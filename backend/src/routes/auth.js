const express = require('express');
const { getPool } = require('../db');
const { hashPassword } = require('../auth/password');
const { validateRegistration } = require('../auth/validation');
const { loginUser } = require('../auth/session');

const router = express.Router();

const UNIQUE_VIOLATION_CODE = '23505';

router.post('/register', async (req, res) => {
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

module.exports = router;