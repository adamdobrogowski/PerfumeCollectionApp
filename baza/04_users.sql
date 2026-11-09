-- 04_users.sql
-- Konta uzytkownikow: typ wyliczeniowy user_role_t i tabela users.

BEGIN;

-- Nazwy obiektow bez prefiksu; na czas transakcji wymuszamy schemat public.
SET LOCAL search_path = public;

CREATE TYPE user_role_t AS ENUM ('user', 'admin');

CREATE TABLE users (
    user_id       uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Adres zapisany malymi literami; backend normalizuje go przed kazdym INSERT i wyszukiwaniem.
    email         text         NOT NULL,
    -- Hash Argon2id wygenerowany przez backend. Nigdy haslo jawnym tekstem.
    password_hash text         NOT NULL,
    role          user_role_t  NOT NULL DEFAULT 'user',
    -- NULL = konto aktywne; data = konto zablokowane przez admina od tego momentu.
    blocked_at    timestamptz  NULL,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    -- Ustawiane przez aplikacje przy kazdym UPDATE (bez triggera).
    updated_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT users_email_key           UNIQUE (email),
    CONSTRAINT users_email_lowercase_chk CHECK (email = lower(email))
);

-- Supabase udostepnia schemat public przez Data API. Zamykamy dostep do tej tabeli:
-- RLS bez polityk odrzuca wszystko dla anon/authenticated, a REVOKE zabiera uprawnienia.
-- Backend laczy sie jako rola postgres, ktora omija RLS, wiec nie jest to dla niego przeszkoda.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE users FROM anon, authenticated;

COMMIT;