-- Prywatne notatki uzytkownika o perfumach (jedna notatka na pare uzytkownik-perfumy).
BEGIN;

SET LOCAL search_path = public;

CREATE TABLE user_perfume_notes (
    user_id    uuid         NOT NULL REFERENCES users (user_id)       ON DELETE CASCADE,
    perfume_id integer      NOT NULL REFERENCES perfumes (perfume_id) ON DELETE CASCADE,
    body       text         NOT NULL,
    longevity  smallint     NULL,
    projection smallint     NULL,
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, perfume_id),
    CONSTRAINT user_perfume_notes_body_chk       CHECK (btrim(body) <> '' AND char_length(body) <= 2000),
    CONSTRAINT user_perfume_notes_longevity_chk  CHECK (longevity IS NULL OR longevity BETWEEN 1 AND 5),
    CONSTRAINT user_perfume_notes_projection_chk CHECK (projection IS NULL OR projection BETWEEN 1 AND 5)
);

ALTER TABLE user_perfume_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE user_perfume_notes FROM anon, authenticated;

COMMIT;