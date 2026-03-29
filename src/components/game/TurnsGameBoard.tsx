import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, FootballPlayer, Throw } from '@/types/game';
import { PlayerInput } from './PlayerInput';
import { PlayerSticker } from './PlayerSticker';
import { RotateCcw, EyeOff, X, StopCircle, HelpCircle } from 'lucide-react';
import { useAllPlayers } from '@/hooks/useAllPlayers';
import { searchPlayer } from '@/data/mockData';
import { CardBack } from './BlitzGameBoard';

const PLAYER_COLORS = ['#1e3a8a', '#b91c1c', '#15803d', '#92400e'];

const BG: React.CSSProperties = {
  backgroundColor: '#ede3ce',
  backgroundImage:
    'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)',
};

const OUTLINE_BTN: React.CSSProperties = {
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

type Phase = 'drafting' | 'handover' | 'between-rounds' | 'game-over';

interface RoundResult {
  pIdx: number;
  apps: number;
  elim: boolean;
  stopped: boolean;
  hitZero: boolean;
  reason?: 'over180' | 'bust' | 'miss' | 'timeout';
  hasMiss?: boolean;
}

interface DraftEntry extends FootballPlayer {
  isMiss?: boolean;
}

interface TurnsGameBoardProps {
  gameState: GameState;
  onReset: () => void;
}

export const TurnsGameBoard = ({ gameState, onReset }: TurnsGameBoardProps) => {
  const players = gameState.players;
  const allowMisses = gameState.allowMisses;
  const timerDuration = gameState.timer;

  // Persistent game state
  const [scores, setScores] = useState<number[]>(() => players.map(() => gameState.startingScore));
  const [eliminated, setEliminated] = useState<boolean[]>(() => players.map(() => false));
  const [stopped, setStopped] = useState<boolean[]>(() => players.map(() => false));
  const [allThrows, setAllThrows] = useState<Throw[][][]>(() => players.map(() => []));

  // Round state
  const [roundNum, setRoundNum] = useState(1);
  const [draft, setDraft] = useState<DraftEntry[][]>(() => players.map(() => []));
  const [lives, setLives] = useState<number[]>(() => players.map(() => 3));
  const [draftOrder, setDraftOrder] = useState<number[]>(() => players.map((_, i) => i));
  const [draftStep, setDraftStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('drafting');
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [winnerIdxs, setWinnerIdxs] = useState<number[]>([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRound, setHistoryRound] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [timeoutToast, setTimeoutToast] = useState<{ msg: string; isElim: boolean } | null>(null);

  const { allPlayers, isLoading: isLoadingSquad } = useAllPlayers();

  const curIdx = draftOrder[draftStep] ?? 0;
  const curPlayer = players[curIdx];
  const curColor = PLAYER_COLORS[curIdx] ?? '#1e3a8a';
  const curDraft = draft[curIdx] ?? [];

  const usedIds = new Set([
    ...allThrows[curIdx].flat().map(t => t.playerId),
    ...curDraft.map(fp => fp.id),
  ]);

  // ── Timer ──────────────────────────────────────────────────────────────────

  // Use a ref for the timeout handler to avoid stale closures in setInterval
  const handleTimeoutRef = useRef<() => void>(() => {});

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimeLeft(null);
  }, []);

  // Start timer when entering drafting phase or player changes
  useEffect(() => {
    if (!timerDuration || phase !== 'drafting') {
      stopTimer();
      return;
    }
    stopTimer();
    setTimeLeft(timerDuration);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          // Fire timeout via ref (always points to latest handler)
          setTimeout(() => handleTimeoutRef.current(), 0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curIdx, roundNum, phase, timerDuration]);

  // ── Core helpers ───────────────────────────────────────────────────────────

  const findWinners = (sc: number[], el: boolean[]): number[] => {
    const active = sc.map((s, i) => ({ s, i })).filter((_, i) => !el[i]);
    if (active.length === 0) return [];
    const minScore = Math.min(...active.map(a => a.s));
    return active.filter(a => a.s === minScore).map(a => a.i);
  };

  const resolveRoundWith = useCallback((
    currentDraft: DraftEntry[][],
    currentStopped: boolean[],
    currentElim = eliminated,
  ) => {
    const newScores = [...scores];
    const newElim = [...currentElim];
    const newLives = [...lives];
    const newThrows = allThrows.map(a => [...a]);
    const results: RoundResult[] = [];

    for (const pIdx of draftOrder) {
      // Stopped players: skip, show as stopped in results
      if (currentStopped[pIdx]) {
        results.push({ pIdx, apps: 0, elim: false, stopped: true, hitZero: false });
        continue;
      }

      const d = currentDraft[pIdx] ?? [];
      const hasMiss = d.some(fp => fp.isMiss);
      const total = hasMiss ? 0 : d.reduce((s, fp) => s + fp.appearances, 0);
      let elim = false;
      let hitZero = false;
      let reason: RoundResult['reason'];

      if (hasMiss && allowMisses) {
        newLives[pIdx] = Math.max(0, newLives[pIdx] - 1);
        if (newLives[pIdx] <= 0) { elim = true; reason = 'miss'; newElim[pIdx] = true; }
      } else if (hasMiss && !allowMisses) {
        elim = true; reason = d[0]?.id?.startsWith('timeout-') ? 'timeout' : 'miss'; newElim[pIdx] = true;
      } else if (total > 180) {
        elim = true; reason = 'over180'; newElim[pIdx] = true;
      } else if (newScores[pIdx] - total < 0) {
        elim = true; reason = 'bust'; newElim[pIdx] = true;
      } else {
        newScores[pIdx] -= total;
        hitZero = newScores[pIdx] === 0;
      }

      const throws: Throw[] = d.map(fp => ({
        playerId: fp.id,
        playerName: fp.name,
        appearances: fp.appearances,
        timestamp: Date.now(),
        photo: fp.photo,
        position: fp.position,
        busted: fp.isMiss,
        missed: fp.isMiss,
      }));
      newThrows[pIdx] = [...newThrows[pIdx], throws];
      results.push({ pIdx, apps: hasMiss ? 0 : total, elim, stopped: false, hitZero, reason, hasMiss });
    }

    setScores(newScores);
    setEliminated(newElim);
    setLives(newLives);
    setAllThrows(newThrows);
    setRoundResults(results);

    // Determine end-of-game conditions
    const anyZero = results.some(r => r.hitZero);
    const remainingActive = players.map((_, i) => !newElim[i] && !currentStopped[i]).filter(Boolean).length;

    if (anyZero || remainingActive === 0) {
      setWinnerIdxs(findWinners(newScores, newElim));
      setPhase('game-over');
    } else {
      setPhase('between-rounds');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, eliminated, lives, allThrows, draftOrder, allowMisses, players]);

  // Keep timeout handler ref up to date
  const handleTimeoutAction = useCallback(() => {
    stopTimer();
    const timeoutEntry: DraftEntry = {
      id: `timeout-${Date.now()}`,
      name: 'Timeout',
      appearances: 0,
      position: '',
      nationality: '',
      isMiss: true,
    };
    const updatedDraft = draft.map((d, i) => i === curIdx ? [timeoutEntry] : d);
    setDraft(updatedDraft);
    setError(null);

    // Check if this timeout will eliminate the player (no lives left)
    const isElim = !allowMisses || lives[curIdx] <= 1;
    const msg = isElim
      ? 'Czas minął! Odpadasz z gry.'
      : `Czas minął! Tracisz życie (zostało ${lives[curIdx] - 1} ♥)`;
    setTimeoutToast({ msg, isElim });

    // Snapshot mutable values for the delayed callback
    const _draftStep = draftStep;
    const _draftOrder = [...draftOrder];
    const _stopped = [...stopped];

    setTimeout(() => {
      setTimeoutToast(null);
      if (_draftStep < _draftOrder.length - 1) {
        setPhase('handover');
      } else {
        resolveRoundWith(updatedDraft, _stopped);
      }
    }, 2200);
  }, [curIdx, draft, draftStep, draftOrder, stopped, lives, allowMisses, resolveRoundWith, stopTimer]);

  useEffect(() => {
    handleTimeoutRef.current = handleTimeoutAction;
  }, [handleTimeoutAction]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAdd = async (name: string, playerId?: string) => {
    if (!gameState.club) return;
    setIsLoading(true);
    setError(null);
    const fp = await searchPlayer(gameState.club.id, name, playerId);
    const isMiss = !fp || fp.appearances === 0;
    const entry: DraftEntry = isMiss
      ? (fp ? { ...fp, isMiss: true } : { id: `miss-${Date.now()}`, name, appearances: 0, position: '', nationality: '', photo: '', isMiss: true })
      : fp;

    if (!isMiss && usedIds.has(fp!.id)) { setError(`${fp!.name} already used!`); setIsLoading(false); return; }
    setDraft(prev => { const n = prev.map(a => [...a]); n[curIdx] = [...n[curIdx], entry]; return n; });
    setIsLoading(false);
  };

  const handleRemove = (i: number) => {
    setDraft(prev => { const n = prev.map(a => [...a]); n[curIdx] = n[curIdx].filter((_, j) => j !== i); return n; });
  };

  const handleLockIn = () => {
    if (curDraft.length === 0) { setError('Add at least one player!'); return; }
    setError(null);
    stopTimer();
    if (draftStep < draftOrder.length - 1) {
      setPhase('handover');
    } else {
      resolveRoundWith(draft, stopped);
    }
  };

  const handleStop = () => {
    setError(null);
    stopTimer();
    const newStopped = [...stopped];
    newStopped[curIdx] = true;
    setStopped(newStopped);

    if (draftStep < draftOrder.length - 1) {
      setPhase('handover');
    } else {
      resolveRoundWith(draft, newStopped);
    }
  };

  const handleHandover = () => {
    setDraftStep(s => s + 1);
    setPhase('drafting');
  };

  const handleNextRound = () => {
    const active = players.map((_, i) => i).filter(i => !eliminated[i] && !stopped[i]);
    if (active.length === 0) {
      setWinnerIdxs(findWinners(scores, eliminated));
      setPhase('game-over');
      return;
    }
    setDraftOrder(active);
    setDraftStep(0);
    setDraft(players.map(() => []));
    setRoundNum(r => r + 1);
    setPhase('drafting');
    setError(null);
  };

  const handleFinish = () => {
    setWinnerIdxs(findWinners(scores, eliminated));
    setPhase('game-over');
  };

  // ── Shared UI pieces ──────────────────────────────────────────────────────

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
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#1e3a8a', letterSpacing: '0.04em', lineHeight: 1 }}>
                  Zasady gry
                </div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.72rem', color: '#8a7553', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
                  Football Darts · Turns
                </div>
              </div>
              <button onClick={() => setShowRules(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7553', padding: 4, marginTop: 2 }}>
                <X size={20} />
              </button>
            </div>

            {/* Rules list */}
            {[
              {
                num: '01',
                title: 'Cel gry',
                body: `Zaczynasz od ${gameState.startingScore} punktów. Wybierając piłkarzy odejmujesz ich liczbę występów. Wygrywa ten, kto jest najbliżej zera.`,
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
              ...(allowMisses ? [{
                num: '05',
                title: 'Miss i życia',
                body: 'Jeśli wybierzesz piłkarza z 0 występami dla tego klubu — tracisz życie (masz 3). Strata wszystkich żyć = eliminacja.',
                color: '#b91c1c',
              }] : [{
                num: '05',
                title: 'Miss',
                body: 'Piłkarz z 0 występami dla tego klubu = natychmiastowy bust.',
                color: '#b91c1c',
              }]),
              ...(timerDuration ? [{
                num: '06',
                title: `Timer (${timerDuration}s)`,
                body: `Masz ${timerDuration} sekund na swój ruch. Przekroczenie czasu = traktowane jak miss${allowMisses ? ' (tracisz życie)' : ' (eliminacja)'}.`,
                color: '#7a6340',
              }] : []),
              {
                num: timerDuration ? '07' : '06',
                title: 'Koniec gry',
                body: 'Gra kończy się gdy ktoś trafi dokładne zero (rundę dokańczamy), wszyscy aktywni gracze klikną stop lub wszyscy odpadną.',
                color: '#15803d',
              },
              {
                num: timerDuration ? '08' : '07',
                title: 'Remis',
                body: 'Wielu graczy może wygrać jednocześnie — jeśli mają identyczny wynik końcowy.',
                color: '#15803d',
              },
            ].map(({ num, title, body, color }) => (
              <div key={num} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 4, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>{num}</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: color, letterSpacing: '0.06em', lineHeight: 1, marginBottom: 3 }}>
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
              style={{ width: '100%', marginTop: 8, background: '#1e3a8a', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.2em', padding: '11px 0', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,58,138,0.3)' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              Rozumiem — gramy!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const header = (
    <motion.div
      className="flex items-center justify-between mb-5"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        <motion.button onClick={onReset} style={OUTLINE_BTN} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
          <RotateCcw size={13} /> New Game
        </motion.button>
        <motion.button
          onClick={() => setShowRules(true)}
          style={{ ...OUTLINE_BTN, color: '#1e3a8a', borderColor: '#1e3a8a', padding: '7px 10px' }}
          whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
          title="Zasady gry"
        >
          <HelpCircle size={14} />
        </motion.button>
      </div>
      {gameState.club && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 4, padding: '5px 12px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          <img
            src={gameState.club.logo}
            alt={gameState.club.name}
            style={{ width: 24, height: 24, objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.95rem', color: '#1e3a8a', letterSpacing: '0.04em' }}>
            {gameState.club.name}
          </span>
        </div>
      )}
      <div style={{
        background: '#1e3a8a', color: 'white',
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
        fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
        padding: '6px 12px', borderRadius: 4,
      }}>
        Turns · R{roundNum}
      </div>
    </motion.div>
  );

  const historyOverlay = (
    <AnimatePresence>
      {showHistory && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setShowHistory(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#ede3ce', borderRadius: 8, padding: '20px 24px', maxWidth: '92vw', width: '100%', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#1e3a8a', letterSpacing: '0.06em' }}>
                Historia rzutów
              </div>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7553', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {(() => {
              const totalRounds = Math.max(...allThrows.map(p => p.length), 0);
              if (totalRounds === 0) return (
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.85rem', color: '#a09070' }}>Brak rozegranych rund</span>
              );
              const activeRound = Math.min(historyRound, totalRounds - 1);
              return (
                <>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
                    {Array.from({ length: totalRounds }, (_, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => setHistoryRound(rIdx)}
                        style={{
                          fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', letterSpacing: '0.14em',
                          padding: '5px 14px', borderRadius: 4, border: 'none', cursor: 'pointer',
                          background: activeRound === rIdx ? '#1e3a8a' : 'rgba(30,58,138,0.1)',
                          color: activeRound === rIdx ? 'white' : '#1e3a8a',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        R{rIdx + 1}
                      </button>
                    ))}
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {players.map((player, pIdx) => {
                        const roundThrows = allThrows[pIdx][activeRound];
                        if (!roundThrows) return null;
                        return (
                          <div key={player.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <div style={{ background: PLAYER_COLORS[pIdx], borderRadius: 3, padding: '2px 10px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'white', letterSpacing: '0.06em' }}>
                                {player.name}
                              </div>
                              {eliminated[pIdx] && activeRound === allThrows[pIdx].length - 1 && (
                                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#b91c1c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>• bust</span>
                              )}
                              {stopped[pIdx] && activeRound === allThrows[pIdx].length - 1 && (
                                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#92400e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>• stopped</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {roundThrows.map((t, ti) => (
                                <PlayerSticker key={t.playerId + ti} throw_={t} index={ti} />
                              ))}
                            </div>
                            {roundThrows.some(t => t.missed) && (
                              <div style={{ marginTop: 6, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#b91c1c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {allowMisses ? '−1 life · score unchanged' : 'miss · eliminated'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── HANDOVER ──────────────────────────────────────────────────────────────
  if (phase === 'handover') {
    const nextPIdx = draftOrder[draftStep + 1];
    const nextPlayer = players[nextPIdx];
    const prevStopped = stopped[curIdx];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={BG}>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'white', borderRadius: 6, padding: '40px 48px', boxShadow: '0 6px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)', maxWidth: 340 }}
        >
          <EyeOff size={40} style={{ color: '#1e3a8a', margin: '0 auto 20px' }} />
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#1e3a8a', letterSpacing: '0.04em', marginBottom: 8 }}>
            Pass the device!
          </div>
          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#5a4a35', marginBottom: 28 }}>
            {prevStopped ? (
              <><strong>{curPlayer.name}</strong> stopped playing.</>
            ) : (
              <>{curPlayer.name}'s picks are locked.</>
            )}<br />
            Hand to <strong>{nextPlayer.name}</strong>.
          </p>
          <motion.button
            onClick={handleHandover}
            style={{ background: '#1e3a8a', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', letterSpacing: '0.14em', padding: '12px 40px', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,58,138,0.35)' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            I'm {nextPlayer.name} — Ready!
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── BETWEEN ROUNDS ────────────────────────────────────────────────────────
  if (phase === 'between-rounds') {
    // Build display: active round results + stopped-before-this-round players
    const resultPIdxs = new Set(roundResults.map(r => r.pIdx));
    const stoppedBeforeRound = players
      .map((_, i) => i)
      .filter(i => stopped[i] && !resultPIdxs.has(i) && !eliminated[i]);

    return (
      <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
        {header}
        {historyOverlay}
      {rulesOverlay}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#1e3a8a', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase' }}>
            Round {roundNum} Results
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            {roundResults.map(({ pIdx, apps, elim, stopped: wasStopped, hitZero, reason }) => (
              <motion.div
                key={pIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pIdx * 0.08 }}
                style={{
                  background: elim ? '#b91c1c' : wasStopped ? '#92400e' : hitZero ? '#15803d' : 'white',
                  borderRadius: 6,
                  padding: '16px 20px',
                  textAlign: 'center',
                  boxShadow: elim
                    ? '0 0 0 3px #b91c1c, 0 0 28px rgba(185,28,28,0.5)'
                    : hitZero
                    ? '0 0 0 3px #15803d, 0 0 28px rgba(21,128,61,0.5)'
                    : '0 2px 10px rgba(0,0,0,0.1)',
                  minWidth: 110,
                  borderTop: elim || wasStopped || hitZero ? 'none' : `4px solid ${PLAYER_COLORS[pIdx] ?? '#1e3a8a'}`,
                }}
              >
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', color: elim || wasStopped || hitZero ? 'rgba(255,255,255,0.8)' : PLAYER_COLORS[pIdx], letterSpacing: '0.06em', marginBottom: 6 }}>
                  {players[pIdx].name}
                </div>
                {wasStopped ? (
                  <>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'white', lineHeight: 1 }}>{scores[pIdx]}</div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>Stopped</div>
                  </>
                ) : elim ? (
                  <>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'white', lineHeight: 1, letterSpacing: '0.08em' }}>OUT!</div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>
                      {reason === 'over180' ? 'over 180' : reason === 'miss' ? (allowMisses ? 'no lives left' : 'miss!') : reason === 'timeout' ? 'timeout' : 'below zero'}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.68rem', color: hitZero ? 'rgba(255,255,255,0.7)' : '#8a7553', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                      -{apps} apps
                    </div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: hitZero ? 'white' : PLAYER_COLORS[pIdx], lineHeight: 1 }}>
                      {hitZero ? '0 ★' : scores[pIdx]}
                    </div>
                    {allowMisses && !hitZero && (
                      <div style={{ fontSize: '0.72rem', marginTop: 3 }}>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span key={i} style={{ color: i < lives[pIdx] ? '#b91c1c' : '#d4c4a0' }}>♥</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}

            {/* Players stopped in previous rounds */}
            {stoppedBeforeRound.map(pIdx => (
              <motion.div
                key={`stopped-${pIdx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#7a6340',
                  borderRadius: 6, padding: '16px 20px', textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)', minWidth: 110,
                }}
              >
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {players[pIdx].name}
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'white', lineHeight: 1 }}>{scores[pIdx]}</div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.58rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>Waiting</div>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button
              onClick={handleNextRound}
              style={{ background: '#1e3a8a', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.15em', padding: '12px 32px', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,58,138,0.3)' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Next Round
            </motion.button>
            <motion.button
              onClick={handleFinish}
              style={{ background: '#b91c1c', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.15em', padding: '12px 32px', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(185,28,28,0.3)' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Finish Game
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────
  if (phase === 'game-over') {
    const isDraw = winnerIdxs.length > 1;
    const isWinner = (i: number) => winnerIdxs.includes(i);

    // Sort players: winners first, then by score (non-eliminated), busted last
    const sortedPlayers = players
      .map((p, i) => ({ p, i }))
      .sort((a, b) => {
        const aWin = isWinner(a.i), bWin = isWinner(b.i);
        if (aWin && !bWin) return -1;
        if (!aWin && bWin) return 1;
        const aBust = eliminated[a.i], bBust = eliminated[b.i];
        if (!aBust && bBust) return -1;
        if (aBust && !bBust) return 1;
        return scores[a.i] - scores[b.i];
      });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={BG}>
        {historyOverlay}
      {rulesOverlay}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full"
          style={{ maxWidth: 480 }}
        >
          {/* Title */}
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: '#8a7553', letterSpacing: '0.3em', marginBottom: 16, textTransform: 'uppercase' }}>
            {winnerIdxs.length === 0 ? '— No Winner —' : isDraw ? '★ Draw ★' : '★ Winner ★'}
          </div>

          {/* All players */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            {sortedPlayers.map(({ p, i }) => {
              const win = isWinner(i);
              const bust = eliminated[i];
              const stop = stopped[i];
              const color = win ? PLAYER_COLORS[i] : bust ? '#b91c1c' : stop ? '#7a6340' : '#5a4a35';
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: win ? 1.05 : 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.05 * i }}
                  style={{
                    background: color,
                    borderRadius: 8, padding: '24px 32px', textAlign: 'center',
                    boxShadow: win
                      ? `0 8px 40px ${color}55, 0 0 0 4px white, 0 0 0 7px ${color}`
                      : '0 4px 16px rgba(0,0,0,0.15)',
                    position: 'relative', overflow: 'hidden', minWidth: 120,
                  }}
                >
                  {win && <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />}
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.25em', marginBottom: 4 }}>
                    {win ? (isDraw ? 'DRAW' : 'WINNER') : bust ? 'BUST' : stop ? 'STOPPED' : ''}
                  </div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1 }}>
                    {p.name}
                  </div>
                  {!bust && (
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
                      {scores[i]} pts
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              onClick={onReset}
              style={{ background: 'white', color: '#1e3a8a', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.15em', padding: '10px 28px', borderRadius: 5, border: '2px solid #1e3a8a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw size={14} /> New Game
            </motion.button>
            <motion.button onClick={() => { setHistoryRound(Math.max(0, allThrows[0].length - 1)); setShowHistory(true); }} style={OUTLINE_BTN} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
              History
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── DRAFTING ──────────────────────────────────────────────────────────────

  // Timer ring percentage
  const timerPct = timerDuration && timeLeft !== null ? (timeLeft / timerDuration) : 1;
  const timerColor = timerPct > 0.4 ? '#15803d' : timerPct > 0.2 ? '#d97706' : '#b91c1c';

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
      {header}
      {historyOverlay}
      {rulesOverlay}

      {/* Timeout toast */}
      <AnimatePresence>
        {timeoutToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 70,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              background: timeoutToast.isElim ? '#b91c1c' : '#92400e',
              color: 'white',
              borderRadius: 10,
              padding: '28px 40px',
              textAlign: 'center',
              boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
              maxWidth: 320,
            }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', letterSpacing: '0.06em', lineHeight: 1, marginBottom: 10 }}>
                ⏱ TIMEOUT
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '1rem', lineHeight: 1.4, opacity: 0.92 }}>
                {timeoutToast.msg}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={`draft-${curIdx}-${roundNum}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col items-center"
      >
        {/* Player label + timer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: curColor, borderRadius: 4, padding: '6px 20px' }}>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'white', letterSpacing: '0.06em' }}>
                {curPlayer.name}
              </span>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                — pick your players
              </span>
            </div>
            {/* Timer display */}
            {timerDuration && timeLeft !== null && (
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `conic-gradient(${timerColor} ${timerPct * 360}deg, rgba(0,0,0,0.08) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                position: 'relative',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: timerColor, lineHeight: 1 }}>
                    {timeLeft}
                  </span>
                </div>
              </div>
            )}
          </div>
          {allowMisses && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 4, padding: '4px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.6rem', color: '#8a7553', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Lives</span>
              <span style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} style={{ color: i < lives[curIdx] ? '#b91c1c' : '#d4c4a0', transition: 'color 0.2s' }}>♥</span>
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Previously used players */}
        {allThrows[curIdx].length > 0 && (
          <div style={{ width: '100%', maxWidth: 420, marginBottom: 14 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.62rem', color: '#a09070', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
              Już wykorzystani
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {allThrows[curIdx].flat().map(t => (
                <div key={t.playerId} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: curColor, background: `${curColor}18`, border: `1px solid ${curColor}40`, borderRadius: 3, padding: '3px 8px', letterSpacing: '0.03em', textDecoration: 'line-through', textDecorationColor: `${curColor}80` }}>
                  {t.playerName}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draft cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14, minHeight: 80 }}>
          {curDraft.length === 0 ? (
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#a09070', letterSpacing: '0.1em', textTransform: 'uppercase', alignSelf: 'center' }}>
              No players selected yet
            </div>
          ) : curDraft.map((fp, i) => (
            <motion.div
              key={fp.id + i}
              initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: (i % 2 === 0 ? -1.5 : 1.5) }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <CardBack
                playerName={curPlayer.name}
                color={curColor}
                cardIndex={i}
                footballPlayerName={fp.name}
                onRemove={() => handleRemove(i)}
              />
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 10 }}>
          <PlayerInput
            onSubmit={handleAdd}
            isLoading={isLoading}
            disabled={false}
            placeholder={`Search player from ${gameState.club?.name ?? ''}...`}
            suggestions={allPlayers}
            isLoadingSuggestions={isLoadingSquad}
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#b91c1c', letterSpacing: '0.06em', marginBottom: 12, padding: '6px 14px', background: '#fef2f2', border: '1.5px solid #b91c1c', borderRadius: 4 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions: Lock In + Stop */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <motion.button
            onClick={handleLockIn}
            disabled={curDraft.length === 0}
            style={{
              background: curDraft.length === 0 ? '#c4b89a' : curColor,
              color: 'white',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.3rem',
              letterSpacing: '0.15em',
              padding: '12px 44px',
              borderRadius: 5,
              border: 'none',
              cursor: curDraft.length === 0 ? 'default' : 'pointer',
              boxShadow: curDraft.length === 0 ? 'none' : '0 4px 16px rgba(0,0,0,0.2)',
            }}
            whileHover={curDraft.length > 0 ? { scale: 1.04, y: -2 } : {}}
            whileTap={curDraft.length > 0 ? { scale: 0.97 } : {}}
          >
            {draftStep < draftOrder.length - 1 ? 'Lock In — Pass Device' : 'Lock In — Resolve!'}
          </motion.button>

          <motion.button
            onClick={handleStop}
            title="Stop playing — lock your current score"
            style={{
              background: 'white',
              color: '#92400e',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '0.9rem',
              letterSpacing: '0.12em',
              padding: '12px 16px',
              borderRadius: 5,
              border: '2px solid #d97706',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <StopCircle size={16} />
            STOP
          </motion.button>
        </div>

        {/* Current score reminder */}
        <div style={{ marginTop: 14, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#a09070', letterSpacing: '0.1em' }}>
          Current score: <span style={{ color: curColor, fontWeight: 700 }}>{scores[curIdx]}</span>
        </div>
      </motion.div>
    </div>
  );
};
