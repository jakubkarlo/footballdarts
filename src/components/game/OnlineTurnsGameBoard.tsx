import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnlineGameSession, OnlineDraftEntry, Throw } from '@/types/game';
import { PlayerInput } from './PlayerInput';
import { CardBack } from './BlitzGameBoard';
import { PlayerSticker } from './PlayerSticker';
import { searchPlayer } from '@/data/mockData';
import { useAllPlayers } from '@/hooks/useAllPlayers';
import { supabase } from '@/integrations/supabase/client';
import { StopCircle, X, HelpCircle, Wifi } from 'lucide-react';
import { PLAYER_COLORS, BG, OUTLINE_BTN, RoundResultTile, GameOverScreen, GameOverPlayer } from './TurnsShared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BetweenRoundsEntry {
  playerId: string;
  playerName: string;
  colorIdx: number;
  total: number;
  hasMiss: boolean;
  bustThisRound: boolean;
  hitZero: boolean;
  skipped: boolean; // didn't play — stopped/busted previously
  currentScore: number;
  lives: number;
  reason: 'over180' | 'miss' | 'below zero' | null;
}

interface OnlineTurnsGameBoardProps {
  session: OnlineGameSession;
  myPlayerId: string | null;
  myPlayerOrder: number | null;
  isMyTurn: boolean;
  isLoading: boolean;
  error: string | null;
  continueRoundSignal: number;
  onLockIn: (draft: OnlineDraftEntry[]) => Promise<{ isEliminated: boolean; isFinished: boolean; newScore: number; newLives: number } | null>;
  onStop: () => Promise<void>;
  onContinueRound: () => void;
  onLeave: () => void;
}

// ─── Rules overlay ────────────────────────────────────────────────────────────

