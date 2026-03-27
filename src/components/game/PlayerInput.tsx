import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, X, Target, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const collator = new Intl.Collator(undefined, { sensitivity: 'base', usage: 'search' });

const diacriticIncludes = (haystack: string, needle: string): boolean => {
  if (!needle) return true;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (collator.compare(haystack.slice(i, i + needle.length), needle) === 0) return true;
  }
  return false;
};

interface SquadPlayer {
  id: number;
  playerId?: string;
  name: string;
  fullName?: string;
  photo: string;
  position: string;
}

interface PlayerInputProps {
  onSubmit: (playerName: string, playerId?: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: SquadPlayer[];
  isLoadingSuggestions?: boolean;
}

export const PlayerInput = ({ 
  onSubmit, 
  isLoading, 
  disabled,
  placeholder = "Enter player name...",
  suggestions = [],
  isLoadingSuggestions = false,
}: PlayerInputProps) => {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions — searches by display name, diacritic-insensitive
  const filteredSuggestions = value.trim().length >= 2
    ? suggestions.filter(player => diacriticIncludes(player.name, value.trim())).slice(0, 5)
    : [];

  useEffect(() => {
    if (!isLoading && !disabled) {
      inputRef.current?.focus();
    }
  }, [isLoading, disabled]);

  useEffect(() => {
    setShowSuggestions(filteredSuggestions.length > 0 && value.trim().length >= 2);
    setSelectedIndex(-1);
  }, [value, filteredSuggestions.length]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    
    setShowSuggestions(false);
    await onSubmit(value.trim());
    setValue('');
  };

  const handleSelectSuggestion = async (player: SquadPlayer) => {
    setValue(player.name);
    setShowSuggestions(false);
    await onSubmit(player.name, player.playerId);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(filteredSuggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (filteredSuggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            autoComplete="off"
            className={cn(
              'pl-12 pr-10 h-14 text-lg bg-card/90 backdrop-blur-sm border-2 border-border/50',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'placeholder:text-muted-foreground/50',
              'transition-all duration-200 rounded-xl'
            )}
          />
          <AnimatePresence>
            {value && !isLoading && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  setValue('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border-2 border-border/50 rounded-xl overflow-hidden shadow-xl z-50"
              >
                {isLoadingSuggestions ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : (
                  <ul className="py-1">
                    {filteredSuggestions.map((player, index) => (
                      <li key={player.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(player)}
                          className={cn(
                            'w-full px-4 py-3 flex items-center gap-3 transition-colors text-left',
                            'hover:bg-primary/10',
                            selectedIndex === index && 'bg-primary/20'
                          )}
                        >
                          {player.photo ? (
                            <img 
                              src={player.photo} 
                              alt={player.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-border/30"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{player.name}</p>
                            {player.fullName && player.fullName !== player.name && (
                              <p className="text-xs text-muted-foreground/70 truncate">{player.fullName}</p>
                            )}
                            <p className="text-sm text-muted-foreground">{player.position}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Button
          type="submit"
          disabled={!value.trim() || isLoading || disabled}
          className={cn(
            'h-14 px-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl',
            'hover:from-primary/90 hover:to-primary/70 disabled:opacity-50',
            'transition-all duration-200 shadow-lg shadow-primary/20'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Target className="w-5 h-5" />
          )}
        </Button>
      </div>
    </form>
  );
};
