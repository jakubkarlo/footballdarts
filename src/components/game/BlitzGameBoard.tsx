import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Throw, FootballPlayer } from '@/types/game';
import { PlayerInput } from './PlayerInput';
import { EyeOff, HelpCircle, X, RotateCcw } from 'lucide-react';
import { useAllPlayers } from '@/hooks/useAllPlayers';
import { searchPlayer } from '@/data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlitzCard {
  footballPlayer: FootballPlayer;
  gamePlayerIndex: number;
}

interface BlitzGameBoardProps {
  gameState: GameState;
  onFinishBlitz: (
    player1Throws: Throw[],
    player2Throws: Throw[],
    player1Score: number,
    player2Score: number
  ) => void;
  onReset: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BBC_PHOTO = 'https://ichef.bbci.co.uk/ace/standard/2560/cpsprodpb/d14d/live/6eac51d0-27dc-11ef-9588-6d96e597ad15.jpg';
const PLAYER_COLORS = ['#1e3a8a', '#b91c1c', '#15803d', '#6a35c5'];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Face-down card shown during picking phase */
export const CardBack = ({
  playerName,
  color,
  cardIndex,
  footballPlayerName,
  onRemove,
}: {
  playerName: string;
  color: string;
  cardIndex: number;
  footballPlayerName?: string;
  onRemove?: () => void;
}) => (
  <div
    style={{
      width: 90,
      height: 132,
      borderRadius: 5,
      background: color,
      boxShadow: '0 3px 10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 6px',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
    }}
  >
    {/* diagonal lines texture */}
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 8px)',
      pointerEvents: 'none',
    }} />

    {/* top-right: remove button or card number */}
    {onRemove ? (
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{
          alignSelf: 'flex-end',
          background: 'rgba(0,0,0,0.3)',
          border: 'none',
          borderRadius: '50%',
          width: 18, height: 18,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
          fontSize: '0.65rem',
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >✕</button>
    ) : (
      <div style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 800,
        fontSize: '0.55rem',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.05em',
        alignSelf: 'flex-end',
      }}>
        #{String(cardIndex + 1).padStart(2, '0')}
      </div>
    )}

    {/* football player name or ? */}
    <div style={{
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: footballPlayerName ? '0.62rem' : '2.2rem',
      color: footballPlayerName ? 'white' : 'rgba(255,255,255,0.25)',
      lineHeight: 1.2,
      textAlign: 'center',
      letterSpacing: '0.03em',
      wordBreak: 'break-word',
    }}>
      {footballPlayerName ?? '?'}
    </div>

    {/* game player name */}
    <div style={{
      fontFamily: 'Barlow Condensed, sans-serif',
      fontWeight: 700,
      fontSize: '0.5rem',
      color: 'rgba(255,255,255,0.55)',
      letterSpacing: '0.08em',
      textAlign: 'center',
      textTransform: 'uppercase',
    }}>
      {playerName}
    </div>
  </div>
);

