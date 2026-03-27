-- Fix abbreviated first names in player_name (e.g. "M.Odegaard" → "Martin Odegaard")
-- Only touches names that contain a dot (abbreviated initial).
-- Keeps the lastname part from name as-is — replaces only the initial with the
-- first word of firstname.
--
-- Examples:
--   "M.Odegaard"       + firstname="Martin"        → "Martin Odegaard"
--   "G. Jesus"         + firstname="Gabriel"        → "Gabriel Jesus"
--   "T.Alexander-Arnold" + firstname="Trent"        → "Trent Alexander-Arnold"
--   "Martinelli"       (no dot)                     → unchanged

UPDATE public.players
SET name = TRIM(SPLIT_PART(firstname, ' ', 1))
           || ' '
           || TRIM(REGEXP_REPLACE(name, '^[^.]+\.\s*', ''))
WHERE firstname IS NOT NULL
  AND name LIKE '%.%';
