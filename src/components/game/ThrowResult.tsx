import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThrowResultProps {
  result: {
    type: 'success' | 'bust' | 'over' | 'invalid';
    message: string;
    value?: number;
  } | null;
}

export const ThrowResult = ({ result }: ThrowResultProps) => {
  if (!result) return null;

  const getIcon = () => {
    switch (result.type) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6" />;
      case 'bust':
        return <XCircle className="w-6 h-6" />;
      case 'over':
        return <AlertTriangle className="w-6 h-6" />;
      case 'invalid':
        return <HelpCircle className="w-6 h-6" />;
    }
  };

  const getStyles = () => {
    switch (result.type) {
      case 'success':
        return 'bg-secondary/20 border-secondary text-secondary';
      case 'bust':
        return 'bg-destructive/20 border-destructive text-destructive';
      case 'over':
        return 'bg-primary/20 border-primary text-primary';
      case 'invalid':
        return 'bg-muted border-muted-foreground text-muted-foreground';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.message}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={cn(
          'flex items-center gap-3 p-4 rounded-xl border-2 backdrop-blur-sm',
          getStyles(),
          result.type === 'success' && 'dart-throw',
          result.type === 'bust' && 'shake'
        )}
      >
        {getIcon()}
        <div className="flex-1">
          <p className="font-medium">{result.message}</p>
          {result.value && (
            <p className="text-sm opacity-80 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Value: <span className="font-bold">{result.value}</span> appearances
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
