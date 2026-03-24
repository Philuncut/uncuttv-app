-- Replace films.blocked_in_de (boolean) with films.blocked_in (text[]).
-- Uses ISO 3166-1 alpha-2 country codes, e.g. DE, AT, CH.

ALTER TABLE films
ADD COLUMN IF NOT EXISTS blocked_in text[] NOT NULL DEFAULT '{}';

UPDATE films
SET blocked_in = ARRAY['DE']::text[]
WHERE blocked_in_de = TRUE
  AND (blocked_in IS NULL OR array_length(blocked_in, 1) IS NULL OR array_length(blocked_in, 1) = 0);

ALTER TABLE films
DROP COLUMN IF EXISTS blocked_in_de;
