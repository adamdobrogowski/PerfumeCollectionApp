// Wyszukiwanie najblizszych perfum dla centrum zainteresowania

const { getPool } = require('../../db');

// centre: wektor centrum (tablica liczb). Zwraca perfumy od najbardziej podobnych.
// Pole similarity (cosinus) sluzy tylko do deduplikacji miedzy sekcjami i nie trafia do odpowiedzi API.
async function findNearest(userId, centre, limit) {
    // Uwagi do zapytania (sa celowe, nie upraszczac bez testu):
    // 1) Sortujemy po iloczynie skalarnym <#>, a nie po cosinusie <=>. Wektory w bazie maja dlugosc 1,
    //    wiec kolejnosc jest taka sama, a operator <#> nie uruchamia indeksu HNSW. Indeks zwraca najwyzej
    //    ok. 40 wynikow (hnsw.ef_search), co przy LIMIT 90 dawaloby niepelne i przyblizone wyniki.
    // 2) LATERAL ... OFFSET 0 wymusza pobieranie wektora po kluczu glownym. Zwykly JOIN powodowal
    //    pelny przeglad tabeli (ok. 300 ms), ktory nie zostaje w pamieci podrecznej bazy.
    //    Pobieranie po kluczu daje ok. 70 ms, gdy strony sa w pamieci (pierwsze zapytanie po dluzszej
    //    przerwie moze byc wolniejsze).
    // 3) Dolaczanie marek i rodzin oraz liczenie cosinusa robimy dopiero dla wybranych wierszy.
    const { rows } = await getPool().query(
        `SELECT p.perfume_id, p.name, p.gender, p.release_year,
                b.brand_id, b.name AS brand_name,
                f.cluster_id AS family_id, f.name AS family_name,
                1 - (top.embedding <=> $1::vector) AS similarity
           FROM (SELECT p.perfume_id, x.embedding
                   FROM perfumes p
                  CROSS JOIN LATERAL (SELECT e.embedding
                                        FROM perfume_embeddings e
                                       WHERE e.perfume_id = p.perfume_id
                                      OFFSET 0) x
                  WHERE NOT EXISTS (SELECT 1 FROM shelf_entries s
                                     WHERE s.user_id = $2 AND s.perfume_id = p.perfume_id)
                  ORDER BY x.embedding <#> $1::vector, p.perfume_id
                  LIMIT $3) top
           JOIN perfumes p  ON p.perfume_id = top.perfume_id
           JOIN brands b    ON b.brand_id = p.brand_id
           JOIN clusters sf ON sf.cluster_id = p.cluster_id
           JOIN clusters f  ON f.cluster_id = sf.parent_cluster_id
          ORDER BY similarity DESC, p.perfume_id`,
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