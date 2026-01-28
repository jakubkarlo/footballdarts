import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameState, Throw } from '@/types/game';
import { Trophy, Medal, RotateCcw, Zap, Target, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface BlitzResultProps {
  gameState: GameState;
  player1Score: number;
  player2Score: number;
  player1Throws: Throw[];
  player2Throws: Throw[];
  onPlayAgain: () => void;
}

export const BlitzResult = ({
  gameState,
  player1Score,
  player2Score,
  player1Throws,
  player2Throws,
  onPlayAgain,
}: BlitzResultProps) => {
  const player1 = gameState.players[0];
  const player2 = gameState.players[1];

  const player1Busted = player1Score < 0;
  const player2Busted = player2Score < 0;

  // Determine winner
  let winnerId: string | null = null;
  let winnerName = '';
  let isDraw = false;

  if (player1Busted && player2Busted) {
    // Both busted - higher (less negative) score wins
    if (player1Score > player2Score) {
      winnerId = player1.id;
      winnerName = player1.name;
    } else if (player2Score > player1Score) {
      winnerId = player2.id;
      winnerName = player2.name;
    } else {
      isDraw = true;
    }
  } else if (player1Busted) {
    winnerId = player2.id;
    winnerName = player2.name;
  } else if (player2Busted) {
    winnerId = player1.id;
    winnerName = player1.name;
  } else {
    // Neither busted - closer to zero wins
    if (player1Score < player2Score) {
      winnerId = player1.id;
      winnerName = player1.name;
    } else if (player2Score < player1Score) {
      winnerId = player2.id;
      winnerName = player2.name;
    } else {
      isDraw = true;
    }
  }

  useEffect(() => {
    if (!isDraw) {
      // Celebration confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#10B981', '#F59E0B', '#3B82F6'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#10B981', '#F59E0B', '#3B82F6'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isDraw]);

  const renderPlayerResult = (
    player: typeof player1,
    score: number,
    throws: Throw[],
    isWinner: boolean,
    busted: boolean
  ) => (
    <motion.div
      className={cn(
        'p-6 rounded-2xl border-2 bg-card/90 backdrop-blur-sm',
        isWinner && !isDraw
          ? 'border-secondary shadow-lg shadow-secondary/30'
          : busted
          ? 'border-destructive/50'
          : 'border-border/50'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {isWinner && !isDraw && (
        <div className="flex justify-center mb-4">
          <Trophy className="w-12 h-12 text-secondary" />
        </div>
      )}
      {busted && (
        <div className="flex justify-center mb-4">
          <Skull className="w-10 h-10 text-destructive" />
        </div>
      )}
      <div className="text-center">
        <h3 className="text-xl font-display font-bold text-foreground mb-2">
          {player.name}
        </h3>
        <div className={cn(
          'text-5xl font-display font-bold tabular-nums mb-2',
          busted ? 'text-destructive' : score <= 50 ? 'text-secondary' : 'text-foreground'
        )}>
          {score}
        </div>
        {busted && (
          <span className="text-sm text-destructive font-medium">BUSTED</span>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          {throws.length} valid throws
        </div>
      </div>

      {/* Throws list */}
      <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
        {throws.map((t, index) => (
          <div key={index} className="flex items-center gap-2 text-sm p-1.5 bg-muted/30 rounded">
            {t.photo && (
              <img src={t.photo} alt={t.playerName} className="w-6 h-6 rounded-full object-cover" />
            )}
            <span className="flex-1 truncate">{t.playerName}</span>
            <span className="font-bold text-primary">{t.appearances}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stadium-gradient">
      {/* Blitz badge */}
      <motion.div
        className="flex items-center gap-2 text-primary mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Zap className="w-5 h-5" />
        <span className="text-sm font-bold uppercase tracking-wider">Blitz Mode Results</span>
      </motion.div>

      {/* Winner announcement */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isDraw ? (
          <>
            <Medal className="w-20 h-20 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
              IT'S A DRAW!
            </h1>
            <p className="text-lg text-muted-foreground">
              Both players finished with the same score
            </p>
          </>
        ) : (
          <>
            <Trophy className="w-20 h-20 text-secondary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
              {winnerName} WINS!
            </h1>
            <p className="text-lg text-muted-foreground">
              Closest to zero takes the victory
            </p>
          </>
        )}
      </motion.div>

      {/* Player results */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {renderPlayerResult(
          player1,
          player1Score,
          player1Throws,
          winnerId === player1.id,
          player1Busted
        )}
        {renderPlayerResult(
          player2,
          player2Score,
          player2Throws,
          winnerId === player2.id,
          player2Busted
        )}
      </div>

      {/* Play again */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={onPlayAgain}
          size="lg"
          className="gap-2 px-12 py-6 text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-xl"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </Button>
      </motion.div>
    </div>
  );
};
