// Onboarding: walidacja ciala zadania

const {
    ONBOARDING_MIN_LIKED,
    ONBOARDING_MIN_DISLIKED,
    ONBOARDING_MAX_LIKED,
    ONBOARDING_MAX_DISLIKED,
} = require('../config');

const MAX_INTEGER_ID = 2147483647;

function isPerfumeId(value) {
    return Number.isInteger(value) && value >= 1 && value <= MAX_INTEGER_ID;
}

function hasDuplicates(ids) {
    return new Set(ids).size !== ids.length;
}

function parseOnboarding(body) {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return { error: 'Podaj Lubiane i Nielubiane perfumy: liked i disliked.' };
    }
    const { liked, disliked } = body;
    if (!Array.isArray(liked)) {
        return { error: 'Pole "liked" musi być listą.' };
    }
    if (!Array.isArray(disliked)) {
        return { error: 'Pole "disliked" musi być listą.' };
    }

    if (liked.length < ONBOARDING_MIN_LIKED) {
        return { error: `Wybierz co najmniej ${ONBOARDING_MIN_LIKED} Lubiane perfumy.` };
    }
    if (liked.length > ONBOARDING_MAX_LIKED) {
        return { error: `Możesz wskazać najwyżej ${ONBOARDING_MAX_LIKED} Lubianych perfum.` };
    }
    if (disliked.length < ONBOARDING_MIN_DISLIKED) {
        return { error: `Wybierz co najmniej ${ONBOARDING_MIN_DISLIKED} Nielubianą perfumę.` };
    }
    if (disliked.length > ONBOARDING_MAX_DISLIKED) {
        return { error: `Możesz wskazać najwyżej ${ONBOARDING_MAX_DISLIKED} Nielubianych perfum.` };
    }

    const likedValue = [];
    for (const item of liked) {
        const isObject = typeof item === 'object' && item !== null && !Array.isArray(item);
        if (!isObject || !isPerfumeId(item.perfumeId)) {
            return { error: 'Każda Lubiana perfuma musi mieć poprawny perfumeId.' };
        }
        if (!(Number.isInteger(item.likeStrength) && item.likeStrength >= 1 && item.likeStrength <= 3)) {
            return { error: 'Siła upodobania musi być liczbą całkowitą od 1 do 3.' };
        }
        likedValue.push({ perfumeId: item.perfumeId, likeStrength: item.likeStrength });
    }
    if (!disliked.every(isPerfumeId)) {
        return { error: 'Każda Nielubiana perfuma musi być poprawnym identyfikatorem.' };
    }

    const likedIds = likedValue.map((item) => item.perfumeId);
    if (hasDuplicates(likedIds) || hasDuplicates(disliked)) {
        return { error: 'Te same perfumy nie mogą się powtarzać na liście.' };
    }
    const likedSet = new Set(likedIds);
    if (disliked.some((id) => likedSet.has(id))) {
        return { error: 'Te same perfumy nie mogą być jednocześnie Lubianymi i Nielubianymi.' };
    }

    return { value: { liked: likedValue, disliked: [...disliked] } };
}

module.exports = { parseOnboarding };