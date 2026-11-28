const express = require('express');
const { getPool, withTransaction } = require('../db');
const { requireAuth } = require('../auth/middleware');
const {
    parsePositiveId,
    parseFeedQuery,
    validatePostCreate,
    validatePostEdit,
} = require('../feed/validation');
const { fetchFeedPosts, fetchPostById } = require('../feed/posts-query');

const router = express.Router();

const FOREIGN_KEY_VIOLATION_CODE = '23503';
const LIST_SCOPES = ['global', 'following'];

router.use(requireAuth);

router.get('/', async (req, res) => {
    const rawScope = req.query.scope;
    let scope = 'global';
    if (rawScope !== undefined && rawScope !== '') {
        if (typeof rawScope !== 'string' || !LIST_SCOPES.includes(rawScope)) {
            return res.status(400).json({
                status: 'error',
                message: 'Nieprawidłowy zakres tablicy (global lub following).',
            });
        }
        scope = rawScope;
    }

    const { error, value } = parseFeedQuery(req.query);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const feed = await fetchFeedPosts({
            viewerId: req.user.userId,
            scope,
            kind: value.kind,
            cursor: value.cursor,
            limit: value.limit,
        });
        return res.json(feed);
    } catch (err) {
        console.error('Błąd pobierania tablicy postów:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać postów.' });
    }
});

router.post('/', async (req, res) => {
    const { errors, value } = validatePostCreate(req.body);
    if (errors) {
        return res.status(400).json({
            status: 'error',
            message: 'Dane posta są nieprawidłowe.',
            fields: errors,
        });
    }

    try {
        // Post i oznaczone perfumy zapisujemy w jednej transakcji, żeby nie powstał post z urwaną listą zapachów.
        const post = await withTransaction(async (client) => {
            const insertResult = await client.query(
                `INSERT INTO posts (author_id, kind, body)
                 VALUES ($1, $2, $3)
                 RETURNING post_id`,
                [req.user.userId, value.kind, value.body]
            );
            const postId = insertResult.rows[0].post_id;

            for (let i = 0; i < value.perfumeIds.length; i += 1) {
                await client.query(
                    `INSERT INTO post_perfumes (post_id, position, perfume_id)
                     VALUES ($1, $2, $3)`,
                    [postId, i + 1, value.perfumeIds[i]]
                );
            }

            return fetchPostById({ viewerId: req.user.userId, postId }, client);
        });

        return res.status(201).json(post);
    } catch (err) {
        if (err.code === FOREIGN_KEY_VIOLATION_CODE && err.table === 'post_perfumes') {
            return res.status(400).json({
                status: 'error',
                message: 'Dane posta są nieprawidłowe.',
                fields: { perfumeIds: 'Co najmniej jedne z oznaczonych perfum nie istnieją.' },
            });
        }
        console.error('Błąd tworzenia posta:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się utworzyć posta.' });
    }
});

router.get('/:postId', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    try {
        const post = await fetchPostById({ viewerId: req.user.userId, postId });
        if (!post) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }
        return res.json(post);
    } catch (err) {
        console.error('Błąd pobierania posta:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać posta.' });
    }
});

router.patch('/:postId', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    const { errors, value } = validatePostEdit(req.body);
    if (errors) {
        return res.status(400).json({
            status: 'error',
            message: 'Dane edycji posta są nieprawidłowe.',
            fields: errors,
        });
    }

    try {
        const outcome = await withTransaction(async (client) => {
            // FOR UPDATE blokuje wiersz na czas transakcji, żeby równoległe edycje nie nadpisały historii.
            const existingResult = await client.query(
                `SELECT author_id, body, can_view_posts_of($1::uuid, author_id) AS can_view
                 FROM posts
                 WHERE post_id = $2
                 FOR UPDATE`,
                [req.user.userId, postId]
            );
            const existing = existingResult.rows[0];

            if (!existing || !existing.can_view) {
                return { errorStatus: 404, errorMessage: 'Nie znaleziono posta.' };
            }
            if (existing.author_id !== req.user.userId) {
                return { errorStatus: 403, errorMessage: 'Możesz edytować tylko własne posty.' };
            }

            if (existing.body !== value.body) {
                await client.query(
                    `INSERT INTO post_edits (post_id, body)
                     VALUES ($1, $2)`,
                    [postId, existing.body]
                );
                await client.query(
                    `UPDATE posts
                     SET body = $1, edited_at = now(), updated_at = now()
                     WHERE post_id = $2`,
                    [value.body, postId]
                );
            }

            const post = await fetchPostById({ viewerId: req.user.userId, postId }, client);
            return { post };
        });

        if (outcome.errorStatus) {
            return res.status(outcome.errorStatus).json({
                status: 'error',
                message: outcome.errorMessage,
            });
        }

        return res.json(outcome.post);
    } catch (err) {
        console.error('Błąd edycji posta:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zapisać zmian.' });
    }
});

router.get('/:postId/edits', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    try {
        const pool = getPool();
        const visibleResult = await pool.query(
            `SELECT 1
             FROM posts
             WHERE post_id = $1 AND can_view_posts_of($2::uuid, author_id)`,
            [postId, req.user.userId]
        );
        if (visibleResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }

        const editsResult = await pool.query(
            `SELECT edit_id, body, edited_at
             FROM post_edits
             WHERE post_id = $1
             ORDER BY edit_id DESC`,
            [postId]
        );

        return res.json({
            items: editsResult.rows.map((row) => ({
                id: row.edit_id,
                body: row.body,
                editedAt: row.edited_at,
            })),
        });
    } catch (err) {
        console.error('Błąd pobierania historii edycji posta:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać historii edycji.' });
    }
});

router.delete('/:postId', async (req, res) => {
    const postId = parsePositiveId(req.params.postId);
    if (postId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator posta.' });
    }

    try {
        const pool = getPool();
        const existingResult = await pool.query(
            `SELECT author_id, can_view_posts_of($1::uuid, author_id) AS can_view
             FROM posts
             WHERE post_id = $2`,
            [req.user.userId, postId]
        );
        const existing = existingResult.rows[0];

        const isAdmin = req.user.role === 'admin';
        if (!existing || (!isAdmin && !existing.can_view)) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono posta.' });
        }
        if (!isAdmin && existing.author_id !== req.user.userId) {
            return res.status(403).json({ status: 'error', message: 'Możesz usuwać tylko własne posty.' });
        }

        await pool.query('DELETE FROM posts WHERE post_id = \$1', [postId]);
        return res.status(204).end();
    } catch (err) {
        console.error('Błąd usuwania posta:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się usunąć posta.' });
    }
});

module.exports = router;