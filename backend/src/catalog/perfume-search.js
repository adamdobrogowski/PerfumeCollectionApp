// Wyszukiwarka perfum (GET /api/v1/perfumes): walidacja parametrów zapytania i budowa zapytań SQL.

const MAX_INTEGER_ID = 2147483647; 
const ID_PATTERN = /^[1-9]\d{0,9}$/;

const GENDERS = ['women', 'men', 'unisex'];
const SORTS = ['relevance', 'popular', 'newest', 'name'];

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 100;
const MAX_QUERY_WORDS = 5;
const MAX_LIST_ITEMS = 10;
const MAX_EXCLUDE_IDS = 20;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_OFFSET = 100000;

class SearchParamError extends Error {}

function readText(query, name) {
    const raw = query[name];
    if (raw === undefined) {
        return undefined;
    }
    if (typeof raw !== 'string') {
        throw new SearchParamError(`Parametr ${name} podaj tylko raz.`);
    }
    const text = raw.trim();
    return text === '' ? undefined : text;
}

function isValidId(text) {
    return ID_PATTERN.test(text) && Number(text) <= MAX_INTEGER_ID;
}

function readId(query, name) {
    const text = readText(query, name);
    if (text === undefined) {
        return null;
    }
    if (!isValidId(text)) {
        throw new SearchParamError(`Parametr ${name} musi być dodatnią liczbą całkowitą.`);
    }
    return Number(text);
}

function readIdList(query, name, maxItems = MAX_LIST_ITEMS) {
    const text = readText(query, name);
    if (text === undefined) {
        return [];
    }
    const parts = text.split(',').map((part) => part.trim());
    if (!parts.every(isValidId)) {
        throw new SearchParamError(`Parametr ${name} musi być listą identyfikatorów rozdzielonych przecinkami.`);
    }
    const ids = [...new Set(parts.map(Number))];
    if (ids.length > maxItems) {
        throw new SearchParamError(`Parametr ${name} może zawierać najwyżej ${maxItems} identyfikatorów.`);
    }
    return ids;
}

function readGenderList(query, name) {
    const text = readText(query, name);
    if (text === undefined) {
        return [];
    }
    const genders = [...new Set(text.split(',').map((part) => part.trim()))];
    if (!genders.every((gender) => GENDERS.includes(gender))) {
        throw new SearchParamError(`Parametr ${name} musi być listą wartości rozdzielonych przecinkami: ${GENDERS.join(', ')}.`);
    }
    return genders;
}

function readInteger(query, name, defaultValue, min, max) {
    const text = readText(query, name);
    if (text === undefined) {
        return defaultValue;
    }
    if (!/^\d{1,9}$/.test(text) || Number(text) < min || Number(text) > max) {
        throw new SearchParamError(`Parametr ${name} musi być liczbą całkowitą od ${min} do ${max}.`);
    }
    return Number(text);
}

function readPhrase(query) {
    const text = readText(query, 'q');
    if (text === undefined) {
        return { phrase: null, words: [] };
    }
    const phrase = text.replace(/\s+/g, ' ');
    const length = [...phrase].length;
    if (length < MIN_QUERY_LENGTH) {
        throw new SearchParamError(`Wyszukiwana fraza musi mieć co najmniej ${MIN_QUERY_LENGTH} znaki.`);
    }
    if (length > MAX_QUERY_LENGTH) {
        throw new SearchParamError(`Wyszukiwana fraza może mieć najwyżej ${MAX_QUERY_LENGTH} znaków.`);
    }
    if (/[\u0000-\u001F\u007F]/.test(phrase)) {
        throw new SearchParamError('Wyszukiwana fraza zawiera niedozwolone znaki.');
    }
    const words = phrase.split(' ');
    if (words.length > MAX_QUERY_WORDS) {
        throw new SearchParamError(`Wyszukiwana fraza może zawierać najwyżej ${MAX_QUERY_WORDS} słów.`);
    }
    return { phrase, words };
}

function assertNoOverlap(included, excluded, includeName, excludeName) {
    if (included.some((id) => excluded.includes(id))) {
        throw new SearchParamError(`Ten sam identyfikator nie może być jednocześnie w ${includeName} i w ${excludeName}.`);
    }
}

function readParams(query) {
    const { phrase, words } = readPhrase(query);

    const genders = readGenderList(query, 'gender');

    const noteIds = readIdList(query, 'notes');
    const excludeNoteIds = readIdList(query, 'excludeNotes');
    const accordIds = readIdList(query, 'accords');
    const excludeAccordIds = readIdList(query, 'excludeAccords');
    const excludeIds = readIdList(query, 'excludeIds', MAX_EXCLUDE_IDS);
    assertNoOverlap(noteIds, excludeNoteIds, 'notes', 'excludeNotes');
    assertNoOverlap(accordIds, excludeAccordIds, 'accords', 'excludeAccords');

    const sort = readText(query, 'sort') ?? (phrase ? 'relevance' : 'popular');
    if (!SORTS.includes(sort)) {
        throw new SearchParamError(`Parametr sort musi mieć wartość: ${SORTS.join(', ')}.`);
    }
    if (sort === 'relevance' && !phrase) {
        throw new SearchParamError('Sortowanie relevance wymaga parametru q.');
    }

    return {
        phrase,
        words,
        brandId: readId(query, 'brand'),
        genders,
        familyId: readId(query, 'family'),
        subfamilyId: readId(query, 'subfamily'),
        excludeIds,
        noteIds,
        excludeNoteIds,
        accordIds,
        excludeAccordIds,
        sort,
        limit: readInteger(query, 'limit', DEFAULT_LIMIT, 1, MAX_LIMIT),
        offset: readInteger(query, 'offset', 0, 0, MAX_OFFSET),
    };
}

