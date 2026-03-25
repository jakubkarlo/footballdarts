import { motion } from 'framer-motion';
import { GameState } from '@/types/game';
import { RotateCcw, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface GameResultProps {
  gameState: GameState;
  onPlayAgain: () => void;
}

const stickerShadow = '0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07)';

const PLACE_COLORS = ['#d97706', '#6b7280', '#92400e'];
const PLACE_LABELS = ['1ST', '2ND', '3RD', '4TH'];

export const GameResult = ({ gameState, onPlayAgain }: GameResultProps) => {
  const winner = gameState.winner;
  const isMultiplayer = gameState.mode !== 'solo';
  const sortedPlayers = [...gameState.players].sort((a, b) => a.score - b.score);

  const getResultMessage = () => {
    if (!winner) return 'GAME OVER';
    if (winner.score === 0) return 'PERFECT FINISH!';
    if (winner.score <= 10) return 'EXCELLENT!';
    if (winner.score <= 50) return 'GREAT GAME!';
    return 'GAME OVER';
  };

  useEffect(() => {
    if (winner && winner.score <= 20) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d97706', '#1e3a8a', '#b91c1c', '#ffffff'],
      });
    }
  }, [winner]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        backgroundColor: '#ede3ce',
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)`,
      }}
    >
      {/* Trophy sticker */}
      <motion.div
        style={{
          background: 'white',
          borderRadius: '5px',
          boxShadow: '0 6px 28px rgba(217,119,6,0.28), 0 0 0 3px #d97706',
          overflow: 'hidden',
          marginBottom: '28px',
          position: 'relative',
          width: 180,
        }}
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
      >
        {/* Gold header */}
        <div
          style={{
            background: '#d97706',
            padding: '10px 14px 8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.3rem',
              color: 'white',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            {isMultiplayer ? winner?.name || 'WINNER' : 'RESULT'}
          </div>
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            #GOLD
          </div>
        </div>

        {/* Trophy body */}
        <div style={{ padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.8rem', lineHeight: 1, marginBottom: '6px' }}>🏆</div>
          <div
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.5rem',
              color: '#d97706',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            {getResultMessage()}
          </div>
          {winner && (
            <div
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '3.5rem',
                color: '#1e3a8a',
                letterSpacing: '0.02em',
                lineHeight: 1,
                marginTop: '4px',
              }}
            >
              {winner.score}
            </div>
          )}
          {winner && (
            <div
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600,
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                color: '#8a7553',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              {winner.throws.length} throws
            </div>
          )}
        </div>

        {/* Foil shimmer */}
        <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      </motion.div>

      {/* Club badge */}
      {gameState.club && (
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'white',
            borderRadius: '5px',
            padding: '8px 16px',
            marginBottom: '24px',
            boxShadow: stickerShadow,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <img
            src={gameState.club.logo}
            alt={gameState.club.name}
            style={{ width: 30, height: 30, objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
          <div>
            <div
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1rem',
                color: '#1e3a8a',
                letterSpacing: '0.04em',
              }}
            >
              {gameState.club.name}
            </div>
            <div
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600,
                fontSize: '0.62rem',
                color: '#8a7553',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {gameState.club.country}
            </div>
          </div>
        </motion.div>
      )}

      {/* Final standings — sticker row */}
      {isMultiplayer && (
        <motion.div
          style={{
            width: '100%',
            maxWidth: '440px',
            marginBottom: '24px',
          }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.25em',
              color: '#8a7553',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '10px',
            }}
          >
            — Final Standings —
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'white',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  boxShadow: index === 0
                    ? '0 3px 14px rgba(217,119,6,0.2), 0 0 0 2px #d97706'
                    : stickerShadow,
                }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + index * 0.07 }}
              >
                {/* Place band */}
                <div
                  style={{
                    background: PLACE_COLORS[index] || '#374151',
                    width: 46,
                    alignSelf: 'stretch',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '0.9rem',
                      color: 'white',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {PLACE_LABELS[index]}
                  </span>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      letterSpacing: '0.04em',
                      color: '#2a1e0e',
                    }}
                  >
                    {player.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span
                      style={{
                        fontFamily: 'Bebas Neue, sans-serif',
                        fontSize: '1.5rem',
                        color: '#1e3a8a',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {player.score}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#8a7553',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {player.throws.length} throws
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Throw collection — winner's throws as mini stickers */}
      {winner && winner.throws.length > 0 && (
        <motion.div
          style={{
            width: '100%',
            maxWidth: '440px',
            marginBottom: '28px',
            background: 'white',
            borderRadius: '5px',
            overflow: 'hidden',
            boxShadow: stickerShadow,
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <div
            style={{
              background: '#1e3a8a',
              padding: '7px 14px',
            }}
          >
            <span
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '0.95rem',
                color: 'white',
                letterSpacing: '0.08em',
              }}
            >
              {isMultiplayer ? `${winner.name}'s Throws` : 'Your Throws'}
            </span>
          </div>
          <div style={{ padding: '10px 14px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {winner.throws.map((t, i) => (
              <motion.span
                key={i}
                style={{
                  background: '#f5f0e8',
                  borderRadius: '3px',
                  padding: '4px 9px',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: '#4a3f2e',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.04 }}
              >
                {t.playerName}{' '}
                <span style={{ color: '#b91c1c', fontWeight: 700 }}>({t.appearances})</span>
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
      >
        <motion.button
          onClick={onPlayAgain}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: '#1e3a8a',
            color: 'white',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.35rem',
            letterSpacing: '0.14em',
            padding: '12px 32px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(30,58,138,0.38)',
          }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <RotateCcw size={16} />
          Play Again
        </motion.button>

        <motion.button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: 'white',
            color: '#7a6340',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '12px 22px',
            borderRadius: '5px',
            border: '1.5px solid #d4c4a0',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.09)',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Football Darts',
                text: `My score: ${winner?.score}! Can you beat me?`,
              });
            }
          }}
        >
          <Share2 size={14} />
          Share
        </motion.button>
      </motion.div>
    </div>
  );
};
