// Progi ryzyka Blind Buy Guard (tabela cluster_thresholds, 72 wiersze) wczytywane z bazy raz i trzymane w pamieci.

const { getPool } = require('../../db');

let cachePromise = null;

async function fetchThresholds() {
    const { rows } = await getPool().query(
        'SELECT cluster_id, n_group, centre_p50, centre_p90, nearest_p50, nearest_p90 FROM cluster_thresholds'
    );
    const byKey = new Map();
    for (const row of rows) {
        byKey.set(`${row.cluster_id}:${row.n_group}`, {
            centreP50: row.centre_p50,
            centreP90: row.centre_p90,
            nearestP50: row.nearest_p50,
            nearestP90: row.nearest_p90,
        });
    }
    return byKey;
}

// Zwraca progi { centreP50, centreP90, nearestP50, nearestP90 } dla klastra (podrodzina albo rodzina)
// i wielkosci grupy nGroup (1, 2 albo 3 = trzy lub wiecej); null, gdy takiego wiersza nie ma.
async function getThreshold(clusterId, nGroup) {
    if (!cachePromise) {
        cachePromise = fetchThresholds().catch((error) => {
            cachePromise = null;
            throw error;
        });
    }
    const byKey = await cachePromise;
    return byKey.get(`${clusterId}:${nGroup}`) ?? null;
}

module.exports = { getThreshold };