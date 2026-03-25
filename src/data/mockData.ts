import { Club, FootballPlayer } from '@/types/game';
import sportsData from './sportsData.json';

// Clubs straight from JSON
export const mockClubs: Club[] = sportsData.teams.map(t => ({
  id: String(t.id),
  name: t.name,
  logo: t.logo,
  country: t.country,
}));

export const fetchClubs = async (): Promise<Club[]> => mockClubs;

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

export const searchPlayer = async (
  clubId: string,
  playerName: string
): Promise<FootballPlayer | null> => {
  const players = getPlayersForClub(clubId);
  const q = playerName.toLowerCase().trim();
  const found = players.find(p => {
    const n = p.name.toLowerCase();
    return n.includes(q) || q.includes(n.split(' ')[0]) || q.includes(n.split(' ').pop() ?? '');
  });
  return found ?? null;
};

export const getRandomClub = (): Club =>
  mockClubs[Math.floor(Math.random() * mockClubs.length)];

export const getRandomClubAsync = async (): Promise<Club> => getRandomClub();
