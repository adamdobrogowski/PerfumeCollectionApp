// Rozgrzewka Odkrywania AI: jedno zapytanie przy starcie serwera, zeby pierwszy uzytkownik nie czekal na zimny start.

const { getClusters } = require('../shared/clusters-cache');
const { findNearest } = require('./neighbours-loader');

// Uzytkownik, ktory nie istnieje, wiec warunek NOT EXISTS nic nie odrzuca.
const NIL_USER_ID = '00000000-0000-0000-0000-000000000000';

// Laduje cache klastrow, nawiazuje polaczenie z baza i wymusza odczyt wektorow tym samym zapytaniem, ktorego uzywa /discover.
async function warmUpDiscover() {
    const startedAt = Date.now();
    const { subfamilies } = await getClusters();
    const clustersMs = Date.now() - startedAt;
    if (subfamilies.length === 0) {
        return;
    }
    await findNearest(NIL_USER_ID, subfamilies[0].centroid, 1);
    const totalMs = Date.now() - startedAt;
    console.log(
        `Rozgrzewka Odkrywania AI zakończona (${totalMs} ms: połączenie i klastry ${clustersMs} ms, wyszukiwanie ${totalMs - clustersMs} ms).`
    );
}

module.exports = { warmUpDiscover };