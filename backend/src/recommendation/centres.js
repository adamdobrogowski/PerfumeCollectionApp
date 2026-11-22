// Centra zainteresowania uzytkownika
// Czysta logika bez dostepu do bazy: dostaje Lubiane perfumy z wektorami oraz liste podrodzin z centroidami.

const { MIN_LIKED_FOR_RELIABLE_CENTRE, BORDERLINE_MARGIN } = require('./config');
const { dot, normalize, weightedMean } = require('./vectors');

function addTo(map, key, member) {
    if (!map.has(key)) {
        map.set(key, []);
    }
    map.get(key).push(member);
}

// Zwraca druga najblizsza podrodzine, jesli perfuma lezy "na granicy" (cosinus do jej podrodziny
// rozni sie od cosinusa do drugiej o mniej niz BORDERLINE_MARGIN); w przeciwnym razie null.
function findBorderlineSubfamily(like, subfamilies, centroidById) {
    if (BORDERLINE_MARGIN <= 0) {
        return null;
    }
    const ownCosine = dot(like.vector, centroidById.get(like.subfamilyId));
    let second = null;
    let secondCosine = -Infinity;
    for (const subfamily of subfamilies) {
        if (subfamily.id === like.subfamilyId) {
            continue;
        }
        const cosine = dot(like.vector, subfamily.centroid);
        if (cosine > secondCosine) {
            second = subfamily;
            secondCosine = cosine;
        }
    }
    return ownCosine - secondCosine < BORDERLINE_MARGIN ? second : null;
}

// Grupuje Lubiane wedlug podrodzin i rodzin (jeden raz). Perfumy graniczne licza sie tez do drugiej podrodziny
// oraz do jej rodziny, o ile jest inna niz rodzina perfumy.
function indexLikes(likes, subfamilies) {
    const centroidById = new Map(subfamilies.map((s) => [s.id, s.centroid]));
    const familyOfSubfamily = new Map(subfamilies.map((s) => [s.id, s.familyId]));
    const bySubfamily = new Map();
    const byFamily = new Map();

    for (const like of likes) {
        if (!centroidById.has(like.subfamilyId)) {
            throw new Error(`Nieznana podrodzina perfum: ${like.subfamilyId}.`);
        }
        const member = { perfumeId: like.perfumeId, strength: like.strength, vector: like.vector };
        addTo(bySubfamily, like.subfamilyId, member);
        addTo(byFamily, like.familyId, member);

        const second = findBorderlineSubfamily(like, subfamilies, centroidById);
        if (second) {
            addTo(bySubfamily, second.id, member);
            if (second.familyId !== like.familyId) {
                addTo(byFamily, second.familyId, member);
            }
        }
    }
    return { bySubfamily, byFamily, familyOfSubfamily };
}

// Wybiera grupe bazowa dla kandydata:
// 1. >= 3 Lubianych w podrodzinie, 2. >= 3 w rodzinie, 3. 1-2 w podrodzinie, 4. 1-2 w rodzinie, 5. brak.
function chooseGroup(index, candidate) {
    const inSubfamily = index.bySubfamily.get(candidate.subfamilyId) ?? [];
    const inFamily = index.byFamily.get(candidate.familyId) ?? [];

    if (inSubfamily.length >= MIN_LIKED_FOR_RELIABLE_CENTRE) {
        return { scope: 'subfamily', clusterId: candidate.subfamilyId, confidence: 'high', members: inSubfamily };
    }
    if (inFamily.length >= MIN_LIKED_FOR_RELIABLE_CENTRE) {
        return { scope: 'family', clusterId: candidate.familyId, confidence: 'medium', members: inFamily };
    }
    if (inSubfamily.length >= 1) {
        return { scope: 'subfamily', clusterId: candidate.subfamilyId, confidence: 'low', members: inSubfamily };
    }
    if (inFamily.length >= 1) {
        return { scope: 'family', clusterId: candidate.familyId, confidence: 'low', members: inFamily };
    }
    return { scope: null, clusterId: null, confidence: 'none', members: [] };
}

// Dodaje do grupy: wielkosc dla progow (1, 2 albo 3 = trzy lub wiecej), sume wag i centrum (srednia wazona, dlugosc 1).
function finishGroup(group) {
    if (group.members.length === 0) {
        return { ...group, nGroup: 0, weightSum: 0, centre: null };
    }
    const vectors = group.members.map((m) => m.vector);
    const weights = group.members.map((m) => m.strength);
    return {
        ...group,
        nGroup: Math.min(group.members.length, MIN_LIKED_FOR_RELIABLE_CENTRE),
        weightSum: weights.reduce((sum, w) => sum + w, 0),
        centre: normalize(weightedMean(vectors, weights)),
    };
}

// Centrum dla jednego kandydata ({ subfamilyId, familyId }); uzywane przez Blind Buy Guard.
function buildCentre(index, candidate) {
    return finishGroup(chooseGroup(index, candidate));
}

// Wszystkie centra uzytkownika, kazde raz, od najmocniej lubianego obszaru; uzywane przez Odkrywanie AI.
// Podrodziny, ktore przechodza na to samo centrum rodziny, daja jedno centrum.
function listCentres(index) {
    const groups = new Map();
    for (const subfamilyId of index.bySubfamily.keys()) {
        const familyId = index.familyOfSubfamily.get(subfamilyId);
        const group = chooseGroup(index, { subfamilyId, familyId });
        const key = `${group.scope}:${group.clusterId}`;
        if (!groups.has(key)) {
            groups.set(key, group);
        }
    }
    return [...groups.values()]
        .map(finishGroup)
        .sort((a, b) => b.weightSum - a.weightSum || a.clusterId - b.clusterId);
}

module.exports = { indexLikes, chooseGroup, buildCentre, listCentres };