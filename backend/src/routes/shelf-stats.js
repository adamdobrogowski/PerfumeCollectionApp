const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { loadShelfStatsData } = require('../recommendation/shelf-stats/shelf-stats-loader');
const { buildShelfStats } = require('../recommendation/shelf-stats/shelf-stats');
const router = express.Router();

// Statystyki polki: przewazajace rodziny, najczestsze i ulubione nuty.
router.get('/', requireAuth, async (req, res) => {
    try {
        const data = await loadShelfStatsData(req.user.userId);
        return res.json(buildShelfStats(data));
    } catch (err) {
        console.error('Błąd pobierania statystyk półki:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się pobrać statystyk półki.' });
    }
});

module.exports = router;