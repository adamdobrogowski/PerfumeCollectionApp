const express = require('express');
const { getPool, withTransaction } = require('../db');
const { hashPassword, verifyPassword, verifyDummyPassword } = require('../auth/password');
const { validateRegistration, validateLogin, validatePasswordChange, validateDeleteAccount } = require('../auth/validation');
const { loginUser, SESSION_COOKIE_NAME } = require('../auth/session');
const { authLimiter } = require('../auth/rate-limit');
const { requireAuth, requireAdmin } = require('../auth/middleware');


const router = express.Router();

const UNIQUE_VIOLATION_CODE = '23505';

router.post('/register', authLimiter, async (req, res) => {
    const { errors, value } = validateRegistration(req.body);
    if (errors) {
        return res.status(400).json({
            status: 'error',
            message: 'Dane rejestracji są nieprawidłowe.',
            fields: errors,
        });
    }

    try {
        // Hashowanie wykonujemy przed transakcją, aby nie blokować połączenia z bazą.
        const passwordHash = await hashPassword(value.password);

        // Konto i profil powstają razem w jednej transakcji albo wcale.
        const user = await withTransaction(async (client) => {
            const result = await client.query(
                `INSERT INTO users (email, password_hash)
                 VALUES ($1, $2)
                 RETURNING user_id, email, role`,
                [value.email, passwordHash]
            );
            const createdUser = result.rows[0];

            await client.query(
                `INSERT INTO user_profiles (user_id, display_name)
                 VALUES ($1, $2)`,
                [createdUser.user_id, value.displayName]
            );

            return createdUser;
        });

        // Sesję zakładamy dopiero po zatwierdzeniu transakcji.
        await loginUser(req, user.user_id);

        return res.status(201).json({
            userId: user.user_id,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        if (err.code === UNIQUE_VIOLATION_CODE && err.constraint === 'users_email_key') {
            return res.status(409).json({
                status: 'error',
                message: 'Ten adres e-mail jest już zarejestrowany.',
                fields: { email: 'Ten adres e-mail jest już zarejestrowany.' },
            });
        }
        if (err.code === UNIQUE_VIOLATION_CODE && err.constraint === 'user_profiles_display_name_key') {
            return res.status(409).json({
                status: 'error',
                message: 'Ten nick jest już zajęty.',
                fields: { displayName: 'Ten nick jest już zajęty.' },
            });
        }
        console.error('Błąd rejestracji:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się utworzyć konta.' });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    const { error, value } = validateLogin(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const result = await getPool().query(
            `SELECT user_id, email, role, password_hash, blocked_at
             FROM users
             WHERE email = $1`,
            [value.email]
        );
        const user = result.rows[0];

        // Gdy konta nie ma, i tak liczymy hash na atrapie, żeby czas odpowiedzi nie zdradzał istnienia konta.
        const passwordOk = user
            ? await verifyPassword(user.password_hash, value.password)
            : await verifyDummyPassword(value.password);

        if (!user || !passwordOk) {
            return res.status(401).json({ status: 'error', message: 'Nieprawidłowy e-mail lub hasło.' });
        }
        // Informację o blokadzie dostaje tylko ten, kto zna poprawne hasło.
        if (user.blocked_at) {
            return res.status(403).json({ status: 'error', message: 'Konto zostało zablokowane.' });
        }

        await loginUser(req, user.user_id);

        return res.status(200).json({ userId: user.user_id, email: user.email, role: user.role });
    } catch (err) {
        console.error('Błąd logowania:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zalogować.' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Błąd wylogowania:', err.message);
            return res.status(500).json({ status: 'error', message: 'Nie udało się wylogować.' });
        }
        res.clearCookie(SESSION_COOKIE_NAME);
        return res.status(204).end();
    });
});

router.get('/me', requireAuth, (req, res) => {
    return res.json(req.user);
});

async function getPasswordHash(userId) {
    const result = await getPool().query('SELECT password_hash FROM users WHERE user_id = $1', [userId]);
    return result.rows[0]?.password_hash ?? null;
}

router.post('/change-password', requireAuth, authLimiter, async (req, res) => {
    const { errors, value } = validatePasswordChange(req.body);
    if (errors) {
        return res.status(400).json({
            status: 'error',
            message: 'Dane zmiany hasła są nieprawidłowe.',
            fields: errors,
        });
    }
    if (value.newPassword === value.currentPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Dane zmiany hasła są nieprawidłowe.',
            fields: { newPassword: 'Nowe hasło musi różnić się od obecnego.' },
        });
    }

    try {
        const storedHash = await getPasswordHash(req.user.userId);
        const passwordOk = storedHash ? await verifyPassword(storedHash, value.currentPassword) : false;
        if (!passwordOk) {
            return res.status(403).json({ status: 'error', message: 'Obecne hasło jest nieprawidłowe.' });
        }

        const newHash = await hashPassword(value.newPassword);

        // Jedno zapytanie: zmiana hasła i usunięcie wszystkich innych sesji tego użytkownika.
        await getPool().query(
            `WITH updated AS (
                 UPDATE users
                 SET password_hash = $1, updated_at = now()
                 WHERE user_id = $2
                 RETURNING user_id
             )
             DELETE FROM user_sessions
             WHERE sess->>'userId' = (SELECT user_id::text FROM updated)
               AND sid <> $3`,
            [newHash, req.user.userId, req.sessionID]
        );

        return res.status(204).end();
    } catch (err) {
        console.error('Błąd zmiany hasła:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zmienić hasła.' });
    }
});

router.post('/delete-account', requireAuth, authLimiter, async (req, res) => {
    const { error, value } = validateDeleteAccount(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const storedHash = await getPasswordHash(req.user.userId);
        const passwordOk = storedHash ? await verifyPassword(storedHash, value.password) : false;
        if (!passwordOk) {
            return res.status(403).json({ status: 'error', message: 'Hasło jest nieprawidłowe.' });
        }

        // Jedno zapytanie: usunięcie konta i wszystkich jego sesji (user_sessions nie ma klucza obcego do users).
        await getPool().query(
            `WITH deleted AS (
                 DELETE FROM users WHERE user_id = $1 RETURNING user_id
             )
             DELETE FROM user_sessions
             WHERE sess->>'userId' = (SELECT user_id::text FROM deleted)`,
            [req.user.userId]
        );
    } catch (err) {
        console.error('Błąd usuwania konta:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się usunąć konta.' });
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Błąd kończenia sesji po usunięciu konta:', err.message);
        }
        res.clearCookie(SESSION_COOKIE_NAME);
        return res.status(204).end();
    });
});

module.exports = router;