import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameMode, StartingScore } from '@/types/game';
import { X, Loader2, Wifi, Users, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateGameModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  selectedMode: GameMode;
  onClose: () => void;
  onCreate: (
    startingScore: StartingScore,
    maxPlayers: number,
    playerName: string
  ) => Promise<void>;
}

const scores: StartingScore[] = [301, 501, 701];
const playerCounts = [2, 3, 4];

const MODE_LABELS: Record<string, string> = {
  'multiplayer-turns': 'Turns',
  'multiplayer-blitz': 'Blitz',
};

export const CreateGameModal = ({
  isOpen,
  isLoading,
  error,
  selectedMode,
  onClose,
  onCreate,
}: CreateGameModalProps) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedScore, setSelectedScore] = useState<StartingScore>(501);
  const [maxPlayers, setMaxPlayers] = useState(2);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      await onCreate(selectedScore, maxPlayers, playerName.trim());
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-bold">Create Online Game</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode badge */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            Mode: <span className="font-semibold text-foreground">{MODE_LABELS[selectedMode] ?? selectedMode}</span>
          </div>

          {/* Player Name */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Your Name
            </label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="h-12 rounded-xl"
              disabled={isLoading}
            />
          </div>

          {/* Starting Score */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Starting Points
            </label>
            <div className="grid grid-cols-3 gap-3">
              {scores.map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setSelectedScore(score)}
                  className={cn(
                    'p-3 rounded-xl border-2 font-display font-bold text-lg transition-all',
                    selectedScore === score
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 hover:border-primary/50'
                  )}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
              <Users className="w-4 h-4" />
              Max Players
            </label>
            <div className="grid grid-cols-3 gap-3">
              {playerCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMaxPlayers(count)}
                  className={cn(
                    'p-3 rounded-xl border-2 font-display font-bold text-lg transition-all',
                    maxPlayers === count
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 hover:border-primary/50'
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={!playerName.trim() || isLoading}
            className="w-full h-12 text-lg font-display font-bold bg-gradient-to-r from-secondary to-secondary/80 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Game'
            )}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
};
