/**
 * sync-sports-data — Supabase Edge Function
 *
 * Syncs teams, players, and appearances into the database
 * using the football-data.org API (v4).
 *
 * Required secret: FDO_API_KEY  (set via `supabase secrets set FDO_API_KEY=xxx`)
 *
 * Trigger: POST /functions/v1/sync-sports-data
 * Body (optional): { leagueIds?: number[], season?: number, clearFirst?: boolean }
 *
 * football-data.org league IDs:
 *   2021 – Premier League
 *   2014 – La Liga (Spain)
 *   2002 – Bundesliga (Germany)
 *   2019 – Serie A (Italy)
 *   2015 – Ligue 1 (France)
 *   2001 – Champions League
 *
 * Rate limit: 10 req/min on free tier → we sleep 6 s between appearance calls.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamData {
  externalId: number;
  name: string;
  shortName?: string;
  logoUrl?: string;
  country?: string;
  leagueId?: number;
  season: number;
}

interface PlayerData {
  externalId: number;
  name: string;
  position?: string;
  nationality?: string;
  photoUrl?: string;
}

interface AppearancesData {
  playerExternalId: number;
  teamExternalId: number;
  season: number;
  appearances: number;
}

// ─── football-data.org provider ───────────────────────────────────────────────

class FootballDataOrgProvider {
  private readonly baseUrl = 'https://api.football-data.org/v4';
  constructor(private readonly apiKey: string) {}

  private async fetch<T>(path: string): Promise<T> {
    const res = await globalThis.fetch(`${this.baseUrl}${path}`, {
      headers: { 'X-Auth-Token': this.apiKey },
    });
    if (!res.ok) throw new Error(`FDO ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }

  async getTeams(leagueId: number, season: number): Promise<TeamData[]> {
    const data = await this.fetch<{ teams: FdTeam[] }>(
      `/competitions/${leagueId}/teams?season=${season}`
    );
    return data.teams.map((t) => ({
      externalId: t.id,
      name: t.name,
      shortName: t.shortName ?? t.tla,
      logoUrl: t.crest,
      country: t.area?.name,
      leagueId,
      season,
    }));
  }

  async getSquad(teamExternalId: number): Promise<PlayerData[]> {
    const data = await this.fetch<{ squad: FdSquadPlayer[] }>(
      `/teams/${teamExternalId}`
    );
    return (data.squad ?? []).map((p) => ({
      externalId: p.id,
      name: p.name,
      position: normalisePosition(p.position),
      nationality: p.nationality,
      photoUrl: undefined, // not available on free tier
    }));
  }

  async getPlayerAppearances(
    playerExternalId: number,
    teamExternalId: number,
    season: number
  ): Promise<AppearancesData> {
    const data = await this.fetch<FdPersonMatches>(
      `/persons/${playerExternalId}/matches?season=${season}&status=FINISHED&limit=100`
    );
    const appearances = data.resultSet?.total ?? data.matches?.length ?? 0;
    return { playerExternalId, teamExternalId, season, appearances };
  }
}

interface FdTeam { id: number; name: string; shortName?: string; tla?: string; crest?: string; area?: { name: string }; }
interface FdSquadPlayer { id: number; name: string; position?: string; nationality?: string; }
interface FdPersonMatches { matches?: unknown[]; resultSet?: { count: number; total: number }; }

function normalisePosition(pos?: string): string | undefined {
  if (!pos) return undefined;
  const l = pos.toLowerCase();
  if (l.includes('goal'))  return 'Goalkeeper';
  if (l.includes('def') || l === 'defence') return 'Defender';
  if (l.includes('mid'))   return 'Midfielder';
  if (l.includes('off') || l.includes('attack') || l.includes('forward')) return 'Forward';
  return pos;
}

// ─── Sync logic ───────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// football-data.org free tier: 10 req/min → wait 6 s between calls
const RATE_LIMIT_DELAY_MS = 6_000;

async function syncAll(
  supabase: ReturnType<typeof createClient>,
  provider: FootballDataOrgProvider,
  leagueIds: number[],
  season: number
) {
  let teamsUpserted = 0;
  let playersUpserted = 0;
  let appearancesUpserted = 0;
  const errors: string[] = [];

  for (const leagueId of leagueIds) {
    // 1. Fetch teams
    let teams: TeamData[];
    try {
      teams = await provider.getTeams(leagueId, season);
      await sleep(RATE_LIMIT_DELAY_MS);
    } catch (e) {
      errors.push(`getTeams(${leagueId}): ${e}`);
      continue;
    }

    // Upsert teams
    const { error: teamErr } = await supabase.from('teams').upsert(
      teams.map((t) => ({
        external_id: t.externalId,
        name: t.name,
        short_name: t.shortName,
        logo_url: t.logoUrl,
        country: t.country,
        league_id: t.leagueId,
        season: t.season,
        synced_at: new Date().toISOString(),
      })),
      { onConflict: 'external_id' }
    );
    if (teamErr) { errors.push(`upsert teams(${leagueId}): ${teamErr.message}`); continue; }
    teamsUpserted += teams.length;

    // Fetch back UUIDs
    const { data: teamRows } = await supabase
      .from('teams')
      .select('id, external_id')
      .in('external_id', teams.map((t) => t.externalId));

    const teamUuidMap = Object.fromEntries((teamRows ?? []).map((r) => [r.external_id, r.id]));

    // 2. For each team — fetch squad
    for (const team of teams) {
      let squad: PlayerData[];
      try {
        squad = await provider.getSquad(team.externalId);
        await sleep(RATE_LIMIT_DELAY_MS);
      } catch (e) {
        errors.push(`getSquad(${team.externalId}): ${e}`);
        continue;
      }
      if (!squad.length) continue;

      // Upsert players
      const { error: playerErr } = await supabase.from('players').upsert(
        squad.map((p) => ({
          external_id: p.externalId,
          name: p.name,
          position: p.position,
          nationality: p.nationality,
          photo_url: p.photoUrl,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: 'external_id' }
      );
      if (playerErr) { errors.push(`upsert players(${team.externalId}): ${playerErr.message}`); continue; }
      playersUpserted += squad.length;

      // Fetch back player UUIDs
      const { data: playerRows } = await supabase
        .from('players')
        .select('id, external_id')
        .in('external_id', squad.map((p) => p.externalId));

      const playerUuidMap = Object.fromEntries((playerRows ?? []).map((r) => [r.external_id, r.id]));
      const teamUuid = teamUuidMap[team.externalId];
      if (!teamUuid) continue;

      // 3. Appearances per player
      const appearanceRows = [];
      for (const player of squad) {
        let apData: AppearancesData;
        try {
          apData = await provider.getPlayerAppearances(player.externalId, team.externalId, season);
          await sleep(RATE_LIMIT_DELAY_MS);
        } catch (e) {
          errors.push(`getPlayerAppearances(${player.externalId}): ${e}`);
          continue;
        }

        const playerUuid = playerUuidMap[player.externalId];
        if (!playerUuid) continue;

        appearanceRows.push({
          player_id: playerUuid,
          team_id: teamUuid,
          season,
          appearances: apData.appearances,
          synced_at: new Date().toISOString(),
        });
      }

      if (appearanceRows.length) {
        const { error: apErr } = await supabase
          .from('player_appearances')
          .upsert(appearanceRows, { onConflict: 'player_id,team_id,season' });
        if (apErr) errors.push(`upsert appearances(${team.externalId}): ${apErr.message}`);
        else appearancesUpserted += appearanceRows.length;
      }
    }
  }

  return { teamsUpserted, playersUpserted, appearancesUpserted, errors };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Default: Premier League + La Liga + Bundesliga
  let leagueIds = [2021, 2014, 2002];
  let season = 2024;
  let clearFirst = false;

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (body.leagueIds) leagueIds = body.leagueIds;
      if (body.season)    season    = body.season;
      if (body.clearFirst) clearFirst = body.clearFirst;
    } catch { /* empty body */ }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const apiKey = Deno.env.get('FDO_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'FDO_API_KEY secret not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Optionally wipe existing data (needed when switching from mock IDs to FDO IDs)
  if (clearFirst) {
    await supabase.from('player_appearances').delete().neq('season', -1);
    await supabase.from('players').delete().neq('external_id', -1);
    await supabase.from('teams').delete().neq('external_id', -1);
  }

  const provider = new FootballDataOrgProvider(apiKey);
  const result = await syncAll(supabase, provider, leagueIds, season);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.errors.length > 0 ? 207 : 200,
  });
});
