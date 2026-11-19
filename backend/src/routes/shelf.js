const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth/middleware');
const { parsePerfumeId, parseShelfState } = require('../shelf/shelf-state');
const router = express.Router();

router.use(requireAuth);

function toEntry(row) {
    return { opinion: row.opinion, likeStrength: row.like_strength, placement: row.placement };
}

router.get('/:perfumeId', async (req, res) => {
    const perfumeId = parsePerfumeId(req.params.perfumeId);
    if (perfumeId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }

    try {
        const result = await getPool().query(
            `SELECT opinion, like_strength, placement
             FROM shelf_entries
             WHERE user_id = $1 AND perfume_id = $2`,
            [req.user.userId, perfumeId]
        );
        return res.json({ entry: result.rows.length === 0 ? null : toEntry(result.rows[0]) });
    } catch (err) {
        console.error('Błąd pobierania stanu półki:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać stanu półki.' });
    }
});

router.put('/:perfumeId', async (req, res) => {
    const perfumeId = parsePerfumeId(req.params.perfumeId);
    if (perfumeId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }
    const { state, error } = parseShelfState(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const pool = getPool();

        if (state.opinion === null && state.placement === null) {
            await pool.query(
                'DELETE FROM shelf_entries WHERE user_id = $1 AND perfume_id = $2',
                [req.user.userId, perfumeId]
            );
            return res.json({ entry: null });
        }

        const result = await pool.query(
            `INSERT INTO shelf_entries (user_id, perfume_id, opinion, like_strength, placement)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, perfume_id) DO UPDATE
             SET opinion = EXCLUDED.opinion,
                 like_strength = EXCLUDED.like_strength,
                 placement = EXCLUDED.placement,
                 updated_at = now()
             RETURNING opinion, like_strength, placement`,
            [req.user.userId, perfumeId, state.opinion, state.likeStrength, state.placement]
        );
        return res.json({ entry: toEntry(result.rows[0]) });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono perfum.' });
        }
        console.error('Błąd zapisu stanu półki:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zapisać stanu półki.' });
    }
});

module.exports = router;