import { motion } from 'framer-motion';
import { GameMode, StartingScore } from '@/types/game';
import { Plus, LogIn } from 'lucide-react';

interface GameMenuProps {
  selectedMode: GameMode;
  selectedScore: StartingScore;
  onModeSelect: (mode: GameMode) => void;
  onScoreSelect: (score: StartingScore) => void;
  onStart: () => void;
  onCreateOnline?: () => void;
  onJoinOnline?: () => void;
}

const MODES: {
  mode: GameMode;
  label: string;
  subtitle: string;
  description: string;
  number: string;
  color: string;
}[] = [
  {
    mode: 'solo',
    label: 'SOLO',
    subtitle: 'Classic Edition',
    description: 'Play alone and beat your personal best score',
    number: '001',
    color: '#1e3a8a',
  },
  {
    mode: 'multiplayer-turns',
    label: 'TURNS',
    subtitle: 'Multiplayer',
    description: 'Up to 4 players taking turns locally',
    number: '002',
    color: '#b91c1c',
  },
  {
    mode: 'multiplayer-blitz',
    label: 'BLITZ',
    subtitle: 'Sudden Death',
    description: 'All players play simultaneously — no mercy!',
    number: '003',
    color: '#92400e',
  },
];

const SCORES: StartingScore[] = [301, 501, 701];

const stickerShadow = '0 2px 6px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)';
const stickerShadowActive = (color: string) =>
  `0 4px 20px ${color}44, 0 1px 4px rgba(0,0,0,0.16), 0 0 0 3px ${color}`;

