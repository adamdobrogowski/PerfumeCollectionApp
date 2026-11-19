-- Polka uzytkownika: opinia (lubiane / nielubiane z sila upodobania) i organizacja (w kolekcji / lista zyczen).
BEGIN;

SET LOCAL search_path = public;

CREATE TYPE shelf_opinion_t   AS ENUM ('liked', 'disliked');
CREATE TYPE shelf_placement_t AS ENUM ('collection', 'wishlist');

CREATE TABLE shelf_entries (
    user_id       uuid              NOT NULL REFERENCES users (user_id)       ON DELETE CASCADE,
    perfume_id    integer           NOT NULL REFERENCES perfumes (perfume_id) ON DELETE CASCADE,
    opinion       shelf_opinion_t   NULL,
    like_strength smallint          NULL,
    placement     shelf_placement_t NULL,
    created_at    timestamptz       NOT NULL DEFAULT now(),
    updated_at    timestamptz       NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, perfume_id),
    CONSTRAINT shelf_entries_strength_range_chk CHECK (like_strength IS NULL OR like_strength BETWEEN 1 AND 3),
    CONSTRAINT shelf_entries_strength_liked_chk CHECK (COALESCE(opinion = 'liked', false) = (like_strength IS NOT NULL)),
    CONSTRAINT shelf_entries_disliked_wishlist_chk CHECK (NOT (opinion = 'disliked' AND placement = 'wishlist')),
    CONSTRAINT shelf_entries_not_empty_chk CHECK (opinion IS NOT NULL OR placement IS NOT NULL)
);

ALTER TABLE shelf_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE shelf_entries FROM anon, authenticated;

COMMIT;