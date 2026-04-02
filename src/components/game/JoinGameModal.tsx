import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Wifi } from 'lucide-react';

const stickerShadow = '0 2px 6px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)';

interface JoinGameModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export const JoinGameModal = ({
  isOpen,
  isLoading,
  error,
  onClose,
  onJoin,
}: JoinGameModalProps) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      await onJoin(code.toUpperCase());
    }
  };

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{ width: '100%', maxWidth: 380, background: '#ede3ce', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header strip */}
        <div style={{ background: '#1e3a8a', padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wifi size={20} />
              Join Game
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2 }}>
              Wpisz kod gry
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 22px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
            Kod gry
          </div>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="XXXXXX"
            maxLength={6}
            disabled={isLoading}
            autoFocus
            style={{
              width: '100%', padding: '12px 0', borderRadius: '5px',
              border: '2px solid rgba(30,58,138,0.2)', background: 'white',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem',
              color: '#1e3a8a', textAlign: 'center',
              outline: 'none', boxShadow: stickerShadow, boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = '#1e3a8a')}
            onBlur={e => (e.target.style.borderColor = 'rgba(30,58,138,0.2)')}
          />

          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ marginTop: 12, padding: '8px 12px', borderRadius: 5, background: 'rgba(185,28,28,0.08)', border: '1.5px solid rgba(185,28,28,0.3)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#b91c1c', textAlign: 'center' }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={code.length !== 6 || isLoading}
            style={{
              width: '100%', marginTop: 20,
              background: code.length === 6 ? '#1e3a8a' : 'rgba(30,58,138,0.35)',
              color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem',
              letterSpacing: '0.2em', padding: '13px 0', borderRadius: 5, border: 'none',
              cursor: code.length === 6 ? 'pointer' : 'not-allowed',
              boxShadow: code.length === 6 ? '0 4px 18px rgba(30,58,138,0.4)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            whileHover={code.length === 6 ? { scale: 1.02 } : {}}
            whileTap={code.length === 6 ? { scale: 0.97 } : {}}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Dołącz do gry'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};
