const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { parsePerfumeId } = require('../shelf/shelf-state');
const { loadPerfumeBrief } = require('../recommendation/shared/perfume-brief-loader');
const { parseMatchRequest } = require('../recommendation/smart-matching/match-request');
const { findMatches } = require('../recommendation/smart-matching/match-search');
const { buildMatchPage } = require('../recommendation/smart-matching/match-levels');
const { loadComparedPerfumes } = require('../recommendation/smart-matching/compare-loader');
const { buildComparison } = require('../recommendation/smart-matching/compare');
const router = express.Router();

// Smart Matching: wyszukiwanie zamiennikow dla perfum-wzorca. Router jest montowany na /api/v1/perfumes
// obok routera katalogu, wiec autoryzacja jest przy samej trasie, a nie przez router.use.
router.post('/:perfumeId/matches/search', requireAuth, async (req, res) => {
    const perfumeId = parsePerfumeId(req.params.perfumeId);
    if (perfumeId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }
    const parsed = parseMatchRequest(req.body);
    if (parsed.error) {
        return res.status(400).json({ status: 'error', message: parsed.error });
    }
    const request = parsed.value;

    try {
        const source = await loadPerfumeBrief(perfumeId);
        if (!source) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono perfum.' });
        }
        if (request.excludeSameBrand && request.brandIds.includes(source.brand.id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Nie można jednocześnie wykluczyć marki wzorca i wybrać jej w filtrze marek.',
            });
        }

        const rows = await findMatches(req.user.userId, { perfumeId: source.id, brandId: source.brand.id }, request);
        const { results, hasMore } = buildMatchPage(rows);
        return res.json({ source, results, hasMore });
    } catch (err) {
        console.error('Błąd Smart Matching:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się wyszukać zamienników.' });
    }
});

// Porownanie dwoch perfum: piramidy nut i akordy z oznaczeniem pozycji wspolnych oraz poziom podobienstwa pary.
router.get('/:perfumeId/compare/:otherId', requireAuth, async (req, res) => {
    const firstId = parsePerfumeId(req.params.perfumeId);
    const secondId = parsePerfumeId(req.params.otherId);
    if (firstId === null || secondId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }
    if (firstId === secondId) {
        return res.status(400).json({ status: 'error', message: 'Wybierz dwoje różnych perfum do porównania.' });
    }

    try {
        const data = await loadComparedPerfumes(firstId, secondId);
        if (!data) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono perfum.' });
        }
        return res.json(buildComparison(data.first, data.second, data.cosine));
    } catch (err) {
        console.error('Błąd porównania perfum:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się porównać perfum.' });
    }
});

module.exports = router;