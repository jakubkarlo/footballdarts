export type GameMode = 'solo' | '1v1-turns' | '1v1-one-shot';

export type StartingScore = 301 | 501 | 701;

export interface Player {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
  logo: string;
  country: string;
}

export interface FootballPlayer {
  id: string;
  name: string;
  appearances: number;
  position: string;
  nationality: string;
}

export interface Throw {
  playerId: string;
  playerName: string;
  appearances: number;
  timestamp: number;
}

export interface GamePlayer {
  id: string;
  name: string;
  score: number;
  throws: Throw[];
  isActive: boolean;
  isBusted: boolean;
  isFinished: boolean;
}

export interface GameState {
  mode: GameMode;
  startingScore: StartingScore;
  club: Club | null;
  players: GamePlayer[];
  currentPlayerIndex: number;
  isGameOver: boolean;
  winner: GamePlayer | null;
  phase: 'menu' | 'setup' | 'playing' | 'result';
}

export interface PlayerSearchResult {
  id: string;
  name: string;
  appearances: number;
  position: string;
  nationality: string;
  isValid: boolean;
  errorMessage?: string;
}
