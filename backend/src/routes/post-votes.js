const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth/middleware');
const { parsePositiveId, validateVote } = require('../feed/validation');

const router = express.Router();

const FOREIGN_KEY_VIOLATION_CODE = '23503';

router.use(requireAuth);

async function isPostVisible(db, postId, viewerId) {
    const result = await db.query(
        `SELECT 1
         FROM posts
         WHERE post_id = $1 AND can_view_posts_of($2::uuid, author_id)`,
        [postId, viewerId]
    );
    return result.rows.length > 0;
}

async function getPostScore(db, postId) {
    const result = await db.query(
        `SELECT COALESCE(SUM(value), 0) AS score
         FROM post_votes
         WHERE post_id = $1`,
        [postId]
    );
    return Number(result.rows[0].score);
}

router.put('/:postId/vote', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    const { error, value } = validateVote(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const pool = getPool();
        const visible = await isPostVisible(pool, postId, req.user.userId);
        if (!visible) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }

        await pool.query(
            `INSERT INTO post_votes (post_id, user_id, value)
             VALUES ($1, $2, $3)
             ON CONFLICT (post_id, user_id) DO UPDATE
             SET value = EXCLUDED.value,
                 updated_at = now()`,
            [postId, req.user.userId, value]
        );

        const score = await getPostScore(pool, postId);
        return res.json({ score, myVote: value });
    } catch (err) {
        if (err.code === FOREIGN_KEY_VIOLATION_CODE) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }
        console.error('Błąd zapisu głosu:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zapisać głosu.' });
    }
});

router.delete('/:postId/vote', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    try {
        const pool = getPool();
        const visible = await isPostVisible(pool, postId, req.user.userId);
        if (!visible) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }

        await pool.query(
            'DELETE FROM post_votes WHERE post_id = $1 AND user_id = $2',
            [postId, req.user.userId]
        );

        const score = await getPostScore(pool, postId);
        return res.json({ score, myVote: null });
    } catch (err) {
        console.error('Błąd cofania głosu:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się cofnąć głosu.' });
    }
});

module.exports = router;