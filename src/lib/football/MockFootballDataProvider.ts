import { IFootballDataProvider } from './IFootballDataProvider';
import { TeamData, PlayerData, AppearancesData } from './types';

// Mirrors the numeric IDs used by api-football.com (same as existing mockClubs)
const MOCK_TEAMS: TeamData[] = [
  { externalId: 33,  name: 'Manchester United', shortName: 'Man Utd',   logoUrl: 'https://media.api-sports.io/football/teams/33.png',  country: 'England', leagueId: 39, season: 2024 },
  { externalId: 40,  name: 'Liverpool',          shortName: 'Liverpool', logoUrl: 'https://media.api-sports.io/football/teams/40.png',  country: 'England', leagueId: 39, season: 2024 },
  { externalId: 42,  name: 'Arsenal',            shortName: 'Arsenal',   logoUrl: 'https://media.api-sports.io/football/teams/42.png',  country: 'England', leagueId: 39, season: 2024 },
  { externalId: 47,  name: 'Tottenham',          shortName: 'Spurs',     logoUrl: 'https://media.api-sports.io/football/teams/47.png',  country: 'England', leagueId: 39, season: 2024 },
  { externalId: 49,  name: 'Chelsea',            shortName: 'Chelsea',   logoUrl: 'https://media.api-sports.io/football/teams/49.png',  country: 'England', leagueId: 39, season: 2024 },
  { externalId: 50,  name: 'Manchester City',    shortName: 'Man City',  logoUrl: 'https://media.api-sports.io/football/teams/50.png',  country: 'England', leagueId: 39, season: 2024 },
  { externalId: 85,  name: 'Paris Saint-Germain',shortName: 'PSG',       logoUrl: 'https://media.api-sports.io/football/teams/85.png',  country: 'France',  leagueId: 61, season: 2024 },
  { externalId: 157, name: 'Bayern Munich',      shortName: 'Bayern',    logoUrl: 'https://media.api-sports.io/football/teams/157.png', country: 'Germany', leagueId: 78, season: 2024 },
  { externalId: 165, name: 'Borussia Dortmund',  shortName: 'Dortmund',  logoUrl: 'https://media.api-sports.io/football/teams/165.png', country: 'Germany', leagueId: 78, season: 2024 },
  { externalId: 489, name: 'AC Milan',           shortName: 'Milan',     logoUrl: 'https://media.api-sports.io/football/teams/489.png', country: 'Italy',   leagueId: 135, season: 2024 },
  { externalId: 492, name: 'Napoli',             shortName: 'Napoli',    logoUrl: 'https://media.api-sports.io/football/teams/492.png', country: 'Italy',   leagueId: 135, season: 2024 },
  { externalId: 496, name: 'Juventus',           shortName: 'Juventus',  logoUrl: 'https://media.api-sports.io/football/teams/496.png', country: 'Italy',   leagueId: 135, season: 2024 },
  { externalId: 529, name: 'Barcelona',          shortName: 'Barca',     logoUrl: 'https://media.api-sports.io/football/teams/529.png', country: 'Spain',   leagueId: 140, season: 2024 },
  { externalId: 530, name: 'Atletico Madrid',    shortName: 'Atletico',  logoUrl: 'https://media.api-sports.io/football/teams/530.png', country: 'Spain',   leagueId: 140, season: 2024 },
  { externalId: 541, name: 'Real Madrid',        shortName: 'Real',      logoUrl: 'https://media.api-sports.io/football/teams/541.png', country: 'Spain',   leagueId: 140, season: 2024 },
];

