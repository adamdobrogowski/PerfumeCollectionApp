// Smart Matching: poziom podobienstwa i sklad strony wynikow (bez dostepu do bazy).

const { VERY_CLOSE_COSINE, MATCH_CLOSE_COSINE, MATCH_PAGE_SIZE } = require('../config');

// Zamiana cosinusa na poziom. Perfumy ponizej progu MATCH_MIN_COSINE odsiewa zapytanie SQL,
// wiec tutaj kazda wartosc, ktora nie jest "bardzo bliska" ani "bliska", to "podobny kierunek".
function levelOf(cosine) {
    if (cosine >= VERY_CLOSE_COSINE) {
        return 'very_close';
    }
    if (cosine >= MATCH_CLOSE_COSINE) {
        return 'close';
    }
    return 'similar_direction';
}

function buildMatchPage(rows, pageSize = MATCH_PAGE_SIZE) {
    const results = rows.slice(0, pageSize).map(({ similarity, ...perfume }) => ({
        ...perfume,
        level: levelOf(similarity),
    }));
    return { results, hasMore: rows.length > pageSize };
}

module.exports = { levelOf, buildMatchPage };