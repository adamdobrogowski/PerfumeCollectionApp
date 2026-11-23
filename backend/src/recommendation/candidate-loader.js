// Dane kandydata dla Blind Buy Guard: perfumy z wektorem, podrodzina, rodzina oraz nazwy do uzasadnienia.

const { getPool } = require('../db');

async function loadCandidate(perfumeId) {
    const { rows } = await getPool().query(
        `SELECT p.perfume_id, p.name,
                b.brand_id, b.name AS brand_name,
                sf.cluster_id AS subfamily_id, sf.name AS subfamily_name,
                f.cluster_id AS family_id, f.name AS family_name,
                e.embedding::text AS embedding
           FROM perfumes p
           JOIN brands b              ON b.brand_id = p.brand_id
           JOIN perfume_embeddings e  ON e.perfume_id = p.perfume_id
           JOIN clusters sf           ON sf.cluster_id = p.cluster_id
           JOIN clusters f            ON f.cluster_id = sf.parent_cluster_id
          WHERE p.perfume_id = $1`,
        [perfumeId]
    );
    if (rows.length === 0) {
        return null;
    }
    const row = rows[0];
    return {
        perfumeId: row.perfume_id,
        name: row.name,
        brand: { id: row.brand_id, name: row.brand_name },
        subfamily: { id: row.subfamily_id, name: row.subfamily_name },
        family: { id: row.family_id, name: row.family_name },
        vector: JSON.parse(row.embedding),
    };
}

module.exports = { loadCandidate };