// playerId → PlayerData
const MOCK_PLAYERS: PlayerData[] = [
  // Man Utd (33)
  { externalId: 1001, name: 'Ryan Giggs',         position: 'Midfielder', nationality: 'Wales',       photoUrl: '' },
  { externalId: 1002, name: 'Wayne Rooney',        position: 'Forward',   nationality: 'England',     photoUrl: '' },
  { externalId: 1003, name: 'Paul Scholes',        position: 'Midfielder', nationality: 'England',    photoUrl: '' },
  { externalId: 1004, name: 'David Beckham',       position: 'Midfielder', nationality: 'England',    photoUrl: '' },
  { externalId: 1005, name: 'Cristiano Ronaldo',   position: 'Forward',   nationality: 'Portugal',   photoUrl: '' },
  { externalId: 1006, name: 'Marcus Rashford',     position: 'Forward',   nationality: 'England',    photoUrl: '' },
  { externalId: 1007, name: 'Bruno Fernandes',     position: 'Midfielder', nationality: 'Portugal',  photoUrl: '' },
  { externalId: 1008, name: 'Peter Schmeichel',    position: 'Goalkeeper', nationality: 'Denmark',   photoUrl: '' },
  { externalId: 1009, name: 'Roy Keane',           position: 'Midfielder', nationality: 'Ireland',   photoUrl: '' },
  // Liverpool (40)
  { externalId: 2001, name: 'Steven Gerrard',      position: 'Midfielder', nationality: 'England',   photoUrl: '' },
  { externalId: 2002, name: 'Mohamed Salah',       position: 'Forward',   nationality: 'Egypt',      photoUrl: '' },
  { externalId: 2003, name: 'Virgil van Dijk',     position: 'Defender',  nationality: 'Netherlands',photoUrl: '' },
  { externalId: 2004, name: 'Sadio Mane',          position: 'Forward',   nationality: 'Senegal',    photoUrl: '' },
  { externalId: 2005, name: 'Trent Alexander-Arnold',position: 'Defender',nationality: 'England',   photoUrl: '' },
  { externalId: 2006, name: 'Jordan Henderson',    position: 'Midfielder', nationality: 'England',   photoUrl: '' },
  // Arsenal (42)
  { externalId: 3001, name: 'Thierry Henry',       position: 'Forward',   nationality: 'France',     photoUrl: '' },
  { externalId: 3002, name: 'Patrick Vieira',      position: 'Midfielder', nationality: 'France',    photoUrl: '' },
  { externalId: 3003, name: 'Bukayo Saka',         position: 'Forward',   nationality: 'England',    photoUrl: '' },
  { externalId: 3004, name: 'Martin Odegaard',     position: 'Midfielder', nationality: 'Norway',    photoUrl: '' },
  { externalId: 3005, name: 'Declan Rice',         position: 'Midfielder', nationality: 'England',   photoUrl: '' },
  // Real Madrid (541)
  { externalId: 4001, name: 'Karim Benzema',       position: 'Forward',   nationality: 'France',     photoUrl: '' },
  { externalId: 4002, name: 'Sergio Ramos',        position: 'Defender',  nationality: 'Spain',      photoUrl: '' },
  { externalId: 4003, name: 'Luka Modric',         position: 'Midfielder', nationality: 'Croatia',   photoUrl: '' },
  { externalId: 4004, name: 'Vinicius Jr',         position: 'Forward',   nationality: 'Brazil',     photoUrl: '' },
  { externalId: 4005, name: 'Jude Bellingham',     position: 'Midfielder', nationality: 'England',   photoUrl: '' },
  // Barcelona (529)
  { externalId: 5001, name: 'Lionel Messi',        position: 'Forward',   nationality: 'Argentina',  photoUrl: '' },
  { externalId: 5002, name: 'Xavi',                position: 'Midfielder', nationality: 'Spain',     photoUrl: '' },
  { externalId: 5003, name: 'Andres Iniesta',      position: 'Midfielder', nationality: 'Spain',     photoUrl: '' },
  { externalId: 5004, name: 'Pedri',               position: 'Midfielder', nationality: 'Spain',     photoUrl: '' },
  { externalId: 5005, name: 'Gavi',                position: 'Midfielder', nationality: 'Spain',     photoUrl: '' },
  // Bayern Munich (157)
  { externalId: 6001, name: 'Thomas Muller',       position: 'Forward',   nationality: 'Germany',    photoUrl: '' },
  { externalId: 6002, name: 'Manuel Neuer',        position: 'Goalkeeper', nationality: 'Germany',   photoUrl: '' },
  { externalId: 6003, name: 'Robert Lewandowski',  position: 'Forward',   nationality: 'Poland',     photoUrl: '' },
  { externalId: 6004, name: 'Jamal Musiala',       position: 'Midfielder', nationality: 'Germany',   photoUrl: '' },
  // PSG (85)
  { externalId: 7001, name: 'Kylian Mbappe',       position: 'Forward',   nationality: 'France',     photoUrl: '' },
  { externalId: 7002, name: 'Neymar',              position: 'Forward',   nationality: 'Brazil',     photoUrl: '' },
  { externalId: 7003, name: 'Marquinhos',          position: 'Defender',  nationality: 'Brazil',     photoUrl: '' },
];

// teamExternalId → playerExternalId[]
const SQUAD_MAP: Record<number, number[]> = {
  33:  [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009],
  40:  [2001, 2002, 2003, 2004, 2005, 2006],
  42:  [3001, 3002, 3003, 3004, 3005],
  541: [4001, 4002, 4003, 4004, 4005],
  529: [5001, 5002, 5003, 5004, 5005],
  157: [6001, 6002, 6003, 6004],
  85:  [7001, 7002, 7003],
};

// (playerExternalId, teamExternalId) → appearances
const APPEARANCES_MAP: Record<string, number> = {
  '1001_33': 168, '1002_33': 156, '1003_33': 155, '1004_33': 128,
  '1005_33': 145, '1006_33': 95,  '1007_33': 88,  '1008_33': 180,
  '1009_33': 162,
  '2001_40': 165, '2002_40': 142, '2003_40': 110, '2004_40': 95,
  '2005_40': 80,  '2006_40': 88,
  '3001_42': 174, '3002_42': 148, '3003_42': 72,  '3004_42': 60,
  '3005_42': 40,
  '4001_541': 165, '4002_541': 172, '4003_541': 148, '4004_541': 78,
  '4005_541': 45,
  '5001_529': 180, '5002_529': 156, '5003_529': 151, '5004_529': 62,
  '5005_529': 55,
  '6001_157': 163, '6002_157': 158, '6003_157': 129, '6004_157': 48,
  '7001_85': 118, '7002_85': 87,  '7003_85': 95,
};

export class MockFootballDataProvider implements IFootballDataProvider {
  async getTeams(leagueId: number, season: number): Promise<TeamData[]> {
    await delay(50);
    return MOCK_TEAMS.filter(
      (t) => (!leagueId || t.leagueId === leagueId) && t.season === season
    );
  }

  async getSquad(teamExternalId: number): Promise<PlayerData[]> {
    await delay(50);
    const ids = SQUAD_MAP[teamExternalId] ?? [];
    return MOCK_PLAYERS.filter((p) => ids.includes(p.externalId));
  }

  async getPlayerAppearances(
    playerExternalId: number,
    teamExternalId: number,
    season: number
  ): Promise<AppearancesData> {
    await delay(20);
    const key = `${playerExternalId}_${teamExternalId}`;
    const appearances = APPEARANCES_MAP[key] ?? Math.floor(Math.random() * 60) + 10;
    return { playerExternalId, teamExternalId, season, appearances };
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
