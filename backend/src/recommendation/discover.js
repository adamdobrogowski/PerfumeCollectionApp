// Odkrywanie AI: sklada sekcje z perfum najblizszych centrom zainteresowania.

const { DISCOVER_MAX_SECTIONS, DISCOVER_PER_SECTION, DISCOVER_OVERFETCH_FACTOR } = require('./config');

function pickCentres(centres) {
    return centres.slice(0, DISCOVER_MAX_SECTIONS);
}

function candidateLimit() {
    return DISCOVER_PER_SECTION * DISCOVER_OVERFETCH_FACTOR;
}

function buildSections(centres, candidateLists, nameById, perSection = DISCOVER_PER_SECTION) {
    if (centres.length !== candidateLists.length) {
        throw new Error('Liczba list kandydatow musi byc rowna liczbie centrow.');
    }

    const bestSection = new Map();
    candidateLists.forEach((list, index) => {
        for (const candidate of list) {
            const current = bestSection.get(candidate.perfumeId);
            if (!current || candidate.similarity > current.similarity) {
                bestSection.set(candidate.perfumeId, { index, similarity: candidate.similarity });
            }
        }
    });

    const sections = [];
    centres.forEach((centre, index) => {
        const perfumes = candidateLists[index]
            .filter((candidate) => bestSection.get(candidate.perfumeId).index === index)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, perSection)
            .map(({ similarity, ...perfume }) => perfume);

        if (perfumes.length === 0) {
            return;
        }
        sections.push({
            scope: centre.scope,
            clusterId: centre.clusterId,
            clusterName: nameById.get(centre.clusterId) ?? null,
            confidence: centre.confidence,
            perfumes,
        });
    });
    return sections;
}

module.exports = { pickCentres, candidateLimit, buildSections };