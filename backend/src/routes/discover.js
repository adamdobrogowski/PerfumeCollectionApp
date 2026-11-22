const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { getClusters } = require('../recommendation/clusters-cache');
const { loadLikes } = require('../recommendation/liked-loader');
const { indexLikes, listCentres } = require('../recommendation/centres');
const { findNearest } = require('../recommendation/neighbours-loader');
const { pickCentres, candidateLimit, buildSections } = require('../recommendation/discover');
const router = express.Router();

router.use(requireAuth);

// Odkrywanie AI: sekcje perfum najblizszych centrom zainteresowania uzytkownika.
router.get('/', async (req, res) => {
    try {
        const { userId } = req.user;
        const { subfamilies, nameById } = await getClusters();
        const likes = await loadLikes(userId);
        const centres = pickCentres(listCentres(indexLikes(likes, subfamilies)));

        const limit = candidateLimit();
        const candidateLists = await Promise.all(
            centres.map((centre) => findNearest(userId, centre.centre, limit))
        );

        return res.json({
            likedTotal: likes.length,
            sections: buildSections(centres, candidateLists, nameById),
        });
    } catch (err) {
        console.error('Błąd Odkrywania AI:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się przygotować rekomendacji.' });
    }
});

module.exports = router;