import { useState } from 'react';

const SESSION_KEY = 'aq_unlocked';
const CORRECT = 'alkoquiz1908';

export function usePasswordGate() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');

  const unlock = (password: string): boolean => {
    if (password === CORRECT) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
      return true;
    }
    return false;
  };

  return { unlocked, unlock };
}

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const { unlocked, unlock } = usePasswordGate();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlock(input)) {
      setError(true);
      setInput('');
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      fontFamily: 'Barlow Condensed, sans-serif',
    }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '40px 48px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: '280px',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>⚽🎯</div>
        <div style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.06em' }}>
          Football Darts
        </div>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Hasło"
          autoFocus
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '6px',
            border: error ? '2px solid #f87171' : '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 600,
            fontSize: '1rem',
            letterSpacing: '0.08em',
            outline: 'none',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        />
        {error && (
          <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 600, marginTop: '-8px' }}>
            Złe hasło
          </div>
        )}
        <button type="submit" style={{
          width: '100%',
          padding: '10px',
          borderRadius: '6px',
          border: 'none',
          background: '#2563eb',
          color: 'white',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: '0.06em',
          cursor: 'pointer',
        }}>
          Wejdź
        </button>
      </form>
    </div>
  );
}
