-- Enable unaccent extension for diacritic-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- RPC function: search a player by name in a team, ignoring diacritics
CREATE OR REPLACE FUNCTION public.search_player_in_team(
  p_team_external_id integer,
  p_query            text
)
RETURNS TABLE (
  player_id          uuid,
  player_external_id integer,
  player_name        text,
  player_firstname   text,
  player_lastname    text,
  position           text,
  nationality        text,
  photo_url          text,
  appearances        bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    player_id, player_external_id, player_name,
    player_firstname, player_lastname,
    position, nationality, photo_url, appearances
  FROM public.squad_appearances
  WHERE team_external_id = p_team_external_id
    AND unaccent(player_name) ILIKE '%' || unaccent(p_query) || '%'
  ORDER BY appearances DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.search_player_in_team(integer, text) TO anon, authenticated;
