import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Club, GameMode, StartingScore } from '@/types/game';
import { mockClubs, fetchClubs, getRandomClubAsync } from '@/data/mockData';
import { Shuffle, ArrowRight, ArrowLeft, User, Search, HelpCircle, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GameSetupProps {
  mode: GameMode;
  selectedScore?: StartingScore;
  selectedClub: Club | null;
  onModeSelect?: (mode: GameMode) => void;
  onScoreSelect?: (score: StartingScore) => void;
  onClubSelect: (club: Club) => void;
  onStart: (playerNames: string[], allowMisses?: boolean, timer?: 30 | 60 | 90 | 180 | 300 | null) => void;
  onBack: () => void;
  hidePlayerNames?: boolean;
}

const getInitialPlayerNames = (mode: GameMode): string[] => {
  if (mode === 'solo') return ['Player'];
  return ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
};

const stickerShadow = '0 2px 6px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)';


const CARD_PALETTES = [
  { from: '#1e3a8a', via: '#2563eb', accent: '#93c5fd' },
  { from: '#7c3aed', via: '#9333ea', accent: '#c4b5fd' },
  { from: '#b91c1c', via: '#dc2626', accent: '#fca5a5' },
  { from: '#065f46', via: '#059669', accent: '#6ee7b7' },
  { from: '#92400e', via: '#d97706', accent: '#fde68a' },
  { from: '#0e7490', via: '#0891b2', accent: '#a5f3fc' },
  { from: '#831843', via: '#db2777', accent: '#fbcfe8' },
  { from: '#1f2937', via: '#374151', accent: '#d1d5db' },
];

const MULTIPLAYER_MODES: { mode: GameMode; label: string; subtitle: string; description: string; hint: string; color: string }[] = [
  {
    mode: 'multiplayer-turns',
    label: 'TURNS',
    subtitle: 'Multiplayer',
    description: 'Up to 4 players taking turns',
    hint: 'Gracze wybierają piłkarzy kolejno — każdy po cichu dobiera swój zestaw kart i zatwierdza strzał. Po każdej rundzie wyniki są rozstrzygane wspólnie.\n\nMożesz strzelać dalej lub kliknąć STOP, żeby zablokować swój wynik i czekać na koniec. Bust (zejście poniżej zera lub rzut >180) eliminuje Cię z gry.\n\nWygrywa ten, kto jest najbliżej zera.',
    color: '#b91c1c',
  },
  {
    mode: 'multiplayer-blitz',
    label: 'BLITZ',
    subtitle: 'Sudden Death',
    description: 'All players play simultaneously — no mercy!',
    hint: 'Każdy gracz wybiera piłkarzy po cichu — karty są zakryte i nikt nie widzi wyboru rywala. Podaj urządzenie kolejnemu graczowi.\n\nGdy wszyscy skończą, naciśnij "Shoot!" — wszystkie karty odsłaniają się jednocześnie. Wyniki są rozstrzygane natychmiast.\n\nBust (poniżej zera lub suma >180) eliminuje gracza. Wygrywa ten z wynikiem najbliższym zera.',
    color: '#92400e',
  },
];
const SCORES: StartingScore[] = [301, 501, 701];
const stickerShadowActive = (color: string) => `0 4px 20px ${color}44, 0 1px 4px rgba(0,0,0,0.16), 0 0 0 3px ${color}`;

export const GameSetup = ({
  mode,
  selectedScore,
  selectedClub,
  onModeSelect,
  onScoreSelect,
  onClubSelect,
  onStart,
  onBack,
  hidePlayerNames = false,
}: GameSetupProps) => {
  const [playerNames, setPlayerNames] = useState<string[]>(getInitialPlayerNames(mode));
  const [playerCount, setPlayerCount] = useState(2);
  const [step, setStep] = useState<'config' | 'club' | 'players'>(hidePlayerNames ? 'club' : 'config');
  const [clubs, setClubs] = useState<Club[]>(mockClubs);
  const [countryFilter, setCountryFilter] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [allowMisses, setAllowMisses] = useState(false);
  const [timer, setTimer] = useState<30 | 60 | 90 | 180 | 300 | null>(null);
  const [hintMode, setHintMode] = useState<GameMode | null>(null);

  useEffect(() => {
    fetchClubs().then(setClubs).catch(() => setClubs(mockClubs));
  }, []);

  const availableCountries = useMemo(
    () => [...new Set(clubs.map(c => c.country).filter(Boolean))].sort() as string[],
    [clubs]
  );

  useEffect(() => {
    setTimer(null);
  }, [mode]);

  const handleRandomClub = async () => {
    const club = await getRandomClubAsync();
    setCountryFilter('');
    setSearchQuery('');
    onClubSelect(club);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const activePlayerNames = mode === 'solo' ? playerNames.slice(0, 1) : playerNames.slice(0, playerCount);

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 pt-16 relative"
      style={{
        backgroundColor: '#ede3ce',
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)`,
      }}
    >
      {/* Back button */}
      <motion.button
        className="absolute top-5 left-5 flex items-center gap-2"
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          color: '#7a6340',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
        onClick={step === 'config' ? onBack : step === 'players' ? () => setStep('config') : hidePlayerNames ? () => setStep('config') : () => setStep('players')}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -2 }}
      >
        <ArrowLeft size={16} />
        Back
      </motion.button>

      {step === 'config' ? (
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{
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

          {/* Mode cards — multiplayer only */}
          {mode !== 'solo' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {MULTIPLAYER_MODES.map(({ mode: m, label, subtitle, description, hint, color }, i) => {
                  const isSelected = mode === m;
                  return (
                    <motion.button
                      key={m}
                      onClick={() => onModeSelect(m)}
                      className="text-left"
                      style={{
                        background: 'white', borderRadius: '5px',
                        boxShadow: isSelected ? stickerShadowActive(color) : stickerShadow,
                        transform: isSelected ? 'translateY(-3px)' : 'none',
                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                        overflow: 'hidden', position: 'relative', cursor: 'pointer', border: 'none',
                      }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.07 }}
                    >
                      <div style={{ background: color, padding: '10px 14px 8px', position: 'relative' }}>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.65rem', color: 'white', lineHeight: 1, letterSpacing: '0.04em' }}>{label}</div>
                        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.65rem', color: 'rgba(255,255,255,0.68)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{subtitle}</div>
                        {/* ? hint button */}
                        <button
                          onClick={e => { e.stopPropagation(); setHintMode(m); }}
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
                        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.82rem', color: '#4a3f2e', lineHeight: 1.45 }}>{description}</p>
                        {isSelected && (
                          <motion.div style={{ marginTop: '8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            ✓ SELECTED
                          </motion.div>
                        )}
                      </div>
                      {isSelected && <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Mode hint overlay */}
              <AnimatePresence>
                {hintMode && (() => {
                  const modeData = MULTIPLAYER_MODES.find(m => m.mode === hintMode)!;
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
                        {/* Coloured header strip */}
                        <div style={{ background: modeData.color, padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1 }}>{modeData.label}</div>
                            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{modeData.subtitle}</div>
                          </div>
                          <button onClick={() => setHintMode(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                            <X size={16} />
                          </button>
                        </div>
                        {/* Body */}
                        <div style={{ padding: '20px 22px 24px' }}>
                          {modeData.hint.split('\n\n').map((para, idx) => (
                            <p key={idx} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 500, fontSize: '0.95rem', color: '#3a2e1e', lineHeight: 1.55, marginBottom: idx < modeData.hint.split('\n\n').length - 1 ? 12 : 0 }}>
                              {para}
                            </p>
                          ))}
                          <motion.button
                            onClick={() => { onModeSelect(hintMode); setHintMode(null); }}
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
            </>
          )}

          {/* Starting points */}
          <div className="mb-8">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Starting Points
            </div>
            <div className="flex gap-2">
              {SCORES.map((score) => {
                const active = selectedScore === score;
                return (
                  <motion.button
                    key={score}
                    onClick={() => onScoreSelect(score)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: '5px',
                      background: active ? '#1e3a8a' : 'white',
                      color: active ? 'white' : '#1e3a8a',
                      fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.25rem', letterSpacing: '0.04em',
                      boxShadow: active ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2px #1e3a8a' : stickerShadow,
                      border: `2px solid ${active ? '#1e3a8a' : 'rgba(30,58,138,0.18)'}`,
                      cursor: 'pointer', transition: 'all 0.18s',
                    }}
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                  >
                    {score}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Turn Timer — for multiplayer modes */}
          {mode !== 'solo' && (
            <div className="mb-6">
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Turn Timer
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(mode === 'multiplayer-blitz'
                  ? [null, 60, 180, 300] as const
                  : [null, 30, 60, 90] as const
                ).map((val) => (
                  <motion.button
                    key={String(val)}
                    onClick={() => setTimer(val as typeof timer)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: '5px',
                      background: timer === val ? '#1e3a8a' : 'white',
                      color: timer === val ? 'white' : '#1e3a8a',
                      fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.06em',
                      boxShadow: timer === val ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2px #1e3a8a' : stickerShadow,
                      border: `2px solid ${timer === val ? '#1e3a8a' : 'rgba(30,58,138,0.18)'}`,
                      cursor: 'pointer', transition: 'all 0.18s',
                    }}
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                  >
                    {val === null ? 'OFF' : val < 120 ? `${val}s` : `${val / 60} min`}
                  </motion.button>
                ))}
              </div>
              {timer !== null && (
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.72rem', color: '#a09070', marginTop: '5px', lineHeight: 1.4 }}>
                  {mode === 'multiplayer-blitz'
                    ? 'Timeout = picks are locked in automatically.'
                    : allowMisses ? 'Timeout = lose 1 life.' : 'Timeout = eliminated.'}{' '}
                  {mode !== 'multiplayer-blitz' && 'Player is skipped for the round.'}
                </div>
              )}
            </div>
          )}

          {/* Allow Misses toggle — only for Turns mode */}
          {mode !== 'multiplayer-blitz' && <div className="mb-6">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Allow Misses
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {([false, true] as const).map((val) => (
                <motion.button
                  key={String(val)}
                  onClick={() => setAllowMisses(val)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: '5px',
                    background: allowMisses === val ? '#1e3a8a' : 'white',
                    color: allowMisses === val ? 'white' : '#1e3a8a',
                    fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.06em',
                    boxShadow: allowMisses === val ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2px #1e3a8a' : stickerShadow,
                    border: `2px solid ${allowMisses === val ? '#1e3a8a' : 'rgba(30,58,138,0.18)'}`,
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                >
                  {val ? 'ON — 3 lives' : 'OFF'}
                </motion.button>
              ))}
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.72rem', color: '#a09070', marginTop: '5px', lineHeight: 1.4 }}>
              {allowMisses
                ? 'Miss = lose 1 life (3 total). Lose all → eliminated.'
                : 'Miss = eliminated at end of turn.'}
            </div>
          </div>}

          {/* Number of players */}
          {mode !== 'solo' && (
            <div className="mb-6">
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Number of Players
              </div>
              <div className="flex gap-2">
                {[2, 3, 4].map((count) => {
                  const active = playerCount === count;
                  return (
                    <motion.button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: '5px',
                        background: active ? '#1e3a8a' : 'white',
                        color: active ? 'white' : '#1e3a8a',
                        fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.25rem', letterSpacing: '0.04em',
                        boxShadow: active ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2px #1e3a8a' : stickerShadow,
                        border: `2px solid ${active ? '#1e3a8a' : 'rgba(30,58,138,0.18)'}`,
                        cursor: 'pointer', transition: 'all 0.18s',
                      }}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    >
                      {count}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          <motion.button
            onClick={() => setStep(hidePlayerNames ? 'club' : 'players')}
            style={{
              width: '100%', background: '#1e3a8a', color: 'white',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.45rem', letterSpacing: '0.2em',
              padding: '14px 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(30,58,138,0.4)', position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
            NEXT
            <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      ) : step === 'players' ? (
        <>
          {/* Player names step */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '2.8rem',
                color: '#1e3a8a',
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              {mode === 'solo' ? 'Your Name' : 'Player Names'}
            </h1>
            <p
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600,
                fontSize: '0.82rem',
                letterSpacing: '0.12em',
                color: '#8a7553',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              Name your collectors
            </p>
          </motion.div>

          {/* Name inputs */}
          <motion.div
            className="w-full max-w-md space-y-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            {activePlayerNames.map((name, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8a7553',
                  }}
                />
                <input
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '14px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: 'white',
                    border: '2px solid #d4c4a0',
                    borderRadius: '5px',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 600,
                    fontSize: '1rem',
                    letterSpacing: '0.05em',
                    color: '#1e3a8a',
                    outline: 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1e3a8a'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d4c4a0'; }}
                />
              </div>
            ))}
          </motion.div>

          {/* Next button */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            {(() => {
              const canGoNext = activePlayerNames.every(n => n.trim());
              return (
                <motion.button
                  onClick={() => setStep('club')}
                  disabled={!canGoNext}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: canGoNext ? '#1e3a8a' : '#a09080',
                    color: 'white',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.55rem',
                    letterSpacing: '0.15em',
                    padding: '13px 48px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: canGoNext ? 'pointer' : 'default',
                    boxShadow: canGoNext
                      ? '0 4px 18px rgba(30,58,138,0.4), 0 2px 4px rgba(0,0,0,0.18)'
                      : 'none',
                  }}
                  whileHover={canGoNext ? { scale: 1.04, y: -2 } : {}}
                  whileTap={canGoNext ? { scale: 0.97 } : {}}
                >
                  NEXT
                  <ArrowRight size={20} />
                </motion.button>
              );
            })()}
          </motion.div>
        </>
      ) : (
        <>
          {/* Club selection step */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '2.8rem',
                color: '#1e3a8a',
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              Choose Your Club
            </h1>
          </motion.div>

          {/* Card preview */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {selectedClub && (() => {
              const idx = clubs.findIndex(c => c.id === selectedClub.id);
              const pal = CARD_PALETTES[(idx >= 0 ? idx : 0) % CARD_PALETTES.length];
              return (
                <motion.div
                  key={selectedClub.id}
                  initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  style={{
                    width: 160,
                    aspectRatio: '2/3',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: `0 0 0 3px white, 0 0 0 5.5px ${pal.via}, 0 16px 48px ${pal.from}99`,
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${pal.from} 0%, ${pal.via} 55%, ${pal.accent}66 100%)` }} />
                  <div style={{ position: 'absolute', left: '-30%', right: '-30%', top: '28%', bottom: '26%', background: 'rgba(255,255,255,0.13)', transform: 'rotate(-18deg)' }} />
                  <div style={{ position: 'absolute', left: '-20%', right: '-20%', top: '34%', height: '18%', background: 'rgba(255,255,255,0.22)', transform: 'rotate(-18deg)' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '30%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                    <img src={selectedClub.logo} alt={selectedClub.name} style={{ width: '62%', height: '62%', objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.6))' }} onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', zIndex: 2, borderTop: `2px solid ${pal.accent}66` }}>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: 'white', letterSpacing: '0.06em', lineHeight: 1.1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{selectedClub.name}</div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.62rem', color: pal.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{selectedClub.country}</div>
                  </div>
                  <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }} />
                </motion.div>
              );
            })()}

            {!selectedClub && (
              <div style={{ width: 160, aspectRatio: '2/3', borderRadius: '10px', border: '2px dashed rgba(30,58,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: 'rgba(30,58,138,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', padding: '0 10px' }}>No club selected</span>
              </div>
            )}
          </motion.div>

          {/* Buttons row: Random + Browse */}
          <motion.div
            className="flex gap-3 mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <motion.button
              onClick={handleRandomClub}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 20px', borderRadius: '5px',
                background: 'white', border: '2px dashed #1e3a8a', color: '#1e3a8a',
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: stickerShadow,
              }}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Shuffle size={15} />
              Random
            </motion.button>

            <motion.button
              onClick={() => setClubModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 20px', borderRadius: '5px',
                background: 'white', border: '2px solid rgba(30,58,138,0.22)', color: '#1e3a8a',
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: stickerShadow,
              }}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Search size={14} />
              Browse clubs
            </motion.button>
          </motion.div>

          {/* Kick off — appears when club selected */}
          {selectedClub && (
            <motion.button
              onClick={() => onStart(hidePlayerNames ? [] : activePlayerNames, allowMisses, timer)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#1e3a8a', color: 'white',
                fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem',
                letterSpacing: '0.15em', padding: '12px 40px',
                borderRadius: '5px', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(30,58,138,0.38)',
              }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              KICK OFF
              <ArrowRight size={18} />
            </motion.button>
          )}

          {/* Club browser modal */}
          {clubModalOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(3px)',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
              }}
              onClick={() => setClubModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ede3ce',
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)`,
                  borderRadius: '10px',
                  width: '100%',
                  maxWidth: '680px',
                  maxHeight: '85dvh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                }}
              >
                {/* Modal header */}
                <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(165,138,90,0.3)' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8a7553', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search clubs..."
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 32px',
                        borderRadius: '5px',
                        border: '2px solid rgba(30,58,138,0.18)',
                        background: 'white',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        letterSpacing: '0.04em',
                        color: '#1e3a8a',
                        boxShadow: stickerShadow,
                        outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(30,58,138,0.18)'; }}
                    />
                  </div>
                  <button
                    onClick={() => setClubModalOpen(false)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'white',
                      color: '#7a6340',
                      cursor: 'pointer',
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: stickerShadow,
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Country filter */}
                <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(165,138,90,0.2)', position: 'relative', zIndex: 10 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={countryFilter}
                      onChange={(e) => { setCountryFilter(e.target.value); setCountryDropdownOpen(true); }}
                      onFocus={() => setCountryDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setCountryDropdownOpen(false), 150)}
                      placeholder="All countries"
                      style={{
                        width: '100%',
                        padding: '8px 32px 8px 12px',
                        borderRadius: countryDropdownOpen ? '5px 5px 0 0' : '5px',
                        border: '2px solid rgba(30,58,138,0.18)',
                        borderBottom: countryDropdownOpen ? '2px solid rgba(30,58,138,0.08)' : '2px solid rgba(30,58,138,0.18)',
                        background: 'white',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        letterSpacing: '0.04em',
                        color: countryFilter ? '#1e3a8a' : '#8a7553',
                        boxShadow: stickerShadow,
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'text',
                      }}
                    />
                    {countryFilter ? (
                      <button
                        onMouseDown={(e) => { e.preventDefault(); setCountryFilter(''); setCountryDropdownOpen(false); }}
                        style={{
                          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#8a7553', fontSize: '0.8rem', padding: '2px 4px', lineHeight: 1,
                        }}
                      >✕</button>
                    ) : (
                      <span style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        color: '#8a7553', fontSize: '0.7rem', pointerEvents: 'none',
                      }}>▼</span>
                    )}
                    {countryDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white',
                        border: '2px solid rgba(30,58,138,0.18)',
                        borderTop: 'none',
                        borderRadius: '0 0 5px 5px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 20,
                      }}>
                        {!countryFilter && (
                          <div
                            onMouseDown={(e) => { e.preventDefault(); setCountryFilter(''); setCountryDropdownOpen(false); }}
                            style={{
                              padding: '8px 12px',
                              fontFamily: 'Barlow Condensed, sans-serif',
                              fontWeight: 600,
                              fontSize: '0.88rem',
                              letterSpacing: '0.04em',
                              color: '#8a7553',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(165,138,90,0.15)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,58,138,0.06)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            All countries
                          </div>
                        )}
                        {availableCountries
                          .filter(c => !countryFilter || c.toLowerCase().includes(countryFilter.toLowerCase()))
                          .map(country => (
                            <div
                              key={country}
                              onMouseDown={(e) => { e.preventDefault(); setCountryFilter(country); setCountryDropdownOpen(false); }}
                              style={{
                                padding: '8px 12px',
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                letterSpacing: '0.04em',
                                color: '#1e3a8a',
                                cursor: 'pointer',
                                background: countryFilter === country ? 'rgba(30,58,138,0.08)' : 'transparent',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,58,138,0.06)')}
                              onMouseLeave={e => (e.currentTarget.style.background = countryFilter === country ? 'rgba(30,58,138,0.08)' : 'transparent')}
                            >
                              {country}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Club grid */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-4">
                    {clubs.map((club, i) => {
                      if (countryFilter.trim() && !club.country?.toLowerCase().includes(countryFilter.trim().toLowerCase())) return null;
                      if (searchQuery.trim() && !club.name.toLowerCase().includes(searchQuery.toLowerCase())) return null;
                      const isSelected = selectedClub?.id === club.id;
                      const p = CARD_PALETTES[i % CARD_PALETTES.length];
                      return (
                        <motion.button
                          key={club.id}
                          onClick={() => { onClubSelect(club); setClubModalOpen(false); }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.015 * i, type: 'spring', stiffness: 280, damping: 24 }}
                          whileHover={{ y: -6, scale: 1.05, rotate: 0.5 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            border: 'none', cursor: 'pointer', padding: 0,
                            background: 'transparent', borderRadius: '8px',
                            position: 'relative',
                            boxShadow: isSelected
                              ? `0 0 0 3px white, 0 0 0 5px ${p.via}, 0 12px 40px ${p.from}88`
                              : '0 4px 14px rgba(0,0,0,0.22)',
                            transition: 'box-shadow 0.25s ease',
                            overflow: 'hidden', aspectRatio: '2/3', display: 'flex', flexDirection: 'column',
                          }}
                        >
                          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${p.from} 0%, ${p.via} 55%, ${p.accent}66 100%)` }} />
                          <div style={{ position: 'absolute', left: '-30%', right: '-30%', top: '28%', bottom: '26%', background: 'rgba(255,255,255,0.11)', transform: 'rotate(-18deg)', pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', left: '-20%', right: '-20%', top: '34%', height: '18%', background: 'rgba(255,255,255,0.2)', transform: 'rotate(-18deg)', pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', top: 6, left: 7, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', zIndex: 2 }}>
                            {String(i + 1).padStart(3, '0')}
                          </div>
                          {isSelected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: 5, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: p.via, fontWeight: 900, zIndex: 3, boxShadow: `0 2px 8px ${p.from}88` }}>✓</motion.div>
                          )}
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '30%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                            <motion.img
                              src={club.logo} alt={club.name}
                              animate={isSelected ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                              transition={{ duration: 0.35 }}
                              style={{ width: '68%', height: '68%', objectFit: 'contain', filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))' }}
                              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                            />
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 5px', zIndex: 2, borderTop: `2px solid ${p.accent}66` }}>
                            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'white', letterSpacing: '0.06em', lineHeight: 1.1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{club.name}</div>
                            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.5rem', color: p.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>{club.country}</div>
                          </div>
                          {isSelected && <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, borderRadius: '8px' }} />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
