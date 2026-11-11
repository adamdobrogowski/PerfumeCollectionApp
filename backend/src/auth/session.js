// Konfiguracja sesji użytkowników: express-session z zapisem w PostgreSQL (tabela user_sessions).

const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { getPool } = require('../db');

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = 'perfume.sid';

function createSessionMiddleware() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET nie jest ustawiony w pliku .env");
    }

    const PgStore = connectPgSimple(session);
    const isProduction = process.env.NODE_ENV === 'production';

    return session({
        store: new PgStore({
            pool: getPool(),
            tableName: 'user_sessions',
            createTableIfMissing: false,
        }),
        name:  SESSION_COOKIE_NAME,
        secret,
        resave: false,
        // Sesja powstaje dopiero po zalogowaniu, a nie dla każdego odwiedzającego.
        saveUninitialized: false,
        // Każda aktywność przedłuża sesję o kolejne 7 dni.
        rolling: true,
        cookie: {
            httpOnly: true,       // ciasteczka nie odczyta skrypt na stronie (ochrona przed XSS)
            sameSite: 'lax',      // ciasteczko nie jest wysyłane z cudzych stron (ochrona przed CSRF)
            secure: isProduction, 
            maxAge: SESSION_MAX_AGE_MS,
        },
    });
}

function loginUser(req, userId) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                return reject(regenerateError);
            } 
            req.session.userId = userId;
            req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
        });
    });
}

module.exports = { createSessionMiddleware, loginUser, SESSION_COOKIE_NAME };