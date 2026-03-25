import { motion } from 'framer-motion';
import { Throw } from '@/types/game';

const BBC_PHOTO = 'https://ichef.bbci.co.uk/ace/standard/2560/cpsprodpb/d14d/live/6eac51d0-27dc-11ef-9588-6d96e597ad15.jpg';

interface PlayerStickerProps {
  throw_: Throw;
  index: number;
  ownerName?: string;
  hidden?: boolean;
}

const POSITION_COLORS: Record<string, string> = {
  goalkeeper: '#15803d',
  defender:   '#1e3a8a',
  midfielder: '#b45309',
  forward:    '#b91c1c',
  attacker:   '#b91c1c',
};

function positionColor(position?: string) {
  if (!position) return '#1e3a8a';
  return POSITION_COLORS[position.toLowerCase()] ?? '#1e3a8a';
}

function positionAbbr(position?: string) {
  if (!position) return 'MF';
  const p = position.toLowerCase();
  if (p.includes('goal')) return 'GK';
  if (p.includes('def'))  return 'DF';
  if (p.includes('mid'))  return 'MF';
  return 'FW';
}

export const PlayerSticker = ({ throw_, index, ownerName, hidden = false }: PlayerStickerProps) => {
  const color   = hidden ? '#4a3d2e' : positionColor(throw_.position);
  const abbr    = positionAbbr(throw_.position);
  const num     = String(index + 1).padStart(3, '0');
  const surname = throw_.playerName.split(' ').slice(-1)[0] ?? throw_.playerName;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.55, rotate: -6 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * 0.045 }}
      style={{
        width: 90,
        flexShrink: 0,
        background: 'white',
        borderRadius: 6,
        padding: 3,
        boxShadow: '0 5px 18px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.14)',
      }}
    >
      {/* Inner card — rounded clip */}
      <div style={{ borderRadius: 4, overflow: 'hidden' }}>

        {/* ── Photo area ───────────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          height: 90,
          background: hidden
            ? 'repeating-linear-gradient(45deg, #2e241a 0px, #2e241a 4px, #241c14 4px, #241c14 8px)'
            : '#1a120a',
          overflow: 'hidden',
        }}>
          {/* Photo */}
          {!hidden && (
            <img
              src={throw_.photo || BBC_PHOTO}
              alt={throw_.playerName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.currentTarget.src = BBC_PHOTO; }}
            />
          )}

          {/* Bottom gradient for name legibility */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 44,
            background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          }} />

          {/* Position badge — top left */}
          <div style={{
            position: 'absolute', top: 5, left: 5,
            background: hidden ? 'rgba(255,255,255,0.12)' : color,
            borderRadius: 2,
            padding: '2px 5px',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800,
            fontSize: '0.52rem',
            color: 'white',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}>
            {hidden ? '?' : abbr}
          </div>

          {/* Sticker number — top right */}
          <div style={{
            position: 'absolute', top: 5, right: 5,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: '0.48rem',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.04em',
          }}>
            #{num}
          </div>

          {/* Player surname — bottom overlay */}
          <div style={{
            position: 'absolute', bottom: 5, left: 5, right: 5,
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: hidden ? '0.85rem' : '0.82rem',
            color: hidden ? 'rgba(255,255,255,0.28)' : 'white',
            letterSpacing: '0.06em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontStyle: hidden ? 'italic' : 'normal',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            {hidden ? '???' : surname}
          </div>

          {/* Foil shimmer */}
          {!hidden && <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />}

          {/* Hidden "?" watermark */}
          {hidden && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '3rem',
              color: 'rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}>?</div>
          )}
        </div>

        {/* ── Stat footer ──────────────────────────────────────────── */}
        <div style={{
          background: color,
          padding: '5px 6px 5px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 4,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* subtle diagonal texture */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(60deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 6px)',
            pointerEvents: 'none',
          }} />
          <span style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.65rem',
            color: 'white',
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}>
            {throw_.appearances}
          </span>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: '0.44rem',
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            paddingBottom: 2,
          }}>
            apps
          </span>
        </div>

        {/* ── Owner tag ─────────────────────────────────────────────── */}
        {ownerName && (
          <div style={{
            background: 'white',
            padding: '2px 5px 3px',
            textAlign: 'center',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800,
            fontSize: '0.48rem',
            color: color,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {ownerName}
          </div>
        )}
      </div>
    </motion.div>
  );
};
