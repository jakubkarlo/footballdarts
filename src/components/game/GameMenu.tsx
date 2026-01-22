import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameMode, StartingScore } from '@/types/game';
import { User, Users, Zap, Target, Trophy, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameMenuProps {
  selectedMode: GameMode;
  selectedScore: StartingScore;
  onModeSelect: (mode: GameMode) => void;
  onScoreSelect: (score: StartingScore) => void;
  onStart: () => void;
}

const gameModes: { mode: GameMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    mode: 'solo',
    label: 'Solo',
    description: 'Play alone and beat your best',
    icon: <User className="w-6 h-6" />,
  },
  {
    mode: '1v1-turns',
    label: '1v1 Turns',
    description: 'Take turns with your opponent',
    icon: <Users className="w-6 h-6" />,
  },
  {
    mode: '1v1-one-shot',
    label: '1v1 Blitz',
    description: 'All players at once - sudden death!',
    icon: <Zap className="w-6 h-6" />,
  },
];

const startingScores: StartingScore[] = [301, 501, 701];

export const GameMenu = ({
  selectedMode,
  selectedScore,
  onModeSelect,
  onScoreSelect,
  onStart,
}: GameMenuProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stadium-gradient">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-secondary/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* Logo / Title */}
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-4 border-primary/50 mb-6 shadow-2xl"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Target className="w-14 h-14 text-primary drop-shadow-lg" />
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground tracking-tight">
          <span className="text-primary">FOOTBALL</span> DARTS
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
          Name players and subtract their appearances to hit zero
        </p>
      </motion.div>

      {/* Game Mode Selection */}
      <motion.div
        className="w-full max-w-3xl mb-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold text-primary mb-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4" />
          Select Game Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gameModes.map(({ mode, label, description, icon }) => (
            <motion.button
              key={mode}
              onClick={() => onModeSelect(mode)}
              className={cn(
                'relative p-6 rounded-2xl border-2 transition-all duration-300 text-left backdrop-blur-sm',
                selectedMode === mode
                  ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20'
                  : 'border-border/50 bg-card/80 hover:border-primary/50 hover:bg-card'
              )}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn(
                'mb-3 p-2 rounded-xl w-fit',
                selectedMode === mode ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {icon}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                {label}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
              {selectedMode === mode && (
                <motion.div
                  className="absolute top-4 right-4 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50"
                  layoutId="mode-indicator"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Starting Score Selection */}
      <motion.div
        className="w-full max-w-lg mb-12 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-sm font-semibold text-primary mb-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
          <Timer className="w-4 h-4" />
          Starting Points
        </h2>
        <div className="flex justify-center gap-4">
          {startingScores.map((score) => (
            <motion.button
              key={score}
              onClick={() => onScoreSelect(score)}
              className={cn(
                'px-8 py-4 rounded-xl border-2 font-display text-2xl font-bold transition-all duration-300',
                selectedScore === score
                  ? 'border-primary bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30'
                  : 'border-border/50 bg-card/80 text-foreground hover:border-primary/50'
              )}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {score}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="px-14 py-7 text-xl font-display font-bold bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 shadow-xl shadow-secondary/30 rounded-2xl"
        >
          START GAME
        </Button>
      </motion.div>

      {/* Rules hint */}
      <motion.p
        className="mt-8 text-sm text-muted-foreground text-center max-w-lg relative z-10 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-border/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        🎯 Max throw value: 180 appearances. Going below zero = BUST!
      </motion.p>
    </div>
  );
};
