const { rateLimit } = require("express-rate-limit");

// Ogranicza liczbę nieudanych prób z jednego adresu IP (zgadywanie haseł, masowa rejestracja).
// Zliczane są tylko odpowiedzi z błędem (status >= 400); udane żądania nie zużywają limitu.
// Liczniki są w pamięci procesu, więc zerują się po restarcie serwera.

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Zbyt wiele nieudanych prób. Spróbuj ponownie później.'
    }
});

module.exports = { authLimiter };