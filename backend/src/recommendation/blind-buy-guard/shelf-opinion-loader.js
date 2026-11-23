const { getPool } = require('../../db');

async function loadOpinion(userId, perfumeId) {
    const { rows } = await getPool().query(
        'SELECT opinion FROM shelf_entries WHERE user_id = $1 AND perfume_id = $2',
        [userId, perfumeId]
    );
    return rows.length === 0 ? null : rows[0].opinion;
}

module.exports = { loadOpinion };