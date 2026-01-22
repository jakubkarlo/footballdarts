import { motion } from 'framer-motion';
import { Club } from '@/types/game';

interface ClubBadgeProps {
  club: Club;
  size?: 'sm' | 'md' | 'lg';
}

export const ClubBadge = ({ club, size = 'md' }: ClubBadgeProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-20 h-20 text-3xl',
    lg: 'w-32 h-32 text-5xl',
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          bg-card border-2 border-border rounded-full
          shadow-lg
        `}
      >
        <span>{club.logo}</span>
      </div>
      <div className="text-center">
        <p className="font-display font-bold text-foreground">{club.name}</p>
        <p className="text-xs text-muted-foreground">{club.country}</p>
      </div>
    </motion.div>
  );
};
