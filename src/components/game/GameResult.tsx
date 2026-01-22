import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { ClubBadge } from './ClubBadge';
import { Trophy, RotateCcw, Share2 } from 'lucide-react';
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
    if (!winner) return 'Gra zakończona!';
    if (winner.score === 0) return 'PERFEKCYJNIE!';
    if (winner.score <= 10) return 'ŚWIETNY WYNIK!';
    if (winner.score <= 50) return 'DOBRY WYNIK!';
    return 'GRA ZAKOŃCZONA';
  };

  const getResultColor = () => {
    if (!winner) return 'text-foreground';
    if (winner.score === 0) return 'text-primary text-glow-gold';
    if (winner.score <= 20) return 'text-secondary text-glow-green';
    return 'text-foreground';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Trophy icon */}
      <motion.div
        className="mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
      >
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center glow-gold">
          <Trophy className="w-12 h-12 text-primary" />
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
            <p className="text-xl text-muted-foreground mb-2">
              Zwycięzca: <span className="text-foreground font-bold">{winner.name}</span>
            </p>
          )}
          <p className="text-muted-foreground">
            Wynik końcowy:
          </p>
          <p className="text-6xl font-display font-bold text-primary mt-2">
            {winner.score}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {winner.throws.length} rzutów
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
          className="w-full max-w-md mb-8 bg-card rounded-xl border border-border p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Wszystkie wyniki:
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
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl font-bold text-primary">
                      {player.score}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({player.throws.length} rzutów)
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
          className="w-full max-w-md mb-8 bg-card rounded-xl border border-border p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Twoje rzuty:
          </h3>
          <div className="flex flex-wrap gap-2">
            {winner.throws.map((t, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-muted rounded-full text-sm"
              >
                {t.playerName} ({t.appearances})
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
          className="gap-2 px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RotateCcw className="w-4 h-4" />
          Zagraj Ponownie
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-border"
          onClick={() => {
            // Share functionality placeholder
            if (navigator.share) {
              navigator.share({
                title: 'Piłkarski Dart',
                text: `Mój wynik: ${winner?.score}! Czy możesz mnie pokonać?`,
              });
            }
          }}
        >
          <Share2 className="w-4 h-4" />
          Udostępnij
        </Button>
      </motion.div>
    </div>
  );
};
