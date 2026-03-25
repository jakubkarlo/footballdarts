// Core data types for the sports data layer

export interface TeamData {
  externalId: number;
  name: string;
  shortName?: string;
  logoUrl?: string;
  country?: string;
  leagueId?: number;
  season: number;
}

export interface PlayerData {
  externalId: number;
  name: string;
  position?: string;
  nationality?: string;
  photoUrl?: string;
}

export interface AppearancesData {
  playerExternalId: number;
  teamExternalId: number;
  season: number;
  appearances: number;
}

export interface SyncResult {
  teamsUpserted: number;
  playersUpserted: number;
  appearancesUpserted: number;
  errors: string[];
}
