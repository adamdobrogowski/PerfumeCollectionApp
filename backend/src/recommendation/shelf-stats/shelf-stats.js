const { SHELF_STATS_TOP_NOTES } = require('../config');

const collator = new Intl.Collator('pl');

function noteLabel(generalNote) {
    return generalNote.namePl ?? generalNote.name;
}

function rankFamilies(families, collectionTotal) {
    return [...families]
        .sort((a, b) => b.perfumeCount - a.perfumeCount || collator.compare(a.name, b.name) || a.id - b.id)
        .map((family) => ({
            id: family.id,
            name: family.name,
            perfumeCount: family.perfumeCount,
            share: family.perfumeCount / collectionTotal,
        }));
}

function rankNotes(notes, valueKey) {
    return [...notes]
        .sort((a, b) =>
            b.value - a.value ||
            collator.compare(noteLabel(a.generalNote), noteLabel(b.generalNote)) ||
            a.generalNote.id - b.generalNote.id
        )
        .slice(0, SHELF_STATS_TOP_NOTES)
        .map((note) => ({ generalNote: note.generalNote, [valueKey]: note.value }));
}

function buildShelfStats({ collectionTotal, likedTotal, families, frequentNotes, favouriteNotes }) {
    return {
        collectionTotal,
        likedTotal,
        families: collectionTotal > 0 ? rankFamilies(families, collectionTotal) : [],
        frequentNotes: rankNotes(frequentNotes, 'perfumeCount'),
        favouriteNotes: rankNotes(favouriteNotes, 'score'),
    };
}

module.exports = { buildShelfStats };