import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader2, Wifi } from 'lucide-react';

interface JoinGameModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onJoin: (code: string, playerName: string) => Promise<void>;
}

export const JoinGameModal = ({
  isOpen,
  isLoading,
  error,
  onClose,
  onJoin,
}: JoinGameModalProps) => {
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6 && playerName.trim()) {
      await onJoin(code.toUpperCase(), playerName.trim());
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
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-bold">Join Game</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Game Code
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter 6-character code"
              className="h-12 rounded-xl text-center text-2xl font-display tracking-[0.2em]"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={code.length !== 6 || !playerName.trim() || isLoading}
            className="w-full h-12 text-lg font-display font-bold bg-gradient-to-r from-primary to-primary/80 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Join Game'
            )}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
};
