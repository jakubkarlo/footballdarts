import { motion } from 'framer-motion';
import { Throw } from '@/types/game';

interface PlayerStickerProps {
  throw_: Throw;
  index: number;
  ownerName?: string;
}

const POSITION_COLORS: Record<string, string> = {
  goalkeeper: '#15803d',
  defender:   '#1e3a8a',
  midfielder: '#92400e',
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

export const PlayerSticker = ({ throw_, index, ownerName }: PlayerStickerProps) => {
  const color = positionColor(throw_.position);
  const abbr  = positionAbbr(throw_.position);
  const num   = String(index + 1).padStart(3, '0');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -4 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22, delay: index * 0.04 }}
      style={{
        width: 80,
        background: 'white',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Color header band */}
      <div style={{ background: color, padding: '4px 6px 3px', position: 'relative' }}>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 800,
          fontSize: '0.55rem',
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.05em',
        }}>
          #{num}
        </div>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '0.75rem',
          color: 'white',
          letterSpacing: '0.06em',
          lineHeight: 1,
        }}>
          {abbr}
        </div>
      </div>

      {/* Photo */}
      <div style={{ position: 'relative', background: '#f0ebe0' }}>
        <img
          src={throw_.photo || 'https://ichef.bbci.co.uk/ace/standard/2560/cpsprodpb/d14d/live/6eac51d0-27dc-11ef-9588-6d96e597ad15.jpg'}
          alt={throw_.playerName}
          style={{ width: '100%', height: 64, objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.currentTarget.src = 'https://ichef.bbci.co.uk/ace/standard/2560/cpsprodpb/d14d/live/6eac51d0-27dc-11ef-9588-6d96e597ad15.jpg';
          }}
        />
        {/* foil shimmer */}
        <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      </div>

      {/* Info */}
      <div style={{ padding: '4px 5px 5px' }}>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '0.7rem',
          color: '#1e1a14',
          letterSpacing: '0.03em',
          lineHeight: 1.1,
          marginBottom: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {throw_.playerName.split(' ').pop()}
        </div>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1.1rem',
          color,
          lineHeight: 1,
          letterSpacing: '0.02em',
        }}>
          {throw_.appearances}
        </div>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600,
          fontSize: '0.5rem',
          color: '#8a7553',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          appearances
        </div>
        {ownerName && (
          <div style={{
            marginTop: 2,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: '0.5rem',
            color: 'white',
            background: color,
            borderRadius: 2,
            padding: '1px 3px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-block',
          }}>
            {ownerName}
          </div>
        )}
      </div>
    </motion.div>
  );
};
