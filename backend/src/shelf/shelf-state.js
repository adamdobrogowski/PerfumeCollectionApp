const MAX_INTEGER_ID = 2147483647;
const OPINIONS = ['liked', 'disliked'];
const PLACEMENTS = ['collection', 'wishlist'];

function parsePerfumeId(text) {
    if (!/^[1-9]\d{0,9}$/.test(text) || Number(text) > MAX_INTEGER_ID) {
        return null;
    }
    return Number(text);
}

function parseShelfState(body) {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return { error: 'Podaj stan półki: opinion, likeStrength i placement.' };
    }
    for (const key of ['opinion', 'likeStrength', 'placement']) {
        if (!Object.hasOwn(body, key)) {
            return { error: `Brakuje pola "${key}".` };
        }
    }

    const { opinion, likeStrength, placement } = body;

    if (opinion !== null && !OPINIONS.includes(opinion)) {
        return { error: 'Nieprawidłowa opinia.' };
    }
    if (placement !== null && !PLACEMENTS.includes(placement)) {
        return { error: 'Nieprawidłowe oznaczenie.' };
    }
    if (likeStrength !== null && !(Number.isInteger(likeStrength) && likeStrength >= 1 && likeStrength <= 3)) {
        return { error: 'Siła upodobania musi być liczbą całkowitą od 1 do 3.' };
    }
    if (opinion === 'liked' && likeStrength === null) {
        return { error: 'Podaj siłę upodobania (1-3) dla Lubianych.' };
    }
    if (opinion !== 'liked' && likeStrength !== null) {
        return { error: 'Siła upodobania dotyczy tylko Lubianych.' };
    }
    if (opinion === 'disliked' && placement === 'wishlist') {
        return { error: 'Nielubianych perfum nie można dodać do listy życzeń.' };
    }

    return { state: { opinion, likeStrength, placement } };
}

module.exports = { parsePerfumeId, parseShelfState };