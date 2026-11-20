-- 10_feed.sql
-- Tablica spolecznosciowa: posty (SOTD, legit check, wpis swobodny), komentarze, glosy i obserwowanie.
-- Zdjecia legit check dojda osobnym plikiem po ustaleniu miejsca przechowywania plikow (kwestia otwarta 13.7).
-- Tresci uzytkownika znikaja razem z jego kontem (ON DELETE CASCADE), tak jak polka i notatki.

BEGIN;

SET LOCAL search_path = public;

-- Rodzaj posta wybierany w kreatorze: Scent of the Day, legit check albo wpis swobodny.
CREATE TYPE post_kind_t AS ENUM ('sotd', 'legitcheck', 'free');

-- Stan obserwowania: oczekuje na zatwierdzenie przez wlasciciela profilu prywatnego albo zaakceptowane.
CREATE TYPE follow_status_t AS ENUM ('pending', 'accepted');

CREATE TABLE posts (
    -- integer (nie bigint), zeby sterownik pg zwracal liczbe, a nie tekst.
    post_id    integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_id  uuid         NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    kind       post_kind_t  NOT NULL,
    body       text         NOT NULL,
    -- Opcjonalny odsylacz do karty perfum. Nie tworzy recenzji i nie pojawia sie na karcie jako recenzja.
    perfume_id integer      NULL REFERENCES perfumes (perfume_id) ON DELETE SET NULL,
    created_at timestamptz  NOT NULL DEFAULT now(),
    -- Ustawiane przez aplikacje przy kazdym UPDATE (bez triggera).
    updated_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT posts_body_chk CHECK (btrim(body) <> '' AND char_length(body) <= 3000)
);

-- Kolejnosc chronologiczna to kolejnosc post_id (identyfikator rosnie z czasem), wiec tablica sortuje i stronicuje
-- po samym post_id (kursor: "post_id mniejszy niz ostatni"). Unikamy kursora po created_at, bo timestamptz ma
-- mikrosekundy, a JavaScript tylko milisekundy. Tablica globalna korzysta z indeksu klucza glownego.
-- Os czasu autora i tablica obserwowanych (posty wybranych autorow):
CREATE INDEX posts_author_idx ON posts (author_id, post_id DESC);

-- Komentarze sa tylko pod postami i tworza plaska liste (bez odpowiedzi na komentarze).
CREATE TABLE post_comments (
    comment_id integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id    integer      NOT NULL REFERENCES posts (post_id)  ON DELETE CASCADE,
    author_id  uuid         NOT NULL REFERENCES users (user_id)  ON DELETE CASCADE,
    body       text         NOT NULL,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT post_comments_body_chk CHECK (btrim(body) <> '' AND char_length(body) <= 1000)
);

-- Komentarze pod postem w kolejnosci dodania (po comment_id, z tego samego powodu co posty).
CREATE INDEX post_comments_post_idx   ON post_comments (post_id, comment_id);
CREATE INDEX post_comments_author_idx ON post_comments (author_id);

-- Glosy dotycza wylacznie postow: jeden glos uzytkownika na post (+1 upvote, -1 downvote).
-- Zmiana glosu to UPDATE, cofniecie glosu to DELETE. Bilans postu liczymy zapytaniem (SUM).
CREATE TABLE post_votes (
    post_id    integer      NOT NULL REFERENCES posts (post_id) ON DELETE CASCADE,
    user_id    uuid         NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    value      smallint     NOT NULL,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id),
    CONSTRAINT post_votes_value_chk CHECK (value IN (-1, 1))
);

-- Glosy zalogowanego uzytkownika na liscie postow oraz usuwanie konta.
CREATE INDEX post_votes_user_idx ON post_votes (user_id);

-- Obserwowanie: follower_id obserwuje followee_id. Status wybiera backend (bez wartosci domyslnej):
-- profil publiczny od razu 'accepted', profil prywatny najpierw 'pending' do zatwierdzenia przez wlasciciela.
CREATE TABLE user_follows (
    follower_id uuid             NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    followee_id uuid             NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    status      follow_status_t  NOT NULL,
    created_at  timestamptz      NOT NULL DEFAULT now(),
    updated_at  timestamptz      NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id),
    CONSTRAINT user_follows_not_self_chk CHECK (follower_id <> followee_id)
);

-- Lista obserwujacych, liczniki oraz skrzynka prosb o zatwierdzenie.
CREATE INDEX user_follows_followee_idx ON user_follows (followee_id, status);

-- Jak przy pozostalych tabelach uzytkownika: zamykamy dostep przez Data API Supabase.
ALTER TABLE posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows  ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE posts, post_comments, post_votes, user_follows FROM anon, authenticated;

COMMIT;