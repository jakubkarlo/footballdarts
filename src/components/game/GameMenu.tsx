import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameMode, StartingScore } from '@/types/game';
import { User, Users, Zap, Target } from 'lucide-react';
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
    description: 'Graj sam i pobij swój rekord',
    icon: <User className="w-6 h-6" />,
  },
  {
    mode: '1v1-turns',
    label: '1v1 Tury',
    description: 'Graj na przemian z przeciwnikiem',
    icon: <Users className="w-6 h-6" />,
  },
  {
    mode: '1v1-one-shot',
    label: '1v1 Na Strzała',
    description: 'Podaj wszystkich piłkarzy naraz',
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Logo / Title */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 border-2 border-primary mb-6"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Target className="w-12 h-12 text-primary" />
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground text-glow-gold">
          PIŁKARSKI DART
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
          Odgadnij piłkarzy i zejdź do zera używając ich liczby występów
        </p>
      </motion.div>

      {/* Game Mode Selection */}
      <motion.div
        className="w-full max-w-2xl mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center uppercase tracking-wider">
          Wybierz tryb gry
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gameModes.map(({ mode, label, description, icon }) => (
            <motion.button
              key={mode}
              onClick={() => onModeSelect(mode)}
              className={cn(
                'relative p-6 rounded-xl border-2 transition-all duration-300 text-left',
                selectedMode === mode
                  ? 'border-primary bg-primary/10 glow-gold'
                  : 'border-border bg-card hover:border-primary/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn(
                'mb-3',
                selectedMode === mode ? 'text-primary' : 'text-muted-foreground'
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
                  className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary"
                  layoutId="mode-indicator"
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Starting Score Selection */}
      <motion.div
        className="w-full max-w-md mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center uppercase tracking-wider">
          Punkty startowe
        </h2>
        <div className="flex justify-center gap-4">
          {startingScores.map((score) => (
            <motion.button
              key={score}
              onClick={() => onScoreSelect(score)}
              className={cn(
                'px-8 py-4 rounded-lg border-2 font-display text-2xl font-bold transition-all duration-300',
                selectedScore === score
                  ? 'border-primary bg-primary text-primary-foreground glow-gold'
                  : 'border-border bg-card text-foreground hover:border-primary/50'
              )}
              whileHover={{ scale: 1.05 }}
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
      >
        <Button
          onClick={onStart}
          size="lg"
          className="px-12 py-6 text-xl font-display font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 glow-green"
        >
          ROZPOCZNIJ GRĘ
        </Button>
      </motion.div>

      {/* Rules hint */}
      <motion.p
        className="mt-8 text-sm text-muted-foreground text-center max-w-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        💡 Maksymalna wartość rzutu: 180 występów. Zejście poniżej zera = BUST!
      </motion.p>
    </div>
  );
};
