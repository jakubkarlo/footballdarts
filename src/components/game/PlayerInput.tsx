import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Send, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerInputProps {
  onSubmit: (playerName: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const PlayerInput = ({ 
  onSubmit, 
  isLoading, 
  disabled,
  placeholder = "Wpisz nazwę piłkarza..." 
}: PlayerInputProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !disabled) {
      inputRef.current?.focus();
    }
  }, [isLoading, disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    
    await onSubmit(value.trim());
    setValue('');
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
            placeholder={placeholder}
            disabled={isLoading || disabled}
            className={cn(
              'pl-12 pr-10 h-14 text-lg bg-card border-2 border-border',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'placeholder:text-muted-foreground/50',
              'transition-all duration-200'
            )}
          />
          <AnimatePresence>
            {value && !isLoading && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        <Button
          type="submit"
          disabled={!value.trim() || isLoading || disabled}
          className={cn(
            'h-14 px-6 bg-primary text-primary-foreground',
            'hover:bg-primary/90 disabled:opacity-50',
            'transition-all duration-200'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </form>
  );
};
