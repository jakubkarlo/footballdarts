/**
 * Shared UI pieces reused by TurnsGameBoard and OnlineTurnsGameBoard.
 */
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

export const PLAYER_COLORS = ['#1e3a8a', '#b91c1c', '#15803d', '#6a35c5'];

export const BG: React.CSSProperties = {
  backgroundColor: '#ede3ce',
  backgroundImage:
    'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)',
};

export const OUTLINE_BTN: React.CSSProperties = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '0.78rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#7a6340',
  background: 'white',
  border: '1.5px solid #d4c4a0',
  borderRadius: '4px',
  padding: '7px 14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};

// ─── Round result tile ────────────────────────────────────────────────────────

export interface RoundResultTileProps {
  playerName: string;
  color: string;
  apps: number;
  isElim: boolean;
  isStopped: boolean;   // stopped this round → brown
  isWaiting: boolean;   // stopped/busted in a previous round → dark brown
  hitZero: boolean;
  score: number;
  lives: number;
  reason?: 'over180' | 'miss' | 'bust' | 'timeout' | 'below zero' | null;
  isMe?: boolean;
  allowMisses?: boolean;
  delay?: number;
}

export const RoundResultTile = ({
  playerName, color, apps, isElim, isStopped, isWaiting, hitZero,
  score, lives, reason, isMe, allowMisses, delay = 0,
}: RoundResultTileProps) => {
  const bg = isWaiting
    ? '#7a6340'
    : isStopped
    ? '#92400e'
    : isElim
    ? '#b91c1c'
    : hitZero
    ? '#15803d'
    : 'white';

  const light = isWaiting || isStopped || isElim || hitZero;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: bg,
        borderRadius: 8,
        padding: '22px 28px',
        textAlign: 'center',
        boxShadow: isElim
          ? '0 0 0 3px #b91c1c, 0 0 28px rgba(185,28,28,0.5)'
          : hitZero
          ? '0 0 0 3px #15803d, 0 0 28px rgba(21,128,61,0.5)'
          : '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: 140,
        borderTop: light ? 'none' : `4px solid ${color}`,
      }}
    >
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: light ? 'rgba(255,255,255,0.8)' : color, letterSpacing: '0.06em', marginBottom: 8 }}>
        {playerName}
      </div>

      {isWaiting && (
        <>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', color: 'white', lineHeight: 1 }}>{score}</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Waiting</div>
        </>
      )}

      {isStopped && !isWaiting && (
        <>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', color: 'white', lineHeight: 1 }}>{score}</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Stopped</div>
        </>
      )}

      {isElim && !isWaiting && (
        <>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.6rem', color: 'white', lineHeight: 1, letterSpacing: '0.08em' }}>OUT!</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
            {reason === 'over180' ? 'over 180'
              : reason === 'miss' ? (allowMisses ? 'no lives left' : 'miss!')
              : reason === 'timeout' ? 'timeout'
              : 'below zero'}
          </div>
        </>
      )}

      {!isWaiting && !isStopped && !isElim && (
        <>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: hitZero ? 'rgba(255,255,255,0.7)' : '#8a7553', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            -{apps} apps
          </div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', color: hitZero ? 'white' : color, lineHeight: 1 }}>
            {hitZero ? '0 ★' : score}
          </div>
          {allowMisses && !hitZero && (
            <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {[0, 1, 2].map((_, i) => (
                <span key={i} style={{ color: i < lives ? '#b91c1c' : '#d4c4a0' }}>♥</span>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

// ─── Game over screen ─────────────────────────────────────────────────────────

export interface GameOverPlayer {
  id: string;
  name: string;
  score: number;
  isElim: boolean;
  isMe?: boolean;
  color: string;
}

interface GameOverScreenProps {
  players: GameOverPlayer[];
  onNewGame: () => void;
  onLeave?: () => void;
  extraButtons?: React.ReactNode;
}

export const GameOverScreen = ({ players, onNewGame, onLeave, extraButtons }: GameOverScreenProps) => {
  const active = players.filter(p => !p.isElim);
  const minScore = active.length > 0 ? Math.min(...active.map(p => p.score)) : null;
  const winners = minScore !== null ? active.filter(p => p.score === minScore) : [];
  const nonWinners = players
    .filter(p => !winners.find(w => w.id === p.id))
    .sort((a, b) => {
      if (!a.isElim && b.isElim) return -1;
      if (a.isElim && !b.isElim) return 1;
      return a.score - b.score;
    });

  const isDraw = winners.length > 1;
  const winnerColor = winners.length === 1 ? winners[0].color : '#5a4a35';
  const winnerBg = (() => {
    if (winners.length === 0) return '#5a4a35';
    if (winners.length === 1) return winners[0].color;
    const pct = 100 / winners.length;
    return `linear-gradient(90deg, ${winners.map((w, k) => `${w.color} ${k * pct}% ${(k + 1) * pct}%`).join(', ')})`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-full"
      style={{ maxWidth: 480 }}
    >
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: '#8a7553', letterSpacing: '0.3em', marginBottom: 16, textTransform: 'uppercase' }}>
        {winners.length === 0 ? '— NO WINNER —' : isDraw ? '★ DRAW ★' : '★ WINNER ★'}
      </div>

      {winners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          style={{ background: winnerBg, borderRadius: 8, padding: '28px 40px', textAlign: 'center', boxShadow: `0 8px 40px ${winnerColor}55, 0 0 0 4px white, 0 0 0 7px ${winnerColor}`, position: 'relative', overflow: 'hidden', marginBottom: 24 }}
        >
          <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          {isDraw ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {winners.map(w => (
                <span key={w.id} style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1 }}>
              {winners[0].name}
            </div>
          )}
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>
            {winners[0].score} pts
          </div>
        </motion.div>
      )}

      {nonWinners.length > 0 && (
        <div style={{ width: '100%', maxWidth: 320, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nonWinners.map((p, rank) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + rank * 0.06 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#3a2e1e', letterSpacing: '0.04em', flex: 1 }}>
                {p.name}
              </span>
              {p.isElim
                ? <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: '#b91c1c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BUST</span>
                : <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#5a4a35' }}>{p.score} pts</span>
              }
            </motion.div>
          ))}
        </div>
      )}

      {winners.length === 0 && (
        <div style={{ marginBottom: 28, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#8a7553' }}>Wszyscy odpadli.</div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <motion.button onClick={onNewGame}
          style={{ background: 'white', color: '#1e3a8a', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.15em', padding: '10px 28px', borderRadius: 5, border: '2px solid #1e3a8a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <RotateCcw size={14} /> Nowa gra
        </motion.button>
        {extraButtons}
      </div>
    </motion.div>
  );
};
