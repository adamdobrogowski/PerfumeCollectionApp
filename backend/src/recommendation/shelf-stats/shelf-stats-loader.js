const { getPool } = require('../../db');

const TOTALS_SQL = `
    SELECT count(*) FILTER (WHERE placement = 'collection')::int AS collection_total,
           count(*) FILTER (WHERE opinion = 'liked')::int AS liked_total
      FROM shelf_entries
     WHERE user_id = $1`;

// Rodzina wynika z podrodziny perfum (perfumes.cluster_id) i jej rodzica w clusters.
const FAMILIES_SQL = `
    SELECT f.cluster_id AS family_id, f.name AS family_name, count(*)::int AS perfume_count
      FROM shelf_entries se
      JOIN perfumes p  ON p.perfume_id = se.perfume_id
      JOIN clusters sf ON sf.cluster_id = p.cluster_id
      JOIN clusters f  ON f.cluster_id = sf.parent_cluster_id
     WHERE se.user_id = $1 AND se.placement = 'collection'
     GROUP BY f.cluster_id, f.name`;

// Nuta ogolna liczy sie raz na perfumy: DISTINCT zdejmuje powtorzenia z kilku warstw piramidy
// oraz z kilku nut szczegolowych odwzorowanych na te sama nute ogolna.
const FREQUENT_NOTES_SQL = `
    SELECT g.general_note_id, g.name, g.name_pl, count(*)::int AS value
      FROM (SELECT DISTINCT pn.perfume_id, n.general_note_id
              FROM shelf_entries se
              JOIN perfume_notes pn ON pn.perfume_id = se.perfume_id
              JOIN notes n          ON n.note_id = pn.note_id
             WHERE se.user_id = $1 AND se.placement = 'collection') x
      JOIN general_notes g ON g.general_note_id = x.general_note_id
     GROUP BY g.general_note_id, g.name, g.name_pl`;

// Ulubione nuty: suma oceny 1-3 Lubianych perfum zawierajacych nute, niezaleznie od oznaczenia (kolekcja, lista zyczen, brak).
const FAVOURITE_NOTES_SQL = `
    SELECT g.general_note_id, g.name, g.name_pl, sum(x.like_strength)::int AS value
      FROM (SELECT DISTINCT pn.perfume_id, n.general_note_id, se.like_strength
              FROM shelf_entries se
              JOIN perfume_notes pn ON pn.perfume_id = se.perfume_id
              JOIN notes n          ON n.note_id = pn.note_id
             WHERE se.user_id = $1 AND se.opinion = 'liked') x
      JOIN general_notes g ON g.general_note_id = x.general_note_id
     GROUP BY g.general_note_id, g.name, g.name_pl`;

function toNote(row) {
    return {
        generalNote: { id: row.general_note_id, name: row.name, namePl: row.name_pl },
        value: row.value,
    };
}

async function loadShelfStatsData(userId) {
    const pool = getPool();
    const [totals, families, frequent, favourite] = await Promise.all([
        pool.query(TOTALS_SQL, [userId]),
        pool.query(FAMILIES_SQL, [userId]),
        pool.query(FREQUENT_NOTES_SQL, [userId]),
        pool.query(FAVOURITE_NOTES_SQL, [userId]),
    ]);
    return {
        collectionTotal: totals.rows[0].collection_total,
        likedTotal: totals.rows[0].liked_total,
        families: families.rows.map((row) => ({
            id: row.family_id,
            name: row.family_name,
            perfumeCount: row.perfume_count,
        })),
        frequentNotes: frequent.rows.map(toNote),
        favouriteNotes: favourite.rows.map(toNote),
    };
}

module.exports = { loadShelfStatsData };