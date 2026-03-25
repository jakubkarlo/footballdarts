import { motion, AnimatePresence } from 'framer-motion';
import { GamePlayer } from '@/types/game';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  player: GamePlayer;
  isActive: boolean;
  showAnimation?: 'success' | 'bust' | null;
  stickerNumber?: number;
}

export const ScoreDisplay = ({
  player,
  isActive,
  showAnimation,
  stickerNumber = 1,
}: ScoreDisplayProps) => {
  const getHeaderColor = () => {
    if (player.isBusted) return '#7f1d1d';
    if (player.isFinished) return '#14532d';
    if (isActive) return '#b91c1c';
    return '#1e3a8a';
  };

  const getScoreColor = () => {
    if (player.isBusted) return '#dc2626';
    if (player.score <= 50) return '#15803d';
    if (player.score <= 100) return '#b45309';
    return '#1e3a8a';
  };

  const getStatusLabel = () => {
    if (player.isBusted) return 'BUSTED';
    if (player.isFinished) return 'FINISHED';
    if (isActive) return 'NOW PLAYING';
    return 'PLAYER';
  };

  return (
    <motion.div
      style={{
        background: 'white',
        borderRadius: '5px',
        boxShadow: isActive
          ? '0 4px 20px rgba(185,28,28,0.22), 0 1px 4px rgba(0,0,0,0.14), 0 0 0 2.5px #b91c1c'
          : '0 2px 8px rgba(0,0,0,0.11), 0 0 0 1px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        position: 'relative',
        opacity: player.isBusted ? 0.72 : 1,
      }}
      layout
      animate={{ y: isActive ? -3 : 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Foil shimmer on active */}
      {isActive && !player.isBusted && (
        <div
          className="foil-shimmer"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
        />
      )}

      {/* Header band */}
      <div
        style={{
          background: getHeaderColor(),
          padding: '8px 12px 7px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.62)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '1px',
            }}
          >
            {getStatusLabel()}
          </div>
          <div
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.2rem',
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '0.04em',
              maxWidth: '110px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {player.name}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800,
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.48)',
            letterSpacing: '0.05em',
            paddingTop: '2px',
          }}
        >
          #{String(stickerNumber).padStart(3, '0')}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 14px 10px' }}>
        {/* Score */}
        <AnimatePresence mode="wait">
          <motion.div
            key={player.score}
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '3.8rem',
              lineHeight: 1,
              color: getScoreColor(),
              letterSpacing: '0.02em',
              textAlign: 'center',
              padding: '2px 0',
            }}
            className={cn(
              showAnimation === 'success' && 'score-flash-green',
              showAnimation === 'bust' && 'score-flash-red shake'
            )}
            initial={{ scale: 1.18, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {player.score}
          </motion.div>
        </AnimatePresence>

        {/* Stats strip */}
        <div
          style={{
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid #e8dece',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#8a7553',
              textTransform: 'uppercase',
            }}
          >
            THROWS: {player.throws.length}
          </span>

          {player.throws.length >= 3 && !player.isBusted && (
            <motion.span
              style={{ fontSize: '0.9rem', lineHeight: 1 }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            >
              🔥
            </motion.span>
          )}
        </div>

        {/* Last throw */}
        {player.throws.length > 0 && (
          <motion.div
            style={{
              marginTop: '5px',
              background: '#f5f0e8',
              borderRadius: '3px',
              padding: '4px 8px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: '#5a4a35',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {player.throws[player.throws.length - 1].playerName}{' '}
            <span style={{ color: '#b91c1c', fontWeight: 700 }}>
              (−{player.throws[player.throws.length - 1].appearances})
            </span>
          </motion.div>
        )}
      </div>

      {/* BUST stamp overlay */}
      {player.isBusted && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0, rotate: -12, scale: 0.6 }}
          animate={{ opacity: 1, rotate: -12, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, delay: 0.1 }}
        >
          <div
            style={{
              border: '3px solid #dc2626',
              color: '#dc2626',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.4rem',
              letterSpacing: '0.12em',
              padding: '3px 12px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.85)',
              opacity: 0.85,
            }}
          >
            BUST
          </div>
        </motion.div>
      )}

      {/* FINISHED stamp */}
      {player.isFinished && !player.isBusted && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0, rotate: -10, scale: 0.6 }}
          animate={{ opacity: 1, rotate: -10, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, delay: 0.1 }}
        >
          <div
            style={{
              border: '3px solid #15803d',
              color: '#15803d',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.2rem',
              letterSpacing: '0.1em',
              padding: '3px 10px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.85)',
            }}
          >
            FINISHED
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