function parseSearchParams(query) {
    try {
        return { params: readParams(query) };
    } catch (err) {
        if (err instanceof SearchParamError) {
            return { error: err.message };
        }
        throw err;
    }
}

function escapeLike(text) {
    return text.replace(/[\\%_]/g, '\\$&');
}

const ORDER_BY = {
    popular: 'p.source_rating_count DESC NULLS LAST, p.perfume_id',
    newest: 'p.release_year DESC NULLS LAST, p.source_rating_count DESC NULLS LAST, p.perfume_id',
    name: 'p.name, p.perfume_id',
};

// Buduje zapytanie o stronę wyników (z łączną liczbą pasujących perfum w kolumnie total)
// oraz osobne zapytanie zliczające, potrzebne tylko gdy strona jest pusta. Wartości trafiają do bazy jako parametry ($1, $2...),
// więc nic z danych użytkownika nie jest wklejane do tekstu SQL.
function buildSearchQueries(params) {
    const values = [];
    const add = (value) => {
        values.push(value);
        return `$${values.length}`;
    };
    const conditions = [];

    // Każde słowo frazy musi pasować do nazwy perfum albo marki, więc "dior sauvage" znajdzie markę i nazwę razem.
    for (const word of params.words) {
        const pattern = add(`%${escapeLike(word)}%`);
        conditions.push(`(p.name ILIKE ${pattern} OR b.name ILIKE ${pattern})`);
    }
    if (params.brandId !== null) {
        conditions.push(`p.brand_id = ${add(params.brandId)}`);
    }
    if (params.genders.length > 0) {
        conditions.push(`p.gender = ANY(${add(params.genders)}::gender_t[])`);
    }
    if (params.familyId !== null) {
        conditions.push(`f.cluster_id = ${add(params.familyId)}`);
    }
    if (params.subfamilyId !== null) {
        conditions.push(`sf.cluster_id = ${add(params.subfamilyId)}`);
    }
    if (params.excludeIds.length > 0) {
        conditions.push(`p.perfume_id <> ALL(${add(params.excludeIds)}::int[])`);
    }

    // Nuty ogólne: perfumy muszą mieć każdą z wybranych (co najmniej jedną nutę szczegółową z każdej grupy).
    // Osobne EXISTS dla każdej nuty działa szybciej niż jedno zapytanie z GROUP BY i HAVING count(...) = N,
    // bo planista zapytań źle szacuje wynik HAVING i wybiera wtedy bardzo wolny plan.
    for (const noteId of params.noteIds) {
        conditions.push(
            `EXISTS (
                SELECT 1
                FROM perfume_notes pn
                JOIN notes n ON n.note_id = pn.note_id
                WHERE pn.perfume_id = p.perfume_id AND n.general_note_id = ${add(noteId)})`
        );
    }
    if (params.excludeNoteIds.length > 0) {
        conditions.push(
            `NOT EXISTS (
                SELECT 1
                FROM perfume_notes pn
                JOIN notes n ON n.note_id = pn.note_id
                WHERE pn.perfume_id = p.perfume_id AND n.general_note_id = ANY(${add(params.excludeNoteIds)}::int[]))`
        );
    }

    for (const accordId of params.accordIds) {
        conditions.push(
            `EXISTS (
                SELECT 1
                FROM perfume_accords pa
                WHERE pa.perfume_id = p.perfume_id AND pa.accord_id = ${add(accordId)})`
        );
    }
    if (params.excludeAccordIds.length > 0) {
        conditions.push(
            `NOT EXISTS (
                SELECT 1
                FROM perfume_accords pa
                WHERE pa.perfume_id = p.perfume_id AND pa.accord_id = ANY(${add(params.excludeAccordIds)}::int[]))`
        );
    }

    const from = `FROM perfumes p
        JOIN brands b    ON b.brand_id = p.brand_id
        JOIN clusters sf ON sf.cluster_id = p.cluster_id
        JOIN clusters f  ON f.cluster_id = sf.parent_cluster_id`;
    const where = conditions.length > 0 ? `WHERE ${conditions.join('\n          AND ')}` : '';

    const countSql = `SELECT count(*) AS total ${from} ${where}`;
    const countValues = [...values];

    const pageValues = [...values];
    const addPageValue = (value) => {
        pageValues.push(value);
        return `$${pageValues.length}`;
    };
    const orderBy = params.sort === 'relevance'
        ? `word_similarity(${addPageValue(params.phrase)}, b.name || ' ' || p.name) DESC, p.source_rating_count DESC NULLS LAST, p.perfume_id`
        : ORDER_BY[params.sort];
    const limit = addPageValue(params.limit);
    const offset = addPageValue(params.offset);

    const pageSql = `SELECT count(*) OVER () AS total,
            p.perfume_id, p.name, p.gender, p.release_year,
            p.source_rating_value, p.source_rating_count,
            b.brand_id, b.name AS brand_name,
            sf.cluster_id AS subfamily_id, sf.name AS subfamily_name,
            f.cluster_id AS family_id, f.name AS family_name
        ${from}
        ${where}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}`;

    return { countSql, countValues, pageSql, pageValues };
}

module.exports = { parseSearchParams, buildSearchQueries };