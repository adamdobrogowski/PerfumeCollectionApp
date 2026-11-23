// Blind Buy Guard: ocena kandydata na liste zyczen wzgledem gustu uzytkownika

const { VERY_CLOSE_COSINE } = require('./config');
const { buildCentre } = require('./centres');
const { assessRisk } = require('./risk');
const { dot } = require('./vectors');

function findNearestMember(vector, members) {
    let best = null;
    for (const member of members) {
        const cosine = dot(vector, member.vector);
        if (!best || cosine > best.cosine) {
            best = { perfumeId: member.perfumeId, cosine };
        }
    }
    return best;
}

// candidate     - wynik loadCandidate(),
// likes         - wynik loadLikes() dla uzytkownika,
// index         - indexLikes(likes, subfamilies),
// loadThreshold - async (clusterId, nGroup) => { centreP50, centreP90, nearestP50, nearestP90 } albo null.
// Zwraca { state, level, confidence, nearestLikedId, family, subfamily, capped }.
async function assessCandidate({ candidate, likes, index, loadThreshold }) {
    const result = {
        state: null,
        level: null,
        confidence: null,
        nearestLikedId: null,
        family: candidate.family,
        subfamily: candidate.subfamily,
        capped: false,
    };

    // 1. Kandydat jest juz w Lubianych: odleglosc od samego siebie bylaby zerem i falszowala wynik.
    if (likes.some((like) => like.perfumeId === candidate.perfumeId)) {
        return { ...result, state: 'already_liked' };
    }

    // 2. Grupa bazowa wedlug rozdzialu 4.2 (podrodzina, potem rodzina).
    const group = buildCentre(index, { subfamilyId: candidate.subfamily.id, familyId: candidate.family.id });

    // 3. Brak grupy: szukamy bardzo bliskiej Lubianej sposrod wszystkich.
    if (group.confidence === 'none') {
        const nearestAny = findNearestMember(candidate.vector, likes);
        if (nearestAny && nearestAny.cosine >= VERY_CLOSE_COSINE) {
            return { ...result, state: 'very_close_other_family', level: 0, nearestLikedId: nearestAny.perfumeId };
        }
        return { ...result, state: 'unknown' };
    }

    // 4-5. Odleglosc od centrum grupy i od najblizszej perfumy w grupie oraz progi tej grupy.
    const centreCosine = dot(candidate.vector, group.centre);
    const nearest = findNearestMember(candidate.vector, group.members);
    const thresholds = await loadThreshold(group.clusterId, group.nGroup);
    if (!thresholds) {
        throw new Error(`Brak progow dla klastra ${group.clusterId} i grupy ${group.nGroup}.`);
    }

    // 6-7. Minimum z dwoch poziomow i ograniczenie przy pewnosci innej niz high.
    const risk = assessRisk({
        centreCosine,
        nearestCosine: nearest.cosine,
        thresholds,
        confidence: group.confidence,
    });

    return {
        ...result,
        state: 'known',
        level: risk.level,
        confidence: group.confidence,
        nearestLikedId: nearest.perfumeId,
        capped: risk.capped,
    };
}

module.exports = { assessCandidate };