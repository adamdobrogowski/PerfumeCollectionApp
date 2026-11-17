-- 07_polish_names.sql - polskie nazwy akordow i nut ogolnych (nowa kolumna name_pl)

\encoding UTF8
\set ON_ERROR_STOP on

BEGIN;

SET LOCAL search_path = public;

-- Zabezpieczenie przed ponownym uruchomieniem i przed uruchomieniem na niepelnej bazie.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND column_name = 'name_pl' AND table_name IN ('accords', 'general_notes')) THEN
        RAISE EXCEPTION 'kolumna name_pl juz istnieje - skrypt 07 byl juz uruchomiony';
    END IF;
    IF (SELECT count(*) FROM accords) <> 84 THEN
        RAISE EXCEPTION 'accords ma % wierszy, oczekiwano 84', (SELECT count(*) FROM accords);
    END IF;
    IF (SELECT count(*) FROM general_notes) <> 1109 THEN
        RAISE EXCEPTION 'general_notes ma % wierszy, oczekiwano 1109 (czy skrypt 06 byl uruchomiony?)', (SELECT count(*) FROM general_notes);
    END IF;
END $$;

-- ---------- 1. nowe kolumny (NULL = brak polskiej nazwy, wtedy aplikacja pokaze nazwe angielska) ----------
ALTER TABLE accords       ADD COLUMN name_pl text;
ALTER TABLE general_notes ADD COLUMN name_pl text;

-- ---------- 2. wczytanie tlumaczen do tabel tymczasowych ----------
CREATE TEMP TABLE accords_pl (
    accord_id  integer PRIMARY KEY,
    name       text NOT NULL UNIQUE,
    name_pl    text,
    confidence text,
    comment    text
) ON COMMIT DROP;

CREATE TEMP TABLE general_notes_pl (
    general_note text PRIMARY KEY,
    name_pl      text,
    confidence   text,
    comment      text
) ON COMMIT DROP;

\copy accords_pl (accord_id, name, name_pl, confidence, comment) FROM '../dane/slownik/akordy_pl.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')
\copy general_notes_pl (general_note, name_pl, confidence, comment) FROM '../dane/slownik/nuty_ogolne_pl.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

-- ---------- 3. kontrole wejscia ----------
DO $$
DECLARE
    n_acc          integer;
    n_acc_bad      integer;
    n_acc_missing  integer;
    n_acc_empty    integer;
    n_acc_format   integer;
    n_acc_dup      integer;
    n_gen          integer;
    n_gen_bad      integer;
    n_gen_missing  integer;
    n_gen_empty    integer;
    n_gen_format   integer;
    n_gen_dup      integer;
BEGIN
    -- akordy
    SELECT count(*) INTO n_acc FROM accords_pl;
    SELECT count(*) INTO n_acc_bad     FROM accords_pl a WHERE NOT EXISTS (SELECT 1 FROM accords x WHERE x.accord_id = a.accord_id AND x.name = a.name);
    SELECT count(*) INTO n_acc_missing FROM accords x WHERE NOT EXISTS (SELECT 1 FROM accords_pl a WHERE a.accord_id = x.accord_id);
    SELECT count(*) INTO n_acc_empty   FROM accords_pl WHERE name_pl IS NULL OR btrim(name_pl) = '';
    SELECT count(*) INTO n_acc_format  FROM accords_pl WHERE name_pl <> btrim(name_pl) OR name_pl ~ '[;"]';
    SELECT count(*) INTO n_acc_dup     FROM (SELECT lower(name_pl) FROM accords_pl GROUP BY 1 HAVING count(*) > 1) d;

    IF n_acc <> 84 THEN RAISE EXCEPTION 'akordy_pl.csv ma % wierszy, oczekiwano 84', n_acc; END IF;
    IF n_acc_bad > 0 THEN RAISE EXCEPTION '% akordow z pliku nie pasuje (id + nazwa angielska) do tabeli accords', n_acc_bad; END IF;
    IF n_acc_missing > 0 THEN RAISE EXCEPTION '% akordow z bazy nie ma w pliku akordy_pl.csv', n_acc_missing; END IF;
    IF n_acc_empty > 0 THEN RAISE EXCEPTION '% akordow ma puste name_pl w pliku', n_acc_empty; END IF;
    IF n_acc_format > 0 THEN RAISE EXCEPTION '% akordow ma name_pl ze spacja na brzegu albo znakiem ; lub "', n_acc_format; END IF;
    IF n_acc_dup > 0 THEN RAISE EXCEPTION '% powtorzonych polskich nazw akordow', n_acc_dup; END IF;

    -- nuty ogolne
    SELECT count(*) INTO n_gen FROM general_notes_pl;
    SELECT count(*) INTO n_gen_bad     FROM general_notes_pl p WHERE NOT EXISTS (SELECT 1 FROM general_notes g WHERE g.name = p.general_note);
    SELECT count(*) INTO n_gen_missing FROM general_notes g WHERE NOT EXISTS (SELECT 1 FROM general_notes_pl p WHERE p.general_note = g.name);
    SELECT count(*) INTO n_gen_empty   FROM general_notes_pl WHERE name_pl IS NULL OR btrim(name_pl) = '';
    SELECT count(*) INTO n_gen_format  FROM general_notes_pl WHERE name_pl <> btrim(name_pl) OR name_pl ~ '[;"]';
    SELECT count(*) INTO n_gen_dup     FROM (SELECT lower(name_pl) FROM general_notes_pl GROUP BY 1 HAVING count(*) > 1) d;

    IF n_gen <> 1109 THEN RAISE EXCEPTION 'nuty_ogolne_pl.csv ma % wierszy, oczekiwano 1109', n_gen; END IF;
    IF n_gen_bad > 0 THEN RAISE EXCEPTION '% nut z pliku nie istnieje w general_notes (zmieniona nazwa angielska?)', n_gen_bad; END IF;
    IF n_gen_missing > 0 THEN RAISE EXCEPTION '% nut ogolnych z bazy nie ma w pliku nuty_ogolne_pl.csv', n_gen_missing; END IF;
    IF n_gen_empty > 0 THEN RAISE EXCEPTION '% nut ma puste name_pl w pliku', n_gen_empty; END IF;
    IF n_gen_format > 0 THEN RAISE EXCEPTION '% nut ma name_pl ze spacja na brzegu albo znakiem ; lub "', n_gen_format; END IF;
    IF n_gen_dup > 0 THEN RAISE EXCEPTION '% powtorzonych polskich nazw nut ogolnych', n_gen_dup; END IF;
