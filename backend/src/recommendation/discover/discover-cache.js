// Pamiec podreczna wyniku Odkrywania AI: jeden wpis na uzytkownika.

const { DISCOVER_CACHE_TTL_MS } = require('../config');

const entries = new Map();

// Zwraca wynik z pamieci albo, gdy go nie ma lub wygasl, wywoluje compute(), zapamietuje i zwraca.
// Trzymamy obietnice (a nie gotowy wynik), wiec rownolegle zadania tego samego uzytkownika dziela jedno liczenie.
function getCachedDiscover(userId, compute) {
    const now = Date.now();
    const cached = entries.get(userId);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const entry = { promise: null, expiresAt: now + DISCOVER_CACHE_TTL_MS };
    entry.promise = compute().catch((error) => {
        if (entries.get(userId) === entry) {
            entries.delete(userId);
        }
        throw error;
    });
    entries.set(userId, entry);
    return entry.promise;
}

function invalidateDiscover(userId) {
    entries.delete(userId);
}

module.exports = { getCachedDiscover, invalidateDiscover };