-- 12_feed_changes.sql
-- Zmiany tablicy po ustaleniach: edycja z adnotacja i historia, do 5 oznaczonych perfum na post,
-- rodzaj posta 'review' (udostepniona recenzja) oraz wspolna regula widocznosci postow.
-- Wymaga plikow 10_feed.sql i 11_profiles.sql.

BEGIN;

SET LOCAL search_path = public;

-- Post z udostepniona recenzja. Powiazanie z tabela recenzji dojdzie razem z recenzjami (etap 3).
ALTER TYPE post_kind_t ADD VALUE 'review';

-- Adnotacja "edytowano": NULL = tresc nigdy nie byla zmieniana, data = moment ostatniej zmiany tresci.
ALTER TABLE posts         ADD COLUMN edited_at timestamptz NULL;
ALTER TABLE post_comments ADD COLUMN edited_at timestamptz NULL;

-- Oznaczone perfumy posta: do 5, w kolejnosci wskazanej przez autora. Limit pilnuje baza (position 1-5 i klucz).
-- Luki w pozycjach sa dozwolone (znikniecie perfum z katalogu usuwa tylko jedno oznaczenie).
CREATE TABLE post_perfumes (
    post_id    integer   NOT NULL REFERENCES posts (post_id)       ON DELETE CASCADE,
    position   smallint  NOT NULL,
    perfume_id integer   NOT NULL REFERENCES perfumes (perfume_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, position),
    CONSTRAINT post_perfumes_position_chk CHECK (position BETWEEN 1 AND 5),
    CONSTRAINT post_perfumes_post_perfume_key UNIQUE (post_id, perfume_id)
);

CREATE INDEX post_perfumes_perfume_idx ON post_perfumes (perfume_id);

-- Odsylacz z pliku 10 (jedne perfumy) przechodzi do nowej tabeli, a kolumna znika.
INSERT INTO post_perfumes (post_id, position, perfume_id)
SELECT post_id, 1, perfume_id FROM posts WHERE perfume_id IS NOT NULL;
ALTER TABLE posts DROP COLUMN perfume_id;

-- Historia edycji posta: kazdy wiersz to poprzednia wersja tresci, zapisana w chwili jej zastapienia.
CREATE TABLE post_edits (
    edit_id   integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id   integer      NOT NULL REFERENCES posts (post_id) ON DELETE CASCADE,
    body      text         NOT NULL,
    edited_at timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX post_edits_post_idx ON post_edits (post_id, edit_id);

-- Regula widocznosci postow, jedna dla calego backendu: posty autora widzi on sam, kazdy (gdy profil jest
-- publiczny) albo jego zaakceptowani obserwujacy. Brak profilu autora traktujemy jak prywatny (blokujemy dostep).
-- Wolac przy KAZDYM odczycie i zapisie dotyczacym posta: lista, watek, komentarze, glosy, os czasu.
CREATE FUNCTION can_view_posts_of(p_viewer uuid, p_author uuid) RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT p_viewer = p_author
        OR NOT COALESCE((SELECT is_private FROM user_profiles WHERE user_id = p_author), true)
        OR EXISTS (
            SELECT 1 FROM user_follows f
            WHERE f.follower_id = p_viewer AND f.followee_id = p_author AND f.status = 'accepted'
        )
$$;

-- Funkcje w schemacie public sa domyslnie wywolywalne przez Data API Supabase, wiec zamykamy dostep.
REVOKE EXECUTE ON FUNCTION can_view_posts_of(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Jak przy pozostalych tabelach uzytkownika: zamykamy dostep przez Data API Supabase.
ALTER TABLE post_perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_edits    ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE post_perfumes, post_edits FROM anon, authenticated;

COMMIT;