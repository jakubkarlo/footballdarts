import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { ScoreDisplay } from './ScoreDisplay';
import { PlayerInput } from './PlayerInput';
import { ThrowResult } from './ThrowResult';
import { ThrowHistory } from './ThrowHistory';
import { ClubBadge } from './ClubBadge';
import { RotateCcw, Flag, ArrowRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const is1v1 = gameState.mode !== 'solo';

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          onClick={onReset}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4" />
          Nowa Gra
        </Button>

        {gameState.club && <ClubBadge club={gameState.club} size="sm" />}

        <Button
          variant="ghost"
          onClick={() => setShowInfo(!showInfo)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Info className="w-4 h-4" />
          Zasady
        </Button>
      </motion.div>

      {/* Rules info panel */}
      {showInfo && (
        <motion.div
          className="mb-6 p-4 bg-card border border-border rounded-lg"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3 className="font-display font-bold mb-2">Zasady gry:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Maksymalna wartość rzutu: 180 występów</li>
            <li>• Zejście poniżej zera = BUST (strata ruchu)</li>
            <li>• Przekroczenie 180 = utrata rzutu {gameState.mode === '1v1-one-shot' && '(dyskwalifikacja)'}</li>
            <li>• Ty decydujesz kiedy kończysz - im bliżej zera, tym lepiej!</li>
          </ul>
        </motion.div>
      )}

      {/* Mode indicator */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
          {gameState.mode === 'solo' && 'Tryb Solo'}
          {gameState.mode === '1v1-turns' && 'Tryb 1v1 - Tury'}
          {gameState.mode === '1v1-one-shot' && 'Tryb 1v1 - Na Strzała'}
        </span>
      </motion.div>

      {/* Score displays */}
      <div className={cn(
        'grid gap-4 mb-6',
        is1v1 ? 'grid-cols-2' : 'grid-cols-1 max-w-md mx-auto w-full'
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
      <div className="mb-6">
        <ThrowResult result={lastThrowResult} />
      </div>

      {/* Player input */}
      <div className="mb-6">
        <PlayerInput
          onSubmit={onThrow}
          isLoading={isLoading}
          disabled={currentPlayer.isBusted || currentPlayer.isFinished}
          placeholder={`Piłkarz ${gameState.club?.name || ''}...`}
        />
      </div>

      {/* Actions */}
      <motion.div
        className="flex justify-center gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {is1v1 && gameState.mode === '1v1-turns' && (
          <Button
            onClick={onEndTurn}
            variant="outline"
            className="gap-2 border-primary text-primary hover:bg-primary/10"
          >
            Zakończ Turę
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        <Button
          onClick={onFinish}
          disabled={currentPlayer.isBusted}
          className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          <Flag className="w-4 h-4" />
          Zakończ Grę
        </Button>
      </motion.div>

      {/* Throw history */}
      <motion.div
        className="max-w-md mx-auto w-full bg-card rounded-xl border border-border p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Historia rzutów - {currentPlayer.name}
        </h3>
        <ThrowHistory throws={currentPlayer.throws} />
      </motion.div>
    </div>
  );
};
