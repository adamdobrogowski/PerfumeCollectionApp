const express = require('express');
const { withTransaction } = require('../db');
const { requireAuth } = require('../auth/middleware');
const { parseOnboarding } = require('../recommendation/onboarding/onboarding');
const { saveOnboarding } = require('../recommendation/onboarding/onboarding-save');
const { invalidateDiscover } = require('../recommendation/discover/discover-cache');
const router = express.Router();

const FOREIGN_KEY_VIOLATION_CODE = '23503';

router.post('/', requireAuth, async (req, res) => {
    const { value, error } = parseOnboarding(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error });
    }

    try {
        const result = await withTransaction((client) => saveOnboarding(client, req.user.userId, value));
        if (result.alreadyCompleted) {
            return res.status(409).json({ status: 'error', message: 'Onboarding został już ukończony.' });
        }
        invalidateDiscover(req.user.userId);
        return res.json({ onboardingCompleted: true });
    } catch (err) {
        if (err.code === FOREIGN_KEY_VIOLATION_CODE) {
            return res.status(404).json({ status: 'error', message: 'Nie znaleziono części wskazanych perfum.' });
        }
        console.error('Błąd zapisu onboardingu:', err.message);
        return res.status(500).json({ status: 'error', message: 'Nie udało się zapisać onboardingu.' });
    }
});

module.exports = router;