import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { ClubBadge } from './ClubBadge';
import { Trophy, RotateCcw, Share2, Medal, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface GameResultProps {
  gameState: GameState;
  onPlayAgain: () => void;
}

export const GameResult = ({ gameState, onPlayAgain }: GameResultProps) => {
  const winner = gameState.winner;
  const is1v1 = gameState.mode !== 'solo';

  // Trigger confetti on mount
  useEffect(() => {
    if (winner && winner.score <= 20) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#22c55e', '#ef4444'],
      });
    }
  }, [winner]);

  const getResultMessage = () => {
    if (!winner) return 'Game Over!';
    if (winner.score === 0) return 'PERFECT FINISH!';
    if (winner.score <= 10) return 'EXCELLENT!';
    if (winner.score <= 50) return 'GREAT GAME!';
    return 'GAME OVER';
  };

  const getResultColor = () => {
    if (!winner) return 'text-foreground';
    if (winner.score === 0) return 'text-primary';
    if (winner.score <= 20) return 'text-secondary';
    return 'text-foreground';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stadium-gradient">
      {/* Trophy icon */}
      <motion.div
        className="mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-4 border-primary/50 shadow-2xl">
          <Trophy className="w-14 h-14 text-primary drop-shadow-lg" />
        </div>
      </motion.div>

      {/* Result message */}
      <motion.h1
        className={`text-4xl md:text-6xl font-display font-bold mb-4 text-center ${getResultColor()}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {getResultMessage()}
      </motion.h1>

      {/* Winner info */}
      {winner && (
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {is1v1 && (
            <p className="text-xl text-muted-foreground mb-2 flex items-center justify-center gap-2">
              <Medal className="w-5 h-5 text-primary" />
              Winner: <span className="text-foreground font-bold">{winner.name}</span>
            </p>
          )}
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Target className="w-4 h-4" />
            Final Score:
          </p>
          <p className="text-7xl font-display font-bold text-primary mt-2">
            {winner.score}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {winner.throws.length} throws
          </p>
        </motion.div>
      )}

      {/* Club badge */}
      {gameState.club && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ClubBadge club={gameState.club} size="md" />
        </motion.div>
      )}

      {/* All players scores (for 1v1) */}
      {is1v1 && (
        <motion.div
          className="w-full max-w-md mb-8 bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Final Standings:
          </h3>
          <div className="space-y-3">
            {gameState.players
              .sort((a, b) => a.score - b.score)
              .map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl font-bold text-primary">
                      {player.score}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({player.throws.length} throws)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Throw history */}
      {winner && winner.throws.length > 0 && (
        <motion.div
          className="w-full max-w-md mb-8 bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Your Throws:
          </h3>
          <div className="flex flex-wrap gap-2">
            {winner.throws.map((t, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-muted/80 rounded-full text-sm border border-border/50"
              >
                {t.playerName} <span className="text-primary font-bold">({t.appearances})</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        className="flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onPlayAgain}
          className="gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 rounded-xl shadow-lg"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-border/50 rounded-xl"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Football Darts',
                text: `My score: ${winner?.score}! Can you beat me?`,
              });
            }
          }}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </motion.div>
    </div>
  );
};
