export type GameMode = 'solo' | 'multiplayer-turns' | 'multiplayer-blitz';

export type StartingScore = 301 | 501 | 701;

export type GamePhase = 'menu' | 'lobby' | 'setup' | 'playing' | 'result';

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
  firstname?: string;
  lastname?: string;
  appearances: number;
  position: string;
  nationality: string;
  photo?: string;
}

export interface Throw {
  playerId: string;
  playerName: string;
  appearances: number;
  timestamp: number;
  photo?: string;
  position?: string;
  busted?: boolean;
  missed?: boolean;
}

export interface GamePlayer {
  id: string;
  name: string;
  score: number;
  throws: Throw[];
  isActive: boolean;
  isBusted: boolean;
  isFinished: boolean;
  sessionToken?: string;
  lives: number;
}

export interface GameState {
  mode: GameMode;
  startingScore: StartingScore;
  club: Club | null;
  players: GamePlayer[];
  currentPlayerIndex: number;
  isGameOver: boolean;
  winner: GamePlayer | null;
  phase: GamePhase;
  isOnline: boolean;
  gameCode: string | null;
  sessionId: string | null;
  myPlayerIndex: number | null;
  allowMisses: boolean;
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

export interface OnlineGameSession {
  id: string;
  code: string;
  mode: GameMode;
  startingScore: number;
  club: Club | null;
  status: 'waiting' | 'playing' | 'finished';
  currentPlayerIndex: number;
  maxPlayers: number;
  players: OnlinePlayer[];
}

export interface OnlinePlayer {
  id: string;
  sessionId: string;
  playerName: string;
  playerOrder: number;
  score: number;
  isBusted: boolean;
  isFinished: boolean;
  sessionToken: string;
  throws: Throw[];
}
