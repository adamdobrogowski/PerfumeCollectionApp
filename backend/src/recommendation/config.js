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
// zostanie przypisana do innej sekcji (perfuma trafia tam, gdzie jest najblizej centrum).
const DISCOVER_OVERFETCH_FACTOR = 3;

module.exports = {
    MIN_LIKED_FOR_RELIABLE_CENTRE,
    VERY_CLOSE_COSINE,
    BORDERLINE_MARGIN,
    DISCOVER_MAX_SECTIONS,
    DISCOVER_PER_SECTION,
    DISCOVER_OVERFETCH_FACTOR,
};