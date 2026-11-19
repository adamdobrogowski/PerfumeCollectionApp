const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth/middleware');
const { parsePerfumeId, parseShelfState } = require('../shelf/shelf-state');
const router = express.Router();

router.use(requireAuth);

function toEntry(row) {
    return { opinion: row.opinion, likeStrength: row.like_strength, placement: row.placement };
}

router.get('/', async (req, res) => {
    try {
        const result = await getPool().query(
            `SELECT p.perfume_id, p.name, p.gender, p.release_year,
                    b.brand_id, b.name AS brand_name,
                    f.cluster_id AS family_id, f.name AS family_name,
                    se.opinion, se.like_strength, se.placement
             FROM shelf_entries se
             JOIN perfumes p  ON p.perfume_id = se.perfume_id
             JOIN brands b    ON b.brand_id = p.brand_id
             JOIN clusters sf ON sf.cluster_id = p.cluster_id
             JOIN clusters f  ON f.cluster_id = sf.parent_cluster_id
             WHERE se.user_id = $1
             ORDER BY se.updated_at DESC, p.perfume_id`,
            [req.user.userId]
        );
        return res.json({
            items: result.rows.map((row) => ({
                perfume: {
                    id: row.perfume_id,
                    name: row.name,
                    brand: { id: row.brand_id, name: row.brand_name },
                    gender: row.gender,
                    releaseYear: row.release_year,
                    family: { id: row.family_id, name: row.family_name },
                },
                entry: toEntry(row),
            })),
        });
    } catch (err) {
        console.error('Błąd pobierania półki:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać półki.' });
    }
});

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