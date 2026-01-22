import { motion, AnimatePresence } from 'framer-motion';
import { GamePlayer } from '@/types/game';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  player: GamePlayer;
  isActive: boolean;
  showAnimation?: 'success' | 'bust' | null;
}

export const ScoreDisplay = ({ player, isActive, showAnimation }: ScoreDisplayProps) => {
  const getScoreColor = () => {
    if (player.isBusted) return 'text-destructive';
    if (player.score <= 50) return 'text-score-positive text-glow-green';
    if (player.score <= 100) return 'text-primary text-glow-gold';
    return 'text-foreground';
  };

  return (
    <motion.div
      className={cn(
        'relative p-6 rounded-xl border-2 transition-all duration-300',
        isActive 
          ? 'border-primary bg-card glow-gold' 
          : 'border-border bg-card/50',
        player.isBusted && 'border-destructive glow-red opacity-60'
      )}
      layout
    >
      {/* Active indicator */}
      {isActive && !player.isBusted && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Player name */}
      <div className="text-sm text-muted-foreground font-medium mb-2">
        {player.name}
      </div>

      {/* Score */}
      <AnimatePresence mode="wait">
        <motion.div
          key={player.score}
          className={cn(
            'text-6xl font-display font-bold',
            getScoreColor(),
            showAnimation === 'success' && 'score-flash-green',
            showAnimation === 'bust' && 'score-flash-red shake'
          )}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {player.score}
        </motion.div>
      </AnimatePresence>

      {/* Throws count */}
      <div className="mt-2 text-sm text-muted-foreground">
        Rzuty: {player.throws.length}
      </div>

      {/* Last throw */}
      {player.throws.length > 0 && (
        <motion.div
          className="mt-2 text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Ostatni: {player.throws[player.throws.length - 1].playerName} (
          {player.throws[player.throws.length - 1].appearances})
        </motion.div>
      )}

      {/* Status badges */}
      {player.isBusted && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          ZDYSKWALIFIKOWANY
        </motion.div>
      )}

      {player.isFinished && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          ZAKOŃCZYŁ
        </motion.div>
      )}
    </motion.div>
  );
};
