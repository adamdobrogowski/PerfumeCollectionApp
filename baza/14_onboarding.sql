-- 14_onboarding.sql

BEGIN;

SET LOCAL search_path = public;

-- NULL = onboarding nieukonczony. Nowe konta tworzy backend bez tej kolumny, wiec dostaja NULL.
ALTER TABLE user_profiles ADD COLUMN onboarding_completed_at timestamptz NULL;

-- Konta istniejace w chwili wdrozenia sa testowe i nie maja byc zmuszane do onboardingu.
UPDATE user_profiles SET onboarding_completed_at = now();

COMMIT;