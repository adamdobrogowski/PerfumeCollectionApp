const { parsePositiveId } = require('../feed/validation');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DISPLAY_NAME_MIN_LENGTH = 3;
const DISPLAY_NAME_MAX_LENGTH = 30;
const DISPLAY_NAME_REGEX = /^[A-Za-z0-9._-]+$/;
const BIO_MAX_LENGTH = 300;
const DEFAULT_SEARCH_LIMIT = 10;
const MAX_SEARCH_LIMIT = 20;
const MAX_SEARCH_QUERY_LENGTH = 50;

const UPDATABLE_FIELDS = ['displayName', 'bio', 'isPrivate', 'shelfIsPrivate'];

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseUuid(value) {
    if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
        return null;
    }
    return value.toLowerCase();
}

function parseProfileSearchQuery(query) {
    const input = isPlainObject(query) ? query : {};
    let q = '';
    let limit = DEFAULT_SEARCH_LIMIT;

    if (input.q !== undefined) {
        if (typeof input.q !== 'string') {
            return { error: 'Parametr wyszukiwania musi być tekstem.' };
        }
        q = input.q.trim();
        if (Array.from(q).length > MAX_SEARCH_QUERY_LENGTH) {
            return { error: `Fraza wyszukiwania może mieć maksymalnie ${MAX_SEARCH_QUERY_LENGTH} znaków.` };
        }
    }

    if (input.limit !== undefined && input.limit !== '') {
        if (typeof input.limit !== 'string') {
            return { error: `Limit musi być liczbą całkowitą od 1 do ${MAX_SEARCH_LIMIT}.` };
        }
        const parsedLimit = parsePositiveId(input.limit);
        if (parsedLimit === null || parsedLimit > MAX_SEARCH_LIMIT) {
            return { error: `Limit musi być liczbą całkowitą od 1 do ${MAX_SEARCH_LIMIT}.` };
        }
        limit = parsedLimit;
    }

    return { value: { q, limit } };
}

function validateProfileUpdate(body) {
    if (!isPlainObject(body)) {
        return { error: 'Podaj dane profilu do aktualizacji.' };
    }

    const hasAnyField = UPDATABLE_FIELDS.some((field) => Object.hasOwn(body, field));
    if (!hasAnyField) {
        return { error: 'Podaj co najmniej jedno pole do aktualizacji.' };
    }

    const errors = {};
    const value = {};

    if (Object.hasOwn(body, 'displayName')) {
        if (typeof body.displayName !== 'string') {
            errors.displayName = 'Podaj nick.';
        } else {
            const trimmed = body.displayName.trim();
            if (trimmed.length < DISPLAY_NAME_MIN_LENGTH || trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
                errors.displayName = `Nick musi mieć od ${DISPLAY_NAME_MIN_LENGTH} do ${DISPLAY_NAME_MAX_LENGTH} znaków.`;
            } else if (!DISPLAY_NAME_REGEX.test(trimmed)) {
                errors.displayName = 'Nick może zawierać wyłącznie litery bez polskich znaków, cyfry oraz znaki _ . -';
            } else {
                value.displayName = trimmed;
            }
        }
    }

    if (Object.hasOwn(body, 'bio')) {
        if (body.bio === null) {
            value.bio = null;
        } else if (typeof body.bio !== 'string') {
            errors.bio = 'Bio musi być tekstem.';
        } else {
            const trimmed = body.bio.trim();
            if (trimmed.length === 0) {
                value.bio = null;
            } else if (Array.from(trimmed).length > BIO_MAX_LENGTH) {
                errors.bio = `Bio może mieć maksymalnie ${BIO_MAX_LENGTH} znaków.`;
            } else {
                value.bio = trimmed;
            }
        }
    }

    if (Object.hasOwn(body, 'isPrivate')) {
        if (typeof body.isPrivate !== 'boolean') {
            errors.isPrivate = 'Ustawienie prywatności profilu musi być wartością logiczną.';
        } else {
            value.isPrivate = body.isPrivate;
        }
    }

    if (Object.hasOwn(body, 'shelfIsPrivate')) {
        if (typeof body.shelfIsPrivate !== 'boolean') {
            errors.shelfIsPrivate = 'Ustawienie prywatności półki musi być wartością logiczną.';
        } else {
            value.shelfIsPrivate = body.shelfIsPrivate;
        }
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    return { value };
}

module.exports = {
    parseUuid,
    parseProfileSearchQuery,
    validateProfileUpdate,
};