/**
 * Query layer for the sports data tables (teams, players, player_appearances).
 * The frontend uses this instead of calling external APIs directly.
 *
 * squad_appearances view aggregates ALL seasons per (player, team) — no season filter needed.
 */

import { supabase } from '@/integrations/supabase/client';

export interface TeamRecord {
  id: string;
  externalId: number;
  name: string;
  shortName?: string;
  logoUrl?: string;
  country?: string;
  season: number;
}

export interface SquadPlayer {
  playerId: string;
  playerExternalId: number;
  name: string;
  firstname?: string;
  lastname?: string;
  fullName?: string;
  position?: string;
  nationality?: string;
  photoUrl?: string;
  appearances: number;
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function getTeams(): Promise<TeamRecord[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, external_id, name, short_name, logo_url, country, season')
    .order('name');

  if (error) throw error;

  return (data ?? []).map(r => ({
    id:        r.id,
    externalId: r.external_id,
    name:      r.name,
    shortName: r.short_name ?? undefined,
    logoUrl:   r.logo_url ?? undefined,
    country:   r.country ?? undefined,
    season:    r.season,
  }));
}

// ─── Squad (appearances summed across all seasons) ────────────────────────────

export async function getSquadByTeamId(teamId: string): Promise<SquadPlayer[]> {
  const { data, error } = await supabase
    .from('squad_appearances')
    .select('player_id, player_external_id, player_name, player_firstname, player_lastname, position, nationality, photo_url, appearances')
    .eq('team_id', teamId)
    .order('appearances', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(r => ({
    playerId:        r.player_id,
    playerExternalId: r.player_external_id,
    name:            r.player_name,
    firstname:       r.player_firstname ?? undefined,
    lastname:        r.player_lastname ?? undefined,
    fullName:        (r.player_firstname && r.player_lastname)
                       ? `${r.player_firstname} ${r.player_lastname}`
                       : undefined,
    position:        r.position ?? undefined,
    nationality:     r.nationality ?? undefined,
    photoUrl:        r.photo_url ?? undefined,
    appearances:     r.appearances,
  }));
}

export async function getSquadByExternalTeamId(teamExternalId: number): Promise<SquadPlayer[]> {
  const { data, error } = await supabase
    .from('squad_appearances')
    .select('player_id, player_external_id, player_name, player_firstname, player_lastname, position, nationality, photo_url, appearances')
    .eq('team_external_id', teamExternalId)
    .order('appearances', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(r => ({
    playerId:        r.player_id,
    playerExternalId: r.player_external_id,
    name:            r.player_name,
    firstname:       r.player_firstname ?? undefined,
    lastname:        r.player_lastname ?? undefined,
    fullName:        (r.player_firstname && r.player_lastname)
                       ? `${r.player_firstname} ${r.player_lastname}`
                       : undefined,
    position:        r.position ?? undefined,
    nationality:     r.nationality ?? undefined,
    photoUrl:        r.photo_url ?? undefined,
    appearances:     r.appearances,
  }));
}

// ─── All players (global) ─────────────────────────────────────────────────────

export async function getAllPlayers(): Promise<SquadPlayer[]> {
  const { data, error } = await supabase
    .from('squad_appearances')
    .select('player_id, player_external_id, player_name, player_firstname, player_lastname, position, nationality, photo_url, appearances')
    .order('player_name');

  if (error) throw error;

  return (data ?? []).map(r => ({
    playerId:        r.player_id,
    playerExternalId: r.player_external_id,
    name:            r.player_name,
    firstname:       r.player_firstname ?? undefined,
    lastname:        r.player_lastname ?? undefined,
    fullName:        (r.player_firstname && r.player_lastname)
                       ? `${r.player_firstname} ${r.player_lastname}`
                       : undefined,
    position:        r.position ?? undefined,
    nationality:     r.nationality ?? undefined,
    photoUrl:        r.photo_url ?? undefined,
    appearances:     r.appearances,
  }));
}

// ─── Player search ────────────────────────────────────────────────────────────

export async function getPlayerByIdInTeam(
  teamExternalId: number,
  playerId: string,
): Promise<SquadPlayer | null> {
  const { data, error } = await supabase
    .from('squad_appearances')
    .select('player_id, player_external_id, player_name, player_firstname, player_lastname, position, nationality, photo_url, appearances')
    .eq('team_external_id', teamExternalId)
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    playerId:         data.player_id,
    playerExternalId: data.player_external_id,
    name:             data.player_name,
    fullName:         (data.player_firstname && data.player_lastname)
                        ? `${data.player_firstname} ${data.player_lastname}`
                        : undefined,
    position:         data.position ?? undefined,
    nationality:      data.nationality ?? undefined,
    photoUrl:         data.photo_url ?? undefined,
    appearances:      data.appearances,
  };
}

export async function searchPlayerInTeam(
  teamExternalId: number,
  query: string,
): Promise<SquadPlayer | null> {
  const { data, error } = await supabase.rpc('search_player_in_team', {
    p_team_external_id: teamExternalId,
    p_query: query,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    playerId:         row.player_id,
    playerExternalId: row.player_external_id,
    name:             row.player_name,
    fullName:         (row.player_firstname && row.player_lastname)
                        ? `${row.player_firstname} ${row.player_lastname}`
                        : undefined,
    position:         row.position ?? undefined,
    nationality:      row.nationality ?? undefined,
    photoUrl:         row.photo_url ?? undefined,
    appearances:      Number(row.appearances),
  };
}
