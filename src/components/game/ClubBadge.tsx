import { motion } from 'framer-motion';
import { Club } from '@/types/game';
import { cn } from '@/lib/utils';

interface ClubBadgeProps {
  club: Club;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { padding: '6px 12px', imgSize: 26, nameSize: '0.85rem', countrySize: '0.62rem', gap: 8 },
  md: { padding: '10px 16px', imgSize: 38, nameSize: '1.1rem', countrySize: '0.68rem', gap: 10 },
  lg: { padding: '14px 20px', imgSize: 52, nameSize: '1.4rem', countrySize: '0.76rem', gap: 14 },
};

export const ClubBadge = ({ club, size = 'md' }: ClubBadgeProps) => {
  const cfg = sizeConfig[size];

  return (
    <motion.div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'white',
        borderRadius: '5px',
        padding: cfg.padding,
        gap: cfg.gap,
        boxShadow: '0 2px 8px rgba(0,0,0,0.11), 0 0 0 1px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -1 }}
    >
      {/* Top accent stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: '#1e3a8a',
        }}
      />

      <img
        src={club.logo}
        alt={club.name}
        style={{ width: cfg.imgSize, height: cfg.imgSize, objectFit: 'contain' }}
        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
      />

      <div>
        <p
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: cfg.nameSize,
            color: '#1e3a8a',
            letterSpacing: '0.04em',
            lineHeight: 1.1,
          }}
        >
          {club.name}
        </p>
        <p
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 600,
            fontSize: cfg.countrySize,
            color: '#8a7553',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {club.country}
        </p>
      </div>
    </motion.div>
  );
};
