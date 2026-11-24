-- 15_embeddings_storage.sql

-- Wektor (512 liczb, ok. 2 KB) domyslnie laduje w TOAST, a pobieranie z TOAST po jednym wierszu jest wolne.
-- Zapis w tabeli glownej (PLAIN) przyspiesza dokladne wyszukiwanie sasiadow (patrz neighbours-loader.js).
-- Na wspolnej bazie (Supabase) zmiana zostala juz wykonana recznie; ten plik sluzy do odtworzenia na nowej bazie.

BEGIN;

SET LOCAL search_path = public;

ALTER TABLE perfume_embeddings ALTER COLUMN embedding SET STORAGE PLAIN;

-- Samo ustawienie dotyczy tylko nowych wierszy, wiec istniejace przepisujemy (rzutowanie tworzy nowa wartosc).
UPDATE perfume_embeddings SET embedding = embedding::real[]::vector(512);

COMMIT;

-- Poza transakcja (VACUUM FULL nie dziala w transakcji): zwalnia stary TOAST i odbudowuje indeksy.
VACUUM (FULL, ANALYZE) perfume_embeddings;