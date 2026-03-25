import { TeamData, PlayerData, AppearancesData } from './types';

/**
 * Adapter interface for any football data source.
 * Implement this to swap between mock data, sportsdataapi.com, api-football.com, etc.
 */
export interface IFootballDataProvider {
  /**
   * Returns list of teams for a given league and season.
   * @param leagueId  provider-specific league identifier
   * @param season    4-digit year, e.g. 2024
   */
  getTeams(leagueId: number, season: number): Promise<TeamData[]>;

  /**
   * Returns all players currently in a team's squad.
   * @param teamExternalId  provider-specific team identifier
   */
  getSquad(teamExternalId: number): Promise<PlayerData[]>;

  /**
   * Returns appearance count for a player in a specific team and season.
   * @param playerExternalId  provider-specific player identifier
   * @param teamExternalId    provider-specific team identifier
   * @param season            4-digit year
   */
  getPlayerAppearances(
    playerExternalId: number,
    teamExternalId: number,
    season: number
  ): Promise<AppearancesData>;
}
