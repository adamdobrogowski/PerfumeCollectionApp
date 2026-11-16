// Słowniki katalogu (tylko odczyt): marki, akordy, rodziny zapachowe i nuty ogólne.
// Dostarczają identyfikatory i nazwy, z których interfejs buduje filtry wyszukiwarki perfum.

const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth/middleware');
const router = express.Router();

// Liczniki (count) sterownik pg zwraca jako tekst, więc zamieniamy je na liczby.
async function loadBrands(pool) {
    const result = await pool.query(
        `SELECT b.brand_id, b.name, c.name AS country_name, count(p.perfume_id) AS perfume_count
         FROM brands b
         JOIN countries c ON c.country_id = b.country_id
         LEFT JOIN perfumes p ON p.brand_id = b.brand_id
         GROUP BY b.brand_id, b.name, c.name
         ORDER BY b.name COLLATE "C"`
    );
    return result.rows.map((row) => ({
        id: row.brand_id,
        name: row.name,
        country: row.country_name,
        perfumeCount: Number(row.perfume_count),
    }));
}

async function loadAccords(pool) {
    const result = await pool.query(
        `SELECT a.accord_id, a.name, count(pa.perfume_id) AS perfume_count
         FROM accords a
         LEFT JOIN perfume_accords pa ON pa.accord_id = a.accord_id
         GROUP BY a.accord_id, a.name
         ORDER BY a.name COLLATE "C"`
    );
    return result.rows.map((row) => ({
        id: row.accord_id,
        name: row.name,
        perfumeCount: Number(row.perfume_count),
    }));
}

// Rodziny z zagnieżdżonymi podrodzinami. Perfumy są przypisane do podrodzin (perfumes.cluster_id), więc licznik rodziny to suma liczników jej podrodzin.
async function loadFamilies(pool) {
    const result = await pool.query(
        `SELECT c.cluster_id, c.level, c.parent_cluster_id, c.name, c.description, count(p.perfume_id) AS perfume_count
         FROM clusters c
         LEFT JOIN perfumes p ON p.cluster_id = c.cluster_id
         GROUP BY c.cluster_id, c.level, c.parent_cluster_id, c.name, c.description
         ORDER BY c.cluster_id`
    );
    const families = new Map();
    for (const row of result.rows) {
        if (row.level === 'family') {
            families.set(row.cluster_id, {
                id: row.cluster_id,
                name: row.name,
                description: row.description,
                perfumeCount: 0,
                subfamilies: [],
            });
        }
    }
    for (const row of result.rows) {
        if (row.level === 'subfamily') {
            const family = families.get(row.parent_cluster_id);
            const perfumeCount = Number(row.perfume_count);
            family.subfamilies.push({
                id: row.cluster_id,
                name: row.name,
                description: row.description,
                perfumeCount,
            });
            family.perfumeCount += perfumeCount;
        }
    }
    return [...families.values()];
}

// Nuty ogólne z licznikiem perfum (liczonych raz, nawet jeśli perfumy mają kilka nut z tej samej grupy).
// Lista nut szczegółowych (specificNotes) jest wypełniona tylko dla grup z więcej niż jedną nutą szczegółową
async function loadGeneralNotes(pool) {
    // Zapytania wykonują się po kolei, żeby jedno żądanie nie zajmowało kilku połączeń z małej puli.
    const generalResult = await pool.query(
        `SELECT g.general_note_id, g.name, count(DISTINCT pn.perfume_id) AS perfume_count
         FROM general_notes g
         JOIN notes n ON n.general_note_id = g.general_note_id
         LEFT JOIN perfume_notes pn ON pn.note_id = n.note_id
         GROUP BY g.general_note_id, g.name
         ORDER BY g.name COLLATE "C"`
    );
    const membersResult = await pool.query(
        `SELECT n.note_id, n.name, n.general_note_id
         FROM notes n
         WHERE n.general_note_id IN (SELECT general_note_id FROM notes GROUP BY general_note_id HAVING count(*) > 1)
         ORDER BY n.name COLLATE "C"`
    );

    const membersByGroup = new Map();
    for (const row of membersResult.rows) {
        if (!membersByGroup.has(row.general_note_id)) {
            membersByGroup.set(row.general_note_id, []);
        }
        membersByGroup.get(row.general_note_id).push({ id: row.note_id, name: row.name });
    }

    return generalResult.rows.map((row) => ({
        id: row.general_note_id,
        name: row.name,
        perfumeCount: Number(row.perfume_count),
        specificNotes: membersByGroup.get(row.general_note_id) ?? [],
    }));
}

// Wspólna obsługa: pobiera dane funkcją load, a przy błędzie zwraca 500 z komunikatem dla użytkownika.
function dictionaryRoute(errorMessage, load) {
    return async (req, res) => {
        try {
            const items = await load(getPool());
            return res.json({ items });
        } catch (err) {
            console.error(errorMessage, err.message);
            return res.status(500).json({ status: 'error', message: errorMessage });
        }
    };
}


router.get('/brands', requireAuth, dictionaryRoute('Nie udało się pobrać listy marek.', loadBrands));
router.get('/accords', requireAuth, dictionaryRoute('Nie udało się pobrać listy akordów.', loadAccords));
router.get('/families', requireAuth, dictionaryRoute('Nie udało się pobrać listy rodzin zapachowych.', loadFamilies));
router.get('/notes', requireAuth, dictionaryRoute('Nie udało się pobrać listy nut.', loadGeneralNotes));

module.exports = router;