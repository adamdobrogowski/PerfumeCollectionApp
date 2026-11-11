// Uruchamia psql z danymi połączenia wczytanymi z pliku .env w głównym folderze projektu.
// Użycie (z głównego folderu projektu):
//   node scripts/psql.js -c "select 1;"
//   node scripts/psql.js -v ON_ERROR_STOP=1 -f baza/06_nazwa.sql
const path = require('path');
const { spawnSync } = require('child_process');

process.loadEnvFile(path.resolve(__dirname, '../.env'));

const WYMAGANE = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const brakujace = WYMAGANE.filter((key) => !process.env[key]);
if (brakujace.length > 0) {
    console.error(`Brakujące zmienne w pliku .env: ${brakujace.join(', ')}`);
    process.exit(1);
}

// Informacja o celu połączenia (bez hasła), żeby od razu było widać, do jakiej bazy trafia polecenie.
console.error(`Łączę z: ${process.env.DB_HOST}:${process.env.DB_PORT} (baza ${process.env.DB_NAME}, użytkownik ${process.env.DB_USER})`);

// Zmienne PG* istnieją tylko dla uruchamianego psql i nie zostają w oknie terminala.
const result = spawnSync('psql', process.argv.slice(2), {
    stdio: 'inherit',
    env: {
        ...process.env,
        PGHOST: process.env.DB_HOST,
        PGPORT: process.env.DB_PORT,
        PGUSER: process.env.DB_USER,
        PGPASSWORD: process.env.DB_PASSWORD,
        PGDATABASE: process.env.DB_NAME,
        PGSSLMODE: 'require',
    },
});

if (result.error) {
    console.error('Nie udało się uruchomić psql:', result.error.message);
    process.exit(1);
}
process.exit(result.status ?? 1);