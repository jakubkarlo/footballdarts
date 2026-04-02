import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameMode, StartingScore } from '@/types/game';
import { ArrowLeft, Loader2, Wifi, HelpCircle, X } from 'lucide-react';

interface CreateOnlineScreenProps {
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onCreate: (
    mode: GameMode,
    startingScore: StartingScore,
    maxPlayers: number,
    allowMisses: boolean,
    timer: 30 | 60 | 90 | 180 | 300 | null,
  ) => Promise<void>;
}

const MODES: {
  mode: GameMode;
  label: string;
  subtitle: string;
  description: string;
  hint: string;
  number: string;
  color: string;
}[] = [
  {
    mode: 'multiplayer-turns',
    label: 'TURNS',
    subtitle: 'Multiplayer',
    description: 'Up to 4 players taking turns',
    hint: 'Gracze wybierają piłkarzy kolejno — każdy po cichu dobiera swój zestaw kart i zatwierdza strzał. Po każdej rundzie wyniki są rozstrzygane wspólnie.\n\nMożesz strzelać dalej lub kliknąć STOP, żeby zablokować swój wynik i czekać na koniec. Bust (zejście poniżej zera lub rzut >180) eliminuje Cię z gry.\n\nWygrywa ten, kto jest najbliżej zera.',
    number: '002',
    color: '#b91c1c',
  },
  {
    mode: 'multiplayer-blitz',
    label: 'BLITZ',
    subtitle: 'Sudden Death',
    description: 'All players play simultaneously — no mercy!',
    hint: 'Każdy gracz wybiera piłkarzy jednocześnie na swoim urządzeniu — karty są zakryte i nikt nie widzi wyboru rywala. Potwierdź wybór i czekaj na pozostałych.\n\nGdy wszyscy skończą, host naciska "Shoot!" — wszystkie karty odsłaniają się jednocześnie. Wyniki są rozstrzygane natychmiast.\n\nBust (poniżej zera lub suma >180) eliminuje gracza. Wygrywa ten z wynikiem najbliższym zera.',
    number: '003',
    color: '#92400e',
  },
];

const SCORES: StartingScore[] = [301, 501, 701];
const PLAYER_COUNTS = [2, 3, 4];

const stickerShadow = '0 2px 6px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)';
const stickerShadowActive = (color: string) =>
  `0 4px 20px ${color}44, 0 1px 4px rgba(0,0,0,0.16), 0 0 0 3px ${color}`;

