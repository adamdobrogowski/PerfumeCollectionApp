// Smart Matching: zapytanie o perfumy podobne do wzorca, z filtrami.

const { getPool } = require('../../db');
const { MATCH_PAGE_SIZE, MATCH_MIN_COSINE } = require('../config');

// Buduje tekst SQL i liste parametrow dla jednej strony wynikow.
// source: { perfumeId, brandId } wzorca; request: wynik parseMatchRequest (pole value).
function buildMatchQuery(userId, source, request) {
    const values = [];
    const add = (value) => {
        values.push(value);
        return `$${values.length}`;
    };
    const sourceId = add(source.perfumeId);
    const user = add(userId);

    const conditions = [`p.perfume_id <> ${sourceId}`];

    // Prog podobienstwa. Wektory maja dlugosc 1, wiec cosinus = -(iloczyn skalarny), a operator <#> zwraca iloczyn ze znakiem minus.
    conditions.push(`(x.embedding <#> (SELECT embedding FROM src)) <= ${add(-MATCH_MIN_COSINE)}`);

    if (request.excludeSameBrand) {
        conditions.push(`p.brand_id <> ${add(source.brandId)}`);
    }
    if (request.brandIds.length > 0) {
        conditions.push(`p.brand_id = ANY(${add(request.brandIds)}::int[])`);
    }
    if (request.gender !== null) {
        conditions.push(`p.gender = ANY(${add([...new Set([request.gender, 'unisex'])])}::gender_t[])`);
    }
    if (request.hideKnown) {
        conditions.push(
            `NOT EXISTS (SELECT 1 FROM shelf_entries s WHERE s.user_id = ${user} AND s.perfume_id = p.perfume_id)`
        );
    }

    // Nuty: kazda wybrana nuta to osobne EXISTS (patrz komentarz w catalog/perfume-search.js), warunki lacza sie przez AND.
    for (const note of request.notes.include) {
        conditions.push(
            note.kind === 'general'
                ? `EXISTS (SELECT 1 FROM perfume_notes pn JOIN notes n ON n.note_id = pn.note_id
                           WHERE pn.perfume_id = p.perfume_id AND n.general_note_id = ${add(note.id)})`
                : `EXISTS (SELECT 1 FROM perfume_notes pn
                           WHERE pn.perfume_id = p.perfume_id AND pn.note_id = ${add(note.id)})`
        );
    }
    const excludedGeneral = request.notes.exclude.filter((note) => note.kind === 'general').map((note) => note.id);
    const excludedDetailed = request.notes.exclude.filter((note) => note.kind === 'detailed').map((note) => note.id);
    if (excludedGeneral.length > 0) {
        conditions.push(
            `NOT EXISTS (SELECT 1 FROM perfume_notes pn JOIN notes n ON n.note_id = pn.note_id
                          WHERE pn.perfume_id = p.perfume_id AND n.general_note_id = ANY(${add(excludedGeneral)}::int[]))`
        );
    }
    if (excludedDetailed.length > 0) {
        conditions.push(
            `NOT EXISTS (SELECT 1 FROM perfume_notes pn
                          WHERE pn.perfume_id = p.perfume_id AND pn.note_id = ANY(${add(excludedDetailed)}::int[]))`
        );
    }

    // Akordy: akord liczy sie, gdy jest na pozycji nie dalszej niz maxRank (1, 3 lub 5); wykluczenie dziala tak samo.
    for (const accord of request.accords.include) {
        conditions.push(
            `EXISTS (SELECT 1 FROM perfume_accords pa
                      WHERE pa.perfume_id = p.perfume_id AND pa.accord_id = ${add(accord.accordId)}
                        AND pa.accord_rank <= ${add(accord.maxRank)})`
        );
    }
    for (const accord of request.accords.exclude) {
        conditions.push(
            `NOT EXISTS (SELECT 1 FROM perfume_accords pa
                          WHERE pa.perfume_id = p.perfume_id AND pa.accord_id = ${add(accord.accordId)}
                            AND pa.accord_rank <= ${add(accord.maxRank)})`
        );
    }

    const limit = add(MATCH_PAGE_SIZE + 1);
    const offset = add(request.offset);

    // Ranking idzie po iloczynie skalarnym ip (bez indeksu HNSW, wektor pobierany po kluczu: LATERAL ... OFFSET 0),
    // a cosinus liczymy dopiero dla wybranych wierszy. Zewnetrzne sortowanie powtarza kolejnosc z rankingu (ip, perfume_id),
    // zeby strony nie zachodzily na siebie.
    const sql = `WITH src AS (SELECT embedding FROM perfume_embeddings WHERE perfume_id = ${sourceId})
        SELECT p.perfume_id, p.name, p.gender, p.release_year,
               b.brand_id, b.name AS brand_name,
               f.cluster_id AS family_id, f.name AS family_name,
               se.opinion, se.placement,
               1 - (top.embedding <=> (SELECT embedding FROM src)) AS similarity
          FROM (SELECT p.perfume_id, x.embedding,
                       (x.embedding <#> (SELECT embedding FROM src)) AS ip
                  FROM perfumes p
                 CROSS JOIN LATERAL (SELECT e.embedding
                                       FROM perfume_embeddings e
                                      WHERE e.perfume_id = p.perfume_id
                                     OFFSET 0) x
                 WHERE ${conditions.join('\n                   AND ')}
                 ORDER BY ip, p.perfume_id
                 LIMIT ${limit} OFFSET ${offset}) top
          JOIN perfumes p  ON p.perfume_id = top.perfume_id
          JOIN brands b    ON b.brand_id = p.brand_id
          JOIN clusters sf ON sf.cluster_id = p.cluster_id
          JOIN clusters f  ON f.cluster_id = sf.parent_cluster_id
          LEFT JOIN shelf_entries se ON se.user_id = ${user} AND se.perfume_id = p.perfume_id
         ORDER BY top.ip, top.perfume_id`;

    return { sql, values };
}

async function findMatches(userId, source, request) {
    const { sql, values } = buildMatchQuery(userId, source, request);
    const { rows } = await getPool().query(sql, values);
    return rows.map((row) => ({
        perfumeId: row.perfume_id,
        similarity: row.similarity,
        name: row.name,
        brand: { id: row.brand_id, name: row.brand_name },
        gender: row.gender,
        releaseYear: row.release_year,
        family: { id: row.family_id, name: row.family_name },
        shelf: row.opinion === null && row.placement === null ? null : { opinion: row.opinion, placement: row.placement },
    }));
}

module.exports = { buildMatchQuery, findMatches };