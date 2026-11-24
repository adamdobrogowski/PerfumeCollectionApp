const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { parsePerfumeId } = require('../shelf/shelf-state');
const { VERY_CLOSE_COSINE } = require('../recommendation/config');
const { getClusters } = require('../recommendation/shared/clusters-cache');
const { getThreshold } = require('../recommendation/blind-buy-guard/thresholds-cache');
const { loadCandidate } = require('../recommendation/blind-buy-guard/candidate-loader');
const { loadLikes } = require('../recommendation/shared/liked-loader');
const { loadOpinion } = require('../recommendation/blind-buy-guard/shelf-opinion-loader');
const { loadPerfumeBrief } = require('../recommendation/shared/perfume-brief-loader');
const { findSimilarDisliked } = require('../recommendation/blind-buy-guard/dislikes-loader');
const { indexLikes } = require('../recommendation/shared/centres');
const { assessCandidate } = require('../recommendation/blind-buy-guard/blind-buy-guard');
const router = express.Router();

// Blind Buy Guard: ocena perfum przed dodaniem do listy zyczen. Router jest montowany na /api/v1/perfumes
// obok routera katalogu, wiec autoryzacja jest przy samej trasie, a nie przez router.use.
router.get('/:perfumeId/blind-buy-check', requireAuth, async (req, res) => {
    const perfumeId = parsePerfumeId(req.params.perfumeId);
    if (perfumeId === null) {
        return res.status(400).json({ status: 'error', message: 'Nieprawidłowy identyfikator perfum.' });
    }

    try {
        const { userId } = req.user;
        const [candidate, opinion] = await Promise.all([loadCandidate(perfumeId), loadOpinion(userId, perfumeId)]);
        if (!candidate) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono perfum.' });
        }
        // Nielubianych perfum nie mozna dodac do listy zyczen (ograniczenie w bazie), wiec Blind Buy Guard nie ma sensu.
        if (opinion === 'disliked') {
            return res.status(409).json({ status: 'error', message: 'Nielubianych perfum nie można dodać do listy życzeń.' });
        }

        const [{ subfamilies }, likes, dislikes] = await Promise.all([
            getClusters(),
            loadLikes(userId),
            findSimilarDisliked(userId, candidate.vector, VERY_CLOSE_COSINE),
        ]);
        const result = await assessCandidate({
            candidate,
            likes,
            index: indexLikes(likes, subfamilies),
            loadThreshold: getThreshold,
        });
        const nearestLiked = result.nearestLikedId === null ? null : await loadPerfumeBrief(result.nearestLikedId);

        return res.json({
            state: result.state,
            level: result.level,
            confidence: result.confidence,
            nearestLiked,
            family: result.family,
            subfamily: result.subfamily,
            dislikeWarning: dislikes.map(({ perfumeId: id, name, brand }) => ({ id, name, brand })),
            capped: result.capped,
        });
    } catch (err) {
        console.error('Błąd Blind Buy Guard:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się ocenić tych perfum.' });
    }
});

module.exports = router;