const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { DISCOVER_PER_SECTION } = require('../recommendation/config');
const { getClusters } = require('../recommendation/shared/clusters-cache');
const { loadLikes } = require('../recommendation/shared/liked-loader');
const { loadPerfumeBriefs } = require('../recommendation/shared/perfume-brief-loader');
const { indexLikes, listCentres } = require('../recommendation/shared/centres');
const { findNearest } = require('../recommendation/discover/neighbours-loader');
const { pickCentres, candidateLimit, pickBasedOnIds, buildSections } = require('../recommendation/discover/discover');
const { getCachedDiscover } = require('../recommendation/discover/discover-cache');
const router = express.Router();

router.use(requireAuth);

// Liczy cala odpowiedz Odkrywania AI dla uzytkownika (kosztowne: po jednym zapytaniu o sasiadow na centrum).
async function computeDiscover(userId) {
    const { subfamilies, nameById } = await getClusters();
    const likes = await loadLikes(userId);
    const centres = pickCentres(listCentres(indexLikes(likes, subfamilies)));

    const limit = candidateLimit();
    const basedOnIds = [...new Set(centres.flatMap((centre) => pickBasedOnIds(centre.members)))];
    const [briefById, ...candidateLists] = await Promise.all([
        loadPerfumeBriefs(basedOnIds),
        ...centres.map((centre) => findNearest(userId, centre.centre, limit)),
    ]);

    return {
        likedTotal: likes.length,
        sections: buildSections(centres, candidateLists, nameById, DISCOVER_PER_SECTION, briefById),
    };
}

// Odkrywanie AI: sekcje perfum najblizszych centrom zainteresowania uzytkownika (z pamieci podrecznej).
router.get('/', async (req, res) => {
    try {
        const { userId } = req.user;
        return res.json(await getCachedDiscover(userId, () => computeDiscover(userId)));
    } catch (err) {
        console.error('Błąd Odkrywania AI:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się przygotować rekomendacji.' });
    }
});

module.exports = router;