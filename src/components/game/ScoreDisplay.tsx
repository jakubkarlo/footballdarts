import { motion, AnimatePresence } from 'framer-motion';
import { GamePlayer } from '@/types/game';
import { cn } from '@/lib/utils';
import { Flame, Target } from 'lucide-react';

interface ScoreDisplayProps {
  player: GamePlayer;
  isActive: boolean;
  showAnimation?: 'success' | 'bust' | null;
}

export const ScoreDisplay = ({ player, isActive, showAnimation }: ScoreDisplayProps) => {
  const getScoreColor = () => {
    if (player.isBusted) return 'text-destructive';
    if (player.score <= 50) return 'text-secondary';
    if (player.score <= 100) return 'text-primary';
    return 'text-foreground';
  };

  return (
    <motion.div
      className={cn(
        'relative p-6 rounded-2xl border-2 transition-all duration-300 bg-card/90 backdrop-blur-sm',
        isActive 
          ? 'border-primary shadow-lg shadow-primary/20' 
          : 'border-border/50',
        player.isBusted && 'border-destructive shadow-lg shadow-destructive/20 opacity-70'
      )}
      layout
    >
      {/* Active indicator */}
      {isActive && !player.isBusted && (
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Target className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}

      {/* Hot streak indicator */}
      {player.throws.length >= 3 && !player.isBusted && (
        <motion.div
          className="absolute top-2 left-2"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Flame className="w-5 h-5 text-orange-500" />
        </motion.div>
      )}

      {/* Player name */}
      <div className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wider">
        {player.name}
      </div>

      {/* Score */}
      <AnimatePresence mode="wait">
        <motion.div
          key={player.score}
          className={cn(
            'text-6xl font-display font-bold tabular-nums',
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
        Throws: {player.throws.length}
      </div>

      {/* Last throw */}
      {player.throws.length > 0 && (
        <motion.div
          className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1 inline-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Last: {player.throws[player.throws.length - 1].playerName} (
          <span className="text-primary font-bold">{player.throws[player.throws.length - 1].appearances}</span>)
        </motion.div>
      )}

      {/* Status badges */}
      {player.isBusted && (
        <motion.div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          DISQUALIFIED
        </motion.div>
      )}

      {player.isFinished && (
        <motion.div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          FINISHED
        </motion.div>
      )}
    </motion.div>
  );
};
