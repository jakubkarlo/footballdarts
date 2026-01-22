import { Club, FootballPlayer } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

// Popular clubs with API-Football team IDs
export const mockClubs: Club[] = [
  { id: '33', name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png', country: 'England' },
  { id: '541', name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', country: 'Spain' },
  { id: '529', name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', country: 'Spain' },
  { id: '157', name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png', country: 'Germany' },
  { id: '40', name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', country: 'England' },
  { id: '496', name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png', country: 'Italy' },
  { id: '85', name: 'Paris Saint-Germain', logo: 'https://media.api-sports.io/football/teams/85.png', country: 'France' },
  { id: '49', name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png', country: 'England' },
  { id: '50', name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png', country: 'England' },
  { id: '489', name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png', country: 'Italy' },
  { id: '42', name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png', country: 'England' },
  { id: '47', name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png', country: 'England' },
  { id: '165', name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png', country: 'Germany' },
  { id: '530', name: 'Atletico Madrid', logo: 'https://media.api-sports.io/football/teams/530.png', country: 'Spain' },
  { id: '492', name: 'Napoli', logo: 'https://media.api-sports.io/football/teams/492.png', country: 'Italy' },
];

// Mock players database as fallback
const mockPlayers: Record<string, FootballPlayer[]> = {
  '33': [ // Manchester United
    { id: 'mu1', name: 'Ryan Giggs', appearances: 168, position: 'Midfielder', nationality: 'Wales' },
    { id: 'mu2', name: 'Wayne Rooney', appearances: 156, position: 'Forward', nationality: 'England' },
    { id: 'mu3', name: 'Paul Scholes', appearances: 155, position: 'Midfielder', nationality: 'England' },
    { id: 'mu4', name: 'David Beckham', appearances: 128, position: 'Midfielder', nationality: 'England' },
    { id: 'mu5', name: 'Cristiano Ronaldo', appearances: 145, position: 'Forward', nationality: 'Portugal' },
    { id: 'mu6', name: 'Marcus Rashford', appearances: 95, position: 'Forward', nationality: 'England' },
    { id: 'mu7', name: 'Bruno Fernandes', appearances: 88, position: 'Midfielder', nationality: 'Portugal' },
  ],
  '541': [ // Real Madrid
    { id: 'rm1', name: 'Cristiano Ronaldo', appearances: 150, position: 'Forward', nationality: 'Portugal' },
    { id: 'rm2', name: 'Karim Benzema', appearances: 165, position: 'Forward', nationality: 'France' },
    { id: 'rm3', name: 'Sergio Ramos', appearances: 172, position: 'Defender', nationality: 'Spain' },
    { id: 'rm4', name: 'Luka Modric', appearances: 148, position: 'Midfielder', nationality: 'Croatia' },
    { id: 'rm5', name: 'Vinicius Jr', appearances: 78, position: 'Forward', nationality: 'Brazil' },
    { id: 'rm6', name: 'Jude Bellingham', appearances: 45, position: 'Midfielder', nationality: 'England' },
  ],
  '40': [ // Liverpool
    { id: 'lp1', name: 'Steven Gerrard', appearances: 165, position: 'Midfielder', nationality: 'England' },
    { id: 'lp2', name: 'Mohamed Salah', appearances: 142, position: 'Forward', nationality: 'Egypt' },
    { id: 'lp3', name: 'Virgil van Dijk', appearances: 110, position: 'Defender', nationality: 'Netherlands' },
    { id: 'lp4', name: 'Sadio Mane', appearances: 95, position: 'Forward', nationality: 'Senegal' },
  ],
};

const defaultPlayers: FootballPlayer[] = [
  { id: 'def1', name: 'Unknown Player 1', appearances: 75, position: 'Midfielder', nationality: 'Unknown' },
  { id: 'def2', name: 'Unknown Player 2', appearances: 50, position: 'Defender', nationality: 'Unknown' },
];

export const getPlayersForClub = (clubId: string): FootballPlayer[] => {
  return mockPlayers[clubId] || defaultPlayers;
};

// API call to search player
export const searchPlayer = async (
  clubId: string,
  playerName: string
): Promise<FootballPlayer | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('search-player', {
      body: { teamId: clubId, playerName },
    });

    if (error) {
      console.error('Edge function error:', error);
      // Fallback to mock data
      return searchPlayerMock(clubId, playerName);
    }

    if (data.player) {
      return {
        id: data.player.id.toString(),
        name: data.player.name,
        appearances: data.player.appearances,
        position: data.player.position,
        nationality: data.player.nationality,
        photo: data.player.photo,
      };
    }

    // Fallback to mock if not found in API
    return searchPlayerMock(clubId, playerName);
  } catch (error) {
    console.error('Error searching player:', error);
    return searchPlayerMock(clubId, playerName);
  }
};

// Fallback mock search
const searchPlayerMock = async (
  clubId: string,
  playerName: string
): Promise<FootballPlayer | null> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const players = getPlayersForClub(clubId);
  const normalizedSearch = playerName.toLowerCase().trim();
  
  const found = players.find(
    (p) => p.name.toLowerCase().includes(normalizedSearch) ||
           normalizedSearch.includes(p.name.toLowerCase().split(' ')[0]) ||
           normalizedSearch.includes(p.name.toLowerCase().split(' ').pop() || '')
  );
  
  return found || null;
};

export const getRandomClub = (): Club => {
  const randomIndex = Math.floor(Math.random() * mockClubs.length);
  return mockClubs[randomIndex];
};
