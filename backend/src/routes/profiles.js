const express = require('express');
const { getPool, withTransaction } = require('../db');
const { requireAuth } = require('../auth/middleware');
const { parseFeedQuery } = require('../feed/validation');
const { fetchFeedPosts } = require('../feed/posts-query');
const {
    parseUuid,
    parseProfileSearchQuery,
    validateProfileUpdate,
} = require('../profiles/validation');

const router = express.Router();

const UNIQUE_VIOLATION_CODE = '23505';
const DISPLAY_NAME_CONSTRAINT = 'user_profiles_display_name_key';

router.use(requireAuth);

function escapeLikePattern(text) {
    return text.replace(/[\\%_]/g, '\\$&');
}

function toOwnProfile(row) {
    return {
        id: row.user_id,
        displayName: row.display_name,
        bio: row.bio,
        isPrivate: row.is_private,
        shelfIsPrivate: row.shelf_is_private,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        followersCount: Number(row.followers_count),
        followingCount: Number(row.following_count),
        postsCount: Number(row.posts_count),
        pendingRequestsCount: Number(row.pending_requests_count),
    };
}

function toPublicProfile(row, viewerId) {
    return {
        id: row.user_id,
        displayName: row.display_name,
        bio: row.bio,
        isPrivate: row.is_private,
        shelfIsPrivate: row.shelf_is_private,
        createdAt: row.created_at,
        followersCount: Number(row.followers_count),
        followingCount: Number(row.following_count),
        postsCount: Number(row.posts_count),
        isOwnProfile: row.user_id === viewerId,
        canViewPosts: row.can_view_posts,
        followStatus: row.follow_status,
        isFollowedBy: row.is_followed_by,
    };
}

async function fetchOwnProfile(db, userId) {
    const result = await db.query(
        `SELECT up.user_id, up.display_name, up.bio, up.is_private, up.shelf_is_private,
                up.created_at, up.updated_at,
                (SELECT COUNT(*) FROM user_follows
                 WHERE followee_id = up.user_id AND status = 'accepted') AS followers_count,
                (SELECT COUNT(*) FROM user_follows
                 WHERE follower_id = up.user_id AND status = 'accepted') AS following_count,
                (SELECT COUNT(*) FROM posts
                 WHERE author_id = up.user_id) AS posts_count,
                (SELECT COUNT(*) FROM user_follows
                 WHERE followee_id = up.user_id AND status = 'pending') AS pending_requests_count
         FROM user_profiles up
         WHERE up.user_id = $1`,
        [userId]
    );
    return result.rows.length === 0 ? null : toOwnProfile(result.rows[0]);
}

async function fetchPublicProfile(db, targetUserId, viewerId) {
    const result = await db.query(
        `SELECT up.user_id, up.display_name, up.bio, up.is_private, up.shelf_is_private,
                up.created_at,
                (SELECT COUNT(*) FROM user_follows
                 WHERE followee_id = up.user_id AND status = 'accepted') AS followers_count,
                (SELECT COUNT(*) FROM user_follows
                 WHERE follower_id = up.user_id AND status = 'accepted') AS following_count,
                (SELECT COUNT(*) FROM posts
                 WHERE author_id = up.user_id) AS posts_count,
                can_view_posts_of($2::uuid, up.user_id) AS can_view_posts,
                (SELECT status FROM user_follows
                 WHERE follower_id = $2::uuid AND followee_id = up.user_id) AS follow_status,
                EXISTS (
                    SELECT 1 FROM user_follows
                    WHERE follower_id = up.user_id
                      AND followee_id = $2::uuid
                      AND status = 'accepted'
                ) AS is_followed_by
         FROM user_profiles up
         WHERE up.user_id = $1`,
        [targetUserId, viewerId]
    );
    return result.rows.length === 0 ? null : toPublicProfile(result.rows[0], viewerId);
}

router.get('/', async (req, res) => {
    const { error, value } = parseProfileSearchQuery(req.query);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const params = [req.user.userId];
        let whereClause = '';
        let orderClause = 'ORDER BY lower(up.display_name) ASC';

        if (value.q.length > 0) {
            const escaped = escapeLikePattern(value.q);
            params.push(`%${escaped}%`);
            const containsParam = `$${params.length}`;
            params.push(`${escaped}%`);
            const prefixParam = `$${params.length}`;

            whereClause = `WHERE up.display_name ILIKE ${containsParam} ESCAPE '\\'`;
            // Najpierw profile zaczynające się od wpisanej frazy, potem reszta alfabetycznie.
            orderClause = `ORDER BY (up.display_name ILIKE ${prefixParam} ESCAPE '\\') DESC, lower(up.display_name) ASC`;
        }

        params.push(value.limit);
        const limitParam = `$${params.length}`;

        const result = await getPool().query(
            `SELECT up.user_id, up.display_name, up.bio, up.is_private,
                    f.status AS follow_status
             FROM user_profiles up
             LEFT JOIN user_follows f
                 ON f.follower_id = $1::uuid AND f.followee_id = up.user_id
             ${whereClause}
             ${orderClause}
             LIMIT ${limitParam}`,
            params
        );

        return res.json({
            items: result.rows.map((row) => ({
                id: row.user_id,
                displayName: row.display_name,
                bio: row.bio,
                isPrivate: row.is_private,
                isOwnProfile: row.user_id === req.user.userId,
                followStatus: row.follow_status,
            })),
        });
    } catch (err) {
        console.error('Błąd wyszukiwania profili:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się wyszukać profili.' });
    }
});

