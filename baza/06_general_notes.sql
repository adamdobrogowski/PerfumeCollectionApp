-- 06_general_notes.sql - wypelnienie nut ogolnych (general_notes) i przypisanie ich nutom szczegolowym

\encoding UTF8
\set ON_ERROR_STOP on

BEGIN;

SET LOCAL search_path = public;

-- Zabezpieczenie przed ponownym uruchomieniem na wspolnej bazie.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM general_notes) THEN
        RAISE EXCEPTION 'general_notes nie jest pusta - skrypt 06 byl juz uruchomiony';
    END IF;
    IF EXISTS (SELECT 1 FROM notes WHERE general_note_id IS NOT NULL) THEN
        RAISE EXCEPTION 'czesc nut ma juz przypisana nute ogolna - skrypt 06 byl juz uruchomiony';
    END IF;
END $$;

-- ---------- 1. wczytanie slownika do tabeli tymczasowej ----------
CREATE TEMP TABLE note_mapping (
    original_note text PRIMARY KEY,
    general_note  text NOT NULL
) ON COMMIT DROP;

\copy note_mapping (original_note, general_note) FROM 'baza_import/note_mapping.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

-- ---------- 2. kontrole wejscia ----------
DO $$
DECLARE
    n_notes       integer;
    n_map         integer;
    n_general     integer;
    n_not_in_db   integer;
    n_not_mapped  integer;
    n_chains      integer;
BEGIN
    SELECT count(*) INTO n_notes FROM notes;
    SELECT count(*) INTO n_map FROM note_mapping;
    SELECT count(DISTINCT general_note) INTO n_general FROM note_mapping;
    SELECT count(*) INTO n_not_in_db  FROM note_mapping m WHERE NOT EXISTS (SELECT 1 FROM notes n WHERE n.name = m.original_note);
    SELECT count(*) INTO n_not_mapped FROM notes n WHERE NOT EXISTS (SELECT 1 FROM note_mapping m WHERE m.original_note = n.name);
    -- lancuch: nuta ogolna jest tez nuta szczegolowa, ale sama wskazuje na inna nute ogolna
    SELECT count(*) INTO n_chains
    FROM note_mapping m JOIN note_mapping g ON g.original_note = m.general_note
    WHERE g.general_note <> m.general_note;

    IF n_map <> n_notes THEN
        RAISE EXCEPTION 'slownik ma % wierszy, a tabela notes % nut', n_map, n_notes;
    END IF;
    IF n_not_in_db > 0 THEN
        RAISE EXCEPTION '% nazw ze slownika nie istnieje w notes', n_not_in_db;
    END IF;
    IF n_not_mapped > 0 THEN
        RAISE EXCEPTION '% nut z notes nie ma w slowniku', n_not_mapped;
    END IF;
    IF n_chains > 0 THEN
        RAISE EXCEPTION 'wykryto % lancuchow w slowniku (nuta ogolna sama wskazuje na inna)', n_chains;
    END IF;
    IF n_general <> 1109 THEN
        RAISE EXCEPTION 'oczekiwano 1109 nut ogolnych (wg mapowanie_raport.md), a slownik ma %', n_general;
    END IF;
END $$;

-- ---------- 3. wstawienie nut ogolnych i przypisanie ich nutom szczegolowym ----------
-- Sortowanie "C" daje te same identyfikatory niezaleznie od ustawien jezykowych serwera.
INSERT INTO general_notes (name)
SELECT general_note FROM note_mapping GROUP BY general_note ORDER BY general_note COLLATE "C";

UPDATE notes n
SET    general_note_id = g.general_note_id
FROM   note_mapping m
JOIN   general_notes g ON g.name = m.general_note
WHERE  n.name = m.original_note;

-- ---------- 4. kontrole wyniku ----------
DO $$
DECLARE
    n_null    integer;
    n_orphan  integer;
    n_chains  integer;
    n_general integer;
BEGIN
    SELECT count(*) INTO n_null FROM notes WHERE general_note_id IS NULL;
    SELECT count(*) INTO n_orphan FROM general_notes g
        WHERE NOT EXISTS (SELECT 1 FROM notes n WHERE n.general_note_id = g.general_note_id);
    -- nuta ogolna bedaca tez nuta szczegolowa musi wskazywac na sama siebie
    SELECT count(*) INTO n_chains FROM general_notes g
        JOIN notes n ON n.name = g.name WHERE n.general_note_id <> g.general_note_id;
    SELECT count(*) INTO n_general FROM general_notes;

    IF n_null > 0 THEN
        RAISE EXCEPTION '% nut szczegolowych bez nuty ogolnej', n_null;
    END IF;
    IF n_orphan > 0 THEN
        RAISE EXCEPTION '% nut ogolnych bez zadnej nuty szczegolowej', n_orphan;
    END IF;
    IF n_chains > 0 THEN
        RAISE EXCEPTION '% nut ogolnych, ktore jako nuty szczegolowe wskazuja na inna nute', n_chains;
    END IF;
    IF n_general <> 1109 THEN
        RAISE EXCEPTION 'general_notes ma % wierszy, oczekiwano 1109', n_general;
    END IF;
END $$;

-- ---------- 5. zaostrzenie schematu: kazda nuta szczegolowa ma dokladnie jedna nute ogolna ----------
ALTER TABLE notes ALTER COLUMN general_note_id SET NOT NULL;
CREATE INDEX notes_general_note_idx ON notes (general_note_id);

\echo '--- liczby wierszy (oczekiwane: general_notes 1109, notes 1664, notes bez nuty ogolnej 0) ---'
SELECT (SELECT count(*) FROM general_notes) AS general_notes,
       (SELECT count(*) FROM notes) AS notes,
       (SELECT count(*) FROM notes WHERE general_note_id IS NULL) AS notes_bez_ogolnej;

\echo '--- najwieksze nuty ogolne (oczekiwane na gorze: rose 36, tea 17, cedar 15, orange 15, vanilla 15) ---'
SELECT g.name, count(*) AS nuty_szczegolowe
FROM general_notes g JOIN notes n USING (general_note_id)
GROUP BY g.name ORDER BY nuty_szczegolowe DESC, g.name LIMIT 8;

COMMIT;
