/**
 * Query layer for the sports data tables (teams, players, player_appearances).
 * The frontend uses this instead of calling external APIs directly.
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
  position?: string;
  nationality?: string;
  photoUrl?: string;
  appearances: number;
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export async function getTeams(season = 2024): Promise<TeamRecord[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, external_id, name, short_name, logo_url, country, season')
    .eq('season', season)
    .order('name');

  if (error) throw error;

  return (data ?? []).map(r => ({
    id: r.id,
    externalId: r.external_id,
    name: r.name,
    shortName: r.short_name ?? undefined,
    logoUrl: r.logo_url ?? undefined,
    country: r.country ?? undefined,
    season: r.season,
  }));
}

// ─── Squad with appearances ───────────────────────────────────────────────────

export async function getSquadByTeamId(
  teamId: string,
  season = 2024
): Promise<SquadPlayer[]> {
  const { data, error } = await supabase
    .from('squad_appearances')
    .select('player_id, player_external_id, player_name, position, nationality, photo_url, appearances')
    .eq('team_id', teamId)
    .eq('season', season)
    .order('appearances', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(r => ({
    playerId: r.player_id,
    playerExternalId: r.player_external_id,
    name: r.player_name,
    position: r.position ?? undefined,
    nationality: r.nationality ?? undefined,
    photoUrl: r.photo_url ?? undefined,
    appearances: r.appearances,
  }));
}

export async function getSquadByExternalTeamId(
  teamExternalId: number,
  season = 2024
): Promise<SquadPlayer[]> {
  const { data, error } = await supabase
    .from('squad_appearances')
    .select('player_id, player_external_id, player_name, position, nationality, photo_url, appearances, team_id')
    .eq('team_external_id', teamExternalId)
    .eq('season', season)
    .order('appearances', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(r => ({
    playerId: r.player_id,
    playerExternalId: r.player_external_id,
    name: r.player_name,
    position: r.position ?? undefined,
    nationality: r.nationality ?? undefined,
    photoUrl: r.photo_url ?? undefined,
    appearances: r.appearances,
  }));
}

// ─── Player search ────────────────────────────────────────────────────────────

export async function searchPlayerInTeam(
  teamExternalId: number,
  query: string,
  season = 2024
): Promise<SquadPlayer | null> {
  const { data, error } = await supabase
    .from('squad_appearances')
    .select('player_id, player_external_id, player_name, position, nationality, photo_url, appearances')
    .eq('team_external_id', teamExternalId)
    .eq('season', season)
    .ilike('player_name', `%${query}%`)
    .order('appearances', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    playerId: data.player_id,
    playerExternalId: data.player_external_id,
    name: data.player_name,
    position: data.position ?? undefined,
    nationality: data.nationality ?? undefined,
    photoUrl: data.photo_url ?? undefined,
    appearances: data.appearances,
  };
}
