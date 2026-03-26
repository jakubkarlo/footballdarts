import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ThrowResultProps {
  result: {
    type: 'success' | 'bust' | 'over' | 'invalid' | 'miss';
    message: string;
    value?: number;
  } | null;
}

const CONFIG = {
  success: { border: '#15803d', color: '#15803d', label: 'GOAL', bg: '#f0fdf4' },
  bust:    { border: '#dc2626', color: '#dc2626', label: 'BUST', bg: '#fef2f2' },
  over:    { border: '#b45309', color: '#b45309', label: 'OVER', bg: '#fffbeb' },
  invalid: { border: '#8a7553', color: '#8a7553', label: 'N/A',  bg: '#faf5eb' },
  miss:    { border: '#b91c1c', color: '#b91c1c', label: 'MISS', bg: '#fef2f2' },
};

export const ThrowResult = ({ result }: ThrowResultProps) => {
  if (!result) return null;

  const cfg = CONFIG[result.type];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.message}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: cfg.bg,
          border: `2px solid ${cfg.border}`,
          borderRadius: '5px',
          padding: '10px 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        className={cn(
          result.type === 'success' && 'dart-throw',
          result.type === 'bust' && 'shake'
        )}
        initial={{ opacity: 0, y: -14, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Stamp label */}
        <div
          style={{
            border: `2px solid ${cfg.border}`,
            color: cfg.color,
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '0.9rem',
            letterSpacing: '0.1em',
            padding: '2px 8px',
            borderRadius: '3px',
            flexShrink: 0,
            transform: 'rotate(-4deg)',
          }}
        >
          {cfg.label}
        </div>

        {/* Message */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
              color: cfg.color,
            }}
          >
            {result.message}
          </p>
          {result.value && (
            <p
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600,
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                color: '#8a7553',
                marginTop: '1px',
              }}
            >
              Value: <span style={{ color: cfg.color, fontWeight: 700 }}>{result.value}</span> appearances
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
