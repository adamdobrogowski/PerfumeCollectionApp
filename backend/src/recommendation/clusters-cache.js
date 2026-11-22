// Podrodziny i nazwy klastrow wczytywane z bazy raz i trzymane w pamieci.

const { getPool } = require('../db');

let cachePromise = null;

async function fetchClusters() {
    const { rows } = await getPool().query(
        'SELECT cluster_id, level, parent_cluster_id, name, centroid::text AS centroid FROM clusters ORDER BY cluster_id'
    );
    const subfamilies = [];
    const nameById = new Map();
    for (const row of rows) {
        nameById.set(row.cluster_id, row.name);
        if (row.level === 'subfamily') {
            // pg zwraca vector jako tekst "[0.1,0.2,...]", ktory jest poprawnym JSON-em
            subfamilies.push({ id: row.cluster_id, familyId: row.parent_cluster_id, centroid: JSON.parse(row.centroid) });
        }
    }
    return { subfamilies, nameById };
}

// Zwraca { subfamilies: [{ id, familyId, centroid }], nameById: Map(clusterId -> nazwa) }.
function getClusters() {
    if (!cachePromise) {
        cachePromise = fetchClusters().catch((error) => {
            cachePromise = null;   
            throw error;
        });
    }
    return cachePromise;
}

module.exports = { getClusters };