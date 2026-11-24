// Smart Matching: walidacja ciala zadania POST /perfumes/:id/matches/search

const {
    MATCH_MAX_CONDITIONS,
    MATCH_MAX_BRANDS,
    MATCH_MAX_OFFSET,
    MATCH_ACCORD_MAX_RANK,
} = require('../config');

const MAX_INTEGER_ID = 2147483647;
const GENDERS = ['women', 'men', 'unisex'];
const NOTE_KINDS = ['general', 'detailed'];
const DEFAULT_ACCORD_STRENGTH = 'clear';

class RequestError extends Error {}

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveId(value) {
    return Number.isInteger(value) && value >= 1 && value <= MAX_INTEGER_ID;
}

function hasDuplicates(keys) {
    return new Set(keys).size !== keys.length;
}

function readBoolean(body, name, defaultValue) {
    const value = body[name];
    if (value === undefined) {
        return defaultValue;
    }
    if (typeof value !== 'boolean') {
        throw new RequestError(`Pole "${name}" musi mieć wartość true lub false.`);
    }
    return value;
}

function readGender(body) {
    const value = body.gender;
    if (value === undefined || value === null) {
        return null;
    }
    if (!GENDERS.includes(value)) {
        throw new RequestError(`Pole "gender" musi mieć wartość: ${GENDERS.join(', ')}.`);
    }
    return value;
}

function readBrandIds(body) {
    const value = body.brandIds;
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new RequestError('Pole "brandIds" musi być listą.');
    }
    if (value.length > MATCH_MAX_BRANDS) {
        throw new RequestError(`Pole "brandIds" może zawierać najwyżej ${MATCH_MAX_BRANDS} marek.`);
    }
    if (!value.every(isPositiveId)) {
        throw new RequestError('Każda marka w "brandIds" musi mieć poprawny identyfikator.');
    }
    if (hasDuplicates(value)) {
        throw new RequestError('Marki w "brandIds" nie mogą się powtarzać.');
    }
    return [...value];
}

function parseNote(item, path) {
    if (!isPlainObject(item) || !NOTE_KINDS.includes(item.kind) || !isPositiveId(item.id)) {
        throw new RequestError(`Każda pozycja w "${path}" musi mieć kind (${NOTE_KINDS.join(' lub ')}) i poprawny id.`);
    }
    return { kind: item.kind, id: item.id };
}

function parseAccord(item, path) {
    if (!isPlainObject(item) || !isPositiveId(item.accordId)) {
        throw new RequestError(`Każda pozycja w "${path}" musi mieć poprawny accordId.`);
    }
    const strength = item.strength === undefined ? DEFAULT_ACCORD_STRENGTH : item.strength;
    if (typeof strength !== 'string' || !Object.hasOwn(MATCH_ACCORD_MAX_RANK, strength)) {
        throw new RequestError(
            `Pole strength w "${path}" musi mieć wartość: ${Object.keys(MATCH_ACCORD_MAX_RANK).join(', ')}.`
        );
    }
    return { accordId: item.accordId, maxRank: MATCH_ACCORD_MAX_RANK[strength] };
}

function readConditions(group, key, path, parseItem, keyOf) {
    const raw = group[key];
    if (raw === undefined) {
        return [];
    }
    if (!Array.isArray(raw)) {
        throw new RequestError(`Pole "${path}" musi być listą.`);
    }
    if (raw.length > MATCH_MAX_CONDITIONS) {
        throw new RequestError(`Pole "${path}" może zawierać najwyżej ${MATCH_MAX_CONDITIONS} pozycji.`);
    }
    const items = raw.map((item) => parseItem(item, path));
    if (hasDuplicates(items.map(keyOf))) {
        throw new RequestError(`Pozycje w "${path}" nie mogą się powtarzać.`);
    }
    return items;
}

// Grupa warunkow { include: [...], exclude: [...] } (dla nut i akordow).
function readConditionGroup(body, name, parseItem, keyOf) {
    const group = body[name];
    if (group === undefined) {
        return { include: [], exclude: [] };
    }
    if (!isPlainObject(group)) {
        throw new RequestError(`Pole "${name}" musi być obiektem z listami include i exclude.`);
    }
    const include = readConditions(group, 'include', `${name}.include`, parseItem, keyOf);
    const exclude = readConditions(group, 'exclude', `${name}.exclude`, parseItem, keyOf);

    const excludedKeys = new Set(exclude.map(keyOf));
    if (include.some((item) => excludedKeys.has(keyOf(item)))) {
        throw new RequestError(`Ta sama pozycja nie może być jednocześnie w "${name}.include" i w "${name}.exclude".`);
    }
    return { include, exclude };
}

function readOffset(body) {
    const value = body.offset;
    if (value === undefined) {
        return 0;
    }
    if (!Number.isInteger(value) || value < 0 || value > MATCH_MAX_OFFSET) {
        throw new RequestError(`Pole "offset" musi być liczbą całkowitą od 0 do ${MATCH_MAX_OFFSET}.`);
    }
    return value;
}

function parseMatchRequest(body) {
    const source = body === undefined ? {} : body;
    try {
        if (!isPlainObject(source)) {
            throw new RequestError('Ciało żądania musi być obiektem JSON.');
        }
        return {
            value: {
                excludeSameBrand: readBoolean(source, 'excludeSameBrand', false),
                hideKnown: readBoolean(source, 'hideKnown', true),
                gender: readGender(source),
                brandIds: readBrandIds(source),
                notes: readConditionGroup(source, 'notes', parseNote, (note) => `${note.kind}:${note.id}`),
                accords: readConditionGroup(source, 'accords', parseAccord, (accord) => accord.accordId),
                offset: readOffset(source),
            },
        };
    } catch (err) {
        if (err instanceof RequestError) {
            return { error: err.message };
        }
        throw err;
    }
}

module.exports = { parseMatchRequest };