const { getPool } = require('../db');
const { SESSION_COOKIE_NAME } = require('./session');

// Wczytuje zalogowanego użytkownika z bazy i zapisuje go w req.user.
// Zapytanie przy każdym żądaniu sprawia, że blokada lub usunięcie konta działają od razu.
async function requireAuth(req, res, next) {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Nie jesteś zalogowany.' });
    }

    let user;
    try {
        const result = await getPool().query(
            'SELECT user_id, email, role, blocked_at FROM users WHERE user_id = $1',
            [userId]
        );
        user = result.rows[0];
    } catch (err) {
        console.error('Błąd wczytywania użytkownika z sesji:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zweryfikować sesji.' });
    }

    if (!user || user.blocked_at) {
        return req.session.destroy(() => {
            res.clearCookie(SESSION_COOKIE_NAME);
            res.status(401).json({ status: 'error', message: 'Nie jesteś zalogowany.' });
        });
    }

    req.user = { userId: user.user_id, email: user.email, role: user.role };
    return next();
}

function checkAdminRole(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Brak uprawnień.' });
    }
    return next();
}

const requireAdmin = [requireAuth, checkAdminRole];

module.exports = { requireAuth, requireAdmin };