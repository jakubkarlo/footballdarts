import { motion } from 'framer-motion';
import { Throw } from '@/types/game';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThrowHistoryProps {
  throws: Throw[];
}

export const ThrowHistory = ({ throws }: ThrowHistoryProps) => {
  if (throws.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-sm">Brak rzutów</p>
        <p className="text-xs mt-1">Wpisz nazwę piłkarza aby zacząć</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-48">
      <div className="space-y-2 pr-4">
        {throws.slice().reverse().map((throwItem, index) => (
          <motion.div
            key={throwItem.timestamp}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div>
              <p className="font-medium text-sm">{throwItem.playerName}</p>
              <p className="text-xs text-muted-foreground">
                #{throws.length - index}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-primary">
                -{throwItem.appearances}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
};
