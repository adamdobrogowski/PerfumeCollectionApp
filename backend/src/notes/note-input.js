const BODY_MAX_LENGTH = 2000;

function parseRating(value, label) {
    if (value === undefined || value === null) {
        return { value: null };
    }
    if (!(Number.isInteger(value) && value >= 1 && value <= 5)) {
        return { error: `${label} musi być liczbą całkowitą od 1 do 5.` };
    }
    return { value };
}

function parseNote(body) {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return { error: 'Podaj notatkę: body, longevity i projection.' };
    }
    if (typeof body.body !== 'string') {
        return { error: 'Podaj treść notatki.' };
    }

    const text = body.body.trim();
    if (text.length === 0) {
        return { error: 'Treść notatki nie może być pusta.' };
    }
    if (Array.from(text).length > BODY_MAX_LENGTH) {
        return { error: `Notatka może mieć najwyżej ${BODY_MAX_LENGTH} znaków.` };
    }

    const longevity = parseRating(body.longevity, 'Trwałość');
    if (longevity.error) {
        return { error: longevity.error };
    }
    const projection = parseRating(body.projection, 'Projekcja');
    if (projection.error) {
        return { error: projection.error };
    }

    return { note: { body: text, longevity: longevity.value, projection: projection.value } };
}

module.exports = { parseNote };