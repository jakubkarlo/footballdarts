import { Club, FootballPlayer } from '@/types/game';
import sportsData from './sportsData.json';
import { getTeams, getSquadByExternalTeamId, searchPlayerInTeam, getAllPlayers, getPlayerByIdInTeam } from '@/lib/football/sportsDataService';

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
        firstname: p.firstname,
        lastname: p.lastname,
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
  playerName: string,
  playerId?: string,
): Promise<FootballPlayer | null> => {
  try {
    const p = playerId
      ? await getPlayerByIdInTeam(Number(clubId), playerId)
      : await searchPlayerInTeam(Number(clubId), playerName);
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
  const qParts = q.split(/\s+/);
  const qLast = qParts[qParts.length - 1];
  // Prefer exact lastname match to avoid wrong-Gabriel situations
  return (
    players.find(p => {
      const nParts = p.name.toLowerCase().split(/\s+/);
      const nLast = nParts[nParts.length - 1];
      return nLast === qLast && nParts[0].startsWith(qParts[0]);
    }) ??
    players.find(p => p.name.toLowerCase().includes(q)) ??
    null
  );
};

// All players across all clubs (for global suggestions)
export const getAllPlayersLocal = (): FootballPlayer[] =>
  sportsData.players.map(p => ({
    id: String(p.id),
    name: p.name,
    appearances: 0,
    position: p.position,
    nationality: p.nationality,
    photo: p.photo,
  }));

export const fetchAllPlayers = async (): Promise<FootballPlayer[]> => {
  try {
    const players = await getAllPlayers(SEASON);
    if (players.length > 0) {
      return players.map(p => ({
        id: p.playerId,
        name: p.name,
        firstname: p.firstname,
        lastname: p.lastname,
        appearances: p.appearances,
        position: p.position,
        nationality: p.nationality,
        photo: p.photoUrl,
      }));
    }
  } catch {
    // fall through
  }
  return getAllPlayersLocal();
};

export const getRandomClub = (): Club =>
  mockClubs[Math.floor(Math.random() * mockClubs.length)];

export const getRandomClubAsync = async (): Promise<Club> => {
  const clubs = await fetchClubs();
  return clubs[Math.floor(Math.random() * clubs.length)];
};
