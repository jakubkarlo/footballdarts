import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameState, Throw, FootballPlayer } from '@/types/game';
import { PlayerInput } from './PlayerInput';
import { ThrowHistory } from './ThrowHistory';
import { ClubBadge } from './ClubBadge';
import { RotateCcw, Flag, User, Eye, EyeOff, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSquad } from '@/hooks/useSquad';
import { searchPlayer } from '@/data/mockData';

interface BlitzThrow {
  playerName: string;
  appearances: number;
  photo?: string;
  isValid: boolean;
  errorMessage?: string;
}

interface BlitzGameBoardProps {
  gameState: GameState;
  onFinishBlitz: (player1Throws: Throw[], player2Throws: Throw[], player1Score: number, player2Score: number) => void;
  onReset: () => void;
}

export const BlitzGameBoard = ({
  gameState,
  onFinishBlitz,
  onReset,
}: BlitzGameBoardProps) => {
  const [currentBlitzPlayer, setCurrentBlitzPlayer] = useState(0);
  const [player1Throws, setPlayer1Throws] = useState<BlitzThrow[]>([]);
  const [player2Throws, setPlayer2Throws] = useState<BlitzThrow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [lastThrowResult, setLastThrowResult] = useState<{
    type: 'success' | 'bust' | 'over' | 'invalid';
    message: string;
    value?: number;
  } | null>(null);

  const { squad, isLoading: isLoadingSquad } = useSquad(gameState.club?.id || null);

  const currentPlayerName = gameState.players[currentBlitzPlayer]?.name || 'Player';
  const currentThrows = currentBlitzPlayer === 0 ? player1Throws : player2Throws;
  const setCurrentThrows = currentBlitzPlayer === 0 ? setPlayer1Throws : setPlayer2Throws;

  const calculateScore = (throws: BlitzThrow[]): number => {
    const validThrows = throws.filter(t => t.isValid);
    const totalDeducted = validThrows.reduce((sum, t) => sum + t.appearances, 0);
    return gameState.startingScore - totalDeducted;
  };

  const currentScore = calculateScore(currentThrows);
  const isBusted = currentScore < 0;

  const handleThrow = async (playerName: string) => {
    if (!gameState.club) return;

    setIsLoading(true);
    setLastThrowResult(null);

    try {
      const footballPlayer = await searchPlayer(gameState.club.id, playerName);

      if (!footballPlayer) {
        setLastThrowResult({
          type: 'invalid',
          message: `Player not found: ${playerName}`,
        });
        setIsLoading(false);
        return;
      }

      const appearances = footballPlayer.appearances;

      // Check if exceeds 180
      if (appearances > 180) {
        const newThrow: BlitzThrow = {
          playerName: footballPlayer.name,
          appearances,
          photo: footballPlayer.photo,
          isValid: false,
          errorMessage: 'Exceeds 180 limit!',
        };
        setCurrentThrows([...currentThrows, newThrow]);
        setLastThrowResult({
          type: 'over',
          message: `${footballPlayer.name} has ${appearances} appearances - exceeds 180!`,
          value: appearances,
        });
        setIsLoading(false);
        return;
      }

      // Check if would bust
      const newScore = currentScore - appearances;
      if (newScore < 0) {
        const newThrow: BlitzThrow = {
          playerName: footballPlayer.name,
          appearances,
          photo: footballPlayer.photo,
          isValid: false,
          errorMessage: 'Would cause bust!',
        };
        setCurrentThrows([...currentThrows, newThrow]);
        setLastThrowResult({
          type: 'bust',
          message: `BUST! Score would be ${newScore}`,
          value: appearances,
        });
        setIsLoading(false);
        return;
      }

      // Valid throw
      const newThrow: BlitzThrow = {
        playerName: footballPlayer.name,
        appearances,
        photo: footballPlayer.photo,
        isValid: true,
      };
      setCurrentThrows([...currentThrows, newThrow]);
      setLastThrowResult({
        type: 'success',
        message: `${footballPlayer.name}: ${appearances} appearances!`,
        value: appearances,
      });
    } catch (error) {
      setLastThrowResult({
        type: 'invalid',
        message: 'Error searching for player',
      });
    }

    setIsLoading(false);
  };

  const handleFinishTurn = () => {
    if (currentBlitzPlayer === 0) {
      // Player 1 finished, switch to player 2
      setShowHandover(true);
    } else {
      // Both players finished, calculate final results
      const p1Score = calculateScore(player1Throws);
      const p2Score = calculateScore(player2Throws);

      const convertToThrows = (blitzThrows: BlitzThrow[]): Throw[] => {
        return blitzThrows
          .filter(t => t.isValid)
          .map((t, index) => ({
            playerId: `throw-${index}`,
            playerName: t.playerName,
            appearances: t.appearances,
            timestamp: Date.now(),
            photo: t.photo,
          }));
      };

      onFinishBlitz(
        convertToThrows(player1Throws),
        convertToThrows(player2Throws),
        p1Score,
        p2Score
      );
    }
  };

  const handleStartPlayer2Turn = () => {
    setShowHandover(false);
    setCurrentBlitzPlayer(1);
    setLastThrowResult(null);
  };

  // Handover screen between players
  if (showHandover) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stadium-gradient">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-6">
            <EyeOff className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Pass the Device!
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            {gameState.players[0].name} has finished their turn
          </p>
          <p className="text-lg text-primary mb-8">
            Hand the device to {gameState.players[1].name}
          </p>
          <p className="text-sm text-muted-foreground mb-8 bg-card/50 rounded-xl px-4 py-2 inline-block">
            <EyeOff className="w-4 h-4 inline mr-2" />
            Don't peek! {gameState.players[0].name}'s choices are hidden
          </p>
          <Button
            onClick={handleStartPlayer2Turn}
            size="lg"
            className="px-12 py-6 text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl"
          >
            <Eye className="w-5 h-5 mr-2" />
            I'm {gameState.players[1].name} - Start!
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 bg-stadium-gradient relative">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          onClick={onReset}
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-card/50"
        >
          <RotateCcw className="w-4 h-4" />
          New Game
        </Button>

        {gameState.club && <ClubBadge club={gameState.club} size="sm" />}

        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-bold">BLITZ</span>
        </div>
      </motion.div>

      {/* Mode indicator */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="px-4 py-1.5 bg-primary/20 backdrop-blur-sm rounded-full text-sm text-primary border border-primary/30 font-medium">
          <User className="w-3 h-3 inline mr-1" />
          {currentPlayerName}'s Turn
        </span>
      </motion.div>

      {/* Score display */}
      <motion.div
        className={cn(
          'max-w-md mx-auto w-full mb-6 p-6 rounded-2xl border-2 bg-card/90 backdrop-blur-sm',
          isBusted ? 'border-destructive shadow-lg shadow-destructive/20' : 'border-primary shadow-lg shadow-primary/20'
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wider">
          {currentPlayerName}
        </div>
        <div className={cn(
          'text-6xl font-display font-bold tabular-nums',
          isBusted ? 'text-destructive' : currentScore <= 50 ? 'text-secondary' : 'text-foreground'
        )}>
          {currentScore}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Throws: {currentThrows.filter(t => t.isValid).length}
        </div>
      </motion.div>

      {/* Throw result */}
      <AnimatePresence mode="wait">
        {lastThrowResult && (
          <motion.div
            key={lastThrowResult.message}
            className={cn(
              'max-w-md mx-auto w-full mb-6 flex items-center gap-3 p-4 rounded-xl border-2 backdrop-blur-sm',
              lastThrowResult.type === 'success' && 'bg-secondary/20 border-secondary text-secondary',
              lastThrowResult.type === 'bust' && 'bg-destructive/20 border-destructive text-destructive',
              lastThrowResult.type === 'over' && 'bg-primary/20 border-primary text-primary',
              lastThrowResult.type === 'invalid' && 'bg-muted border-muted-foreground text-muted-foreground'
            )}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {lastThrowResult.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
            {lastThrowResult.type === 'bust' && <AlertTriangle className="w-6 h-6" />}
            {lastThrowResult.type === 'over' && <AlertTriangle className="w-6 h-6" />}
            <div className="flex-1">
              <p className="font-medium">{lastThrowResult.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player input */}
      <div className="mb-6 max-w-md mx-auto w-full">
        <PlayerInput
          onSubmit={handleThrow}
          isLoading={isLoading}
          disabled={isBusted}
          placeholder={`Search player from ${gameState.club?.name || ''}...`}
          suggestions={squad}
          isLoadingSuggestions={isLoadingSquad}
        />
      </div>

      {/* Finish turn button */}
      <motion.div
        className="flex justify-center gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleFinishTurn}
          className="gap-2 bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 rounded-xl px-8"
        >
          <Flag className="w-4 h-4" />
          {currentBlitzPlayer === 0 ? 'Finish & Pass Device' : 'Finish Game'}
        </Button>
      </motion.div>

      {/* Throw history */}
      <motion.div
        className="max-w-md mx-auto w-full bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Your Throws (hidden from opponent)
        </h3>
        <div className="space-y-2">
          {currentThrows.map((t, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                t.isValid ? 'bg-secondary/10' : 'bg-destructive/10'
              )}
            >
              {t.photo && (
                <img src={t.photo} alt={t.playerName} className="w-8 h-8 rounded-full object-cover" />
              )}
              <div className="flex-1">
                <span className="font-medium text-sm">{t.playerName}</span>
                {!t.isValid && (
                  <span className="text-xs text-destructive ml-2">({t.errorMessage})</span>
                )}
              </div>
              <span className={cn(
                'font-bold',
                t.isValid ? 'text-secondary' : 'text-destructive line-through'
              )}>
                {t.appearances}
              </span>
            </div>
          ))}
          {currentThrows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No throws yet. Search for players above!
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
