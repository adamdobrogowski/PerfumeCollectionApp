-- =====================================================================================================
-- 03_indexes_and_checks.sql - indeksy (po zaladowaniu danych) i kontrole poladowaniu
-- Uruchom: psql -U <uzytkownik> -d <baza> -f baza/03_indexes_and_checks.sql
-- =====================================================================================================
\set ON_ERROR_STOP on

CREATE INDEX perfumes_brand_idx            ON perfumes (brand_id);
CREATE INDEX perfumes_cluster_idx          ON perfumes (cluster_id);
CREATE INDEX perfumes_name_trgm_idx        ON perfumes USING gin (name gin_trgm_ops);       -- wyszukiwarka po nazwie perfumy (literowki, fragmenty)
CREATE INDEX brands_name_trgm_idx          ON brands   USING gin (name gin_trgm_ops);
CREATE INDEX perfume_notes_note_idx        ON perfume_notes (note_id);
CREATE INDEX perfume_accords_accord_idx    ON perfume_accords (accord_id);
CREATE INDEX perfume_perfumers_perfumer_idx ON perfume_perfumers (perfumer_id);
-- wektorowy indeks przyblizony (HNSW, odleglosc cosinusowa); przy 24 tys. wektorow dokladne przeszukiwanie tez jest szybkie, indeks przyda sie przy wzroscie bazy
CREATE INDEX perfume_embeddings_hnsw_idx   ON perfume_embeddings USING hnsw (embedding vector_cosine_ops);
ANALYZE;

\echo '--- liczby wierszy (oczekiwane: 53 / 1060 / 899 / 84 / 0 / 1664 / 24 / 24046 / 24046 / 13069 / 238208 / 118736) ---'
SELECT (SELECT count(*) FROM countries)          AS countries,          (SELECT count(*) FROM brands)           AS brands,
       (SELECT count(*) FROM perfumers)          AS perfumers,          (SELECT count(*) FROM accords)          AS accords,
       (SELECT count(*) FROM general_notes)      AS general_notes,      (SELECT count(*) FROM notes)            AS notes,
       (SELECT count(*) FROM clusters)           AS clusters,           (SELECT count(*) FROM perfumes)         AS perfumes,
       (SELECT count(*) FROM perfume_embeddings) AS embeddings,         (SELECT count(*) FROM perfume_perfumers) AS perf_perfumers,
       (SELECT count(*) FROM perfume_notes)      AS perf_notes,         (SELECT count(*) FROM perfume_accords)  AS perf_accords;

\echo '--- perfumes.cluster_id powinno wskazywac tylko podrodziny (oczekiwane: 0) ---'
SELECT count(*) AS perfumy_w_rodzinie_zamiast_podrodziny FROM perfumes p JOIN clusters c USING (cluster_id) WHERE c.level <> 'subfamily';

\echo '--- liczba perfum w rodzinach (oczekiwane: 6101 / 4525 / 3733 / 3627 / 2744 / 2695 / 621) ---'
SELECT f.cluster_id, f.name, count(*) AS perfum FROM perfumes p JOIN clusters s USING (cluster_id) JOIN clusters f ON f.cluster_id = s.parent_cluster_id GROUP BY f.cluster_id, f.name ORDER BY perfum DESC;

\echo '--- test wektorow: 5 perfum najbardziej podobnych do SAUVAGE (Dior), inna marka (oczekiwane: perfumy meskie, aromatyczne/drzewne) ---'
SELECT p.name, b.name AS brand, round((1 - (e.embedding <=> q.embedding))::numeric, 3) AS cosinus
FROM perfume_embeddings e
JOIN perfumes p USING (perfume_id) JOIN brands b USING (brand_id),
     (SELECT e2.embedding, p2.brand_id FROM perfume_embeddings e2 JOIN perfumes p2 USING (perfume_id) JOIN brands b2 USING (brand_id)
      WHERE b2.name = 'DIOR' AND p2.name = 'SAUVAGE') q
WHERE p.brand_id <> q.brand_id
ORDER BY e.embedding <=> q.embedding LIMIT 5;

\echo '--- test wyszukiwarki po nazwie (literowka): "coco mademoisel" ---'
SELECT p.name, b.name AS brand, round(similarity(p.name, 'coco mademoisel')::numeric, 2) AS podobienstwo
FROM perfumes p JOIN brands b USING (brand_id) WHERE p.name % 'coco mademoisel' ORDER BY similarity(p.name, 'coco mademoisel') DESC LIMIT 5;
