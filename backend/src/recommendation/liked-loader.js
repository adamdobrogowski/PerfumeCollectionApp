// Wczytuje Lubiane perfumy uzytkownika w ksztalcie oczekiwanym przez centres.js:

const { getPool } = require('../db');

async function loadLikes(userId) {
    const { rows } = await getPool().query(
        `SELECT s.perfume_id,
                s.like_strength,
                e.embedding::text AS embedding,
                p.cluster_id AS subfamily_id,
                c.parent_cluster_id AS family_id
           FROM shelf_entries s
           JOIN perfumes p            ON p.perfume_id = s.perfume_id
           JOIN perfume_embeddings e  ON e.perfume_id = s.perfume_id
           JOIN clusters c            ON c.cluster_id = p.cluster_id
          WHERE s.user_id = $1 AND s.opinion = 'liked'
          ORDER BY s.perfume_id`,
        [userId]
    );
    return rows.map((row) => ({
        perfumeId: row.perfume_id,
        strength: row.like_strength,
        vector: JSON.parse(row.embedding),
        subfamilyId: row.subfamily_id,
        familyId: row.family_id,
    }));
}

module.exports = { loadLikes };