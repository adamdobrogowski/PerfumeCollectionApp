// Od tylu Lubianych perfum w grupie centrum zainteresowania jest wiarygodne.
const MIN_LIKED_FOR_RELIABLE_CENTRE = 3;

// Cosinus, od ktorego dwie perfumy uznajemy za "bardzo bliskie" (p95 najblizszego sasiada z innej marki).
const VERY_CLOSE_COSINE = 0.9015;

// Perfumy, ktorych cosinus do pierwszego i drugiego najblizszego srodka podrodziny rozni sie
// o mniej niz ta wartosc, sa "graniczne" i licza sie do obu podrodzin.
const BORDERLINE_MARGIN = 0.03;

module.exports = { MIN_LIKED_FOR_RELIABLE_CENTRE, VERY_CLOSE_COSINE, BORDERLINE_MARGIN };