import { motion, AnimatePresence } from 'framer-motion';
import { GameMode } from '@/types/game';
import { Plus, LogIn } from 'lucide-react';

interface GameMenuProps {
  selectedMode: GameMode;
  onModeSelect: (mode: GameMode) => void;
  onStart: () => void;
  onCreateOnline?: () => void;
  onJoinOnline?: () => void;
}

const stickerShadow = '0 2px 6px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)';

export const GameMenu = ({
  selectedMode,
  onModeSelect,
  onStart,
  onCreateOnline,
  onJoinOnline,
}: GameMenuProps) => {
  const isSolo = selectedMode === 'solo';
  const isMultiplayer = !isSolo;

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
            transition={{ delay: 0.1, type: 'spring', stiffness: 110 }}
          >
            FOOTBALL
            <br />
            <span style={{ color: '#b91c1c' }}>DARTS</span>
          </motion.h1>
        </motion.div>

        {/* SOLO / MULTIPLAYER toggle */}
        <motion.div
          className="flex mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          style={{
            background: 'white',
            borderRadius: '30px',
            padding: '3px',
            boxShadow: stickerShadow,
          }}
        >
          {[
            { label: 'SOLO', value: 'solo' as GameMode },
            { label: 'MULTIPLAYER', value: 'multiplayer-turns' as GameMode },
          ].map(({ label, value }) => {
            const active = value === 'solo' ? isSolo : isMultiplayer;
            return (
              <motion.button
                key={value}
                onClick={() => onModeSelect(value)}
                style={{
                  padding: '6px 18px',
                  borderRadius: '24px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  background: active ? '#1e3a8a' : 'transparent',
                  color: active ? 'white' : '#8a7553',
                  transition: 'all 0.2s',
                }}
                whileTap={{ scale: 0.96 }}
              >
                {label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Buttons */}
        <AnimatePresence mode="wait">
          {isMultiplayer ? (
            <motion.div
              key="multi-btns"
              className="w-full max-w-sm flex flex-col gap-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {onCreateOnline && (
                <motion.button
                  onClick={onCreateOnline}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 0',
                    borderRadius: '6px',
                    background: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.45rem',
                    letterSpacing: '0.18em',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(30,58,138,0.4), 0 2px 4px rgba(0,0,0,0.18)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                  <Plus size={18} />
                  CREATE ONLINE
                </motion.button>
              )}

              {onJoinOnline && (
                <motion.button
                  onClick={onJoinOnline}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 0',
                    borderRadius: '6px',
                    background: '#b91c1c',
                    color: 'white',
                    border: 'none',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.45rem',
                    letterSpacing: '0.18em',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(185,28,28,0.4), 0 2px 4px rgba(0,0,0,0.18)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                  <LogIn size={18} />
                  JOIN ONLINE
                </motion.button>
              )}

              <motion.button
                onClick={onStart}
                style={{
                  padding: '10px 0',
                  borderRadius: '5px',
                  background: 'transparent',
                  color: '#7a6340',
                  border: '1.5px solid rgba(122,99,64,0.35)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
                whileHover={{ borderColor: 'rgba(122,99,64,0.65)', color: '#5a4820' }}
                whileTap={{ scale: 0.97 }}
              >
                Local Game
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="solo-btns"
              className="w-full max-w-sm"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={onStart}
                style={{
                  width: '100%',
                  background: '#1e3a8a',
                  color: 'white',
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.45rem',
                  letterSpacing: '0.2em',
                  padding: '14px 0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 18px rgba(30,58,138,0.4), 0 2px 4px rgba(0,0,0,0.18)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                KICK OFF
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

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
          transition={{ delay: 0.55 }}
        >
          Max throw: 180 appearances · Bust if score drops below zero
        </motion.p>
      </div>

      <div
        style={{
          height: 8,
          background: 'linear-gradient(90deg, #b91c1c 0%, #1e3a8a 50%, #b91c1c 100%)',
        }}
      />
    </div>
  );
};
