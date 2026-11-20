const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth/middleware');
const { parsePerfumeId } = require('../shelf/shelf-state');
const { parseNote } = require('../notes/note-input');
const router = express.Router();

router.use(requireAuth);

function toNote(row) {
    return {
        body: row.body,
        longevity: row.longevity,
        projection: row.projection,
        updatedAt: row.updated_at,
    };
}

router.get('/:perfumeId', async (req, res) => {
    const perfumeId = parsePerfumeId(req.params.perfumeId);
    if (perfumeId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }

    try {
        const result = await getPool().query(
            `SELECT body, longevity, projection, updated_at
             FROM user_perfume_notes
             WHERE user_id = $1 AND perfume_id = $2`,
            [req.user.userId, perfumeId]
        );
        return res.json({ note: result.rows.length === 0 ? null : toNote(result.rows[0]) });
    } catch (err) {
        console.error('Błąd pobierania notatki:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać notatki.' });
    }
});

router.put('/:perfumeId', async (req, res) => {
    const perfumeId = parsePerfumeId(req.params.perfumeId);
    if (perfumeId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }
    const { note, error } = parseNote(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const result = await getPool().query(
            `INSERT INTO user_perfume_notes (user_id, perfume_id, body, longevity, projection)
             SELECT se.user_id, se.perfume_id, $3::text, $4::smallint, $5::smallint
             FROM shelf_entries se
             WHERE se.user_id = $1 AND se.perfume_id = $2
             ON CONFLICT (user_id, perfume_id) DO UPDATE
             SET body = EXCLUDED.body,
                 longevity = EXCLUDED.longevity,
                 projection = EXCLUDED.projection,
                 updated_at = now()
             RETURNING body, longevity, projection, updated_at`,
            [req.user.userId, perfumeId, note.body, note.longevity, note.projection]
        );
        if (result.rows.length === 0) {
            return res.status(409).json({
                status: 'error',
                message: 'Notatkę można dodać tylko do perfum z półki.',
            });
        }
        return res.json({ note: toNote(result.rows[0]) });
    } catch (err) {
        console.error('Błąd zapisu notatki:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zapisać notatki.' });
    }
});

router.delete('/:perfumeId', async (req, res) => {
    const perfumeId = parsePerfumeId(req.params.perfumeId);
    if (perfumeId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }

    try {
        await getPool().query(
            'DELETE FROM user_perfume_notes WHERE user_id = $1 AND perfume_id = $2',
            [req.user.userId, perfumeId]
        );
        return res.status(204).end();
    } catch (err) {
        console.error('Błąd usuwania notatki:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się usunąć notatki.' });
    }
});

module.exports = router;