const RulesOverlay = ({ onClose, startingScore, allowMisses }: { onClose: () => void; startingScore: number; allowMisses: boolean }) => {
  const rules = [
    {
      num: '01',
      title: 'Cel gry',
      body: `Zaczynasz od ${startingScore} punktów. Wybierając piłkarzy odejmujesz ich liczbę występów. Wygrywa ten, kto jest najbliżej zera.`,
      color: '#1e3a8a',
    },
    {
      num: '02',
      title: 'Strzał',
      body: 'Każda runda: wybierz jednego lub więcej piłkarzy z wybranego klubu i zatwierdź jako strzał. Suma ich występów odejmowana jest od Twojego wyniku.',
      color: '#1e3a8a',
    },
    {
      num: '03',
      title: 'Stop',
      body: 'Zamiast strzelać możesz kliknąć STOP — blokujesz swój aktualny wynik i czekasz na koniec gry. Inni gracze grają dalej.',
      color: '#92400e',
    },
    {
      num: '04',
      title: 'Bust',
      body: 'Jeśli Twój wynik zejdzie poniżej zera lub suma jednego rzutu przekroczy 180 — odpadasz. To samo dotyczy missa (0 występów) gdy gra bez życia.',
      color: '#b91c1c',
    },
    allowMisses
      ? {
          num: '05',
          title: 'Miss i życia',
          body: 'Jeśli wybierzesz piłkarza z 0 występami dla tego klubu — tracisz życie (masz 3). Strata wszystkich żyć = eliminacja.',
          color: '#b91c1c',
        }
      : {
          num: '05',
          title: 'Miss',
          body: 'Piłkarz z 0 występami dla tego klubu = natychmiastowy bust.',
          color: '#b91c1c',
        },
    {
      num: '06',
      title: 'Koniec gry',
      body: 'Gra kończy się gdy ktoś trafi dokładne zero (rundę dokańczamy), wszyscy aktywni gracze klikną stop lub wszyscy odpadną.',
      color: '#15803d',
    },
    {
      num: '07',
      title: 'Remis',
      body: 'Wielu graczy może wygrać jednocześnie — jeśli mają identyczny wynik końcowy.',
      color: '#15803d',
    },
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
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#1e3a8a', letterSpacing: '0.04em', lineHeight: 1 }}>Zasady gry</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.72rem', color: '#8a7553', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Football Darts · Turns · Online</div>
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
          style={{ width: '100%', marginTop: 8, background: '#1e3a8a', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.2em', padding: '11px 0', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,58,138,0.3)' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        >
          Rozumiem — gramy!
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const OnlineTurnsGameBoard = ({
  session,
  myPlayerId,
  myPlayerOrder,
  isMyTurn,
  isLoading: hookLoading,
  error: hookError,
  continueRoundSignal,
  onLockIn,
  onStop,
  onContinueRound,
  onLeave,
}: OnlineTurnsGameBoardProps) => {
  const [draft, setDraft] = useState<OnlineDraftEntry[]>([]);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stopConfirming, setStopConfirming] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [timeoutToast, setTimeoutToast] = useState<{ msg: string; isElim: boolean } | null>(null);

  // Between-rounds overlay
  const [roundSummary, setRoundSummary] = useState<BetweenRoundsEntry[] | null>(null);
  const [summaryRoundNum, setSummaryRoundNum] = useState(0);

  // History (game over)
  type HistoryRound = { roundNum: number; byPlayer: { player: typeof session.players[0]; throws: Throw[] }[] };
  const [showHistory, setShowHistory] = useState(false);
  const [historyRound, setHistoryRound] = useState(0);
  const [historyData, setHistoryData] = useState<HistoryRound[] | null>(null);

  // Per-turn countdown timer (only when it's my turn and session.timer is set)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Synchronized countdown shown in the waiting player strip (mirrors active player's timer)
  const [waitingTimeLeft, setWaitingTimeLeft] = useState<number | null>(null);
  const waitingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer on waiting screen
  const [elapsed, setElapsed] = useState(0);

  const prevRoundRef = useRef(session.roundNumber);
  const prevCurrentPlayerRef = useRef(session.currentPlayerIndex);
  const prevMyTurnRef = useRef(isMyTurn);

  const { allPlayers, isLoading: isLoadingSquad } = useAllPlayers();

  const myPlayer = session.players.find(p => p.id === myPlayerId);
  const myColorIdx = session.players.findIndex(p => p.id === myPlayerId);
  const myColor = PLAYER_COLORS[myColorIdx >= 0 ? myColorIdx : 0];
  const isHost = myPlayerOrder === 0;

  const currentPlayer = session.players.find(p => p.playerOrder === session.currentPlayerIndex);
  const currentColorIdx = session.players.findIndex(p => p.id === currentPlayer?.id);
  const currentColor = PLAYER_COLORS[currentColorIdx >= 0 ? currentColorIdx : 0];

  // Computed: set of IDs already used by me across all rounds
  const usedIds = new Set([
    ...(myPlayer?.throws.map(t => t.playerId) ?? []),
    ...draft.map(e => e.id),
  ]);

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Host broadcast: dismiss between-rounds overlay for all players
  useEffect(() => {
    if (continueRoundSignal > 0) setRoundSummary(null);
  }, [continueRoundSignal]);

  // Clear draft when my turn starts
  useEffect(() => {
    if (isMyTurn && !prevMyTurnRef.current) {
      setDraft([]);
      setDraftError(null);
      setStopConfirming(false);
    }
    prevMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  // Per-turn countdown — mirrors local TurnsGameBoard timer logic
  const handleTimeoutRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!isMyTurn || !session.timer || session.status !== 'playing' || roundSummary !== null) { setTimeLeft(null); return; }
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
  }, [isMyTurn, session.currentPlayerIndex, session.roundNumber, session.timer, session.status, roundSummary]);

  // Waiting countdown — mirrors active player's timer for spectating players
  useEffect(() => {
    if (waitingTimerRef.current) { clearInterval(waitingTimerRef.current); waitingTimerRef.current = null; }
    if (isMyTurn || !session.timer || session.status !== 'playing' || roundSummary !== null) { setWaitingTimeLeft(null); return; }
    setWaitingTimeLeft(session.timer);
    waitingTimerRef.current = setInterval(() => {
      setWaitingTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(waitingTimerRef.current!);
          waitingTimerRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (waitingTimerRef.current) { clearInterval(waitingTimerRef.current); waitingTimerRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, session.currentPlayerIndex, session.roundNumber, session.timer, session.status, roundSummary]);

  // Detect round transitions → fetch summary and show overlay
  useEffect(() => {
    if (session.roundNumber <= prevRoundRef.current) return;
    const completedRound = prevRoundRef.current;
    prevRoundRef.current = session.roundNumber;

    supabase
      .from('game_throws')
      .select('*')
      .eq('session_id', session.id)
      .eq('round_number', completedRound)
      .then(({ data }) => {
        const throws = data || [];
        const entries: BetweenRoundsEntry[] = session.players.map((player, idx) => {
          const playerThrows = throws.filter((t: any) => t.player_id === player.id);
          const hasMiss = playerThrows.some((t: any) => t.is_miss);
          const total = hasMiss ? 0 : playerThrows.reduce((s: number, t: any) => s + t.appearances, 0);
          const playedThisRound = playerThrows.length > 0;
          const bustThisRound = playedThisRound && player.isBusted;

          let reason: BetweenRoundsEntry['reason'] = null;
          if (bustThisRound) {
            if (hasMiss) reason = 'miss';
            else if (total > 180) reason = 'over180';
            else reason = 'below zero';
          }

          return {
            playerId: player.id,
            playerName: player.playerName,
            colorIdx: idx,
            total,
            hasMiss,
            bustThisRound,
            hitZero: playedThisRound && player.isFinished && player.score === 0,
            skipped: !playedThisRound,
            currentScore: player.score,
            lives: player.lives,
            reason,
          };
        });
        setRoundSummary(entries);
        setSummaryRoundNum(completedRound);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.roundNumber]);

  // Reset elapsed timer when active player changes
  useEffect(() => {
    if (session.currentPlayerIndex !== prevCurrentPlayerRef.current) {
      prevCurrentPlayerRef.current = session.currentPlayerIndex;
      setElapsed(0);
    }
  }, [session.currentPlayerIndex]);

  // Elapsed timer — runs only while waiting
  useEffect(() => {
    if (isMyTurn || session.status !== 'playing') return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [isMyTurn, session.status]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    if (!isMyTurn || isSubmitting) return;
    const myPlayerNow = session.players.find(p => p.id === myPlayerId);
    const currentLives = myPlayerNow?.lives ?? 0;
    const isElim = !session.allowMisses || currentLives <= 1;
    const msg = isElim
      ? 'Czas minął! Odpadasz z gry.'
      : `Czas minął! Tracisz życie (zostało ${currentLives - 1} ♥)`;
    setTimeoutToast({ msg, isElim });

    setTimeout(async () => {
      setTimeoutToast(null);
      setIsSubmitting(true);
      setDraftError(null);
      const timeoutEntry: OnlineDraftEntry = {
        id: `timeout-${Date.now()}`,
        name: 'Timeout',
        appearances: 0,
        isMiss: true,
      };
      await onLockIn([timeoutEntry]);
      setIsSubmitting(false);
      setDraft([]);
    }, 2200);
  }, [isMyTurn, isSubmitting, session, myPlayerId, onLockIn]);

  useEffect(() => { handleTimeoutRef.current = handleTimeout; }, [handleTimeout]);

  const handleAdd = useCallback(async (name: string, playerId?: string) => {
    if (!session.club) return;
    setIsSearching(true);
    setDraftError(null);
    try {
      const fp = await searchPlayer(session.club.id, name, playerId);
      const isMiss = !fp || fp.appearances === 0;
      const entry: OnlineDraftEntry = isMiss
        ? { id: fp?.id ?? `miss-${Date.now()}`, name: fp?.name ?? name, appearances: 0, photo: fp?.photo, isMiss: true }
        : { id: fp.id, name: fp.name, appearances: fp.appearances, photo: fp.photo, position: fp.position };

      if (!isMiss && usedIds.has(fp!.id)) {
        setDraftError(`${fp!.name} already used!`);
        return;
      }
      setDraft(prev => [entry, ...prev]);
    } catch {
      setDraftError('Error searching for player');
    } finally {
      setIsSearching(false);
    }
  }, [session.club, usedIds]);

  const handleRemove = (idx: number) => setDraft(prev => prev.filter((_, i) => i !== idx));

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimeLeft(null);
  };

  const handleLockIn = async () => {
    if (draft.length === 0) { setDraftError('Dodaj przynajmniej jednego piłkarza!'); return; }
    stopTimer();
    setIsSubmitting(true);
    setDraftError(null);
    await onLockIn(draft);
    setIsSubmitting(false);
    setDraft([]);
  };

  const handleStop = async () => {
    stopTimer();
    setIsSubmitting(true);
    await onStop();
    setIsSubmitting(false);
    setStopConfirming(false);
  };

  // ── Score ring values ────────────────────────────────────────────────────────

  const SCORE_R = 46;
  const SCORE_C = 2 * Math.PI * SCORE_R;
  const myScore = myPlayer?.score ?? 0;
  const scoreFraction = Math.max(0, Math.min(1, myScore / session.startingScore));

  // Elapsed ring (waiting screen)
  const MAX_ELAPSED = 60;
  const elapsedFraction = Math.min(1, elapsed / MAX_ELAPSED);
  const elapsedRingColor = elapsedFraction > 0.66 ? '#b91c1c' : elapsedFraction > 0.4 ? '#d97706' : currentColor;

  // Countdown ring (my turn) — identical logic to local TurnsGameBoard
  const countdownFraction = session.timer && timeLeft !== null ? timeLeft / session.timer : 1;
  const countdownRingColor = countdownFraction > 0.4 ? '#15803d' : countdownFraction > 0.2 ? '#d97706' : '#b91c1c';

  // ── Shared header — identical to local TurnsGameBoard ───────────────────────

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
      <motion.button
        onClick={() => setShowRules(true)}
        style={{ ...OUTLINE_BTN, color: '#1e3a8a', borderColor: '#1e3a8a', padding: '7px 10px' }}
        whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
        title="Zasady gry"
      >
        <HelpCircle size={14} />
      </motion.button>
    </motion.div>
  );

  // ── BETWEEN ROUNDS — pełny ekran, 1:1 z lokalną grą ─────────────────────────

  if (roundSummary && session.status !== 'finished') {
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
        <AnimatePresence>{showRules && <RulesOverlay onClose={() => setShowRules(false)} startingScore={session.startingScore} allowMisses={session.allowMisses} />}</AnimatePresence>
        {header}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#1e3a8a', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase' }}>
            Round {summaryRoundNum} Results
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 28 }}>
            {roundSummary.map((entry, i) => (
              <RoundResultTile
                key={entry.playerId}
                playerName={entry.playerName}
                color={PLAYER_COLORS[entry.colorIdx] ?? '#1e3a8a'}
                apps={entry.total}
                isElim={entry.bustThisRound}
                isStopped={false}
                isWaiting={entry.skipped}
                hitZero={entry.hitZero}
                score={entry.currentScore}
                lives={entry.lives}
                reason={entry.reason}
                isMe={entry.playerId === myPlayerId}
                allowMisses={session.allowMisses}
                delay={i * 0.08}
              />
            ))}
          </div>
          {isHost ? (
            <motion.button
              onClick={() => { onContinueRound(); setRoundSummary(null); }}
              style={{ background: '#1e3a8a', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.15em', padding: '12px 32px', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,58,138,0.3)' }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              Next Round
            </motion.button>
          ) : (
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#8a7553', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
              Czekaj na hosta…
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────────

  if (session.status === 'finished') {
    const gameOverPlayers: GameOverPlayer[] = session.players.map((p, i) => ({
      id: p.id,
      name: p.playerName,
      score: p.score,
      isElim: p.isBusted,
      isMe: p.id === myPlayerId,
      color: PLAYER_COLORS[i] ?? '#1e3a8a',
    }));

    const fetchHistory = async () => {
      if (historyData) { setShowHistory(true); return; }
      const { data } = await supabase
        .from('game_throws')
        .select('*')
        .eq('session_id', session.id)
        .order('round_number', { ascending: true })
        .order('created_at', { ascending: true });
      if (!data) return;
      const maxRound = Math.max(...data.map((t: any) => t.round_number), 0);
      const rounds: HistoryRound[] = [];
      for (let r = 1; r <= maxRound; r++) {
        const roundThrows = data.filter((t: any) => t.round_number === r);
        const byPlayer = session.players.map(player => ({
          player,
          throws: roundThrows
            .filter((t: any) => t.player_id === player.id)
            .map((t: any): Throw => ({
              playerId: t.football_player_id,
              playerName: t.football_player_name,
              appearances: t.appearances,
              timestamp: new Date(t.created_at).getTime(),
              photo: t.photo ?? undefined,
              missed: t.is_miss,
            })),
        })).filter(bp => bp.throws.length > 0);
        if (byPlayer.length > 0) rounds.push({ roundNum: r, byPlayer });
      }
      setHistoryData(rounds);
      setHistoryRound(0);
      setShowHistory(true);
    };

    const historyOverlay = (
      <AnimatePresence>
        {showHistory && historyData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ede3ce', borderRadius: 8, padding: '20px 24px', maxWidth: '92vw', width: '100%', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#1e3a8a', letterSpacing: '0.06em' }}>Historia rzutów</div>
                <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7553', padding: 4 }}><X size={18} /></button>
              </div>
              {historyData.length === 0 ? (
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.85rem', color: '#a09070' }}>Brak rozegranych rund</span>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
                    {historyData.map((r, idx) => (
                      <button key={r.roundNum} onClick={() => setHistoryRound(idx)}
                        style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', letterSpacing: '0.14em', padding: '5px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', background: historyRound === idx ? '#1e3a8a' : 'rgba(30,58,138,0.1)', color: historyRound === idx ? 'white' : '#1e3a8a', transition: 'background 0.15s, color 0.15s' }}>
                        R{r.roundNum}
                      </button>
                    ))}
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {historyData[historyRound]?.byPlayer.map(({ player, throws: playerThrows }, pIdx) => {
                        const colorIdx = session.players.findIndex(p => p.id === player.id);
                        const color = PLAYER_COLORS[colorIdx >= 0 ? colorIdx : 0];
                        const hasMiss = playerThrows.some(t => t.missed);
                        return (
                          <div key={player.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <div style={{ background: color, borderRadius: 3, padding: '2px 10px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'white', letterSpacing: '0.06em' }}>
                                {player.playerName}
                              </div>
                              {player.isBusted && (
                                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#b91c1c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>• bust</span>
                              )}
                              {player.isFinished && !player.isBusted && player.score > 0 && (
                                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#92400e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>• stopped</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {playerThrows.map((t, ti) => (
                                <PlayerSticker key={t.playerId + ti} throw_={t} index={ti} />
                              ))}
                            </div>
                            {hasMiss && (
                              <div style={{ marginTop: 6, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#b91c1c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {session.allowMisses ? '−1 life · score unchanged' : 'miss · eliminated'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={BG}>
        <AnimatePresence>{showRules && <RulesOverlay onClose={() => setShowRules(false)} startingScore={session.startingScore} allowMisses={session.allowMisses} />}</AnimatePresence>
        {historyOverlay}
        <GameOverScreen
          players={gameOverPlayers}
          onNewGame={onLeave}
          extraButtons={
            <motion.button onClick={fetchHistory} style={OUTLINE_BTN} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
              History
            </motion.button>
          }
        />
      </div>
    );
  }

  // ── MY TURN — drafting ───────────────────────────────────────────────────────


  // ── WAITING — other player's turn ────────────────────────────────────────────

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${elapsed}s`;

  // ── RENDER ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
      <AnimatePresence>{showRules && <RulesOverlay onClose={() => setShowRules(false)} startingScore={session.startingScore} allowMisses={session.allowMisses} />}</AnimatePresence>

      {/* Timeout toast — identical to local TurnsGameBoard */}
      <AnimatePresence>
        {timeoutToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
            style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
          >
            <div style={{ background: timeoutToast.isElim ? '#b91c1c' : '#92400e', color: 'white', borderRadius: 10, padding: '28px 40px', textAlign: 'center', boxShadow: '0 12px 48px rgba(0,0,0,0.4)', maxWidth: 320 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', letterSpacing: '0.06em', lineHeight: 1, marginBottom: 10 }}>⏱ TIMEOUT</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '1rem', lineHeight: 1.4, opacity: 0.92 }}>{timeoutToast.msg}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div key={`online-${session.currentPlayerIndex}-${isMyTurn}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center">

        {header}

        {/* ── MY TURN ── */}
        {isMyTurn && myPlayer && !myPlayer.isBusted && !myPlayer.isFinished ? (
          <>
            {/* Player strip */}
            <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: myColor, borderRadius: 6, padding: '8px 16px' }}>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'white', letterSpacing: '0.06em' }}>
                  {myPlayer.playerName}
                  <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: 8 }}>— Twój ruch</span>
                </span>
                {session.allowMisses && (
                  <span style={{ fontSize: '1.1rem', letterSpacing: '0.08em' }}>
                    {[0, 1, 2].map((_, i) => (
                      <span key={i} style={{ color: i < myPlayer.lives ? 'white' : 'rgba(255,255,255,0.25)', transition: 'color 0.2s' }}>♥</span>
                    ))}
                  </span>
                )}
              </div>
            </div>

            {/* Score circle + countdown timer circle — identical to local TurnsGameBoard */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
                <svg width="108" height="108" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="54" cy="54" r={SCORE_R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="10" />
                  <circle cx="54" cy="54" r={SCORE_R} fill="none" stroke={myColor} strokeWidth="10"
                    strokeDasharray={SCORE_C} strokeDashoffset={SCORE_C * (1 - scoreFraction)}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.span key={myScore} initial={{ scale: 1.2, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.9rem', color: myColor, lineHeight: 1 }}>
                    {myScore}
                  </motion.span>
                </div>
              </div>

              {session.timer && timeLeft !== null && (
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${countdownRingColor} ${countdownFraction * 360}deg, rgba(0,0,0,0.08) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ede3ce', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: countdownRingColor, lineHeight: 1 }}>{timeLeft}</span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.42rem', color: countdownRingColor, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>sec</span>
                  </div>
                </div>
              )}
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
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ width: '100%', maxWidth: 420, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#b91c1c', letterSpacing: '0.06em', marginBottom: 8, padding: '6px 14px', background: '#fef2f2', border: '1.5px solid #b91c1c', borderRadius: 4 }}>
                  {draftError || hookError}
                </motion.div>
              )}
            </AnimatePresence>


            {/* Actions — identical to local TurnsGameBoard */}
            <div style={{ width: '100%', maxWidth: 420, display: 'flex', gap: 8, marginBottom: 16 }}>
              <motion.button
                onClick={handleLockIn}
                disabled={draft.length === 0 || isSubmitting || hookLoading}
                style={{
                  flex: 1,
                  background: draft.length === 0 ? '#c4b89a' : myColor,
                  color: 'white',
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.3rem',
                  letterSpacing: '0.16em',
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
                {isSubmitting
                  ? <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.6)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  : 'Potwierdź strzał'
                }
              </motion.button>

              <AnimatePresence mode="wait">
                {!stopConfirming ? (
                  <motion.button
                    key="stop-idle"
                    onClick={() => setStopConfirming(true)}
                    style={{
                      width: 96, flexShrink: 0,
                      background: 'white', borderRadius: 6,
                      border: '2px solid #d4c4a0', cursor: 'pointer',
                      padding: '10px 4px', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 5,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
                    }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.04, borderColor: '#92400e' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <StopCircle size={22} style={{ color: '#92400e' }} />
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#92400e', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.2, textAlign: 'center' }}>
                      Stop<br />Playing
                    </span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="stop-confirm"
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                    style={{
                      width: 96, flexShrink: 0, background: '#fff8f0',
                      borderRadius: 6, border: '2px solid #92400e',
                      padding: '6px 5px', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 4,
                    }}
                  >
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.58rem', color: '#92400e', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3 }}>
                      Lock score at {myScore}?
                    </span>
                    <button onClick={handleStop} disabled={isSubmitting}
                      style={{ width: '100%', background: '#92400e', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.8rem', letterSpacing: '0.1em', padding: '4px 0' }}>
                      Confirm
                    </button>
                    <button onClick={() => setStopConfirming(false)}
                      style={{ width: '100%', background: 'none', color: '#92400e', border: '1px solid #d4c4a0', borderRadius: 3, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.06em', padding: '3px 0' }}>
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Draft cards — face down, wrap like local TurnsGameBoard */}
            <div style={{ width: '100%', maxWidth: 420, minHeight: 140 }}>
              {draft.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 8 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#a09070', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    pick your players
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {draft.map((entry, i) => (
                    <motion.div
                      key={entry.id + i}
                      style={{ flexShrink: 0, position: 'relative' }}
                      initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
                      animate={{ opacity: 1, scale: 1, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <CardBack
                        playerName={myPlayer?.playerName ?? ''}
                        color={entry.isMiss ? '#b91c1c' : myColor}
                        cardIndex={i}
                        footballPlayerName={entry.name}
                        onRemove={() => handleRemove(i)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Used players */}
            {myPlayer.throws.length > 0 && (
              <div style={{ width: '100%', maxWidth: 420, marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {myPlayer.throws.map((t, i) => (
                  <span key={i} style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: '0.7rem', color: `${myColor}88`, textDecoration: 'line-through', letterSpacing: '0.04em' }}>
                    {t.playerName}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          // ── WAITING ──
          <>
            {/* Player strip — current active player */}
            <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: currentColor, borderRadius: 6, padding: '8px 16px' }}>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'white', letterSpacing: '0.06em' }}>
                  {currentPlayer?.playerName ?? '…'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {session.timer && waitingTimeLeft !== null && (
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'white', lineHeight: 1, opacity: 0.9 }}>
                      {waitingTimeLeft}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score circle + elapsed timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
              {/* My score ring */}
              {myPlayer && !myPlayer.isBusted && !myPlayer.isFinished && (
                <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
                  <svg width="108" height="108" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="54" cy="54" r={SCORE_R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="10" />
                    <circle cx="54" cy="54" r={SCORE_R} fill="none" stroke={myColor} strokeWidth="10"
                      strokeDasharray={SCORE_C} strokeDashoffset={SCORE_C * (1 - scoreFraction)}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.9rem', color: myColor, lineHeight: 1 }}>{myScore}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Face-down cards placeholder — hides how many cards opponent is picking */}
            <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
              <div style={{ border: '2px dashed #d4c4a0', borderRadius: 5, height: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2, ease: 'easeInOut' }}
                    style={{ width: 60, height: 80, borderRadius: 4, background: currentColor, opacity: 0.25 + i * 0.15, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 6, fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.12em', color: '#b5a07a', textTransform: 'uppercase' }}>
                Karty zakryte — wyniki po rundzie
              </div>
            </div>

            {/* All players scoreboard */}
            <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {session.players
                .slice()
                .sort((a, b) => a.playerOrder - b.playerOrder)
                .map((p, idx) => {
                  const color = PLAYER_COLORS[idx] ?? '#1e3a8a';
                  const isActive = p.playerOrder === session.currentPlayerIndex;
                  const isMe = p.id === myPlayerId;
                  const hasStopped = p.isFinished && p.score > 0;
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderLeft: `4px solid ${isActive ? color : 'transparent'}`, background: isActive ? `${color}0d` : 'transparent', borderBottom: idx < session.players.length - 1 ? '1px solid #f0e8d6' : 'none', transition: 'all 0.3s ease' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.isBusted ? '#d4c4a0' : color, flexShrink: 0 }} />
                      <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: '0.9rem', color: p.isBusted ? '#a09070' : '#1e1810', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.playerName}
                        {isMe && <span style={{ fontSize: '0.6rem', color, marginLeft: 5 }}>(Ty)</span>}
                      </div>
                      {session.allowMisses && (
                        <div style={{ fontSize: '0.75rem' }}>
                          {[0, 1, 2].map(i => <span key={i} style={{ color: i < p.lives ? '#b91c1c' : '#d4c4a0' }}>♥</span>)}
                        </div>
                      )}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {p.isBusted
                          ? <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: '0.7rem', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>BUST</span>
                          : hasStopped
                          ? <div><div style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', color: '#15803d' }}>{p.score}</div><div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: '0.52rem', color: '#15803d', textTransform: 'uppercase' }}>STOP</div></div>
                          : <span style={{ fontFamily: 'Bebas Neue', fontSize: '1.2rem', color: '#1e1810' }}>{p.score}</span>
                        }
                      </div>
                      {isActive && <Wifi size={12} color={color} style={{ flexShrink: 0 }} />}
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </motion.div>

      {/* Bottom stripe */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #b91c1c 0%, #1e3a8a 50%, #b91c1c 100%)', zIndex: 50 }} />
    </div>
  );
};