router.get('/me', async (req, res) => {
    try {
        const profile = await fetchOwnProfile(getPool(), req.user.userId);
        if (!profile) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono profilu.' });
        }
        return res.json(profile);
    } catch (err) {
        console.error('Błąd pobierania własnego profilu:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać profilu.' });
    }
});

router.patch('/me', async (req, res) => {
    const { error, errors, value } = validateProfileUpdate(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }
    if (errors) {
        return res.status(400).json({
            status: 'error',
            message: 'Dane profilu są nieprawidłowe.',
            fields: errors,
        });
    }

    try {
        const profile = await withTransaction(async (client) => {
            // FOR UPDATE serializuje zmianę prywatności z równoległymi żądaniami POST /:userId/follow.
            const existingResult = await client.query(
                `SELECT is_private
                 FROM user_profiles
                 WHERE user_id = $1
                 FOR UPDATE`,
                [req.user.userId]
            );
            const existing = existingResult.rows[0];
            if (!existing) {
                return null;
            }

            const setClauses = [];
            const params = [];

            if (Object.hasOwn(value, 'displayName')) {
                params.push(value.displayName);
                setClauses.push(`display_name = $${params.length}`);
            }
            if (Object.hasOwn(value, 'bio')) {
                params.push(value.bio);
                setClauses.push(`bio = $${params.length}`);
            }
            if (Object.hasOwn(value, 'isPrivate')) {
                params.push(value.isPrivate);
                setClauses.push(`is_private = $${params.length}`);
            }
            if (Object.hasOwn(value, 'shelfIsPrivate')) {
                params.push(value.shelfIsPrivate);
                setClauses.push(`shelf_is_private = $${params.length}`);
            }

            setClauses.push('updated_at = now()');
            params.push(req.user.userId);

            await client.query(
                `UPDATE user_profiles
                 SET ${setClauses.join(', ')}
                 WHERE user_id = $${params.length}`,
                params
            );

            // Przejście z profilu prywatnego na publiczny automatycznie akceptuje oczekujące prośby.
            if (existing.is_private === true && value.isPrivate === false) {
                await client.query(
                    `UPDATE user_follows
                     SET status = 'accepted', updated_at = now()
                     WHERE followee_id = $1 AND status = 'pending'`,
                    [req.user.userId]
                );
            }

            return fetchOwnProfile(client, req.user.userId);
        });

        if (!profile) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono profilu.' });
        }

        return res.json(profile);
    } catch (err) {
        if (err.code === UNIQUE_VIOLATION_CODE && err.constraint === DISPLAY_NAME_CONSTRAINT) {
            return res.status(409).json({
                status: 'error',
                message: 'Ten nick jest już zajęty.',
                fields: { displayName: 'Ten nick jest już zajęty.' },
            });
        }
        console.error('Błąd aktualizacji profilu:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zapisać zmian w profilu.' });
    }
});

router.get('/:userId', async (req, res) => {
    const targetUserId = parseUuid(req.params.userId);
    if (targetUserId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    try {
        const profile = await fetchPublicProfile(getPool(), targetUserId, req.user.userId);
        if (!profile) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono profilu.' });
        }
        return res.json(profile);
    } catch (err) {
        console.error('Błąd pobierania profilu użytkownika:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać profilu.' });
    }
});

router.get('/:userId/posts', async (req, res) => {
    const targetUserId = parseUuid(req.params.userId);
    if (targetUserId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    const { error, value } = parseFeedQuery(req.query);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const accessResult = await getPool().query(
            `SELECT can_view_posts_of($1::uuid, user_id) AS can_view
             FROM user_profiles
             WHERE user_id = $2`,
            [req.user.userId, targetUserId]
        );
        const access = accessResult.rows[0];

        if (!access) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono profilu.' });
        }
        if (!access.can_view) {
            return res.status(403).json({ status: 'error', message: 'Ten profil jest prywatny.' });
        }

        const feed = await fetchFeedPosts({
            viewerId: req.user.userId,
            scope: 'author',
            authorId: targetUserId,
            kind: value.kind,
            cursor: value.cursor,
            limit: value.limit,
        });
        return res.json(feed);
    } catch (err) {
        console.error('Błąd pobierania osi czasu użytkownika:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać postów użytkownika.' });
    }
});

module.exports = router;