import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Club, GameMode } from '@/types/game';
import { mockClubs, getRandomClub } from '@/data/mockData';
import { ClubBadge } from './ClubBadge';
import { Shuffle, ArrowRight, ArrowLeft, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GameSetupProps {
  mode: GameMode;
  selectedClub: Club | null;
  onClubSelect: (club: Club) => void;
  onStart: (playerNames: string[]) => void;
  onBack: () => void;
}

export const GameSetup = ({
  mode,
  selectedClub,
  onClubSelect,
  onStart,
  onBack,
}: GameSetupProps) => {
  const [playerNames, setPlayerNames] = useState<string[]>(
    mode === 'solo' ? ['Player'] : ['Player 1', 'Player 2']
  );
  const [step, setStep] = useState<'club' | 'players'>('club');

  const handleRandomClub = () => {
    onClubSelect(getRandomClub());
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const canProceed = selectedClub && playerNames.every((name) => name.trim());

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stadium-gradient">
      {/* Back button */}
      <motion.div
        className="absolute top-6 left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button
          variant="ghost"
          onClick={step === 'club' ? onBack : () => setStep('club')}
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-card/50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </motion.div>

      {step === 'club' ? (
        <>
          {/* Club Selection */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Choose Your Club
            </h1>
            <p className="text-muted-foreground">
              Select a club or randomize
            </p>
          </motion.div>

          {/* Random button */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={handleRandomClub}
              variant="outline"
              className="gap-2 px-6 py-3 border-primary text-primary hover:bg-primary/10 rounded-xl"
            >
              <Shuffle className="w-5 h-5" />
              Random Club
            </Button>
          </motion.div>

          {/* Selected club display */}
          {selectedClub && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <ClubBadge club={selectedClub} size="lg" />
            </motion.div>
          )}

          {/* Club grid */}
          <motion.div
            className="w-full max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ScrollArea className="h-72 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-1">
                {mockClubs.map((club) => (
                  <motion.button
                    key={club.id}
                    onClick={() => onClubSelect(club)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all duration-200 text-center bg-card/80 backdrop-blur-sm',
                      selectedClub?.id === club.id
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'border-border/50 hover:border-primary/50'
                    )}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img 
                      src={club.logo} 
                      alt={club.name}
                      className="w-12 h-12 mx-auto mb-2 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <span className="text-xs font-medium text-foreground block truncate">
                      {club.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {club.country}
                    </span>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>

          {/* Next button */}
          {selectedClub && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={() => setStep('players')}
                className="gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </>
      ) : (
        <>
          {/* Player Names */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/20 mb-4">
              <User className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {mode === 'solo' ? 'Your Name' : 'Player Names'}
            </h1>
            <p className="text-muted-foreground">
              Enter {mode === 'solo' ? 'your name' : 'player names'}
            </p>
          </motion.div>

          {/* Selected club reminder */}
          {selectedClub && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ClubBadge club={selectedClub} size="md" />
            </motion.div>
          )}

          {/* Player name inputs */}
          <motion.div
            className="w-full max-w-md space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {playerNames.map((name, index) => (
              <div key={index} className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                  className="pl-12 h-14 text-lg bg-card/80 backdrop-blur-sm border-2 border-border/50 focus:border-primary rounded-xl"
                />
              </div>
            ))}
          </motion.div>

          {/* Start button */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => onStart(playerNames)}
              disabled={!canProceed}
              className="gap-2 px-12 py-6 text-xl font-display font-bold bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 disabled:opacity-50 rounded-2xl shadow-xl shadow-secondary/30"
            >
              START
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </>
      )}
    </div>
  );
};
