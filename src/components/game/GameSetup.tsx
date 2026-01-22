import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Club, GameMode } from '@/types/game';
import { mockClubs, getRandomClub } from '@/data/mockData';
import { ClubBadge } from './ClubBadge';
import { Shuffle, ArrowRight, ArrowLeft, User } from 'lucide-react';
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
    mode === 'solo' ? ['Gracz'] : ['Gracz 1', 'Gracz 2']
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Back button */}
      <motion.div
        className="absolute top-6 left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button
          variant="ghost"
          onClick={step === 'club' ? onBack : () => setStep('club')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Wróć
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
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Wybierz Klub
            </h1>
            <p className="text-muted-foreground">
              Wybierz klub z listy lub wylosuj
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
              className="gap-2 px-6 py-3 border-primary text-primary hover:bg-primary/10"
            >
              <Shuffle className="w-5 h-5" />
              Losuj Klub
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
            <ScrollArea className="h-64 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                {mockClubs.map((club) => (
                  <motion.button
                    key={club.id}
                    onClick={() => onClubSelect(club)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all duration-200 text-center',
                      selectedClub?.id === club.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl mb-2 block">{club.logo}</span>
                    <span className="text-sm font-medium text-foreground block truncate">
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
                className="gap-2 px-8 py-3 bg-primary text-primary-foreground"
              >
                Dalej
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
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {mode === 'solo' ? 'Twoja Nazwa' : 'Nazwy Graczy'}
            </h1>
            <p className="text-muted-foreground">
              Podaj {mode === 'solo' ? 'swoją nazwę' : 'nazwy graczy'}
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
                  placeholder={`Gracz ${index + 1}`}
                  className="pl-12 h-14 text-lg bg-card border-2 border-border focus:border-primary"
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
              className="gap-2 px-12 py-6 text-xl font-display font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 glow-green disabled:opacity-50"
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
