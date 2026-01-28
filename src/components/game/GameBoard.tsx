import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { ScoreDisplay } from './ScoreDisplay';
import { PlayerInput } from './PlayerInput';
import { ThrowResult } from './ThrowResult';
import { ThrowHistory } from './ThrowHistory';
import { ClubBadge } from './ClubBadge';
import { RotateCcw, Flag, ArrowRight, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSquad } from '@/hooks/useSquad';

interface GameBoardProps {
  gameState: GameState;
  isLoading: boolean;
  lastThrowResult: {
    type: 'success' | 'bust' | 'over' | 'invalid';
    message: string;
    value?: number;
  } | null;
  onThrow: (playerName: string) => Promise<void>;
  onEndTurn: () => void;
  onFinish: () => void;
  onReset: () => void;
}

export const GameBoard = ({
  gameState,
  isLoading,
  lastThrowResult,
  onThrow,
  onEndTurn,
  onFinish,
  onReset,
}: GameBoardProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMultiplayer = gameState.mode !== 'solo';
  
  const { squad, isLoading: isLoadingSquad } = useSquad(gameState.club?.id || null);

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

        <Button
          variant="ghost"
          onClick={() => setShowInfo(!showInfo)}
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-card/50"
        >
          <Info className="w-4 h-4" />
          Rules
        </Button>
      </motion.div>

      {/* Rules info panel */}
      {showInfo && (
        <motion.div
          className="mb-6 p-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl relative"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfo(false)}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
          <h3 className="font-display font-bold mb-2 text-primary">Game Rules:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Max throw value: 180 appearances</li>
            <li>• Going below zero = BUST (lose turn)</li>
            <li>• Exceeding 180 = invalid throw {gameState.mode === 'multiplayer-blitz' && '(disqualified)'}</li>
            <li>• You decide when to finish - closer to zero wins!</li>
          </ul>
        </motion.div>
      )}

      {/* Mode indicator */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="px-4 py-1.5 bg-card/80 backdrop-blur-sm rounded-full text-sm text-muted-foreground border border-border/50">
          {gameState.mode === 'solo' && 'Solo Mode'}
          {gameState.mode === 'multiplayer-turns' && 'Multiplayer - Turns'}
          {gameState.mode === 'multiplayer-blitz' && 'Multiplayer - Blitz'}
        </span>
      </motion.div>

      {/* Score displays */}
      <div className={cn(
        'grid gap-4 mb-6',
        isMultiplayer ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 max-w-md mx-auto w-full'
      )}>
        {gameState.players.map((player, index) => (
          <ScoreDisplay
            key={player.id}
            player={player}
            isActive={index === gameState.currentPlayerIndex && !player.isBusted}
            showAnimation={
              index === gameState.currentPlayerIndex
                ? lastThrowResult?.type === 'success'
                  ? 'success'
                  : lastThrowResult?.type === 'bust'
                  ? 'bust'
                  : null
                : null
            }
          />
        ))}
      </div>

      {/* Throw result */}
      <div className="mb-6 max-w-md mx-auto w-full">
        <ThrowResult result={lastThrowResult} />
      </div>

      {/* Player input */}
      <div className="mb-6 max-w-md mx-auto w-full">
        <PlayerInput
          onSubmit={onThrow}
          isLoading={isLoading}
          disabled={currentPlayer.isBusted || currentPlayer.isFinished}
          placeholder={`Search player from ${gameState.club?.name || ''}...`}
          suggestions={squad}
          isLoadingSuggestions={isLoadingSquad}
        />
      </div>

      {/* Actions */}
      <motion.div
        className="flex justify-center gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isMultiplayer && gameState.mode === 'multiplayer-turns' && (
          <Button
            onClick={onEndTurn}
            variant="outline"
            className="gap-2 border-primary text-primary hover:bg-primary/10 rounded-xl"
          >
            End Turn
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        <Button
          onClick={onFinish}
          disabled={currentPlayer.isBusted}
          className="gap-2 bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 rounded-xl"
        >
          <Flag className="w-4 h-4" />
          Finish Game
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
          Throw History - {currentPlayer.name}
        </h3>
        <ThrowHistory throws={currentPlayer.throws} />
      </motion.div>
    </div>
  );
};
