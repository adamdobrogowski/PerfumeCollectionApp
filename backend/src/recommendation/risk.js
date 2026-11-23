// Blind Buy Guard: poziom ryzyka (0 = maly, 1 = sredni, 2 = duzy) z odleglosci kandydata od grupy Lubianych.

const { VERY_CLOSE_COSINE } = require('./config');

// Odleglosc dzielimy progami p50 i p90 grupy: do p50 wlacznie = 0, do p90 wlacznie = 1, powyzej = 2.
function levelFromThresholds(distance, p50, p90) {
    if (distance <= p50) {
        return 0;
    }
    if (distance <= p90) {
        return 1;
    }
    return 2;
}

// centreCosine  - cosinus kandydata do centrum grupy,
// nearestCosine - najwiekszy cosinus kandydata do pojedynczego Lubianego perfumu z tej grupy,
// thresholds    - { centreP50, centreP90, nearestP50, nearestP90 } dla tej grupy,
// confidence    - pewnosc centrum: 'high' | 'medium' | 'low'.
function assessRisk({ centreCosine, nearestCosine, thresholds, confidence }) {
    const centreLevel = levelFromThresholds(1 - centreCosine, thresholds.centreP50, thresholds.centreP90);
    const nearestLevel = levelFromThresholds(1 - nearestCosine, thresholds.nearestP50, thresholds.nearestP90);

    // Z dwoch miar bierzemy lagodniejsza: kandydat blisko jednego Lubianego perfumu jest bezpieczny
    // nawet wtedy, gdy centrum grupy lezy dalej (i odwrotnie).
    let level = Math.min(centreLevel, nearestLevel);

    // Gdy centrum nie jest w pelni wiarygodne, nie oglaszamy "malego ryzyka", chyba ze kandydat jest
    // bardzo blisko jakiegos Lubianego perfumu z grupy.
    let capped = false;
    if (confidence !== 'high' && level === 0 && nearestCosine < VERY_CLOSE_COSINE) {
        level = 1;
        capped = true;
    }

    return { level, capped, centreLevel, nearestLevel };
}

module.exports = { levelFromThresholds, assessRisk };