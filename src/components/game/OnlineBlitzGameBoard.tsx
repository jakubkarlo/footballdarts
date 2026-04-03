import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnlineGameSession, OnlineDraftEntry, Throw } from '@/types/game';
import { PlayerInput } from './PlayerInput';
import { CardBack } from './BlitzGameBoard';
import { searchPlayer } from '@/data/mockData';
import { useAllPlayers } from '@/hooks/useAllPlayers';
import { HelpCircle, X, RotateCcw, Zap, Lock } from 'lucide-react';
import { PLAYER_COLORS, BG, OUTLINE_BTN } from './TurnsShared';
const BBC_PHOTO = 'https://ichef.bbci.co.uk/ace/standard/2560/cpsprodpb/d14d/live/6eac51d0-27dc-11ef-9588-6d96e597ad15.jpg';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnlineBlitzGameBoardProps {
  session: OnlineGameSession;
  myPlayerId: string | null;
  myPlayerOrder: number | null;
  revealSignal: number;
  isLoading: boolean;
  error: string | null;
  onLockIn: (draft: OnlineDraftEntry[]) => Promise<void>;
  onTriggerReveal: () => void;
  onLeave: () => void;
}

// ─── Online flip card (mirrors local FlipCard but uses Throw data) ────────────

const OnlineFlipCard = ({
  throw_,
  playerColorIdx,
  playerName,
  cardIndex,
  isRevealed,
  revealDelay,
  isBusted,
}: {
  throw_: Throw;
  playerColorIdx: number;
  playerName: string;
  cardIndex: number;
  isRevealed: boolean;
  revealDelay: number;
  isBusted: boolean;
}) => {
  const backColor = PLAYER_COLORS[playerColorIdx] ?? '#1e3a8a';
  const surname = throw_.playerName.split(' ').slice(-1)[0] ?? throw_.playerName;

  return (
    <motion.div
      style={{ width: 90, height: 132, perspective: 700, flexShrink: 0 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: cardIndex * 0.06 }}
    >
      <motion.div
        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.55, delay: revealDelay, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* BACK */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <CardBack playerName={playerName} color={backColor} cardIndex={cardIndex} />
        </div>

        {/* FRONT — matches PlayerSticker design */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'white',
          borderRadius: 6,
          padding: 3,
          boxShadow: '0 5px 18px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ borderRadius: 4, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Bust overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isBusted && isRevealed ? 1 : 0 }}
              transition={{ delay: revealDelay + 0.55, duration: 0.3 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(185,28,28,0.55)', zIndex: 10, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'white', letterSpacing: '0.08em', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>✕</div>
            </motion.div>

            {/* Photo */}
            <div style={{ position: 'relative', flex: 1, background: '#1a120a', overflow: 'hidden' }}>
              {throw_.appearances > 0 && (
                <img
                  src={throw_.photo || BBC_PHOTO}
                  alt={throw_.playerName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { e.currentTarget.src = BBC_PHOTO; }}
                />
              )}
              {/* Miss: big X */}
              {throw_.appearances === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 14, background: 'rgb(185 28 28)' }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3.2rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>✕</div>
                </div>
              )}
              {/* bottom gradient */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }} />
              {/* surname */}
              <div style={{ position: 'absolute', bottom: 5, left: 5, right: 5, fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.82rem', color: 'white', letterSpacing: '0.06em', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {surname}
              </div>
              {throw_.appearances > 0 && <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />}
            </div>

            {/* Stat footer */}
            <div style={{ background: backColor, padding: '5px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(60deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 6px)', pointerEvents: 'none' }} />
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.65rem', color: 'white', lineHeight: 1, letterSpacing: '0.02em' }}>{throw_.appearances}</span>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.44rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', paddingBottom: 2 }}>apps</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Winner logic (N players) ─────────────────────────────────────────────────

function computeWinner(players: OnlineGameSession['players']): { winnerId: string | null; isDraw: boolean } {
  if (players.length === 0) return { winnerId: null, isDraw: false };
  const alive = players.filter(p => !p.isBusted);
  if (alive.length > 0) {
    const minScore = Math.min(...alive.map(p => p.score));
    const winners = alive.filter(p => p.score === minScore);
    if (winners.length > 1) return { winnerId: null, isDraw: true };
    return { winnerId: winners[0].id, isDraw: false };
  }
  // All busted — highest (least negative) wins
  const maxScore = Math.max(...players.map(p => p.score));
  const winners = players.filter(p => p.score === maxScore);
  if (winners.length > 1) return { winnerId: null, isDraw: true };
  return { winnerId: winners[0].id, isDraw: false };
}

// ─── Rules overlay ────────────────────────────────────────────────────────────

const RulesOverlay = ({ onClose, startingScore }: { onClose: () => void; startingScore: number }) => {
  const rules = [
    { num: '01', title: 'Cel gry', body: `Zaczynasz od ${startingScore} punktów. Wybierasz piłkarzy — ich suma występów jest odejmowana od Twojego wyniku. Wygrywa ten, kto jest najbliżej zera.`, color: '#92400e' },
    { num: '02', title: 'Gra jednoczesna', body: 'Wszyscy gracze wybierają piłkarzy w tym samym czasie — każdy na swoim urządzeniu. Nikt nie widzi kart innych graczy.', color: '#1e3a8a' },
    { num: '03', title: 'Potwierdź wybór', body: 'Kliknij "POTWIERDŹ" gdy skończysz wybierać. Po potwierdzeniu nie możesz edytować kart — czekasz na pozostałych graczy.', color: '#1e3a8a' },
    { num: '04', title: 'Timer', body: 'Jeśli timer jest ustawiony — po jego upływie Twoje karty są automatycznie blokowane.', color: '#d97706' },
    { num: '05', title: 'Bust', body: 'Jeśli suma Twoich kart przekroczy wynik startowy (zejdzie poniżej zera) — odpadasz (BUST).', color: '#b91c1c' },
    { num: '06', title: 'Shoot!', body: 'Gdy wszyscy potwierdzą — host klika SHOOT! Karty odkrywają się jednocześnie dla wszystkich. Wygrywa gracz z wynikiem najbliższym zera.', color: '#15803d' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#ede3ce', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)', borderRadius: 10, padding: '28px 28px 24px', maxWidth: 420, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#92400e', letterSpacing: '0.04em', lineHeight: 1 }}>Zasady gry</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.72rem', color: '#8a7553', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Football Darts · Blitz · Online</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7553', padding: 4 }}><X size={20} /></button>
        </div>
        {rules.map(r => (
          <div key={r.num} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 4, background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>{r.num}</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: r.color, letterSpacing: '0.06em', lineHeight: 1, marginBottom: 3 }}>{r.title}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 500, fontSize: '0.88rem', color: '#5a4a35', lineHeight: 1.45 }}>{r.body}</div>
            </div>
          </div>
        ))}
        <motion.button
          onClick={onClose}
          style={{ width: '100%', marginTop: 8, background: '#92400e', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.2em', padding: '11px 0', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(146,64,14,0.3)' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        >
          Rozumiem — gramy!
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const OnlineBlitzGameBoard = ({
  session,
  myPlayerId,
  myPlayerOrder,
  revealSignal,
  isLoading: hookLoading,
  error: hookError,
  onLockIn,
  onTriggerReveal,
  onLeave,
}: OnlineBlitzGameBoardProps) => {
  const [draft, setDraft] = useState<OnlineDraftEntry[]>([]);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleTimeoutRef = useRef<() => void>(() => {});
  const handleConfirmRef = useRef<() => void>(() => {});

  const { allPlayers, isLoading: isLoadingSquad } = useAllPlayers();

  const myPlayer = session.players.find(p => p.id === myPlayerId);
  const myColorIdx = session.players.findIndex(p => p.id === myPlayerId);
  const myColor = PLAYER_COLORS[myColorIdx >= 0 ? myColorIdx : 0];
  const isHost = myPlayerOrder === 0;

  const usedIds = new Set(draft.map(e => e.id));

  const SCORE_R = 46;
  const SCORE_C = 2 * Math.PI * SCORE_R;
  const displayScore = myPlayer?.score ?? session.startingScore;

  // ── Reveal signal ─────────────────────────────────────────────────────────────

  const prevRevealSignal = useRef(revealSignal);
  useEffect(() => {
    if (revealSignal > prevRevealSignal.current) {
      prevRevealSignal.current = revealSignal;
      setIsRevealed(true);
    }
  }, [revealSignal]);

  useEffect(() => {
    if (!isRevealed) return;
    const maxCards = Math.max(...session.players.map(p => p.throws.length), 0);
    const delay = maxCards * 0.09 + 1.2;
    const t = setTimeout(() => setShowWinner(true), delay * 1000);
    return () => clearTimeout(t);
  }, [isRevealed, session.players]);

  // ── Timer ─────────────────────────────────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    if (isLocked || isSubmitting) return;
    handleConfirmRef.current();
  }, [isLocked, isSubmitting]);

  useEffect(() => { handleTimeoutRef.current = handleTimeout; }, [handleTimeout]);

  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!session.timer || session.status !== 'playing') { setTimeLeft(null); return; }
    // Don't restart if already locked — just let existing timer run out
    if (isLocked) return;
    setTimeLeft(session.timer);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimeout(() => handleTimeoutRef.current(), 0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.timer, session.status]);

  const countdownFraction = session.timer && timeLeft !== null ? timeLeft / session.timer : 1;
  const countdownRingColor = countdownFraction > 0.4 ? '#15803d' : countdownFraction > 0.2 ? '#d97706' : '#b91c1c';

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleAdd = useCallback(async (name: string, playerId?: string) => {
    if (isLocked || !session.club) return;
    setIsSearching(true);
    setDraftError(null);
    try {
      const fp = await searchPlayer(session.club.id, name, playerId);
      if (!fp) {
        if (draft.some(e => e.name.toLowerCase() === name.toLowerCase())) { setDraftError(`${name} już jest na liście!`); return; }
        const entry: OnlineDraftEntry = { id: `unknown-${name}-${Date.now()}`, name, appearances: 0, photo: undefined, position: '' };
        setDraft(prev => [entry, ...prev]);
        return;
      }
      if (fp.appearances > 180) { setDraftError(`${fp.name} ma ${fp.appearances} występów — przekracza limit 180!`); return; }
      if (usedIds.has(fp.id)) { setDraftError(`${fp.name} już jest na liście!`); return; }
      const entry: OnlineDraftEntry = { id: fp.id, name: fp.name, appearances: fp.appearances, photo: fp.photo, position: fp.position };
      setDraft(prev => [entry, ...prev]);
    } catch {
      setDraftError('Błąd wyszukiwania');
    } finally {
      setIsSearching(false);
    }
  }, [isLocked, session.club, usedIds]);

  const handleRemove = (idx: number) => setDraft(prev => prev.filter((_, i) => i !== idx));

  const handleConfirm = useCallback(async () => {
    if (isLocked || isSubmitting) return;
    // Don't clear the timer — let it keep counting down visually on the waiting screen.
    // handleTimeout already checks isLocked and won't re-trigger confirm.
    setIsSubmitting(true);
    setDraftError(null);
    await onLockIn(draft);
    setIsLocked(true);
    setIsSubmitting(false);
  }, [isLocked, isSubmitting, draft, onLockIn]);

  useEffect(() => { handleConfirmRef.current = handleConfirm; }, [handleConfirm]);

  // ── Header ────────────────────────────────────────────────────────────────────

  const header = (
    <motion.div
      className="flex items-center justify-between mb-5"
      style={{ width: '100%' }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {session.club ? (
        <div style={{ ...OUTLINE_BTN, color: '#1e3a8a', borderColor: '#1e3a8a', padding: '7px 12px', gap: 8, cursor: 'default' }}>
          <img
            src={session.club.logo}
            alt={session.club.name}
            style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#1e3a8a', letterSpacing: '0.04em' }}>
            {session.club.name}
          </span>
        </div>
      ) : <div />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.button
          onClick={() => setShowRules(true)}
          style={{ ...OUTLINE_BTN, color: '#1e3a8a', borderColor: '#1e3a8a', padding: '7px 10px' }}
          whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
          title="Zasady gry"
        >
          <HelpCircle size={14} />
        </motion.button>
      </div>
    </motion.div>
  );

  // ── REVEAL / SHOOT PHASE (status === 'finished') ───────────────────────────────

  if (session.status === 'finished') {
    const { winnerId, isDraw } = computeWinner(session.players);
    const winnerIdx = session.players.findIndex(p => p.id === winnerId);

    return (
      <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
        <AnimatePresence>{showRules && <RulesOverlay onClose={() => setShowRules(false)} startingScore={session.startingScore} />}</AnimatePresence>
        {header}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">

          {/* Winner banner — appears after all cards flipped */}
          {showWinner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              style={{
                marginBottom: 16,
                background: winnerIdx >= 0 ? PLAYER_COLORS[winnerIdx] : '#5a4a35',
                borderRadius: 6,
                padding: '18px 40px',
                textAlign: 'center',
                boxShadow: winnerIdx >= 0
                  ? `0 6px 32px ${PLAYER_COLORS[winnerIdx]}66, 0 0 0 3px ${PLAYER_COLORS[winnerIdx]}, 0 0 0 5px white`
                  : '0 4px 20px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 2 }}>
                {winnerIdx >= 0 ? '★ winner ★' : '— remis —'}
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', color: 'white', letterSpacing: '0.05em', lineHeight: 1 }}>
                {winnerIdx >= 0 ? session.players[winnerIdx].playerName : 'Nikt'}
              </div>
            </motion.div>
          )}

          {/* SHOOT button — host only, before reveal */}
          {!isRevealed && isHost && (
            <motion.button
              onClick={onTriggerReveal}
              style={{
                width: '100%',
                marginBottom: 20,
                background: '#b91c1c',
                color: 'white',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '2.2rem',
                letterSpacing: '0.2em',
                padding: '16px 0',
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 28px rgba(185,28,28,0.45)',
                position: 'relative',
                overflow: 'hidden',
              }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              whileHover={{ scale: 1.03, boxShadow: '0 8px 36px rgba(185,28,28,0.55)' }}
              whileTap={{ scale: 0.96 }}
            >
              <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
              SHOOT!
            </motion.button>
          )}

          {/* Waiting for host (non-host, not yet revealed) */}
          {!isRevealed && !isHost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginBottom: 20, padding: '14px 24px', background: 'white', borderRadius: 6, border: '2px solid #d4c4a0', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#8a7553', letterSpacing: '0.1em' }}>
                Czekaj na hosta…
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#a09070', marginTop: 3 }}>
                Host za chwilę odkryje karty
              </div>
            </motion.div>
          )}

          {/* Player rows — identical layout to local blitz */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', marginBottom: 28 }}>
            {session.players.map((player, pIdx) => {
              const isWinner = showWinner && player.id === winnerId && !isDraw;
              const isBusted = player.isBusted;
              const playerThrows = player.throws;

              return (
                <motion.div
                  key={player.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    borderRadius: 8,
                    border: isWinner ? `2px solid ${PLAYER_COLORS[pIdx]}` : '2px solid transparent',
                    padding: '8px 10px',
                    background: isWinner ? `${PLAYER_COLORS[pIdx]}18` : 'transparent',
                    transition: 'border-color 0.3s, background 0.3s',
                  }}
                  animate={{ scale: isWinner ? 1.01 : 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                >
                  {/* Player header: label + score/bust */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      background: PLAYER_COLORS[pIdx],
                      borderRadius: 4,
                      padding: '3px 12px',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1rem',
                      color: 'white',
                      letterSpacing: '0.08em',
                      flexShrink: 0,
                    }}>
                      {player.playerName}
                    </div>

                    {isRevealed && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (playerThrows.length) * 0.08 + 0.4 }}
                        style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}
                      >
                        {isBusted ? (
                          <div style={{ background: '#b91c1c', borderRadius: 4, padding: '2px 10px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: 'white', letterSpacing: '0.1em' }}>
                            BUST
                          </div>
                        ) : (
                          <>
                            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: PLAYER_COLORS[pIdx], letterSpacing: '0.04em', lineHeight: 1 }}>
                              {player.score}
                            </span>
                            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.6rem', color: '#8a7553', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                              pts left
                            </span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Cards row */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                    {playerThrows.length === 0 ? (
                      <div style={{ height: 132, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', opacity: 0.45 }}>
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.72rem', color: '#7a6340', letterSpacing: '0.1em', textTransform: 'uppercase' }}>brak kart</span>
                      </div>
                    ) : (
                      playerThrows.map((t, cIdx) => (
                        <OnlineFlipCard
                          key={`${t.playerId}-${cIdx}`}
                          throw_={t}
                          playerColorIdx={pIdx}
                          playerName={player.playerName}
                          cardIndex={cIdx}
                          isRevealed={isRevealed}
                          revealDelay={cIdx * 0.08 + pIdx * 0.04}
                          isBusted={isBusted}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* New game button — after winner shown */}
          {showWinner && (
            <motion.button
              onClick={onLeave}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                marginTop: 20,
                background: 'white',
                color: '#1e3a8a',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.2rem',
                letterSpacing: '0.15em',
                padding: '10px 36px',
                borderRadius: 5,
                border: '2px solid #1e3a8a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw size={14} />
              Nowa gra
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── LOCKED — waiting for all players to confirm ───────────────────────────────

  if (isLocked) {
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
        <AnimatePresence>{showRules && <RulesOverlay onClose={() => setShowRules(false)} startingScore={session.startingScore} />}</AnimatePresence>
        {header}
        <div className="flex flex-col items-center justify-center flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'white', borderRadius: 8, padding: '32px 36px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 6px 32px rgba(0,0,0,0.1), 0 0 0 3px #92400e' }}
          >
            <Lock size={36} style={{ color: '#92400e', margin: '0 auto 14px', display: 'block' }} />
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#92400e', letterSpacing: '0.06em', lineHeight: 1, marginBottom: 6 }}>
              Wybór zablokowany
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#7a6340', marginBottom: 24 }}>
              Twoje karty zostały potwierdzone.<br />Czekaj na pozostałych graczy.
            </div>

            {/* Timer — still counting down */}
            {session.timer && timeLeft !== null && (() => {
              const frac = timeLeft / session.timer;
              const ringColor = frac > 0.4 ? '#15803d' : frac > 0.2 ? '#d97706' : '#b91c1c';
              return (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: `conic-gradient(${ringColor} ${frac * 360}deg, rgba(0,0,0,0.08) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
                    <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: ringColor, lineHeight: 1 }}>{timeLeft}</span>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.42rem', color: ringColor, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>sec</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Player status list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {session.players.map((player, idx) => {
                const isMe = player.id === myPlayerId;
                const finished = isMe ? true : player.isFinished || player.isBusted;
                const color = PLAYER_COLORS[idx] ?? '#1e3a8a';
                return (
                  <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8f6f2', borderRadius: 6, padding: '8px 14px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: finished ? '#15803d' : '#d4c4a0', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color, letterSpacing: '0.04em', flex: 1, textAlign: 'left' }}>
                      {player.playerName}
                    </span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: finished ? '#15803d' : '#a09070' }}>
                      {finished ? '✓ gotowy' : 'wybiera…'}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── PICKING PHASE ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
      <AnimatePresence>{showRules && <RulesOverlay onClose={() => setShowRules(false)} startingScore={session.startingScore} />}</AnimatePresence>

      {header}

      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {/* Player strip */}
        {myPlayer && (
          <div style={{ width: '100%', maxWidth: 420, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: myColor, borderRadius: 6, padding: '8px 16px' }}>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'white', letterSpacing: '0.1em' }}>
                PICK YOUR PLAYERS
              </span>
            </div>
          </div>
        )}

        {/* Score ring + timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 14 }}>
          <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
            <svg width="108" height="108" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="54" cy="54" r={SCORE_R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="10" />
              <circle cx="54" cy="54" r={SCORE_R} fill="none" stroke={myColor} strokeWidth="10"
                strokeDasharray={SCORE_C} strokeDashoffset={0}
                strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.9rem', color: myColor, lineHeight: 1 }}>
                {displayScore}
              </span>
            </div>
          </div>

          {session.timer && timeLeft !== null && (
            <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${countdownRingColor} ${countdownFraction * 360}deg, rgba(0,0,0,0.08) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ede3ce', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: countdownRingColor, lineHeight: 1 }}>{timeLeft}</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.42rem', color: countdownRingColor, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>sec</span>
              </div>
            </div>
          )}
        </div>

        {/* Other players status */}
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {session.players.filter(p => p.id !== myPlayerId).map((player) => {
            const colorIdx = session.players.findIndex(p => p.id === player.id);
            const color = PLAYER_COLORS[colorIdx >= 0 ? colorIdx : 0];
            const done = player.isFinished || player.isBusted;
            return (
              <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: done ? 'rgba(21,128,61,0.08)' : 'rgba(0,0,0,0.05)', borderRadius: 4, padding: '4px 10px', border: `1.5px solid ${done ? '#15803d' : 'rgba(0,0,0,0.1)'}` }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: done ? '#15803d' : color, opacity: done ? 1 : 0.5 }} />
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: done ? '#15803d' : '#7a6340', letterSpacing: '0.05em' }}>
                  {player.playerName}
                </span>
                {done && <span style={{ fontSize: '0.65rem', color: '#15803d' }}>✓</span>}
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 8 }}>
          <PlayerInput
            onSubmit={handleAdd}
            isLoading={isSearching}
            placeholder="wpisz piłkarza…"
            suggestions={allPlayers}
            isLoadingSuggestions={isLoadingSquad}
            hideSubmitButton
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {(draftError || hookError) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ width: '100%', maxWidth: 420, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#b91c1c', letterSpacing: '0.06em', marginBottom: 8, padding: '6px 14px', background: '#fef2f2', border: '1.5px solid #b91c1c', borderRadius: 4 }}
            >
              {draftError || hookError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm button */}
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
          <motion.button
            onClick={handleConfirm}
            disabled={draft.length === 0 || isSubmitting || hookLoading}
            style={{
              width: '100%',
              background: draft.length === 0 ? '#c4b89a' : myColor,
              color: 'white',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.3rem',
              letterSpacing: '0.15em',
              padding: '14px 0',
              borderRadius: 6,
              border: 'none',
              cursor: draft.length === 0 || isSubmitting ? 'default' : 'pointer',
              boxShadow: draft.length === 0 ? 'none' : '0 4px 18px rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            whileHover={draft.length > 0 && !isSubmitting ? { scale: 1.02, y: -2 } : {}}
            whileTap={draft.length > 0 && !isSubmitting ? { scale: 0.97 } : {}}
          >
            {isSubmitting ? (
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.6)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <>
                <Lock size={16} />
                Potwierdź — Zablokuj wybór
              </>
            )}
          </motion.button>
          {draft.length === 0 && (
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.7rem', color: '#a09070', textAlign: 'center', marginTop: 4 }}>
              Dodaj przynajmniej jednego piłkarza
            </div>
          )}
        </div>

        {/* Cards area */}
        <div style={{ width: '100%', maxWidth: 420, minHeight: 140 }}>
          {draft.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 8 }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#a09070', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                wybierz piłkarzy
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <AnimatePresence>
                {draft.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <CardBack
                      playerName={myPlayer?.playerName ?? ''}
                      color={myColor}
                      cardIndex={i}
                      footballPlayerName={entry.name}
                      onRemove={() => handleRemove(i)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
