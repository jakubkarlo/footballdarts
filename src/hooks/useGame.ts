import { useState, useCallback } from 'react';
import { GameState, GameMode, StartingScore, Club, GamePlayer, Throw } from '@/types/game';
import { searchPlayer } from '@/data/mockData';

const MAX_THROW = 180;

const createPlayer = (id: string, name: string, startingScore: StartingScore): GamePlayer => ({
  id,
  name,
  score: startingScore,
  throws: [],
  isActive: false,
  isBusted: false,
  isFinished: false,
  lives: 3,
});

export interface BlitzResult {
  player1Throws: Throw[];
  player2Throws: Throw[];
  player1Score: number;
  player2Score: number;
}

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    mode: 'multiplayer-turns',
    startingScore: 501,
    club: null,
    players: [],
    currentPlayerIndex: 0,
    isGameOver: false,
    winner: null,
    phase: 'menu',
    isOnline: false,
    gameCode: null,
    sessionId: null,
    myPlayerIndex: null,
    allowMisses: false,
    timer: null,
  });

  const [blitzResult, setBlitzResult] = useState<BlitzResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [lastThrowResult, setLastThrowResult] = useState<{
    type: 'success' | 'bust' | 'over' | 'invalid' | 'miss';
    message: string;
    value?: number;
  } | null>(null);

  const setMode = useCallback((mode: GameMode) => {
    setGameState((prev) => ({ ...prev, mode }));
  }, []);

  const setStartingScore = useCallback((score: StartingScore) => {
    setGameState((prev) => ({ ...prev, startingScore: score }));
  }, []);

  const setClub = useCallback((club: Club) => {
    setGameState((prev) => ({ ...prev, club }));
  }, []);

  const startGame = useCallback((playerNames: string[], allowMisses = false, timer: 30 | 60 | 90 | null = null) => {
    const players = playerNames.map((name, index) =>
      createPlayer(`player-${index}`, name, gameState.startingScore)
    );
    players[0].isActive = true;

    setGameState((prev) => ({
      ...prev,
      players,
      currentPlayerIndex: 0,
      isGameOver: false,
      winner: null,
      phase: 'playing',
      allowMisses,
      timer,
    }));
    setLastThrowResult(null);
  }, [gameState.startingScore]);

  const makeThrow = useCallback(async (playerName: string, playerId?: string): Promise<{
    success: boolean;
    appearances?: number;
    message: string;
  }> => {
    if (!gameState.club) {
      return { success: false, message: 'No club selected!' };
    }

    setIsLoading(true);
    
    try {
      const footballPlayer = await searchPlayer(gameState.club.id, playerName, playerId);
      
      const isMiss = !footballPlayer || footballPlayer.appearances === 0;
      if (isMiss && gameState.allowMisses) {
        const missThrow: Throw = {
          playerId: footballPlayer?.id ?? `miss-${Date.now()}`,
          playerName: footballPlayer?.name ?? playerName,
          appearances: 0,
          timestamp: Date.now(),
          photo: footballPlayer?.photo,
          position: footballPlayer?.position,
          missed: true,
          busted: true,
        };
        setGameState((prev) => {
          const newPlayers = [...prev.players];
          const ci = prev.currentPlayerIndex;
          const newLives = Math.max(0, newPlayers[ci].lives - 1);
          newPlayers[ci] = {
            ...newPlayers[ci],
            lives: newLives,
            throws: [...newPlayers[ci].throws, missThrow],
            isBusted: newLives <= 0,
            isFinished: newLives <= 0,
          };
          const isGameOver = newPlayers.every(p => p.isBusted || p.isFinished);
          const winner = isGameOver ? (newPlayers.find(p => !p.isBusted) ?? null) : null;
          return { ...prev, players: newPlayers, isGameOver, winner, phase: isGameOver ? 'result' : prev.phase };
        });
        setLastThrowResult({ type: 'miss', message: `Miss! ${footballPlayer?.name ?? playerName} — 0 appearances` });
        setIsLoading(false);
        return { success: false, message: 'Miss!' };
      }

      if (!footballPlayer) {
        setLastThrowResult({
          type: 'invalid',
          message: `Player not found: ${playerName}`,
        });
        setIsLoading(false);
        return { success: false, message: `Player not found: ${playerName}` };
      }

      if (footballPlayer.appearances === 0) {
        setLastThrowResult({
          type: 'invalid',
          message: `${footballPlayer.name} has no appearances for this club!`,
        });
        setIsLoading(false);
        return { success: false, message: `${footballPlayer.name} has 0 appearances` };
      }

      // In turns mode each player has their own secret pool — only block reuse within same player
      const usedPlayerIds = new Set(
        gameState.players[gameState.currentPlayerIndex].throws.map(t => t.playerId)
      );
      if (usedPlayerIds.has(footballPlayer.id)) {
        setLastThrowResult({
          type: 'invalid',
          message: `${footballPlayer.name} already used!`,
        });
        setIsLoading(false);
        return { success: false, message: `${footballPlayer.name} already used!` };
      }

      const appearances = footballPlayer.appearances;

      // Check if throw exceeds 180
      if (appearances > MAX_THROW) {
        setLastThrowResult({
          type: 'over',
          message: `${footballPlayer.name} has ${appearances} appearances - exceeds 180 limit!`,
          value: appearances,
        });
        
        // In blitz mode, disqualify
        if (gameState.mode === 'multiplayer-blitz') {
          setGameState((prev) => {
            const newPlayers = [...prev.players];
            newPlayers[prev.currentPlayerIndex].isBusted = true;
            return { ...prev, players: newPlayers };
          });
        }
        
        setIsLoading(false);
        return { 
          success: false, 
          appearances,
          message: `Exceeds 180 limit! (${appearances} appearances)` 
        };
      }

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const newScore = currentPlayer.score - appearances;

      // Check if bust (below zero)
      if (newScore < 0) {
        setLastThrowResult({
          type: 'bust',
          message: `BUST! Score ${newScore} - turn lost!`,
          value: appearances,
        });
        
        if (gameState.mode === 'multiplayer-blitz') {
          setGameState((prev) => {
            const newPlayers = [...prev.players];
            newPlayers[prev.currentPlayerIndex].isBusted = true;
            return { ...prev, players: newPlayers };
          });
        }
        
        setIsLoading(false);
        return { 
          success: false, 
          appearances,
          message: `BUST! Went below zero (${newScore})` 
        };
      }

      // Successful throw
      const newThrow: Throw = {
        playerId: footballPlayer.id,
        playerName: footballPlayer.name,
        appearances,
        timestamp: Date.now(),
        photo: footballPlayer.photo,
        position: footballPlayer.position,
      };

      setGameState((prev) => {
        const newPlayers = [...prev.players];
        newPlayers[prev.currentPlayerIndex] = {
          ...newPlayers[prev.currentPlayerIndex],
          score: newScore,
          throws: [...newPlayers[prev.currentPlayerIndex].throws, newThrow],
        };
        return { ...prev, players: newPlayers };
      });

      setLastThrowResult({
        type: 'success',
        message: `${footballPlayer.name}: ${appearances} appearances!`,
        value: appearances,
      });

      // In turns mode one throw = one turn, auto-advance after short delay
      if (gameState.mode === 'multiplayer-turns') {
        setTimeout(() => {
          setGameState((prev) => {
            const nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
            return {
              ...prev,
              players: prev.players.map((p, i) => ({ ...p, isActive: i === nextIndex })),
              currentPlayerIndex: nextIndex,
            };
          });
          setLastThrowResult(null);
        }, 1200);
      }

      setIsLoading(false);
      return {
        success: true,
        appearances,
        message: `${footballPlayer.name} - ${appearances} appearances`
      };
    } catch (error) {
      setIsLoading(false);
      return { success: false, message: 'Error searching for player' };
    }
  }, [gameState.club, gameState.currentPlayerIndex, gameState.mode, gameState.players]);

  const endTurn = useCallback(() => {
    setGameState((prev) => {
      const nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      const newPlayers = prev.players.map((player, index) => ({
        ...player,
        isActive: index === nextIndex,
      }));

      return {
        ...prev,
        players: newPlayers,
        currentPlayerIndex: nextIndex,
      };
    });
    setLastThrowResult(null);
  }, []);

  const finishGame = useCallback((playerId: string) => {
    setGameState((prev) => {
      const winner = prev.players.find((p) => p.id === playerId) || null;
      const newPlayers = prev.players.map((p) => ({
        ...p,
        isFinished: p.id === playerId,
      }));

      return {
        ...prev,
        players: newPlayers,
        isGameOver: true,
        winner,
        phase: 'result',
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      mode: 'solo',
      startingScore: 501,
      club: null,
      players: [],
      currentPlayerIndex: 0,
      isGameOver: false,
      winner: null,
      phase: 'menu',
      isOnline: false,
      gameCode: null,
      sessionId: null,
      myPlayerIndex: null,
      allowMisses: false,
      timer: null,
    });
    setLastThrowResult(null);
    setBlitzResult(null);
  }, []);

  const goToSetup = useCallback(() => {
    setGameState((prev) => ({ ...prev, phase: 'setup' }));
  }, []);

  const finishBlitzGame = useCallback((
    player1Throws: Throw[],
    player2Throws: Throw[],
    player1Score: number,
    player2Score: number
  ) => {
    setBlitzResult({
      player1Throws,
      player2Throws,
      player1Score,
      player2Score,
    });

    // Determine winner
    let winnerId: string | null = null;
    const p1Busted = player1Score < 0;
    const p2Busted = player2Score < 0;

    if (p1Busted && p2Busted) {
      winnerId = player1Score > player2Score ? 'player-0' : 'player-1';
    } else if (p1Busted) {
      winnerId = 'player-1';
    } else if (p2Busted) {
      winnerId = 'player-0';
    } else {
      winnerId = player1Score < player2Score ? 'player-0' : 'player-1';
    }

    setGameState((prev) => {
      const winner = prev.players.find((p) => p.id === winnerId) || null;
      return {
        ...prev,
        isGameOver: true,
        winner,
        phase: 'result',
      };
    });
  }, []);

  return {
    gameState,
    isLoading,
    lastThrowResult,
    blitzResult,
    setMode,
    setStartingScore,
    setClub,
    startGame,
    makeThrow,
    endTurn,
    finishGame,
    finishBlitzGame,
    resetGame,
    goToSetup,
  };
};
