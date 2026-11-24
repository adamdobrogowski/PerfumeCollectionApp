// Smart Matching: porownanie dwoch perfum (bez dostepu do bazy).

const { MATCH_MIN_COSINE } = require('../config');
const { levelOf } = require('./match-levels');

function describe(perfume, other) {
    const otherGeneralNotes = new Set(other.notes.map((note) => note.generalNote.id));
    const otherAccords = new Set(other.accords.map((accord) => accord.id));

    const notes = { top: [], middle: [], base: [] };
    for (const note of perfume.notes) {
        notes[note.layer].push({
            id: note.id,
            name: note.name,
            generalNote: note.generalNote,
            shared: otherGeneralNotes.has(note.generalNote.id),
        });
    }

    return {
        id: perfume.id,
        name: perfume.name,
        brand: perfume.brand,
        gender: perfume.gender,
        releaseYear: perfume.releaseYear,
        family: perfume.family,
        subfamily: perfume.subfamily,
        notes,
        accords: perfume.accords.map((accord) => ({ ...accord, shared: otherAccords.has(accord.id) })),
    };
}

function buildComparison(first, second, cosine) {
    const level = cosine !== null && cosine >= MATCH_MIN_COSINE ? levelOf(cosine) : null;
    return { level, source: describe(first, second), other: describe(second, first) };
}

module.exports = { buildComparison };