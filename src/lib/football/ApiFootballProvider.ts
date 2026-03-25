import { IFootballDataProvider } from './IFootballDataProvider';
import { TeamData, PlayerData, AppearancesData } from './types';

/**
 * Adapter for api-football.com (v3).
 * TODO: implement once API key is available.
 *
 * Base URL: https://v3.football.api-sports.io
 * Required header: x-apisports-key: <API_KEY>
 */
export class ApiFootballProvider implements IFootballDataProvider {
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(path: string): Promise<T> {
    const res = await globalThis.fetch(`${this.baseUrl}${path}`, {
      headers: { 'x-apisports-key': this.apiKey },
    });
    if (!res.ok) throw new Error(`api-football: ${res.status} ${path}`);
    const json = await res.json();
    return json.response as T;
  }

  async getTeams(leagueId: number, season: number): Promise<TeamData[]> {
    // TODO
    throw new Error('ApiFootballProvider.getTeams not implemented');
  }

  async getSquad(teamExternalId: number): Promise<PlayerData[]> {
    // TODO
    throw new Error('ApiFootballProvider.getSquad not implemented');
  }

  async getPlayerAppearances(
    playerExternalId: number,
    teamExternalId: number,
    season: number
  ): Promise<AppearancesData> {
    // TODO
    throw new Error('ApiFootballProvider.getPlayerAppearances not implemented');
  }
}
