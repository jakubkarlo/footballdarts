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
});

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    mode: 'solo',
    startingScore: 501,
    club: null,
    players: [],
    currentPlayerIndex: 0,
    isGameOver: false,
    winner: null,
    phase: 'menu',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastThrowResult, setLastThrowResult] = useState<{
    type: 'success' | 'bust' | 'over' | 'invalid';
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

  const startGame = useCallback((playerNames: string[]) => {
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
    }));
    setLastThrowResult(null);
  }, [gameState.startingScore]);

  const makeThrow = useCallback(async (playerName: string): Promise<{
    success: boolean;
    appearances?: number;
    message: string;
  }> => {
    if (!gameState.club) {
      return { success: false, message: 'Nie wybrano klubu!' };
    }

    setIsLoading(true);
    
    try {
      const footballPlayer = await searchPlayer(gameState.club.id, playerName);
      
      if (!footballPlayer) {
        setLastThrowResult({
          type: 'invalid',
          message: `Nie znaleziono piłkarza: ${playerName}`,
        });
        setIsLoading(false);
        return { success: false, message: `Nie znaleziono piłkarza: ${playerName}` };
      }

      const appearances = footballPlayer.appearances;
      
      // Check if throw exceeds 180
      if (appearances > MAX_THROW) {
        setLastThrowResult({
          type: 'over',
          message: `${footballPlayer.name} ma ${appearances} występów - przekracza limit 180!`,
          value: appearances,
        });
        
        // In one-shot mode, disqualify
        if (gameState.mode === '1v1-one-shot') {
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
          message: `Przekroczono limit 180! (${appearances} występów)` 
        };
      }

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const newScore = currentPlayer.score - appearances;

      // Check if bust (below zero)
      if (newScore < 0) {
        setLastThrowResult({
          type: 'bust',
          message: `BUST! Wynik ${newScore} - strata ruchu!`,
          value: appearances,
        });
        
        if (gameState.mode === '1v1-one-shot') {
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
          message: `BUST! Zejście poniżej zera (${newScore})` 
        };
      }

      // Successful throw
      const newThrow: Throw = {
        playerId: footballPlayer.id,
        playerName: footballPlayer.name,
        appearances,
        timestamp: Date.now(),
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
        message: `${footballPlayer.name}: ${appearances} występów!`,
        value: appearances,
      });

      setIsLoading(false);
      return { 
        success: true, 
        appearances,
        message: `${footballPlayer.name} - ${appearances} występów` 
      };
    } catch (error) {
      setIsLoading(false);
      return { success: false, message: 'Błąd podczas wyszukiwania piłkarza' };
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
    });
    setLastThrowResult(null);
  }, []);

  const goToSetup = useCallback(() => {
    setGameState((prev) => ({ ...prev, phase: 'setup' }));
  }, []);

  return {
    gameState,
    isLoading,
    lastThrowResult,
    setMode,
    setStartingScore,
    setClub,
    startGame,
    makeThrow,
    endTurn,
    finishGame,
    resetGame,
    goToSetup,
  };
};
