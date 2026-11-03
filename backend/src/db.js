const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
const WYMAGANE = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];   

let pool = null;

function getPool() {
    if (pool) {
        return pool;
    }
    const brakujace = WYMAGANE.filter((key) => !process.env[key]);
    if (brakujace.length > 0) {
        throw new Error(`Brakujące zmienne środowiskowe: ${brakujace.join(', ')}`);
    }


    pool = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        // Polaczenie szyfrowane (Supabase tego wymaga). rejectUnauthorized: false szyfruje, ale nie weryfikuje
        // certyfikatu serwera - wystarczy na czas rozwoju. Przed wdrozeniem dodac certyfikat CA z panelu Supabase (opcja ssl.ca).
        ssl: { rejectUnauthorized: false },
        max: 5,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        
    });

    pool.on('error', (err) => {
        console.error('Błąd w puli połączeń z bazą danych:', err.message);
    });

    pool.on("connect", (client) => {
        client.query("SET search_path TO public, extensions");
    });

    return pool;
}

module.exports = { getPool };
