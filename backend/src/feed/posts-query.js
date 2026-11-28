const { getPool } = require('../db');

const FEED_SCOPES = ['global', 'following', 'author'];

function toPost(row, perfumes) {
    return {
        id: row.post_id,
        kind: row.kind,
        body: row.body,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        editedAt: row.edited_at,
        author: {
            id: row.author_id,
            displayName: row.author_display_name,
        },
        perfumes,
        // PostgreSQL zwraca SUM i COUNT jako bigint, który sterownik pg oddaje jako string.
        score: Number(row.score),
        commentCount: Number(row.comment_count),
        myVote: row.my_vote === null ? null : Number(row.my_vote),
    };
}

// Wspólne zapytanie: najpierw wybiera i ogranicza stronę postów, a potem liczy głosy i komentarze tylko dla tej strony.
async function selectPostRows(whereClauses, params, rowLimit, db) {
    const limitParamIndex = params.length + 1;
    const queryParams = [...params, rowLimit];

    const result = await db.query(
        `WITH page_posts AS (
             SELECT p.post_id, p.author_id, p.kind, p.body,
                    p.created_at, p.updated_at, p.edited_at,
                    up.display_name AS author_display_name
             FROM posts p
             JOIN user_profiles up ON up.user_id = p.author_id
             WHERE ${whereClauses.join(' AND ')}
             ORDER BY p.post_id DESC
             LIMIT $${limitParamIndex}
         )
         SELECT pp.post_id, pp.author_id, pp.author_display_name,
                pp.kind, pp.body, pp.created_at, pp.updated_at, pp.edited_at,
                COALESCE(v.score, 0) AS score,
                COALESCE(c.comment_count, 0) AS comment_count,
                mv.value AS my_vote
         FROM page_posts pp
         LEFT JOIN (
             SELECT post_id, SUM(value) AS score
             FROM post_votes
             WHERE post_id IN (SELECT post_id FROM page_posts)
             GROUP BY post_id
         ) v ON v.post_id = pp.post_id
         LEFT JOIN (
             SELECT post_id, COUNT(*) AS comment_count
             FROM post_comments
             WHERE post_id IN (SELECT post_id FROM page_posts)
             GROUP BY post_id
         ) c ON c.post_id = pp.post_id
         LEFT JOIN post_votes mv
             ON mv.post_id = pp.post_id AND mv.user_id = $1::uuid
         ORDER BY pp.post_id DESC`,
        queryParams
    );

    return result.rows;
}

// Drugie zapytanie dla całej strony wyników — unika problemu N+1 przy dociąganiu oznaczonych perfum.
async function attachPerfumes(rows, db) {
    if (rows.length === 0) {
        return [];
    }

    const postIds = rows.map((row) => row.post_id);
    const perfumesResult = await db.query(
        `SELECT pp.post_id, p.perfume_id, p.name, b.brand_id, b.name AS brand_name
         FROM post_perfumes pp
         JOIN perfumes p ON p.perfume_id = pp.perfume_id
         JOIN brands b   ON b.brand_id = p.brand_id
         WHERE pp.post_id = ANY($1::int[])
         ORDER BY pp.post_id, pp.position`,
        [postIds]
    );

    const perfumesByPostId = new Map();
    for (const row of perfumesResult.rows) {
        if (!perfumesByPostId.has(row.post_id)) {
            perfumesByPostId.set(row.post_id, []);
        }
        perfumesByPostId.get(row.post_id).push({
            id: row.perfume_id,
            name: row.name,
            brand: {
                id: row.brand_id,
                name: row.brand_name,
            },
        });
    }

    return rows.map((row) => toPost(row, perfumesByPostId.get(row.post_id) ?? []));
}

async function fetchFeedPosts(
    { viewerId, scope = 'global', authorId = null, kind = null, cursor = null, limit = 20 },
    db = getPool()
) {
    if (!FEED_SCOPES.includes(scope)) {
        throw new Error(`Nieprawidłowy zakres tablicy: ${scope}`);
    }

    const params = [viewerId ?? null];
    const whereClauses = ['can_view_posts_of($1::uuid, p.author_id)'];

    if (scope === 'following') {
        whereClauses.push(
            `EXISTS (
                 SELECT 1 FROM user_follows f
                 WHERE f.follower_id = $1::uuid
                   AND f.followee_id = p.author_id
                   AND f.status = 'accepted'
             )`
        );
    } else if (scope === 'author') {
        if (!authorId) {
            throw new Error('Zakres "author" wymaga podania authorId.');
        }
        params.push(authorId);
        whereClauses.push(`p.author_id = $${params.length}::uuid`);
    }

    if (kind !== null && kind !== undefined) {
        params.push(kind);
        whereClauses.push(`p.kind = $${params.length}::post_kind_t`);
    }

    if (cursor !== null && cursor !== undefined) {
        params.push(cursor);
        whereClauses.push(`p.post_id < $${params.length}`);
    }

    // Pobieramy limit + 1 wierszy, żeby bez osobnego COUNT(*) wiedzieć, czy istnieje kolejna strona.
    const rows = await selectPostRows(whereClauses, params, limit + 1, db);
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = await attachPerfumes(pageRows, db);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor };
}

async function fetchPostById({ viewerId, postId }, db = getPool()) {
    const rows = await selectPostRows(
        ['can_view_posts_of($1::uuid, p.author_id)', 'p.post_id = $2'],
        [viewerId ?? null, postId],
        1,
        db
    );

    if (rows.length === 0) {
        return null;
    }

    const [post] = await attachPerfumes(rows, db);
    return post;
}

module.exports = {
    fetchFeedPosts,
    fetchPostById,
};