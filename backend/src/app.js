const express = require("express");
const helmet = require("helmet");
const { getPool } = require("./db");
const { createSessionMiddleware } = require("./auth/session"); 
const authRoutes = require("./routes/auth");
const perfumeRoutes = require("./routes/perfumes");
const catalogRoutes = require("./routes/catalog");
const shelfRoutes = require("./routes/shelf");
const perfumeNotesRoutes = require("./routes/perfume-notes");
const discoverRoutes = require("./routes/discover");
const blindBuyCheckRoutes = require("./routes/blind-buy-check");
const smartMatchingRoutes = require("./routes/smart-matching");
const onboardingRoutes = require("./routes/onboarding");
const shelfStatsRoutes = require("./routes/shelf-stats");
const postsRoutes = require("./routes/posts");
const postCommentsRoutes = require("./routes/post-comments");
const postVotesRoutes = require("./routes/post-votes");

const app = express();
app.use(helmet());

app.use(express.json());
app.use(createSessionMiddleware());  
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/perfumes", perfumeRoutes);
app.use("/api/v1/shelf/stats", shelfStatsRoutes);
app.use("/api/v1/shelf", shelfRoutes);
app.use("/api/v1/perfume-notes", perfumeNotesRoutes);
app.use("/api/v1", catalogRoutes);
app.use("/api/v1/discover", discoverRoutes);
app.use("/api/v1/perfumes", blindBuyCheckRoutes);
app.use("/api/v1/perfumes", smartMatchingRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/posts", postsRoutes);
app.use("/api/v1/posts", postCommentsRoutes);
app.use("/api/v1/posts", postVotesRoutes);

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

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Nie znaleziono zasobu." });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ status: "error", message: "Niepoprawny format JSON." });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ status: "error", message: "Przesyłany JSON jest zbyt duży." });
  }
  console.error("Nieobsłużony błąd:", err);
  return res.status(500).json({ status: "error", message: "Wystąpił nieoczekiwany błąd serwera." });
});

module.exports = app;