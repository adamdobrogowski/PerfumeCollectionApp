-- 11_profiles.sql
-- Publiczne dane profilu uzytkownika: nazwa wyswietlana (nick), bio i ustawienia prywatnosci.
-- Osobna tabela (a nie kolumny w users), zeby zapytania o autorow postow nigdy nie dotykaly e-maila ani hasha.

BEGIN;

SET LOCAL search_path = public;

CREATE TABLE user_profiles (
    user_id          uuid         PRIMARY KEY REFERENCES users (user_id) ON DELETE CASCADE,
    -- Nick widoczny przy postach i komentarzach. Dozwolone znaki sprawdza backend (latwiej je potem zmienic niz w bazie).
    display_name     text         NOT NULL,
    bio              text         NULL,
    -- Profil prywatny: posty i os czasu widza tylko zaakceptowani obserwujacy. Domyslnie publiczny (do potwierdzenia).
    is_private       boolean      NOT NULL DEFAULT false,
    -- Polka prywatna: niewidoczna dla innych czlonkow. Domyslnie prywatna (do potwierdzenia).
    shelf_is_private boolean      NOT NULL DEFAULT true,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    -- Ustawiane przez aplikacje przy kazdym UPDATE (bez triggera).
    updated_at       timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT user_profiles_display_name_chk CHECK (char_length(display_name) BETWEEN 3 AND 30 AND display_name = btrim(display_name)),
    CONSTRAINT user_profiles_bio_chk          CHECK (bio IS NULL OR char_length(bio) <= 300)
);

-- Nick jest unikalny bez wzgledu na wielkosc liter.
CREATE UNIQUE INDEX user_profiles_display_name_key ON user_profiles (lower(display_name));

-- Konta utworzone przed tym plikiem dostaja tymczasowy nick user_1, user_2, ... (wedlug daty zalozenia konta).
-- Numeracja gwarantuje unikalnosc. Nowe konta musi tworzyc backend razem z profilem, w jednej transakcji.
INSERT INTO user_profiles (user_id, display_name)
SELECT user_id, 'user_' || row_number() OVER (ORDER BY created_at, user_id)
FROM users;

-- Jak przy pozostalych tabelach uzytkownika: zamykamy dostep przez Data API Supabase.
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE user_profiles FROM anon, authenticated;

COMMIT;