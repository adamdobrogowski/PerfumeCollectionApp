const MAX_INTEGER_ID = 2147483647;
const POST_BODY_MAX_LENGTH = 3000;
const COMMENT_BODY_MAX_LENGTH = 1000;
const MAX_PERFUMES_PER_POST = 5;
const DEFAULT_FEED_LIMIT = 20;
const MAX_FEED_LIMIT = 50;

// Rodzaj "review" jest zarezerwowany na udostępnioną recenzję, więc nie można go utworzyć w zwykłym kreatorze posta.
const CREATABLE_POST_KINDS = ['sotd', 'legitcheck', 'free'];
const FILTERABLE_POST_KINDS = ['sotd', 'legitcheck', 'free', 'review'];
const VOTE_VALUES = [-1, 1];

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePositiveId(value) {
    if (typeof value === 'number') {
        return Number.isInteger(value) && value >= 1 && value <= MAX_INTEGER_ID ? value : null;
    }
    if (typeof value === 'string') {
        if (!/^[1-9]\d{0,9}$/.test(value)) {
            return null;
        }
        const parsed = Number(value);
        return parsed <= MAX_INTEGER_ID ? parsed : null;
    }
    return null;
}

function parseFeedQuery(query) {
    const input = isPlainObject(query) ? query : {};
    let cursor = null;
    let limit = DEFAULT_FEED_LIMIT;
    let kind = null;

    if (input.cursor !== undefined && input.cursor !== '') {
        if (typeof input.cursor !== 'string') {
            return { error: 'Nieprawidłowy kursor stronicowania.' };
        }
        cursor = parsePositiveId(input.cursor);
        if (cursor === null) {
            return { error: 'Nieprawidłowy kursor stronicowania.' };
        }
    }

    if (input.limit !== undefined && input.limit !== '') {
        if (typeof input.limit !== 'string') {
            return { error: `Limit musi być liczbą całkowitą od 1 do ${MAX_FEED_LIMIT}.` };
        }
        const parsedLimit = parsePositiveId(input.limit);
        if (parsedLimit === null || parsedLimit > MAX_FEED_LIMIT) {
            return { error: `Limit musi być liczbą całkowitą od 1 do ${MAX_FEED_LIMIT}.` };
        }
        limit = parsedLimit;
    }

    if (input.kind !== undefined && input.kind !== '') {
        if (typeof input.kind !== 'string' || !FILTERABLE_POST_KINDS.includes(input.kind)) {
            return { error: 'Nieprawidłowy rodzaj posta.' };
        }
        kind = input.kind;
    }

    return { value: { cursor, limit, kind } };
}

function validateTextBody(rawBody, maxLength, emptyMessage, tooLongMessage) {
    if (typeof rawBody !== 'string') {
        return { error: emptyMessage };
    }
    const trimmed = rawBody.trim();
    if (trimmed.length === 0) {
        return { error: emptyMessage };
    }
    if (Array.from(trimmed).length > maxLength) {
        return { error: tooLongMessage };
    }
    return { value: trimmed };
}

function validatePerfumeIds(rawPerfumeIds, kind) {
    if (rawPerfumeIds === undefined || rawPerfumeIds === null) {
        if (kind === 'sotd') {
            return { error: 'Post typu SOTD wymaga oznaczenia co najmniej jednych perfum.' };
        }
        return { value: [] };
    }

    if (!Array.isArray(rawPerfumeIds)) {
        return { error: 'Oznaczone perfumy muszą być listą identyfikatorów.' };
    }

    if (rawPerfumeIds.length > MAX_PERFUMES_PER_POST) {
        return { error: `Możesz oznaczyć maksymalnie ${MAX_PERFUMES_PER_POST} perfum.` };
    }

    const seen = new Set();
    const perfumeIds = [];

    for (const item of rawPerfumeIds) {
        if (typeof item !== 'number' || !Number.isInteger(item) || item < 1 || item > MAX_INTEGER_ID) {
            return { error: 'Lista perfum zawiera nieprawidłowy identyfikator.' };
        }
        if (seen.has(item)) {
            return { error: 'Te same perfumy nie mogą być oznaczone więcej niż raz.' };
        }
        seen.add(item);
        perfumeIds.push(item);
    }

    if (kind === 'sotd' && perfumeIds.length === 0) {
        return { error: 'Post typu SOTD wymaga oznaczenia co najmniej jednych perfum.' };
    }

    return { value: perfumeIds };
}

function validatePostCreate(body) {
    const input = isPlainObject(body) ? body : {};
    const errors = {};
    let kind = null;

    if (typeof input.kind !== 'string' || !CREATABLE_POST_KINDS.includes(input.kind)) {
        errors.kind = 'Wybierz prawidłowy rodzaj posta (sotd, legitcheck lub free).';
    } else {
        kind = input.kind;
    }

    const bodyResult = validateTextBody(
        input.body,
        POST_BODY_MAX_LENGTH,
        'Treść posta nie może być pusta.',
        `Treść posta może mieć maksymalnie ${POST_BODY_MAX_LENGTH} znaków.`
    );
    if (bodyResult.error) {
        errors.body = bodyResult.error;
    }

    const perfumesResult = validatePerfumeIds(input.perfumeIds, kind);
    if (perfumesResult.error) {
        errors.perfumeIds = perfumesResult.error;
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    return {
        value: {
            kind,
            body: bodyResult.value,
            perfumeIds: perfumesResult.value,
        },
    };
}

function validatePostEdit(body) {
    const input = isPlainObject(body) ? body : {};
    const bodyResult = validateTextBody(
        input.body,
        POST_BODY_MAX_LENGTH,
        'Treść posta nie może być pusta.',
        `Treść posta może mieć maksymalnie ${POST_BODY_MAX_LENGTH} znaków.`
    );

    if (bodyResult.error) {
        return { errors: { body: bodyResult.error } };
    }

    return { value: { body: bodyResult.value } };
}

function validateCommentBody(body) {
    const input = isPlainObject(body) ? body : {};
    const bodyResult = validateTextBody(
        input.body,
        COMMENT_BODY_MAX_LENGTH,
        'Treść komentarza nie może być pusta.',
        `Treść komentarza może mieć maksymalnie ${COMMENT_BODY_MAX_LENGTH} znaków.`
    );

    if (bodyResult.error) {
        return { errors: { body: bodyResult.error } };
    }

    return { value: { body: bodyResult.value } };
}

function validateVote(body) {
    const input = isPlainObject(body) ? body : {};
    if (!VOTE_VALUES.includes(input.value)) {
        return { error: 'Wartość głosu musi wynosić -1 lub 1.' };
    }
    return { value: input.value };
}

module.exports = {
    DEFAULT_FEED_LIMIT,
    MAX_FEED_LIMIT,
    POST_BODY_MAX_LENGTH,
    COMMENT_BODY_MAX_LENGTH,
    MAX_PERFUMES_PER_POST,
    parsePositiveId,
    parseFeedQuery,
    validatePostCreate,
    validatePostEdit,
    validateCommentBody,
    validateVote,
};