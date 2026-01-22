import { motion } from 'framer-motion';
import { Club } from '@/types/game';
import { cn } from '@/lib/utils';

interface ClubBadgeProps {
  club: Club;
  size?: 'sm' | 'md' | 'lg';
}

export const ClubBadge = ({ club, size = 'md' }: ClubBadgeProps) => {
  const sizeClasses = {
    sm: 'p-2 gap-2',
    md: 'p-4 gap-3',
    lg: 'p-6 gap-4',
  };

  const imgSizes = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <motion.div
      className={cn(
        'flex items-center rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg',
        sizeClasses[size]
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <img 
        src={club.logo} 
        alt={club.name}
        className={cn('object-contain', imgSizes[size])}
        onError={(e) => {
          e.currentTarget.src = '/placeholder.svg';
        }}
      />
      <div>
        <p className={cn('font-display font-bold text-foreground', textSizes[size])}>
          {club.name}
        </p>
        <p className="text-sm text-muted-foreground">{club.country}</p>
      </div>
    </motion.div>
  );
};
