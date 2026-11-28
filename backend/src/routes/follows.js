const express = require('express');
const { getPool, withTransaction } = require('../db');
const { requireAuth } = require('../auth/middleware');
const { parseUuid } = require('../profiles/validation');

const router = express.Router();

router.use(requireAuth);

async function checkProfileVisibility(db, viewerId, targetUserId) {
    const result = await db.query(
        `SELECT can_view_posts_of($1::uuid, user_id) AS can_view
         FROM user_profiles
         WHERE user_id = $2`,
        [viewerId, targetUserId]
    );
    if (result.rows.length === 0) {
        return { exists: false, canView: false };
    }
    return { exists: true, canView: result.rows[0].can_view };
}

router.get('/me/follow-requests', async (req, res) => {
    try {
        const result = await getPool().query(
            `SELECT up.user_id, up.display_name, up.is_private, f.created_at
             FROM user_follows f
             JOIN user_profiles up ON up.user_id = f.follower_id
             WHERE f.followee_id = $1 AND f.status = 'pending'
             ORDER BY f.created_at DESC, up.user_id`,
            [req.user.userId]
        );

        return res.json({
            items: result.rows.map((row) => ({
                user: {
                    id: row.user_id,
                    displayName: row.display_name,
                    isPrivate: row.is_private,
                },
                createdAt: row.created_at,
            })),
        });
    } catch (err) {
        console.error('Błąd pobierania próśb o obserwowanie:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać próśb o obserwowanie.' });
    }
});

