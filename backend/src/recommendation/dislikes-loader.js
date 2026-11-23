// Nielubiane perfumy uzytkownika podobne do kandydata (do ostrzezenia Blind Buy Guard).
// Porownanie robi baza (pgvector), wiec nie wczytujemy do Node wektorow wszystkich Nielubianych.

const { getPool } = require('../db');

// Zwraca Nielubiane o cosinusie do kandydata co najmniej minCosine, od najbardziej podobnej.
// Pole similarity (cosinus) nie trafia do odpowiedzi API.
async function findSimilarDisliked(userId, vector, minCosine) {
    const { rows } = await getPool().query(
        `SELECT p.perfume_id, p.name, b.brand_id, b.name AS brand_name,
                1 - (e.embedding <=> $1::vector) AS similarity
           FROM shelf_entries s
           JOIN perfume_embeddings e ON e.perfume_id = s.perfume_id
           JOIN perfumes p           ON p.perfume_id = s.perfume_id
           JOIN brands b             ON b.brand_id = p.brand_id
          WHERE s.user_id = $2
            AND s.opinion = 'disliked'
            AND 1 - (e.embedding <=> $1::vector) >= $3
          ORDER BY e.embedding <=> $1::vector`,
        [JSON.stringify(vector), userId, minCosine]
    );
    return rows.map((row) => ({
        perfumeId: row.perfume_id,
        name: row.name,
        brand: { id: row.brand_id, name: row.brand_name },
        similarity: row.similarity,
    }));
}

module.exports = { findSimilarDisliked };