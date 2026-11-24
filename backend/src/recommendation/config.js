// Od tylu Lubianych perfum w grupie centrum zainteresowania jest wiarygodne.
const MIN_LIKED_FOR_RELIABLE_CENTRE = 3;

// Cosinus, od ktorego dwie perfumy uznajemy za "bardzo bliskie" (p95 najblizszego sasiada z innej marki).
const VERY_CLOSE_COSINE = 0.9015;

// Perfumy, ktorych cosinus do pierwszego i drugiego najblizszego srodka podrodziny rozni sie
// o mniej niz ta wartosc, sa "graniczne" i licza sie do obu podrodzin.
const BORDERLINE_MARGIN = 0.03;

// Odkrywanie AI: najwyzej tyle sekcji (po jednej na centrum zainteresowania) i tyle perfum w sekcji.
const DISCOVER_MAX_SECTIONS = 6;
const DISCOVER_PER_SECTION = 30;

// Dla kazdego centrum pobieramy tyle razy wiecej kandydatow niz miejsc w sekcji, bo czesc z nich
// zostanie przypisana do innej sekcji (perfumy trafiaja tam, gdzie jest najblizej centrum).
const DISCOVER_OVERFETCH_FACTOR = 3;

// Onboarding: ile perfum uzytkownik musi wskazac (minimum z dokumentacji) i ile najwyzej w jednym zadaniu.
const ONBOARDING_MIN_LIKED = 3;
const ONBOARDING_MIN_DISLIKED = 1;
const ONBOARDING_MAX_LIKED = 20;
const ONBOARDING_MAX_DISLIKED = 20;

// Statystyki polki: ile pozycji pokazujemy w zestawieniach nut (najczestsze i ulubione).
const SHELF_STATS_TOP_NOTES = 10;

// Smart Matching: ograniczenia ciala zadania.
// Najwyzej tyle pozycji w jednej liscie warunkow (nuty lub akordy, osobno dla include i exclude).
const MATCH_MAX_CONDITIONS = 10;
const MATCH_MAX_BRANDS = 20;
const MATCH_MAX_OFFSET = 10000;

// Sila akordu -> najnizsza pozycja w perfumach (accord_rank 1-5), na ktorej akord jeszcze sie liczy.
const MATCH_ACCORD_MAX_RANK = { dominant: 1, clear: 3, background: 5 };

module.exports = {
    MIN_LIKED_FOR_RELIABLE_CENTRE,
    VERY_CLOSE_COSINE,
    BORDERLINE_MARGIN,
    DISCOVER_MAX_SECTIONS,
    DISCOVER_PER_SECTION,
    DISCOVER_OVERFETCH_FACTOR,
    ONBOARDING_MIN_LIKED,
    ONBOARDING_MIN_DISLIKED,
    ONBOARDING_MAX_LIKED,
    ONBOARDING_MAX_DISLIKED,
    SHELF_STATS_TOP_NOTES,
    MATCH_MAX_CONDITIONS,
    MATCH_MAX_BRANDS,
    MATCH_MAX_OFFSET,
    MATCH_ACCORD_MAX_RANK,
};