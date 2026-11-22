// Wyszukiwanie najblizszych perfum dla centrum zainteresowania
// Szukanie jest dokladne (pgvector, operator <=> to odleglosc cosinusowa) i obejmuje caly katalog.

const { getPool } = require('../db');

// centre: wektor centrum (tablica liczb). Zwraca perfumy od najbardziej podobnych.
// Pole similarity (cosinus) sluzy tylko do deduplikacji miedzy sekcjami i nie trafia do odpowiedzi API.
async function findNearest(userId, centre, limit) {
    const { rows } = await getPool().query(
        `SELECT p.perfume_id, p.name, p.gender, p.release_year,
                b.brand_id, b.name AS brand_name,
                f.cluster_id AS family_id, f.name AS family_name,
                1 - (e.embedding <=> $1::vector) AS similarity
           FROM perfume_embeddings e
           JOIN perfumes p  ON p.perfume_id = e.perfume_id
           JOIN brands b    ON b.brand_id = p.brand_id
           JOIN clusters sf ON sf.cluster_id = p.cluster_id
           JOIN clusters f  ON f.cluster_id = sf.parent_cluster_id
          WHERE NOT EXISTS (SELECT 1 FROM shelf_entries s
                             WHERE s.user_id = $2 AND s.perfume_id = p.perfume_id)
          ORDER BY e.embedding <=> $1::vector
          LIMIT $3`,
        [JSON.stringify(centre), userId, limit]
    );
    return rows.map((row) => ({
        perfumeId: row.perfume_id,
        similarity: row.similarity,
        name: row.name,
        brand: { id: row.brand_id, name: row.brand_name },
        gender: row.gender,
        releaseYear: row.release_year,
        family: { id: row.family_id, name: row.family_name },
    }));
}

module.exports = { findNearest };