/** Flippable card — face-down during picking, flips to sticker on reveal */
const FlipCard = ({
  card,
  playerName,
  cardIndex,
  isRevealed,
  revealDelay,
  isBusted,
}: {
  card: BlitzCard;
  playerName: string;
  cardIndex: number;
  isRevealed: boolean;
  revealDelay: number;
  isBusted: boolean;
}) => {
  const backColor = PLAYER_COLORS[card.gamePlayerIndex] ?? '#1e3a8a';
  const p = card.footballPlayer;

  const posColor = () => {
    const pos = p.position?.toLowerCase() ?? '';
    if (pos.includes('goal')) return '#15803d';
    if (pos.includes('def'))  return '#1e3a8a';
    if (pos.includes('mid'))  return '#b45309';
    return '#b91c1c';
  };
  const posAbbr = () => {
    const pos = p.position?.toLowerCase() ?? '';
    if (pos.includes('goal')) return 'GK';
    if (pos.includes('def'))  return 'DF';
    if (pos.includes('mid'))  return 'MF';
    return 'FW';
  };
  const surname = p.name.split(' ').slice(-1)[0] ?? p.name;

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
            {/* Photo area */}
            <div style={{ position: 'relative', flex: 1, background: '#1a120a', overflow: 'hidden' }}>
              <img
                src={p.photo || BBC_PHOTO}
                alt={p.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.currentTarget.src = BBC_PHOTO; }}
              />
              {/* bottom gradient */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }} />
              {/* position badge */}
              <div style={{ position: 'absolute', top: 5, left: 5, background: posColor(), borderRadius: 2, padding: '2px 5px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '0.52rem', color: 'white', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                {posAbbr()}
              </div>
              {/* surname */}
              <div style={{ position: 'absolute', bottom: 5, left: 5, right: 5, fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.82rem', color: 'white', letterSpacing: '0.06em', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {surname}
              </div>
              <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
            </div>
            {/* Stat footer — player colour */}
            <div style={{ background: backColor, padding: '5px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(60deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 6px)', pointerEvents: 'none' }} />
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.65rem', color: 'white', lineHeight: 1, letterSpacing: '0.02em' }}>{p.appearances}</span>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.44rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', paddingBottom: 2 }}>apps</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const BlitzGameBoard = ({
  gameState,
  onFinishBlitz,
  onReset,
}: BlitzGameBoardProps) => {
  const players = gameState.players;
  const playerCount = players.length;

  // cards[playerIndex] = array of picked BlitzCards
  const [cards, setCards] = useState<BlitzCard[][]>(
    Array.from({ length: playerCount }, () => [])
  );
  const [currentPickerIndex, setCurrentPickerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHandover, setShowHandover] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleTimeoutRef = useRef<() => void>(() => {});

  const timerDuration = gameState.timer;
  const allPicked = currentPickerIndex >= playerCount;

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimeLeft(null);
  }, []);

  // Start/reset timer when picker changes
  useEffect(() => {
    if (!timerDuration || allPicked || showHandover) { stopTimer(); return; }
    stopTimer();
    setTimeLeft(timerDuration);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setTimeout(() => handleTimeoutRef.current(), 0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPickerIndex, timerDuration, allPicked, showHandover]);

  const handleTimeout = useCallback(() => {
    stopTimer();
    setError(null);
    if (currentPickerIndex < playerCount - 1) {
      setShowHandover(true);
    } else {
      setCurrentPickerIndex(playerCount);
    }
  }, [currentPickerIndex, playerCount, stopTimer]);

  useEffect(() => { handleTimeoutRef.current = handleTimeout; }, [handleTimeout]);

  const { allPlayers, isLoading: isLoadingSquad } = useAllPlayers();

  // Only block duplicates within the CURRENT player's own deck
  const usedIds = new Set((cards[currentPickerIndex] ?? []).map(c => c.footballPlayer.id));

  const currentPlayerName = players[currentPickerIndex]?.name ?? 'Player';
  const currentCards = cards[currentPickerIndex] ?? [];

  // ── Pick a card ────────────────────────────────────────────────────────────
  const handlePick = async (playerName: string, playerId?: string) => {
    if (!gameState.club || allPicked) return;
    setIsLoading(true);
    setError(null);

    const fp = await searchPlayer(gameState.club.id, playerName, playerId);

    if (!fp) {
      setError(`Not found: ${playerName}`);
      setIsLoading(false);
      return;
    }
    if (fp.appearances > 180) {
      setError(`${fp.name} ma ${fp.appearances} występów — przekracza limit 180!`);
      setIsLoading(false);
      return;
    }
    if (usedIds.has(fp.id)) {
      setError(`${fp.name} already picked!`);
      setIsLoading(false);
      return;
    }

    const newCard: BlitzCard = { footballPlayer: fp, gamePlayerIndex: currentPickerIndex };
    setCards(prev => {
      const next = prev.map(arr => [...arr]);
      next[currentPickerIndex] = [...next[currentPickerIndex], newCard];
      return next;
    });
    setIsLoading(false);
  };

  // ── Remove a card from current picker's deck ──────────────────────────────
  const handleRemoveCard = (cardIdx: number) => {
    setCards(prev => {
      const next = prev.map(arr => [...arr]);
      next[currentPickerIndex] = next[currentPickerIndex].filter((_, i) => i !== cardIdx);
      return next;
    });
  };

  // ── Done picking, move to next player ─────────────────────────────────────
  const handleDonePicking = () => {
    if (currentCards.length === 0) {
      setError('Pick at least one player!');
      return;
    }
    setError(null);
    stopTimer();
    if (currentPickerIndex < playerCount - 1) {
      setShowHandover(true);
    } else {
      setCurrentPickerIndex(playerCount); // all done
    }
  };

  const handleHandoverConfirm = () => {
    setShowHandover(false);
    setCurrentPickerIndex(i => i + 1);
  };

  // ── Shoot! ─────────────────────────────────────────────────────────────────
  const handleShoot = () => {
    setIsRevealed(true);
  };

  // ── Finish game ────────────────────────────────────────────────────────────
  // ─── Handover screen ──────────────────────────────────────────────────────
  if (showHandover) {
    const nextName = players[currentPickerIndex + 1]?.name ?? 'Next Player';
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: '#ede3ce', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)' }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 6,
            padding: '40px 48px',
            boxShadow: '0 6px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
            maxWidth: 340,
          }}
        >
          <EyeOff size={40} style={{ color: '#1e3a8a', margin: '0 auto 20px' }} />
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '2rem',
            color: '#1e3a8a',
            letterSpacing: '0.04em',
            marginBottom: 8,
          }}>
            Pass the device!
          </div>
          <p style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#5a4a35',
            marginBottom: 28,
          }}>
            {currentPlayerName}'s cards are hidden.<br />
            Hand to <strong>{nextName}</strong>.
          </p>
          <motion.button
            onClick={handleHandoverConfirm}
            style={{
              background: '#1e3a8a',
              color: 'white',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.3rem',
              letterSpacing: '0.14em',
              padding: '12px 40px',
              borderRadius: 5,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(30,58,138,0.35)',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            I'm {nextName} — Ready!
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── Rules overlay ────────────────────────────────────────────────────────
  const OUTLINE_BTN_STYLE = {
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700,
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#7a6340',
    background: 'white',
    border: '1.5px solid #d4c4a0',
    borderRadius: 4,
    padding: '7px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  };

  const rulesOverlay = (
    <AnimatePresence>
      {showRules && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setShowRules(false)}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#ede3ce', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)', borderRadius: 10, padding: '28px 28px 24px', maxWidth: 420, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.15)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#b91c1c', letterSpacing: '0.04em', lineHeight: 1 }}>
                  Zasady gry
                </div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.72rem', color: '#8a7553', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
                  Football Darts · Blitz
                </div>
              </div>
              <button onClick={() => setShowRules(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7553', padding: 4, marginTop: 2 }}>
                <X size={20} />
              </button>
            </div>

            {[
              {
                num: '01',
                title: 'Cel gry',
                body: `Zaczynasz od ${gameState.startingScore} punktów. Wybierasz piłkarzy — ich suma występów odejmowana jest od Twojego wyniku. Wygrywa ten, kto jest najbliżej zera.`,
                color: '#b91c1c',
              },
              {
                num: '02',
                title: 'Faza wybierania',
                body: 'Każdy gracz po kolei wybiera piłkarzy po cichu (karty są zakryte). Podaj urządzenie następnemu graczowi — nie może widzieć Twoich kart.',
                color: '#1e3a8a',
              },
              {
                num: '03',
                title: 'Reveal — Shoot!',
                body: 'Gdy wszyscy skończą, kliknij "Shoot!" — wszystkie karty przewracają się jednocześnie. Wyniki rozstrzygane są natychmiastowo.',
                color: '#b91c1c',
              },
              {
                num: '04',
                title: 'Bust',
                body: 'Jeśli suma występów Twoich kart przekroczy wynik startowy (zejdzie poniżej zera) — odpadasz (BUST). Pojedyncza karta z > 180 występami jest niedozwolona.',
                color: '#b91c1c',
              },
              {
                num: '05',
                title: 'Miss (0 appearances)',
                body: 'Piłkarz z 0 występami dla tego klubu to karta o wartości 0. Możesz ją dodać — nie odejmuje nic i nie powoduje BUST.',
                color: '#92400e',
              },
              {
                num: '06',
                title: 'Wynik końcowy',
                body: 'Wygrywa gracz z wynikiem najbliższym zera (nieujemnym). Jeśli obaj zbustują — wygrywa ten z wyższym (mniej ujemnym) wynikiem. Możliwy remis.',
                color: '#15803d',
              },
            ].map(({ num, title, body, color }) => (
              <div key={num} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 4, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>{num}</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color, letterSpacing: '0.06em', lineHeight: 1, marginBottom: 3 }}>
                    {title}
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 500, fontSize: '0.88rem', color: '#5a4a35', lineHeight: 1.45 }}>
                    {body}
                  </div>
                </div>
              </div>
            ))}

            <motion.button
              onClick={() => setShowRules(false)}
              style={{ width: '100%', marginTop: 8, background: '#b91c1c', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.2em', padding: '11px 0', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(185,28,28,0.3)' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              Rozumiem — gramy!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ─── Main layout ──────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col p-4 md:p-5"
      style={{
        backgroundColor: '#ede3ce',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)',
      }}
    >
      {rulesOverlay}

      {/* Header — matches Turns style */}
      <motion.div
        className="flex items-center justify-between mb-5"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {gameState.club ? (
          <div style={{ ...OUTLINE_BTN_STYLE, color: '#1e3a8a', borderColor: '#1e3a8a', padding: '7px 12px', gap: 8, cursor: 'default' }}>
            <img
              src={gameState.club.logo}
              alt={gameState.club.name}
              style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            />
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#1e3a8a', letterSpacing: '0.04em' }}>
              {gameState.club.name}
            </span>
          </div>
        ) : <div />}
        <motion.button
          onClick={() => setShowRules(true)}
          style={{ ...OUTLINE_BTN_STYLE, color: '#b91c1c', borderColor: '#b91c1c', padding: '7px 10px' }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          title="Zasady gry"
        >
          <HelpCircle size={14} />
        </motion.button>
      </motion.div>

      {/* ── PICKING PHASE ──────────────────────────────────────────────── */}
      {!allPicked && (
        <motion.div
          key={`picker-${currentPickerIndex}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center"
        >
          {/* Player strip — full width, matches Turns style */}
          <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: PLAYER_COLORS[currentPickerIndex],
              borderRadius: 6,
              padding: '8px 16px',
            }}>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'white', letterSpacing: '0.06em' }}>
                {currentPlayerName}
              </span>
            </div>
          </div>

          {/* Timer circle */}
          {timerDuration && timeLeft !== null && (() => {
            const frac = timeLeft / timerDuration;
            const ringColor = frac > 0.4 ? '#15803d' : frac > 0.2 ? '#d97706' : '#b91c1c';
            return (
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `conic-gradient(${ringColor} ${frac * 360}deg, rgba(0,0,0,0.08) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ede3ce', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: ringColor, lineHeight: 1 }}>{timeLeft}</span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.42rem', color: ringColor, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>sec</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search */}
          <div style={{ width: '100%', maxWidth: 420, marginBottom: 8 }}>
            <PlayerInput
              onSubmit={handlePick}
              isLoading={isLoading}
              disabled={false}
              placeholder="type player"
              suggestions={allPlayers}
              isLoadingSuggestions={isLoadingSquad}
              hideSubmitButton
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ width: '100%', maxWidth: 420, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#b91c1c', letterSpacing: '0.06em', marginBottom: 8, padding: '6px 14px', background: '#fef2f2', border: '1.5px solid #b91c1c', borderRadius: 4 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Done button — full width */}
          <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
            <motion.button
              onClick={handleDonePicking}
              disabled={currentCards.length === 0}
              style={{
                width: '100%',
                background: currentCards.length === 0 ? '#c4b89a' : PLAYER_COLORS[currentPickerIndex],
                color: 'white',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.3rem',
                letterSpacing: '0.15em',
                padding: '14px 0',
                borderRadius: 6,
                border: 'none',
                cursor: currentCards.length === 0 ? 'default' : 'pointer',
                boxShadow: currentCards.length === 0 ? 'none' : '0 4px 18px rgba(0,0,0,0.2)',
              }}
              whileHover={currentCards.length > 0 ? { scale: 1.02, y: -2 } : {}}
              whileTap={currentCards.length > 0 ? { scale: 0.97 } : {}}
            >
              {currentPickerIndex < playerCount - 1 ? 'Confirm — Pass Device' : 'Confirm — Ready to Shoot!'}
            </motion.button>
          </div>

          {/* Cards area — below controls */}
          <div style={{ width: '100%', maxWidth: 420, minHeight: 140 }}>
            {currentCards.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 8 }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#a09070', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  pick your players
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <AnimatePresence>
                  {currentCards.map((card, i) => (
                    <motion.div
                      key={card.footballPlayer.id}
                      initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
                      animate={{ opacity: 1, scale: 1, rotate: (i % 2 === 0 ? -1.5 : 1.5) }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <CardBack
                        playerName={currentPlayerName}
                        color={PLAYER_COLORS[currentPickerIndex]}
                        cardIndex={i}
                        footballPlayerName={card.footballPlayer.name}
                        onRemove={() => handleRemoveCard(i)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── SHOOT / REVEAL PHASE ───────────────────────────────────────── */}
      {allPicked && (() => {
        // Score calculation
        const totalApps = (pIdx: number) =>
          (cards[pIdx] ?? []).reduce((s, c) => s + c.footballPlayer.appearances, 0);
        const scores = players.map((_, i) => gameState.startingScore - totalApps(i));
        const busted = players.map((_, i) => scores[i] < 0);

        // Winner = lowest non-negative score; -1 = all busted / draw
        const validScores = scores.map((s, i) => busted[i] ? Infinity : s);
        const minScore = Math.min(...validScores);
        const winnerIdx = validScores.indexOf(minScore) === validScores.lastIndexOf(minScore) && minScore < Infinity
          ? validScores.indexOf(minScore) : -1;

        // Delay after last card flips
        const maxCards = Math.max(...players.map((_, i) => cards[i]?.length ?? 0));
        const resultDelay = maxCards * 0.09 + 0.8;

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">

            {/* Winner banner — top */}
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: resultDelay, type: 'spring', stiffness: 180, damping: 14 }}
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
                <div style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.65)',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}>
                  {winnerIdx >= 0 ? '★ winner ★' : '— remis —'}
                </div>
                <div style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '2.4rem',
                  color: 'white',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}>
                  {winnerIdx >= 0 ? players[winnerIdx].name : 'Nikt'}
                </div>
              </motion.div>
            )}

            {/* SHOOT button — top, before players */}
            {!isRevealed && (
              <motion.button
                onClick={handleShoot}
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

            {/* Player rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', marginBottom: 28 }}>
              {players.map((player, pIdx) => {
                const isWinner = isRevealed && winnerIdx === pIdx;
                const isBusted = isRevealed && busted[pIdx];
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
                    transition={{ delay: resultDelay + 0.1 }}
                  >
                    {/* Player header row: label + score */}
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
                        {player.name}
                      </div>

                      {/* Score / bust after reveal */}
                      {isRevealed && (
                        <motion.div
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (cards[pIdx]?.length ?? 0) * 0.08 + 0.4 }}
                          style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}
                        >
                          {isBusted ? (
                            <div style={{
                              background: '#b91c1c',
                              borderRadius: 4,
                              padding: '2px 10px',
                              fontFamily: 'Bebas Neue, sans-serif',
                              fontSize: '1.1rem',
                              color: 'white',
                              letterSpacing: '0.1em',
                            }}>
                              BUST
                            </div>
                          ) : (
                            <>
                              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: PLAYER_COLORS[pIdx], letterSpacing: '0.04em', lineHeight: 1 }}>
                                {scores[pIdx]}
                              </span>
                              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.6rem', color: '#8a7553', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                pts left
                              </span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Cards — horizontal scroll */}
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                      {(cards[pIdx] ?? []).map((card, cIdx) => (
                        <FlipCard
                          key={card.footballPlayer.id}
                          card={card}
                          playerName={player.name}
                          cardIndex={cIdx}
                          isRevealed={isRevealed}
                          revealDelay={cIdx * 0.08 + pIdx * 0.04}
                          isBusted={busted[pIdx]}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* New game button */}
            {isRevealed && (
              <motion.button
                onClick={onReset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: resultDelay + 0.5 }}
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
                New Game
              </motion.button>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
};
