import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Club, GameMode } from '@/types/game';
import { mockClubs, fetchClubs, getRandomClubAsync } from '@/data/mockData';
import { Shuffle, ArrowRight, ArrowLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GameSetupProps {
  mode: GameMode;
  selectedClub: Club | null;
  onClubSelect: (club: Club) => void;
  onStart: (playerNames: string[]) => void;
  onBack: () => void;
  hidePlayerNames?: boolean;
}

const getInitialPlayerNames = (mode: GameMode): string[] => {
  if (mode === 'solo') return ['Player'];
  return ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
};

const stickerShadow = '0 2px 6px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)';

export const GameSetup = ({
  mode,
  selectedClub,
  onClubSelect,
  onStart,
  onBack,
  hidePlayerNames = false,
}: GameSetupProps) => {
  const [playerNames, setPlayerNames] = useState<string[]>(getInitialPlayerNames(mode));
  const [playerCount, setPlayerCount] = useState(2);
  const [step, setStep] = useState<'club' | 'players'>('club');
  const [clubs, setClubs] = useState<Club[]>(mockClubs);

  useEffect(() => {
    fetchClubs().then(setClubs).catch(() => setClubs(mockClubs));
  }, []);

  const handleRandomClub = async () => onClubSelect(await getRandomClubAsync());

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const activePlayerNames = mode === 'solo' ? playerNames.slice(0, 1) : playerNames.slice(0, playerCount);
  const canProceed = selectedClub && activePlayerNames.every((name) => name.trim());
  const isMultiplayer = mode !== 'solo';

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
        onClick={step === 'club' ? onBack : () => setStep('club')}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -2 }}
      >
        <ArrowLeft size={16} />
        Back
      </motion.button>

      {step === 'club' ? (
        <>
          {/* Header */}
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
              Pick from the album
            </p>
          </motion.div>

          {/* Random + Selected */}
          <motion.div
            className="flex flex-col items-center gap-4 mb-7"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              onClick={handleRandomClub}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 22px',
                borderRadius: '5px',
                background: 'white',
                border: '2px dashed #1e3a8a',
                color: '#1e3a8a',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: stickerShadow,
              }}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Shuffle size={15} />
              Random Club
            </motion.button>

            {/* Selected club mini sticker */}
            {selectedClub && (
              <motion.div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'white',
                  borderRadius: '5px',
                  padding: '10px 16px',
                  boxShadow: '0 4px 18px rgba(30,58,138,0.2), 0 0 0 2.5px #1e3a8a',
                }}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <img
                  src={selectedClub.logo}
                  alt={selectedClub.name}
                  style={{ width: 36, height: 36, objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.1rem',
                      color: '#1e3a8a',
                      letterSpacing: '0.04em',
                      lineHeight: 1.1,
                    }}
                  >
                    {selectedClub.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: '#8a7553',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedClub.country}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Club sticker grid */}
          <motion.div
            className="w-full max-w-4xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <ScrollArea className="h-72 w-full">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1 pr-4">
                {clubs.map((club, i) => {
                  const isSelected = selectedClub?.id === club.id;
                  return (
                    <motion.button
                      key={club.id}
                      onClick={() => onClubSelect(club)}
                      style={{
                        background: 'white',
                        borderRadius: '5px',
                        padding: '12px 8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isSelected
                          ? '0 4px 18px rgba(30,58,138,0.22), 0 0 0 2.5px #1e3a8a'
                          : stickerShadow,
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.18s ease',
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.02 * i }}
                    >
                      {/* Top color band on selected */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: '#1e3a8a',
                          }}
                        />
                      )}

                      <img
                        src={club.logo}
                        alt={club.name}
                        style={{ width: 40, height: 40, objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                      <div
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          color: isSelected ? '#1e3a8a' : '#3a2f1e',
                          letterSpacing: '0.04em',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                        }}
                      >
                        {club.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontWeight: 500,
                          fontSize: '0.6rem',
                          color: '#8a7553',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {club.country}
                      </div>

                      {isSelected && (
                        <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>

          {/* Next */}
          {selectedClub && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {hidePlayerNames ? (
                <motion.button
                  onClick={() => onStart([])}
                  style={{
                    background: '#1e3a8a',
                    color: 'white',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.4rem',
                    letterSpacing: '0.15em',
                    padding: '12px 40px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(30,58,138,0.38)',
                  }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  DONE
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setStep('players')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#1e3a8a',
                    color: 'white',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.4rem',
                    letterSpacing: '0.15em',
                    padding: '12px 40px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(30,58,138,0.38)',
                  }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  NEXT
                  <ArrowRight size={18} />
                </motion.button>
              )}
            </motion.div>
          )}
        </>
      ) : (
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

          {/* Club reminder */}
          {selectedClub && (
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'white',
                borderRadius: '5px',
                padding: '8px 14px',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <img
                src={selectedClub.logo}
                alt={selectedClub.name}
                style={{ width: 28, height: 28, objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
              />
              <span
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1rem',
                  color: '#1e3a8a',
                  letterSpacing: '0.04em',
                }}
              >
                {selectedClub.name}
              </span>
            </motion.div>
          )}

          {/* Player count */}
          {isMultiplayer && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.2em',
                  color: '#8a7553',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  marginBottom: '10px',
                }}
              >
                Number of players
              </p>
              <div className="flex gap-3 justify-center">
                {[2, 3, 4].map((count) => (
                  <motion.button
                    key={count}
                    onClick={() => setPlayerCount(count)}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.4rem',
                      letterSpacing: '0.03em',
                      background: playerCount === count ? '#1e3a8a' : 'white',
                      color: playerCount === count ? 'white' : '#1e3a8a',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: playerCount === count
                        ? '0 3px 14px rgba(30,58,138,0.38), 0 0 0 2.5px #1e3a8a'
                        : '0 2px 6px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                      transition: 'all 0.18s',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {count}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

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

          {/* Start button */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <motion.button
              onClick={() => onStart(activePlayerNames)}
              disabled={!canProceed}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: canProceed ? '#1e3a8a' : '#a09080',
                color: 'white',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.55rem',
                letterSpacing: '0.15em',
                padding: '13px 48px',
                borderRadius: '5px',
                border: 'none',
                cursor: canProceed ? 'pointer' : 'default',
                boxShadow: canProceed
                  ? '0 4px 18px rgba(30,58,138,0.4), 0 2px 4px rgba(0,0,0,0.18)'
                  : 'none',
              }}
              whileHover={canProceed ? { scale: 1.04, y: -2 } : {}}
              whileTap={canProceed ? { scale: 0.97 } : {}}
            >
              KICK OFF
              <ArrowRight size={20} />
            </motion.button>
          </motion.div>
        </>
      )}
    </div>
  );
};