export const GameMenu = ({
  selectedMode,
  selectedScore,
  onModeSelect,
  onScoreSelect,
  onStart,
  onCreateOnline,
  onJoinOnline,
}: GameMenuProps) => {
  const isMultiplayer = selectedMode !== 'solo';

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden select-none"
      style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)
        `,
        backgroundColor: '#ede3ce',
      }}
    >
      {/* Panini header band */}
      <div
        className="relative flex items-center justify-between px-6 py-3 overflow-hidden"
        style={{ background: '#b91c1c' }}
      >
        <div className="flex items-center gap-1.5">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="text-white/50 text-xs">★</span>
          ))}
        </div>
        <motion.span
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.35em' }}
          transition={{ duration: 0.7 }}
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.5rem',
            color: 'white',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          PANINI
        </motion.span>
        <div className="flex items-center gap-1.5">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="text-white/50 text-xs">★</span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* Title */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full mb-5"
            style={{
              background: '#1e3a8a',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.2em',
              color: 'white',
              textTransform: 'uppercase',
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span style={{ color: '#f5a623' }}>★</span>
            Official Card Collection
            <span style={{ color: '#f5a623' }}>★</span>
          </motion.div>

          <motion.h1
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 'clamp(3.8rem, 11vw, 7.5rem)',
              lineHeight: 0.88,
              letterSpacing: '0.03em',
              color: '#1e3a8a',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.14, type: 'spring', stiffness: 110 }}
          >
            FOOTBALL
            <br />
            <span style={{ color: '#b91c1c' }}>DARTS</span>
          </motion.h1>

          <motion.div
            className="mt-5 flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{ height: 2, width: 44, background: '#b91c1c' }} />
            <span
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.22em',
                color: '#7a6340',
                textTransform: 'uppercase',
              }}
            >
              Season 2024 · 25
            </span>
            <div style={{ height: 2, width: 44, background: '#b91c1c' }} />
          </motion.div>
        </motion.div>

        {/* Mode sticker cards */}
        <motion.div
          className="w-full max-w-3xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.28em',
              color: '#8a7553',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '0.8rem',
            }}
          >
            — Select Edition —
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODES.map(({ mode, label, subtitle, description, number, color }, i) => {
              const isSelected = selectedMode === mode;
              return (
                <motion.button
                  key={mode}
                  onClick={() => onModeSelect(mode)}
                  className="text-left"
                  style={{
                    background: 'white',
                    borderRadius: '5px',
                    boxShadow: isSelected ? stickerShadowActive(color) : stickerShadow,
                    transform: isSelected ? 'translateY(-3px)' : 'none',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 + i * 0.07 }}
                >
                  {/* Colored header */}
                  <div style={{ background: color, padding: '10px 14px 8px', position: 'relative' }}>
                    <div
                      style={{
                        fontFamily: 'Bebas Neue, sans-serif',
                        fontSize: '1.65rem',
                        color: 'white',
                        lineHeight: 1,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.68)',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {subtitle}
                    </div>
                    {/* Sticker number */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 10,
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 800,
                        fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      #{number}
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '10px 14px 14px' }}>
                    <p
                      style={{
                        fontFamily: 'Barlow, sans-serif',
                        fontSize: '0.82rem',
                        color: '#4a3f2e',
                        lineHeight: 1.45,
                      }}
                    >
                      {description}
                    </p>
                    {isSelected && (
                      <motion.div
                        style={{
                          marginTop: '8px',
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: color,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        ✓ SELECTED
                      </motion.div>
                    )}
                  </div>

                  {/* Foil shimmer on selected */}
                  {isSelected && (
                    <div
                      className="foil-shimmer"
                      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Score circles */}
        <motion.div
          className="w-full max-w-sm mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
        >
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.28em',
              color: '#8a7553',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '0.8rem',
            }}
          >
            — Starting Points —
          </div>

          <div className="flex justify-center gap-5">
            {SCORES.map((score) => {
              const isSelected = selectedScore === score;
              return (
                <motion.button
                  key={score}
                  onClick={() => onScoreSelect(score)}
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: '50%',
                    background: isSelected ? '#1e3a8a' : 'white',
                    color: isSelected ? 'white' : '#1e3a8a',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.65rem',
                    letterSpacing: '0.03em',
                    boxShadow: isSelected
                      ? '0 4px 18px rgba(30,58,138,0.4), 0 0 0 3px #1e3a8a'
                      : stickerShadow,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {score}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <motion.button
            onClick={onStart}
            style={{
              background: '#1e3a8a',
              color: 'white',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.55rem',
              letterSpacing: '0.18em',
              padding: '14px 56px',
              borderRadius: '5px',
              boxShadow: '0 4px 18px rgba(30,58,138,0.4), 0 2px 4px rgba(0,0,0,0.18)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
            whileHover={{
              scale: 1.04,
              boxShadow: '0 7px 28px rgba(30,58,138,0.5), 0 2px 8px rgba(0,0,0,0.2)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
            {isMultiplayer ? 'LOCAL GAME' : 'KICK OFF'}
          </motion.button>

          {isMultiplayer && onCreateOnline && onJoinOnline && (
            <div className="flex gap-3">
              <motion.button
                onClick={onCreateOnline}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  background: 'white',
                  color: '#1e3a8a',
                  border: '2px solid #1e3a8a',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  boxShadow: stickerShadow,
                }}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <Plus size={14} />
                CREATE ONLINE
              </motion.button>
              <motion.button
                onClick={onJoinOnline}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  background: 'white',
                  color: '#b91c1c',
                  border: '2px solid #b91c1c',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  boxShadow: stickerShadow,
                }}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <LogIn size={14} />
                JOIN ONLINE
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Rules hint */}
        <motion.p
          className="mt-10 text-center"
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 600,
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            color: '#8a7553',
            textTransform: 'uppercase',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Max throw: 180 appearances · Bust if score drops below zero
        </motion.p>
      </div>

      {/* Bottom stripe */}
      <div
        style={{
          height: 8,
          background: 'linear-gradient(90deg, #b91c1c 0%, #1e3a8a 50%, #b91c1c 100%)',
        }}
      />
    </div>
  );
};