export const CreateOnlineScreen = ({
  isLoading,
  error,
  onBack,
  onCreate,
}: CreateOnlineScreenProps) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('multiplayer-turns');
  const [selectedScore, setSelectedScore] = useState<StartingScore>(501);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [allowMisses, setAllowMisses] = useState(false);
  const [timer, setTimer] = useState<30 | 60 | 90 | 180 | 300 | null>(null);
  const [hintMode, setHintMode] = useState<GameMode | null>(null);

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    // Reset timer when switching modes — valid values differ between turns and blitz
    setTimer(null);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    await onCreate(selectedMode, selectedScore, maxPlayers, allowMisses, timer);
  };

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

        {/* Back button */}
        <motion.div
          className="w-full max-w-lg mb-6 flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <motion.button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#8a7553',
              padding: 0,
            }}
            whileHover={{ color: '#4a3f2e' }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft size={15} />
            Back
          </motion.button>
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-7"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
            style={{
              background: '#1e3a8a',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.2em',
              color: 'white',
              textTransform: 'uppercase',
            }}
          >
            <Wifi size={11} />
            Online Game
          </div>
          <h1
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 'clamp(2.8rem, 8vw, 5rem)',
              lineHeight: 0.9,
              letterSpacing: '0.03em',
              color: '#1e3a8a',
            }}
          >
            CREATE
            <br />
            <span style={{ color: '#b91c1c' }}>GAME</span>
          </h1>
        </motion.div>

        <div className="w-full max-w-lg">

          {/* Mode cards */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.63rem',
                letterSpacing: '0.25em',
                color: '#8a7553',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              Game Mode
            </div>
            <div className="grid grid-cols-2 gap-4">
              {MODES.map(({ mode, label, subtitle, description, hint, number, color }, i) => {
                const isSelected = selectedMode === mode;
                return (
                  <motion.button
                    key={mode}
                    onClick={() => handleModeSelect(mode)}
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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.07 }}
                  >
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
                      {/* ? hint button */}
                      <button
                        onClick={e => { e.stopPropagation(); setHintMode(mode); }}
                        style={{
                          position: 'absolute', top: 7, right: 8,
                          background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
                          borderRadius: '50%', width: 22, height: 22,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'white', padding: 0,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                        title="Jak działa ten tryb?"
                      >
                        <HelpCircle size={13} />
                      </button>
                    </div>
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
                            color,
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          ✓ SELECTED
                        </motion.div>
                      )}
                    </div>
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

          {/* Mode hint overlay */}
          <AnimatePresence>
            {hintMode && (() => {
              const modeData = MODES.find(m => m.mode === hintMode)!;
              return (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                  onClick={() => setHintMode(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    onClick={e => e.stopPropagation()}
                    style={{ background: '#ede3ce', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)', borderRadius: 10, overflow: 'hidden', maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                  >
                    <div style={{ background: modeData.color, padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1 }}>{modeData.label}</div>
                        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{modeData.subtitle}</div>
                      </div>
                      <button onClick={() => setHintMode(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                        <X size={16} />
                      </button>
                    </div>
                    <div style={{ padding: '20px 22px 24px' }}>
                      {modeData.hint.split('\n\n').map((para, idx) => (
                        <p key={idx} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 500, fontSize: '0.95rem', color: '#3a2e1e', lineHeight: 1.55, marginBottom: idx < modeData.hint.split('\n\n').length - 1 ? 12 : 0 }}>
                          {para}
                        </p>
                      ))}
                      <motion.button
                        onClick={() => { handleModeSelect(hintMode); setHintMode(null); }}
                        style={{ width: '100%', marginTop: 20, background: modeData.color, color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.15rem', letterSpacing: '0.18em', padding: '11px 0', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px ${modeData.color}55` }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      >
                        Wybierz {modeData.label}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Starting points */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <div
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.63rem',
                letterSpacing: '0.25em',
                color: '#8a7553',
                textTransform: 'uppercase',
                marginBottom: '0.45rem',
              }}
            >
              Starting Points
            </div>
            <div className="flex gap-2">
              {SCORES.map((score) => {
                const active = selectedScore === score;
                return (
                  <motion.button
                    key={score}
                    onClick={() => setSelectedScore(score)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: '5px',
                      background: active ? '#1e3a8a' : 'white',
                      color: active ? 'white' : '#1e3a8a',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.25rem',
                      letterSpacing: '0.04em',
                      boxShadow: active
                        ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2px #1e3a8a'
                        : stickerShadow,
                      border: `2px solid ${active ? '#1e3a8a' : 'rgba(30,58,138,0.18)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {score}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Max players */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
          >
            <div
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.63rem',
                letterSpacing: '0.25em',
                color: '#8a7553',
                textTransform: 'uppercase',
                marginBottom: '0.45rem',
              }}
            >
              Max Players
            </div>
            <div className="flex gap-2">
              {PLAYER_COUNTS.map((count) => {
                const active = maxPlayers === count;
                return (
                  <motion.button
                    key={count}
                    onClick={() => setMaxPlayers(count)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: '5px',
                      background: active ? '#1e3a8a' : 'white',
                      color: active ? 'white' : '#1e3a8a',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.25rem',
                      letterSpacing: '0.04em',
                      boxShadow: active
                        ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2px #1e3a8a'
                        : stickerShadow,
                      border: `2px solid ${active ? '#1e3a8a' : 'rgba(30,58,138,0.18)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {count}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Timer */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.37 }}
          >
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              {selectedMode === 'multiplayer-blitz' ? 'Blitz Timer' : 'Turn Timer'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(selectedMode === 'multiplayer-blitz'
                ? [null, 60, 180, 300] as const
                : [null, 30, 60, 90] as const
              ).map((val) => {
                const active = timer === val;
                return (
                  <motion.button
                    key={String(val)}
                    onClick={() => setTimer(val as typeof timer)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: '5px',
                      background: active ? '#1e3a8a' : 'white',
                      color: active ? 'white' : '#1e3a8a',
                      fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.06em',
                      boxShadow: active ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2px #1e3a8a' : stickerShadow,
                      border: `2px solid ${active ? '#1e3a8a' : 'rgba(30,58,138,0.18)'}`,
                      cursor: 'pointer', transition: 'all 0.18s',
                    }}
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                  >
                    {val === null ? 'OFF' : val < 120 ? `${val}s` : `${val / 60} min`}
                  </motion.button>
                );
              })}
            </div>
            {timer !== null && selectedMode === 'multiplayer-turns' && (
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.72rem', color: '#a09070', marginTop: '5px', lineHeight: 1.4 }}>
                {allowMisses ? 'Timeout = lose 1 life.' : 'Timeout = eliminated.'} Player is skipped for the round.
              </div>
            )}
            {timer !== null && selectedMode === 'multiplayer-blitz' && (
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.72rem', color: '#a09070', marginTop: '5px', lineHeight: 1.4 }}>
                Wszyscy grają jednocześnie. Timer kończy wybieranie automatycznie.
              </div>
            )}
          </motion.div>

          {/* Allow Misses — only for turns mode */}
          {selectedMode === 'multiplayer-turns' && (
            <motion.div
              className="mb-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                Allow Misses
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {([false, true] as const).map((val) => {
                  const active = allowMisses === val;
                  return (
                    <motion.button
                      key={String(val)}
                      onClick={() => setAllowMisses(val)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: '5px',
                        background: active ? '#1e3a8a' : 'white',
                        color: active ? 'white' : '#1e3a8a',
                        fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.06em',
                        boxShadow: active ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2px #1e3a8a' : stickerShadow,
                        border: `2px solid ${active ? '#1e3a8a' : 'rgba(30,58,138,0.18)'}`,
                        cursor: 'pointer', transition: 'all 0.18s',
                      }}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    >
                      {val ? 'ON — 3 lives' : 'OFF'}
                    </motion.button>
                  );
                })}
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.72rem', color: '#a09070', marginTop: '5px', lineHeight: 1.4 }}>
                {allowMisses ? 'Miss = lose 1 life (3 total). Lose all → eliminated.' : 'Miss = eliminated at end of turn.'}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '5px',
                background: 'rgba(185,28,28,0.08)',
                border: '1.5px solid rgba(185,28,28,0.3)',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600,
                fontSize: '0.82rem',
                color: '#b91c1c',
                textAlign: 'center',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Create button */}
          <motion.button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
            style={{
              background: '#1e3a8a',
              color: 'white',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.5rem',
              letterSpacing: '0.2em',
              padding: '14px 0',
              borderRadius: '6px',
              boxShadow: '0 4px 18px rgba(30,58,138,0.4), 0 2px 4px rgba(0,0,0,0.18)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
          >
            <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
            {isLoading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <>
                <Wifi size={18} />
                CREATE ONLINE
              </>
            )}
          </motion.button>
        </div>
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
