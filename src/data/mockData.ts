import { Club, FootballPlayer } from '@/types/game';
import sportsData from './sportsData.json';
import { getTeams, getSquadByExternalTeamId, searchPlayerInTeam } from '@/lib/football/sportsDataService';

const SEASON = 2024;

// Clubs straight from JSON (fallback)
export const mockClubs: Club[] = sportsData.teams.map(t => ({
  id: String(t.id),
  name: t.name,
  logo: t.logo,
  country: t.country,
}));

export const fetchClubs = async (): Promise<Club[]> => {
  try {
    const teams = await getTeams(SEASON);
    if (teams.length > 0) {
      return teams.map(t => ({
        id: String(t.externalId),
        name: t.name,
        logo: t.logoUrl,
        country: t.country,
      }));
    }
  } catch {
    // fall through to local data
  }
  return mockClubs;
};

// Sync fallback — used only when Supabase hasn't loaded yet
export const getPlayersForClub = (clubId: string): FootballPlayer[] => {
  const teamId = Number(clubId);
  const playerIds = new Set(
    sportsData.appearances
      .filter(a => a.teamId === teamId)
      .map(a => a.playerId)
  );
  return sportsData.players
    .filter(p => playerIds.has(p.id))
    .map(p => {
      const app = sportsData.appearances.find(
        a => a.playerId === p.id && a.teamId === teamId
      );
      return {
        id: String(p.id),
        name: p.name,
        appearances: app?.appearances ?? 0,
        position: p.position,
        nationality: p.nationality,
        photo: p.photo,
      };
    });
};

// Async version — tries Supabase first, falls back to JSON
export const fetchPlayersForClub = async (clubId: string): Promise<FootballPlayer[]> => {
  try {
    const squad = await getSquadByExternalTeamId(Number(clubId), SEASON);
    if (squad.length > 0) {
      return squad.map(p => ({
        id: p.playerId,
        name: p.name,
        appearances: p.appearances,
        position: p.position,
        nationality: p.nationality,
        photo: p.photoUrl,
      }));
    }
  } catch {
    // fall through to local data
  }
  return getPlayersForClub(clubId);
};

export const searchPlayer = async (
  clubId: string,
  playerName: string
): Promise<FootballPlayer | null> => {
  try {
    const p = await searchPlayerInTeam(Number(clubId), playerName, SEASON);
    if (p) {
      return {
        id: p.playerId,
        name: p.name,
        appearances: p.appearances,
        position: p.position,
        nationality: p.nationality,
        photo: p.photoUrl,
      };
    }
  } catch {
    // fall through to local search
  }
  const players = getPlayersForClub(clubId);
  const q = playerName.toLowerCase().trim();
  return players.find(p => {
    const n = p.name.toLowerCase();
    return n.includes(q) || q.includes(n.split(' ')[0]) || q.includes(n.split(' ').pop() ?? '');
  }) ?? null;
};

export const getRandomClub = (): Club =>
  mockClubs[Math.floor(Math.random() * mockClubs.length)];

export const getRandomClubAsync = async (): Promise<Club> => {
  const clubs = await fetchClubs();
  return clubs[Math.floor(Math.random() * clubs.length)];
};
