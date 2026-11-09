-- 05_user_sessions.sql
-- Sesje uzytkownikow dla express-session + connect-pg-simple (opcja tableName: 'user_sessions').

BEGIN;

SET LOCAL search_path = public;

CREATE TABLE user_sessions (
    -- Losowy identyfikator sesji (ten sam, ktory trafia do ciasteczka).
    sid    text         PRIMARY KEY,
    -- Dane sesji zapisane przez express-session (m.in. id zalogowanego uzytkownika).
    sess   jsonb        NOT NULL,
    -- Moment wygasniecia sesji; po nim biblioteka ignoruje wiersz i okresowo go usuwa.
    expire timestamptz  NOT NULL
);

-- Przyspiesza okresowe czyszczenie: DELETE ... WHERE expire < teraz.
CREATE INDEX user_sessions_expire_idx ON user_sessions (expire);

-- Jak przy tabeli users: zamykamy dostep przez Data API Supabase.
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE user_sessions FROM anon, authenticated;

COMMIT;