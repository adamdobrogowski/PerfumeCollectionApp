const { getPool } = require('../db');

async function loadPerfumeBrief(perfumeId) {
    const { rows } = await getPool().query(
        `SELECT p.perfume_id, p.name, b.brand_id, b.name AS brand_name
           FROM perfumes p
           JOIN brands b ON b.brand_id = p.brand_id
          WHERE p.perfume_id = $1`,
        [perfumeId]
    );
    if (rows.length === 0) {
        return null;
    }
    const row = rows[0];
    return { id: row.perfume_id, name: row.name, brand: { id: row.brand_id, name: row.brand_name } };
}

module.exports = { loadPerfumeBrief };