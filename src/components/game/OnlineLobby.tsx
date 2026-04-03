import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnlineGameSession, Club } from '@/types/game';
import { ArrowLeft, Copy, Check, Play, Loader2, Wifi, Zap } from 'lucide-react';
import { GameSetup } from './GameSetup';
import { PLAYER_COLORS, BG, OUTLINE_BTN } from './TurnsShared';

const stickerShadow = '0 2px 6px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)';

interface OnlineLobbyProps {
  session: OnlineGameSession;
  myPlayerId: string | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  onSetClub: (club: Club) => void;
  onSetReady: (name: string) => Promise<void>;
  onStartGame: () => void;
  onLeave: () => void;
}

export const OnlineLobby = ({
  session,
  myPlayerId,
  isHost,
  isLoading,
  error,
  onSetClub,
  onSetReady,
  onStartGame,
  onLeave,
}: OnlineLobbyProps) => {
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<'waiting' | 'club'>('waiting');
  const [myName, setMyName] = useState('');
  const [isSettingReady, setIsSettingReady] = useState(false);

  const myPlayer = session.players.find(p => p.id === myPlayerId);
  const amReady = myPlayer?.isFinished ?? false;
  const allReady = session.players.length >= 2 && session.players.every(p => p.isFinished);
  const modeLabel = session.mode === 'multiplayer-blitz' ? 'BLITZ' : 'TURNS';
  const modeColor = session.mode === 'multiplayer-blitz' ? '#92400e' : '#b91c1c';

  const copyCode = () => {
    navigator.clipboard.writeText(session.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReady = async () => {
    setIsSettingReady(true);
    const defaultName = `Player ${(myPlayer?.playerOrder ?? 0) + 1}`;
    await onSetReady(myName.trim() || defaultName);
    setIsSettingReady(false);
  };

  // Host: club selection
  if (phase === 'club' && isHost) {
    return (
      <GameSetup
        mode={session.mode}
        selectedClub={session.club}
        onClubSelect={onSetClub}
        onStart={() => setPhase('waiting')}
        onBack={() => setPhase('waiting')}
        hidePlayerNames
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={BG}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Back button */}
        <motion.button
          onClick={onLeave}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a7553', padding: 0, marginBottom: 20 }}
          whileHover={{ color: '#4a3f2e' }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft size={15} />
          Wyjdź
        </motion.button>

        {/* Title + code */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1e3a8a', borderRadius: 20, padding: '4px 14px', marginBottom: 10 }}>
            <Wifi size={11} style={{ color: 'white' }} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', color: 'white', textTransform: 'uppercase' }}>Online Lobby</span>
          </div>

          {/* Game code */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2.8rem, 10vw, 4.2rem)', color: '#1e3a8a', lineHeight: 1 }}>
              {session.code}
            </span>
            <motion.button
              onClick={copyCode}
              style={{ ...OUTLINE_BTN, padding: '8px 10px', color: copied ? '#15803d' : '#7a6340', borderColor: copied ? '#15803d' : '#d4c4a0' }}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.94 }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </motion.button>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.72rem', color: '#a09070', letterSpacing: '0.1em' }}>
            Podaj kod znajomym
          </div>
        </motion.div>

        {/* Mode / score chips */}
        <motion.div
          style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {[
            { label: modeLabel, color: modeColor, icon: session.mode === 'multiplayer-blitz' ? <Zap size={11} /> : null },
            { label: `${session.startingScore} pts`, color: '#1e3a8a', icon: null },
            { label: `max ${session.maxPlayers}`, color: '#1e3a8a', icon: null },
          ].map(chip => (
            <div key={chip.label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', borderRadius: 4, padding: '4px 10px', boxShadow: stickerShadow, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: chip.color }}>
              {chip.icon}
              {chip.label}
            </div>
          ))}
        </motion.div>

        {/* Players list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ background: 'white', borderRadius: 8, boxShadow: stickerShadow, overflow: 'hidden', marginBottom: 16 }}
        >
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f0e8d8', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase' }}>
            Gracze ({session.players.length}/{session.maxPlayers})
          </div>

          {session.players.map((player, idx) => {
            const isMe = player.id === myPlayerId;
            const color = PLAYER_COLORS[idx] ?? '#1e3a8a';
            const ready = player.isFinished;
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: idx < session.players.length - 1 ? '1px solid #f5f0e8' : 'none', background: isMe ? `${color}08` : 'transparent' }}
              >
                {/* Color dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: ready ? '#15803d' : color, flexShrink: 0, transition: 'background 0.3s' }} />

                {/* Name */}
                <div style={{ flex: 1, fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', color, letterSpacing: '0.04em' }}>
                  {player.playerName}
                  {idx === 0 && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.6rem', color: '#8a7553', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 8 }}>Host</span>}
                  {isMe && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.6rem', color: color, opacity: 0.7, letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 6 }}>Ty</span>}
                </div>

                {/* Ready badge */}
                <AnimatePresence mode="wait">
                  {ready ? (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#15803d', background: 'rgba(21,128,61,0.1)', borderRadius: 4, padding: '3px 8px' }}
                    >
                      ✓ Gotowy
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', color: '#a09070' }}
                    >
                      wybiera…
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: session.maxPlayers - session.players.length }).map((_, i) => (
            <div key={`empty-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid #f5f0e8' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#d4c4a0', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.8rem', color: '#c4b49a', letterSpacing: '0.06em' }}>Czeka na gracza…</span>
            </div>
          ))}
        </motion.div>

        {/* My name input + READY — only if not yet ready */}
        {!amReady && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ background: 'white', borderRadius: 8, padding: '16px', boxShadow: stickerShadow, marginBottom: 16 }}
          >
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.25em', color: '#8a7553', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              Twoje imię
            </div>
            <input
              value={myName}
              onChange={e => setMyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !amReady && handleReady()}
              placeholder={`Player ${(myPlayer?.playerOrder ?? 0) + 1}`}
              maxLength={24}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 5, border: '2px solid rgba(30,58,138,0.2)', background: '#fafaf8', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.05em', color: '#1e3a8a', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
              onFocus={e => (e.target.style.borderColor = '#1e3a8a')}
              onBlur={e => (e.target.style.borderColor = 'rgba(30,58,138,0.2)')}
            />
            <motion.button
              onClick={handleReady}
              disabled={isSettingReady}
              style={{ width: '100%', background: '#15803d', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', letterSpacing: '0.18em', padding: '12px 0', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(21,128,61,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
            >
              {isSettingReady
                ? <Loader2 size={18} className="animate-spin" />
                : '✓ Jestem gotowy'}
            </motion.button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 5, background: 'rgba(185,28,28,0.08)', border: '1.5px solid rgba(185,28,28,0.3)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#b91c1c', textAlign: 'center' }}
          >
            {error}
          </motion.div>
        )}

        {/* Club bar + actions — visible for all ready players */}
        {amReady && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Club bar */}
            <AnimatePresence mode="wait">
              {session.club ? (
                <motion.div
                  key="club"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ ...OUTLINE_BTN, color: '#1e3a8a', borderColor: '#1e3a8a', padding: '9px 14px', gap: 8, cursor: 'default', justifyContent: 'center' }}
                >
                  <img
                    src={session.club.logo}
                    alt={session.club.name}
                    style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                  />
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#1e3a8a', letterSpacing: '0.04em' }}>
                    {session.club.name}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="no-club"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#a09070', letterSpacing: '0.08em', padding: '8px 0' }}
                >
                  {isHost ? 'Wybierz klub dla wszystkich' : 'Host wybiera klub…'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Host buttons */}
            {isHost && (
              <AnimatePresence mode="wait">
                {session.club ? (
                  <motion.div key="has-club" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <motion.button
                      onClick={onStartGame}
                      disabled={isLoading}
                      style={{ width: '100%', background: '#15803d', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', letterSpacing: '0.2em', padding: '14px 0', borderRadius: 6, border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(21,128,61,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden' }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
                      {isLoading ? <Loader2 size={22} className="animate-spin" /> : <><Play size={18} /> Gramy!</>}
                    </motion.button>
                    <motion.button
                      onClick={() => setPhase('club')}
                      style={{ ...OUTLINE_BTN, width: '100%', justifyContent: 'center', padding: '9px 0', fontSize: '0.78rem' }}
                      whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                    >
                      Zmień klub
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div key="no-club" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <motion.button
                      onClick={() => setPhase('club')}
                      disabled={!allReady}
                      style={{ width: '100%', background: allReady ? '#1e3a8a' : 'rgba(30,58,138,0.35)', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', letterSpacing: '0.2em', padding: '14px 0', borderRadius: 6, border: 'none', cursor: allReady ? 'pointer' : 'not-allowed', boxShadow: allReady ? '0 4px 18px rgba(30,58,138,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden' }}
                      whileHover={allReady ? { scale: 1.02, y: -2 } : {}}
                      whileTap={allReady ? { scale: 0.97 } : {}}
                    >
                      {allReady && <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />}
                      <Play size={18} /> Wybierz klub
                    </motion.button>
                    {!allReady && (
                      <div style={{ textAlign: 'center', marginTop: 8, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#a09070', letterSpacing: '0.08em' }}>
                        Czekaj aż wszyscy będą gotowi
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Non-host — waiting info after club chosen */}
            {!isHost && session.club && (
              <div style={{ textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#8a7553', letterSpacing: '0.08em' }}>
                Czekasz aż host zacznie grę…
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
};
