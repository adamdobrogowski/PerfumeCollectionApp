const express = require("express");
const { getPool } = require("./db");

const app = express();

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend is running.",
  });
});

app.get("/api/v1/health/db", async (req, res) => {
  try {
    const wynik = await getPool().query(`
      select
        current_database() as baza,
        (select extversion from pg_extension where extname = 'vector') as pgvector,
        (select count(*) from perfumes) as perfumes
    `);
    const w = wynik.rows[0];
    res.json({
      status: "ok",
      baza: w.baza,
      pgvector: w.pgvector,
      perfumes: Number(w.perfumes),
    });
  } catch (err) {
    console.error("Blad testu bazy:", err.message);
    res.status(503).json({ status: "error", message: "Brak polaczenia z baza" });
  }
});

module.exports = app;