// Smart Matching: dane dwoch perfum do porownania (naglowek, nuty, akordy) oraz cosinus miedzy nimi.

const { getPool } = require('../../db');

async function loadComparedPerfumes(firstId, secondId) {
    const pool = getPool();
    const ids = [firstId, secondId];

    const perfumesResult = await pool.query(
        `SELECT p.perfume_id, p.name, p.gender, p.release_year,
                b.brand_id, b.name AS brand_name,
                sf.cluster_id AS subfamily_id, sf.name AS subfamily_name,
                f.cluster_id AS family_id, f.name AS family_name
           FROM perfumes p
           JOIN brands b    ON b.brand_id = p.brand_id
           JOIN clusters sf ON sf.cluster_id = p.cluster_id
           JOIN clusters f  ON f.cluster_id = sf.parent_cluster_id
          WHERE p.perfume_id = ANY($1::int[])`,
        [ids]
    );
    if (perfumesResult.rows.length !== 2) {
        return null;
    }

    const notesResult = await pool.query(
        `SELECT pn.perfume_id, n.note_id, n.name, pn.layer,
                g.general_note_id, g.name AS general_name, g.name_pl AS general_name_pl
           FROM perfume_notes pn
           JOIN notes n         ON n.note_id = pn.note_id
           JOIN general_notes g ON g.general_note_id = n.general_note_id
          WHERE pn.perfume_id = ANY($1::int[])
          ORDER BY pn.perfume_id, g.name, n.name`,
        [ids]
    );

    const accordsResult = await pool.query(
        `SELECT pa.perfume_id, a.accord_id, a.name, a.name_pl, pa.accord_rank
           FROM perfume_accords pa
           JOIN accords a ON a.accord_id = pa.accord_id
          WHERE pa.perfume_id = ANY($1::int[])
          ORDER BY pa.perfume_id, pa.accord_rank`,
        [ids]
    );

    const cosineResult = await pool.query(
        `SELECT 1 - (a.embedding <=> b.embedding) AS cosine
           FROM perfume_embeddings a, perfume_embeddings b
          WHERE a.perfume_id = $1 AND b.perfume_id = $2`,
        ids
    );

    const byId = new Map(
        perfumesResult.rows.map((row) => [
            row.perfume_id,
            {
                id: row.perfume_id,
                name: row.name,
                brand: { id: row.brand_id, name: row.brand_name },
                gender: row.gender,
                releaseYear: row.release_year,
                family: { id: row.family_id, name: row.family_name },
                subfamily: { id: row.subfamily_id, name: row.subfamily_name },
                notes: [],
                accords: [],
            },
        ])
    );
    for (const row of notesResult.rows) {
        byId.get(row.perfume_id).notes.push({
            id: row.note_id,
            name: row.name,
            layer: row.layer,
            generalNote: { id: row.general_note_id, name: row.general_name, namePl: row.general_name_pl },
        });
    }
    for (const row of accordsResult.rows) {
        byId.get(row.perfume_id).accords.push({
            id: row.accord_id,
            name: row.name,
            namePl: row.name_pl,
            rank: row.accord_rank,
        });
    }

    return {
        first: byId.get(firstId),
        second: byId.get(secondId),
        cosine: cosineResult.rows.length === 0 ? null : cosineResult.rows[0].cosine,
    };
}

module.exports = { loadComparedPerfumes };