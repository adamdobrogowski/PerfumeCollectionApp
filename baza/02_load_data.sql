-- =====================================================================================================
-- 02_load_data.sql - ladowanie plikow CSV z notatnika export_DB.ipynb (folder baza_import)
-- Uruchom Z FOLDERU, W KTORYM LEZY baza_import (u Ciebie: notatniki), np.:
--   psql -U <uzytkownik> -d <baza> -f ../baza/02_load_data.sql
-- \copy czyta pliki po stronie klienta (psql), wiec nie wymaga uprawnien serwera do dysku. Sciezki wzgledne od biezacego folderu.
-- Wszystko w jednej transakcji: przy bledzie nic nie zostaje zaladowane. Kolejnosc: najpierw tabele, do ktorych odwoluja sie inne.
-- =====================================================================================================
\set ON_ERROR_STOP on
BEGIN;

\copy countries          (country_id, name)                                  FROM 'baza_import/countries.csv'          WITH (FORMAT csv, HEADER true)
\copy brands             (brand_id, name, country_id)                        FROM 'baza_import/brands.csv'             WITH (FORMAT csv, HEADER true)
\copy perfumers          (perfumer_id, name, is_company)                     FROM 'baza_import/perfumers.csv'          WITH (FORMAT csv, HEADER true)
\copy accords            (accord_id, name)                                   FROM 'baza_import/accords.csv'            WITH (FORMAT csv, HEADER true)
\copy general_notes      (general_note_id, name)                             FROM 'baza_import/general_notes.csv'      WITH (FORMAT csv, HEADER true)
\copy notes              (note_id, name, general_note_id)                    FROM 'baza_import/notes.csv'              WITH (FORMAT csv, HEADER true)
\copy clusters           (cluster_id, level, parent_cluster_id, name, description, centroid) FROM 'baza_import/clusters.csv' WITH (FORMAT csv, HEADER true)
\copy perfumes           (perfume_id, fragrantica_id, url, name, brand_id, gender, release_year, source_rating_value, source_rating_count, cluster_id, cluster_distance) FROM 'baza_import/perfumes.csv' WITH (FORMAT csv, HEADER true)
\copy perfume_embeddings (perfume_id, embedding)                             FROM 'baza_import/perfume_embeddings.csv' WITH (FORMAT csv, HEADER true)
\copy perfume_perfumers  (perfume_id, perfumer_id)                           FROM 'baza_import/perfume_perfumers.csv'  WITH (FORMAT csv, HEADER true)
\copy perfume_notes      (perfume_id, note_id, layer)                        FROM 'baza_import/perfume_notes.csv'      WITH (FORMAT csv, HEADER true)
\copy perfume_accords    (perfume_id, accord_id, accord_rank)                FROM 'baza_import/perfume_accords.csv'    WITH (FORMAT csv, HEADER true)

-- Kolumny IDENTITY dostaly jawne id z plikow, wiec liczniki trzeba ustawic za najwiekszym id (inaczej pierwszy INSERT bez id zderzylby sie z istniejacym).
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT * FROM (VALUES ('countries', 'country_id'), ('brands', 'brand_id'), ('perfumers', 'perfumer_id'), ('accords', 'accord_id'),
                                   ('general_notes', 'general_note_id'), ('notes', 'note_id'), ('perfumes', 'perfume_id')) AS t (tab, col)
    LOOP
        EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT max(%I) FROM %I), 1), (SELECT count(*) > 0 FROM %I))',
                       r.tab, r.col, r.col, r.tab, r.tab);
    END LOOP;
END $$;

COMMIT;