router.post('/me/follow-requests/:followerId/accept', async (req, res) => {
    const followerId = parseUuid(req.params.followerId);
    if (followerId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    try {
        const result = await getPool().query(
            `UPDATE user_follows
             SET status = 'accepted', updated_at = now()
             WHERE follower_id = $1 AND followee_id = $2 AND status = 'pending'
             RETURNING status`,
            [followerId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono oczekującej prośby o obserwowanie.' });
        }

        return res.json({ status: result.rows[0].status });
    } catch (err) {
        console.error('Błąd akceptacji prośby o obserwowanie:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zaakceptować prośby.' });
    }
});

router.delete('/me/follow-requests/:followerId', async (req, res) => {
    const followerId = parseUuid(req.params.followerId);
    if (followerId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    try {
        const result = await getPool().query(
            `DELETE FROM user_follows
             WHERE follower_id = $1 AND followee_id = $2 AND status = 'pending'
             RETURNING follower_id`,
            [followerId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono oczekującej prośby o obserwowanie.' });
        }

        return res.status(204).end();
    } catch (err) {
        console.error('Błąd odrzucania prośby o obserwowanie:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się odrzucić prośby.' });
    }
});

router.delete('/me/followers/:followerId', async (req, res) => {
    const followerId = parseUuid(req.params.followerId);
    if (followerId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    try {
        const result = await getPool().query(
            `DELETE FROM user_follows
             WHERE follower_id = $1 AND followee_id = $2 AND status = 'accepted'
             RETURNING follower_id`,
            [followerId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Ten użytkownik Cię nie obserwuje.' });
        }

        return res.status(204).end();
    } catch (err) {
        console.error('Błąd usuwania obserwującego:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się usunąć obserwującego.' });
    }
});

router.post('/:userId/follow', async (req, res) => {
    const targetUserId = parseUuid(req.params.userId);
    if (targetUserId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    if (targetUserId === req.user.userId) {
        return res.status(400).json({ status: 'error', message: 'Nie możesz obserwować samego siebie.' });
    }

    try {
        const outcome = await withTransaction(async (client) => {
            // FOR SHARE chroni przed równoczesną zmianą is_private podczas wstawiania relacji.
            const targetResult = await client.query(
                `SELECT is_private
                 FROM user_profiles
                 WHERE user_id = $1
                 FOR SHARE`,
                [targetUserId]
            );
            const target = targetResult.rows[0];
            if (!target) {
                return { notFound: true };
            }

            const existingResult = await client.query(
                `SELECT status
                 FROM user_follows
                 WHERE follower_id = $1 AND followee_id = $2`,
                [req.user.userId, targetUserId]
            );
            if (existingResult.rows.length > 0) {
                return { status: existingResult.rows[0].status, created: false };
            }

            const desiredStatus = target.is_private ? 'pending' : 'accepted';
            const insertResult = await client.query(
                `INSERT INTO user_follows (follower_id, followee_id, status)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (follower_id, followee_id) DO NOTHING
                 RETURNING status`,
                [req.user.userId, targetUserId, desiredStatus]
            );

            if (insertResult.rows.length > 0) {
                return { status: insertResult.rows[0].status, created: true };
            }

            // Równoległe żądanie zdążyło już wstawić wiersz — zwracamy aktualny stan idempotentnie.
            const raceResult = await client.query(
                `SELECT status
                 FROM user_follows
                 WHERE follower_id = $1 AND followee_id = $2`,
                [req.user.userId, targetUserId]
            );
            return { status: raceResult.rows[0].status, created: false };
        });

        if (outcome.notFound) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono profilu.' });
        }

        return res.status(outcome.created ? 201 : 200).json({ status: outcome.status });
    } catch (err) {
        console.error('Błąd obserwowania użytkownika:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zaobserwować użytkownika.' });
    }
});

router.delete('/:userId/follow', async (req, res) => {
    const targetUserId = parseUuid(req.params.userId);
    if (targetUserId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    if (targetUserId === req.user.userId) {
        return res.status(400).json({ status: 'error', message: 'Nie możesz przestać obserwować samego siebie.' });
    }

    try {
        await getPool().query(
            `DELETE FROM user_follows
             WHERE follower_id = $1 AND followee_id = $2`,
            [req.user.userId, targetUserId]
        );
        return res.json({ status: null });
    } catch (err) {
        console.error('Błąd cofania obserwowania:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się przestać obserwować użytkownika.' });
    }
});

router.get('/:userId/followers', async (req, res) => {
    const targetUserId = parseUuid(req.params.userId);
    if (targetUserId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    try {
        const pool = getPool();
        const access = await checkProfileVisibility(pool, req.user.userId, targetUserId);
        if (!access.exists) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono profilu.' });
        }
        if (!access.canView) {
            return res.status(403).json({ status: 'error', message: 'Ten profil jest prywatny.' });
        }

        const result = await pool.query(
            `SELECT up.user_id, up.display_name, up.is_private,
                    myf.status AS follow_status,
                    f.updated_at AS followed_at
             FROM user_follows f
             JOIN user_profiles up ON up.user_id = f.follower_id
             LEFT JOIN user_follows myf
                 ON myf.follower_id = $1::uuid AND myf.followee_id = up.user_id
             WHERE f.followee_id = $2 AND f.status = 'accepted'
             ORDER BY f.updated_at DESC, up.user_id`,
            [req.user.userId, targetUserId]
        );

        return res.json({
            items: result.rows.map((row) => ({
                id: row.user_id,
                displayName: row.display_name,
                isPrivate: row.is_private,
                isOwnProfile: row.user_id === req.user.userId,
                followStatus: row.follow_status,
                followedAt: row.followed_at,
            })),
        });
    } catch (err) {
        console.error('Błąd pobierania obserwujących:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać listy obserwujących.' });
    }
});

router.get('/:userId/following', async (req, res) => {
    const targetUserId = parseUuid(req.params.userId);
    if (targetUserId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator użytkownika.' });
    }

    try {
        const pool = getPool();
        const access = await checkProfileVisibility(pool, req.user.userId, targetUserId);
        if (!access.exists) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono profilu.' });
        }
        if (!access.canView) {
            return res.status(403).json({ status: 'error', message: 'Ten profil jest prywatny.' });
        }

        const result = await pool.query(
            `SELECT up.user_id, up.display_name, up.is_private,
                    myf.status AS follow_status,
                    f.updated_at AS followed_at
             FROM user_follows f
             JOIN user_profiles up ON up.user_id = f.followee_id
             LEFT JOIN user_follows myf
                 ON myf.follower_id = $1::uuid AND myf.followee_id = up.user_id
             WHERE f.follower_id = $2 AND f.status = 'accepted'
             ORDER BY f.updated_at DESC, up.user_id`,
            [req.user.userId, targetUserId]
        );

        return res.json({
            items: result.rows.map((row) => ({
                id: row.user_id,
                displayName: row.display_name,
                isPrivate: row.is_private,
                isOwnProfile: row.user_id === req.user.userId,
                followStatus: row.follow_status,
                followedAt: row.followed_at,
            })),
        });
    } catch (err) {
        console.error('Błąd pobierania obserwowanych:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać listy obserwowanych.' });
    }
});

module.exports = router;