const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { getClusters } = require('../recommendation/clusters-cache');
const { loadLikes } = require('../recommendation/liked-loader');
const { indexLikes, listCentres } = require('../recommendation/centres');
const router = express.Router();

router.use(requireAuth);

// TYMCZASOWE: podglad centrow zainteresowania do sprawdzenia logiki na prawdziwych danych.
// Do usuniecia po zbudowaniu Odkrywania AI (docelowo GET /api/v1/discover).
// Odpowiedz nie zawiera wektorow, tylko opis centrow i id perfum, z ktorych sa liczone.
router.get('/centres', async (req, res) => {
    try {
        const { subfamilies, nameById } = await getClusters();
        const likes = await loadLikes(req.user.userId);
        const centres = listCentres(indexLikes(likes, subfamilies));
        return res.json({
            likedTotal: likes.length,
            centres: centres.map((centre) => ({
                scope: centre.scope,
                clusterId: centre.clusterId,
                clusterName: nameById.get(centre.clusterId),
                confidence: centre.confidence,
                nGroup: centre.nGroup,
                perfumeCount: centre.members.length,
                weightSum: centre.weightSum,
                perfumeIds: centre.members.map((member) => member.perfumeId),
            })),
        });
    } catch (err) {
        console.error('Błąd wyznaczania centrów zainteresowania:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się wyznaczyć centrów zainteresowania.' });
    }
});

module.exports = router;