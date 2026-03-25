/**
 * sync-sports-data — Supabase Edge Function
 *
 * Syncs teams, players, and appearances into the database.
 * Uses a pluggable provider — swap MockProvider for ApiFootballProvider
 * once a real API key is available.
 *
 * Trigger: POST /functions/v1/sync-sports-data
 * Body (optional): { leagueId?: number, season?: number }
 *
 * For daily automation: call this from pg_cron or a GitHub Actions schedule.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types (inline — Edge Functions can't import from src/) ──────────────────

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

interface IFootballDataProvider {
  getTeams(leagueId: number, season: number): Promise<TeamData[]>;
  getSquad(teamExternalId: number): Promise<PlayerData[]>;
  getPlayerAppearances(playerExternalId: number, teamExternalId: number, season: number): Promise<AppearancesData>;
}

// ─── Mock provider (embedded for Edge Function) ──────────────────────────────

const MOCK_TEAMS: TeamData[] = [
  { externalId: 33,  name: 'Manchester United', shortName: 'Man Utd',  logoUrl: 'https://media.api-sports.io/football/teams/33.png',  country: 'England', leagueId: 39,  season: 2024 },
  { externalId: 40,  name: 'Liverpool',          shortName: 'Liverpool',logoUrl: 'https://media.api-sports.io/football/teams/40.png',  country: 'England', leagueId: 39,  season: 2024 },
  { externalId: 42,  name: 'Arsenal',            shortName: 'Arsenal',  logoUrl: 'https://media.api-sports.io/football/teams/42.png',  country: 'England', leagueId: 39,  season: 2024 },
  { externalId: 50,  name: 'Manchester City',    shortName: 'Man City', logoUrl: 'https://media.api-sports.io/football/teams/50.png',  country: 'England', leagueId: 39,  season: 2024 },
  { externalId: 541, name: 'Real Madrid',        shortName: 'Real',     logoUrl: 'https://media.api-sports.io/football/teams/541.png', country: 'Spain',   leagueId: 140, season: 2024 },
  { externalId: 529, name: 'Barcelona',          shortName: 'Barca',    logoUrl: 'https://media.api-sports.io/football/teams/529.png', country: 'Spain',   leagueId: 140, season: 2024 },
  { externalId: 157, name: 'Bayern Munich',      shortName: 'Bayern',   logoUrl: 'https://media.api-sports.io/football/teams/157.png', country: 'Germany', leagueId: 78,  season: 2024 },
  { externalId: 85,  name: 'Paris Saint-Germain',shortName: 'PSG',      logoUrl: 'https://media.api-sports.io/football/teams/85.png',  country: 'France',  leagueId: 61,  season: 2024 },
];

const MOCK_PLAYERS: PlayerData[] = [
  { externalId: 1001, name: 'Ryan Giggs',           position: 'Midfielder', nationality: 'Wales' },
  { externalId: 1002, name: 'Wayne Rooney',          position: 'Forward',   nationality: 'England' },
  { externalId: 1003, name: 'Paul Scholes',          position: 'Midfielder', nationality: 'England' },
  { externalId: 1004, name: 'Cristiano Ronaldo',     position: 'Forward',   nationality: 'Portugal' },
  { externalId: 1005, name: 'Marcus Rashford',       position: 'Forward',   nationality: 'England' },
  { externalId: 1006, name: 'Bruno Fernandes',       position: 'Midfielder', nationality: 'Portugal' },
  { externalId: 2001, name: 'Steven Gerrard',        position: 'Midfielder', nationality: 'England' },
  { externalId: 2002, name: 'Mohamed Salah',         position: 'Forward',   nationality: 'Egypt' },
  { externalId: 2003, name: 'Virgil van Dijk',       position: 'Defender',  nationality: 'Netherlands' },
  { externalId: 2004, name: 'Sadio Mane',            position: 'Forward',   nationality: 'Senegal' },
  { externalId: 3001, name: 'Thierry Henry',         position: 'Forward',   nationality: 'France' },
  { externalId: 3002, name: 'Bukayo Saka',           position: 'Forward',   nationality: 'England' },
  { externalId: 3003, name: 'Martin Odegaard',       position: 'Midfielder', nationality: 'Norway' },
  { externalId: 3004, name: 'Declan Rice',           position: 'Midfielder', nationality: 'England' },
  { externalId: 4001, name: 'Erling Haaland',        position: 'Forward',   nationality: 'Norway' },
  { externalId: 4002, name: 'Kevin De Bruyne',       position: 'Midfielder', nationality: 'Belgium' },
  { externalId: 5001, name: 'Karim Benzema',         position: 'Forward',   nationality: 'France' },
  { externalId: 5002, name: 'Luka Modric',           position: 'Midfielder', nationality: 'Croatia' },
  { externalId: 5003, name: 'Vinicius Jr',           position: 'Forward',   nationality: 'Brazil' },
  { externalId: 5004, name: 'Jude Bellingham',       position: 'Midfielder', nationality: 'England' },
  { externalId: 6001, name: 'Lionel Messi',          position: 'Forward',   nationality: 'Argentina' },
  { externalId: 6002, name: 'Pedri',                 position: 'Midfielder', nationality: 'Spain' },
  { externalId: 6003, name: 'Gavi',                  position: 'Midfielder', nationality: 'Spain' },
  { externalId: 7001, name: 'Thomas Muller',         position: 'Forward',   nationality: 'Germany' },
  { externalId: 7002, name: 'Jamal Musiala',         position: 'Midfielder', nationality: 'Germany' },
  { externalId: 7003, name: 'Harry Kane',            position: 'Forward',   nationality: 'England' },
  { externalId: 8001, name: 'Kylian Mbappe',         position: 'Forward',   nationality: 'France' },
  { externalId: 8002, name: 'Ousmane Dembele',       position: 'Forward',   nationality: 'France' },
];

const SQUAD_MAP: Record<number, number[]> = {
  33:  [1001, 1002, 1003, 1004, 1005, 1006],
  40:  [2001, 2002, 2003, 2004],
  42:  [3001, 3002, 3003, 3004],
  50:  [4001, 4002],
  541: [5001, 5002, 5003, 5004],
  529: [6001, 6002, 6003],
  157: [7001, 7002, 7003],
  85:  [8001, 8002],
};

const APPEARANCES_MAP: Record<string, number> = {
  '1001_33': 168, '1002_33': 156, '1003_33': 155, '1004_33': 145,
  '1005_33': 95,  '1006_33': 88,
  '2001_40': 165, '2002_40': 142, '2003_40': 110, '2004_40': 95,
  '3001_42': 174, '3002_42': 72,  '3003_42': 60,  '3004_42': 40,
  '4001_50': 80,  '4002_50': 165,
  '5001_541': 165, '5002_541': 148, '5003_541': 78, '5004_541': 45,
  '6001_529': 180, '6002_529': 62,  '6003_529': 55,
  '7001_157': 163, '7002_157': 48,  '7003_157': 35,
  '8001_85': 118,  '8002_85': 72,
};

class MockFootballDataProvider implements IFootballDataProvider {
  async getTeams(leagueId: number, season: number): Promise<TeamData[]> {
    return MOCK_TEAMS.filter(t =>
      (!leagueId || t.leagueId === leagueId) && t.season === season
    );
  }

  async getSquad(teamExternalId: number): Promise<PlayerData[]> {
    const ids = SQUAD_MAP[teamExternalId] ?? [];
    return MOCK_PLAYERS.filter(p => ids.includes(p.externalId));
  }

  async getPlayerAppearances(playerExternalId: number, teamExternalId: number, season: number): Promise<AppearancesData> {
    const key = `${playerExternalId}_${teamExternalId}`;
    const appearances = APPEARANCES_MAP[key] ?? Math.floor(Math.random() * 60) + 10;
    return { playerExternalId, teamExternalId, season, appearances };
  }
}

// ─── Sync logic ──────────────────────────────────────────────────────────────

async function syncAll(
  supabase: ReturnType<typeof createClient>,
  provider: IFootballDataProvider,
  leagueIds: number[],
  season: number
) {
  let teamsUpserted = 0;
  let playersUpserted = 0;
  let appearancesUpserted = 0;
  const errors: string[] = [];

  for (const leagueId of leagueIds) {
    let teams: TeamData[];
    try {
      teams = await provider.getTeams(leagueId, season);
    } catch (e) {
      errors.push(`getTeams(${leagueId}): ${e}`);
      continue;
    }

    // Upsert teams
    const { error: teamErr } = await supabase.from('teams').upsert(
      teams.map(t => ({
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
    if (teamErr) { errors.push(`upsert teams: ${teamErr.message}`); continue; }
    teamsUpserted += teams.length;

    // Fetch team rows to get UUIDs
    const { data: teamRows } = await supabase
      .from('teams')
      .select('id, external_id')
      .in('external_id', teams.map(t => t.externalId));

    const teamUuidByExternalId = Object.fromEntries(
      (teamRows ?? []).map(r => [r.external_id, r.id])
    );

    for (const team of teams) {
      let squad: PlayerData[];
      try {
        squad = await provider.getSquad(team.externalId);
      } catch (e) {
        errors.push(`getSquad(${team.externalId}): ${e}`);
        continue;
      }

      if (!squad.length) continue;

      // Upsert players
      const { error: playerErr } = await supabase.from('players').upsert(
        squad.map(p => ({
          external_id: p.externalId,
          name: p.name,
          position: p.position,
          nationality: p.nationality,
          photo_url: p.photoUrl,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: 'external_id' }
      );
      if (playerErr) { errors.push(`upsert players: ${playerErr.message}`); continue; }
      playersUpserted += squad.length;

      // Fetch player rows to get UUIDs
      const { data: playerRows } = await supabase
        .from('players')
        .select('id, external_id')
        .in('external_id', squad.map(p => p.externalId));

      const playerUuidByExternalId = Object.fromEntries(
        (playerRows ?? []).map(r => [r.external_id, r.id])
      );

      const teamUuid = teamUuidByExternalId[team.externalId];
      if (!teamUuid) continue;

      // Upsert appearances for each player
      const appearanceRows = [];
      for (const player of squad) {
        let apData: AppearancesData;
        try {
          apData = await provider.getPlayerAppearances(player.externalId, team.externalId, season);
        } catch (e) {
          errors.push(`getPlayerAppearances(${player.externalId}, ${team.externalId}): ${e}`);
          continue;
        }

        const playerUuid = playerUuidByExternalId[player.externalId];
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
        if (apErr) errors.push(`upsert appearances: ${apErr.message}`);
        else appearancesUpserted += appearanceRows.length;
      }
    }
  }

  return { teamsUpserted, playersUpserted, appearancesUpserted, errors };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Allow cron calls without a body
  let leagueIds = [39, 140, 78, 135, 61]; // PL, La Liga, Bundesliga, Serie A, Ligue 1
  let season = 2024;

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (body.leagueIds) leagueIds = body.leagueIds;
      if (body.season) season = body.season;
    } catch {
      // empty body is fine
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // TODO: swap MockFootballDataProvider for ApiFootballProvider once API key is set
  const provider: IFootballDataProvider = new MockFootballDataProvider();

  const result = await syncAll(supabase, provider, leagueIds, season);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.errors.length > 0 ? 207 : 200,
  });
});