END $$;

-- ---------- 4. zapis polskich nazw ----------
UPDATE accords a
SET    name_pl = p.name_pl
FROM   accords_pl p
WHERE  a.accord_id = p.accord_id;

UPDATE general_notes g
SET    name_pl = p.name_pl
FROM   general_notes_pl p
WHERE  g.name = p.general_note;

-- ---------- 5. kontrole wyniku i zabezpieczenie schematu ----------
DO $$
BEGIN
    IF (SELECT count(*) FROM accords WHERE name_pl IS NOT NULL) <> 84 THEN
        RAISE EXCEPTION 'po zapisie accords ma % polskich nazw, oczekiwano 84', (SELECT count(*) FROM accords WHERE name_pl IS NOT NULL);
    END IF;
    IF (SELECT count(*) FROM general_notes WHERE name_pl IS NOT NULL) <> 1109 THEN
        RAISE EXCEPTION 'po zapisie general_notes ma % polskich nazw, oczekiwano 1109', (SELECT count(*) FROM general_notes WHERE name_pl IS NOT NULL);
    END IF;
END $$;

-- Polska nazwa moze byc NULL (przyszle nowe wpisy), ale nigdy pusta ani ze spacjami na brzegach.
ALTER TABLE accords       ADD CONSTRAINT accords_name_pl_ck       CHECK (name_pl IS NULL OR (name_pl <> '' AND name_pl = btrim(name_pl)));
ALTER TABLE general_notes ADD CONSTRAINT general_notes_name_pl_ck CHECK (name_pl IS NULL OR (name_pl <> '' AND name_pl = btrim(name_pl)));

COMMENT ON COLUMN accords.name_pl       IS 'Polska nazwa akordu (male litery); NULL = brak, aplikacja pokazuje nazwe angielska';
COMMENT ON COLUMN general_notes.name_pl IS 'Polska nazwa nuty ogolnej (male litery); NULL = brak, aplikacja pokazuje nazwe angielska';

\echo '--- liczby (oczekiwane: accords 84 / z name_pl 84, general_notes 1109 / z name_pl 1109) ---'
SELECT (SELECT count(*) FROM accords)       AS accords,       (SELECT count(name_pl) FROM accords)       AS accords_z_name_pl,
       (SELECT count(*) FROM general_notes) AS general_notes, (SELECT count(name_pl) FROM general_notes) AS general_notes_z_name_pl;

\echo '--- przyklady akordow (oczekiwane: woody drzewny, citrus cytrusowy, white floral biale kwiaty, vanilla waniliowy, musky pizmowy) ---'
SELECT accord_id, name, name_pl FROM accords WHERE name IN ('woody', 'citrus', 'white floral', 'vanilla', 'musky') ORDER BY accord_id;

\echo '--- przyklady nut ogolnych (oczekiwane: rose roza, vanilla wanilia, musk pizmo, bergamot bergamotka, vetiver wetiweria) ---'
SELECT name, name_pl FROM general_notes WHERE name IN ('rose', 'vanilla', 'musk', 'bergamot', 'vetiver') ORDER BY name;

-- Z parametrem -v dry_run=1 zmiany sa wycofywane (proba), bez parametru zapisywane.
\if :{?dry_run}
    \echo '*** TRYB PROBNY (dry_run): wycofuje zmiany ***'
    ROLLBACK;
\else
    COMMIT;
\endif