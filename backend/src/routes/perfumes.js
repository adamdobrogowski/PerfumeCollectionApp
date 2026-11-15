const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth/middleware');
const router = express.Router();

router.use(requireAuth);

const MAX_INTEGER_ID = 2147483647;

router.get('/:id', async (req, res) => {
    if (!/^[1-9]\d{0,9}$/.test(req.params.id) || Number(req.params.id) > MAX_INTEGER_ID) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }
    const perfumeId = Number(req.params.id);

    try {
        const pool = getPool();

        // Zapytania wykonują się po kolei, żeby jedno żądanie nie zajmowało kilku połączeń z małej puli.
        const perfumeResult = await pool.query(
            `SELECT p.perfume_id, p.name, p.gender, p.release_year,
                    p.source_rating_value, p.source_rating_count,
                    b.brand_id, b.name AS brand_name, c.name AS country_name,
                    sf.cluster_id AS subfamily_id, sf.name AS subfamily_name, sf.description AS subfamily_description,
                    f.cluster_id AS family_id, f.name AS family_name
             FROM perfumes p
             JOIN brands b     ON b.brand_id = p.brand_id
             JOIN countries c  ON c.country_id = b.country_id
             JOIN clusters sf  ON sf.cluster_id = p.cluster_id
             JOIN clusters f   ON f.cluster_id = sf.parent_cluster_id
             WHERE p.perfume_id = $1`,
            [perfumeId]
        );
        if (perfumeResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono perfum.' });
        }
        const perfume = perfumeResult.rows[0];

        const perfumersResult = await pool.query(
            `SELECT pr.perfumer_id, pr.name, pr.is_company
             FROM perfume_perfumers pp
             JOIN perfumers pr ON pr.perfumer_id = pp.perfumer_id
             WHERE pp.perfume_id = $1
             ORDER BY pr.name`,
            [perfumeId]
        );

        const notesResult = await pool.query(
            `SELECT n.note_id, n.name, pn.layer
             FROM perfume_notes pn
             JOIN notes n ON n.note_id = pn.note_id
             WHERE pn.perfume_id = $1
             ORDER BY n.name`,
            [perfumeId]
        );

        const accordsResult = await pool.query(
            `SELECT a.accord_id, a.name, pa.accord_rank
             FROM perfume_accords pa
             JOIN accords a ON a.accord_id = pa.accord_id
             WHERE pa.perfume_id = $1
             ORDER BY pa.accord_rank`,
            [perfumeId]
        );

        const notes = { top: [], middle: [], base: [] };
        for (const row of notesResult.rows) {
            notes[row.layer].push({ id: row.note_id, name: row.name });
        }

        return res.json({
            id: perfume.perfume_id,
            name: perfume.name,
            brand: { id: perfume.brand_id, name: perfume.brand_name, country: perfume.country_name },
            gender: perfume.gender,
            releaseYear: perfume.release_year,
            // Sterownik pg zwraca typ numeric jako tekst, więc ocenę zamieniamy na liczbę.
            sourceRating: perfume.source_rating_value === null
                ? null
                : { value: Number(perfume.source_rating_value), count: perfume.source_rating_count },
            family: { id: perfume.family_id, name: perfume.family_name },
            subfamily: {
                id: perfume.subfamily_id,
                name: perfume.subfamily_name,
                description: perfume.subfamily_description,
            },
            perfumers: perfumersResult.rows.map((row) => ({
                id: row.perfumer_id,
                name: row.name,
                isCompany: row.is_company,
            })),
            notes,
            accords: accordsResult.rows.map((row) => ({
                id: row.accord_id,
                name: row.name,
                rank: row.accord_rank,
            })),
        });
    } catch (err) {
        console.error('Błąd pobierania karty perfum:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać karty perfum.' });
    }
});

module.exports = router;