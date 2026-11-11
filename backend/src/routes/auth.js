const express = require('express');
const { getPool } = require('../db');
const { hashPassword, verifyPassword, verifyDummyPassword } = require('../auth/password');
const { validateRegistration, validateLogin } = require('../auth/validation');
const { loginUser, SESSION_COOKIE_NAME } = require('../auth/session');
const { authLimiter } = require('../auth/rate-limit');

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
        const passwordHash = await hashPassword(value.password);
        const result = await getPool().query(
            `INSERT INTO users (email, password_hash)
             VALUES ($1, $2)
             RETURNING user_id, email, role`,
            [value.email, passwordHash]
        );
        const user = result.rows[0];

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

router.get('/me', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Nie jesteś zalogowany.' });
    }

    try {
        const result = await getPool().query(
            'SELECT user_id, email, role, blocked_at FROM users WHERE user_id = $1',
            [userId]
        );
        const user = result.rows[0];

        // Konto usunięte lub zablokowane po zalogowaniu: kończymy sesję.
        if (!user || user.blocked_at) {
            return req.session.destroy(() => {
                res.clearCookie(SESSION_COOKIE_NAME);
                res.status(401).json({ status: 'error', message: 'Nie jesteś zalogowany.' });
            });
        }

        return res.json({ userId: user.user_id, email: user.email, role: user.role });
    } catch (err) {
        console.error('Błąd odczytu bieżącego użytkownika:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać użytkownika.' });
    }
});

module.exports = router;