const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth/middleware');
const {
    parsePositiveId,
    parseCommentsQuery,
    validateCommentBody,
} = require('../feed/validation');

const router = express.Router();

const FOREIGN_KEY_VIOLATION_CODE = '23503';

router.use(requireAuth);

function toComment(row) {
    return {
        id: row.comment_id,
        postId: row.post_id,
        body: row.body,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        editedAt: row.edited_at,
        author: {
            id: row.author_id,
            displayName: row.author_display_name,
        },
    };
}

async function isPostVisible(db, postId, viewerId) {
    const result = await db.query(
        `SELECT 1
         FROM posts
         WHERE post_id = $1 AND can_view_posts_of($2::uuid, author_id)`,
        [postId, viewerId]
    );
    return result.rows.length > 0;
}

router.get('/:postId/comments', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    const { error, value } = parseCommentsQuery(req.query);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const pool = getPool();
        const visible = await isPostVisible(pool, postId, req.user.userId);
        if (!visible) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }

        const params = [postId];
        const whereClauses = ['c.post_id = $1'];

        if (value.cursor !== null) {
            params.push(value.cursor);
            whereClauses.push(`c.comment_id > $${params.length}`);
        }

        params.push(value.limit + 1);
        const limitParamIndex = params.length;

        const result = await pool.query(
            `SELECT c.comment_id, c.post_id, c.author_id, c.body,
                    c.created_at, c.updated_at, c.edited_at,
                    up.display_name AS author_display_name
             FROM post_comments c
             JOIN user_profiles up ON up.user_id = c.author_id
             WHERE ${whereClauses.join(' AND ')}
             ORDER BY c.comment_id ASC
             LIMIT $${limitParamIndex}`,
            params
        );

        const hasMore = result.rows.length > value.limit;
        const pageRows = hasMore ? result.rows.slice(0, value.limit) : result.rows;
        const items = pageRows.map(toComment);
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        return res.json({ items, nextCursor });
    } catch (err) {
        console.error('Błąd pobierania komentarzy:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać komentarzy.' });
    }
});

router.post('/:postId/comments', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    const { errors, value } = validateCommentBody(req.body);
    if (errors) {
        return res.status(400).json({
            status: 'error',
            message: 'Treść komentarza jest nieprawidłowa.',
            fields: errors,
        });
    }

    try {
        const pool = getPool();
        const visible = await isPostVisible(pool, postId, req.user.userId);
        if (!visible) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }

        const result = await pool.query(
            `WITH inserted AS (
                 INSERT INTO post_comments (post_id, author_id, body)
                 VALUES ($1, $2, $3)
                 RETURNING comment_id, post_id, author_id, body, created_at, updated_at, edited_at
             )
             SELECT i.comment_id, i.post_id, i.author_id, i.body,
                    i.created_at, i.updated_at, i.edited_at,
                    up.display_name AS author_display_name
             FROM inserted i
             JOIN user_profiles up ON up.user_id = i.author_id`,
            [postId, req.user.userId, value.body]
        );

        return res.status(201).json(toComment(result.rows[0]));
    } catch (err) {
        if (err.code === FOREIGN_KEY_VIOLATION_CODE) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }
        console.error('Błąd dodawania komentarza:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się dodać komentarza.' });
    }
});

router.patch('/:postId/comments/:commentId', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    const commentId = parsePositiveId(req.params.commentId);
    if (commentId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator komentarza.' });
    }

    const { errors, value } = validateCommentBody(req.body);
    if (errors) {
        return res.status(400).json({
            status: 'error',
            message: 'Treść komentarza jest nieprawidłowa.',
            fields: errors,
        });
    }

    try {
        const pool = getPool();
        const existingResult = await pool.query(
            `SELECT c.comment_id, c.post_id, c.author_id, c.body,
                    c.created_at, c.updated_at, c.edited_at,
                    up.display_name AS author_display_name,
                    can_view_posts_of($1::uuid, p.author_id) AS can_view
             FROM post_comments c
             JOIN posts p ON p.post_id = c.post_id
             JOIN user_profiles up ON up.user_id = c.author_id
             WHERE c.comment_id = $2 AND c.post_id = $3`,
            [req.user.userId, commentId, postId]
        );
        const existing = existingResult.rows[0];

        if (!existing || !existing.can_view) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono komentarza.' });
        }
        if (existing.author_id !== req.user.userId) {
            return res.status(403).json({ status: 'error', message: 'Możesz edytować tylko własne komentarze.' });
        }

        if (existing.body === value.body) {
            return res.json(toComment(existing));
        }

        const updatedResult = await pool.query(
            `UPDATE post_comments
             SET body = $1, edited_at = now(), updated_at = now()
             WHERE comment_id = $2 AND post_id = $3
             RETURNING comment_id, post_id, author_id, body, created_at, updated_at, edited_at`,
            [value.body, commentId, postId]
        );

        return res.json(
            toComment({
                ...updatedResult.rows[0],
                author_display_name: existing.author_display_name,
            })
        );
    } catch (err) {
        console.error('Błąd edycji komentarza:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zapisać komentarza.' });
    }
});

router.delete('/:postId/comments/:commentId', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    const commentId = parsePositiveId(req.params.commentId);
    if (commentId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator komentarza.' });
    }

    try {
        const pool = getPool();
        const existingResult = await pool.query(
            `SELECT c.author_id, can_view_posts_of($1::uuid, p.author_id) AS can_view
             FROM post_comments c
             JOIN posts p ON p.post_id = c.post_id
             WHERE c.comment_id = $2 AND c.post_id = $3`,
            [req.user.userId, commentId, postId]
        );
        const existing = existingResult.rows[0];

        const isAdmin = req.user.role === 'admin';
        if (!existing || (!isAdmin && !existing.can_view)) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono komentarza.' });
        }
        if (!isAdmin && existing.author_id !== req.user.userId) {
            return res.status(403).json({ status: 'error', message: 'Możesz usuwać tylko własne komentarze.' });
        }

        await pool.query(
            'DELETE FROM post_comments WHERE comment_id = $1 AND post_id = $2',
            [commentId, postId]
        );
        return res.status(204).end();
    } catch (err) {
        console.error('Błąd usuwania komentarza:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się usunąć komentarza.' });
    }
});

module.exports = router;