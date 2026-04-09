import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, FootballPlayer, Throw } from '@/types/game';
import { PlayerInput } from './PlayerInput';
import { PlayerSticker } from './PlayerSticker';
import { X, HelpCircle } from 'lucide-react';
import { useAllPlayers } from '@/hooks/useAllPlayers';
import { searchPlayer } from '@/data/mockData';
import { CardBack } from './BlitzGameBoard';
import { PLAYER_COLORS, BG, OUTLINE_BTN, RoundResultTile } from './TurnsShared';

type Phase = 'drafting' | 'between-rounds' | 'game-over';

interface DraftEntry extends FootballPlayer {
  isMiss?: boolean;
}

interface RoundResult {
  apps: number;
  elim: boolean;
  hitZero: boolean;
  reason?: 'over180' | 'bust' | 'miss' | 'timeout';
}

interface SoloGameBoardProps {
  gameState: GameState;
  onReset: () => void;
  onPickClub?: () => void;
}

export const SoloGameBoard = ({ gameState, onReset, onPickClub }: SoloGameBoardProps) => {
  const player = gameState.players[0];
  const allowMisses = gameState.allowMisses;
  const timerDuration = gameState.timer;
  const color = PLAYER_COLORS[0];

  // Persistent state
  const [score, setScore] = useState(gameState.startingScore);
  const [eliminated, setEliminated] = useState(false);
  const [lives, setLives] = useState(3);
  // allThrows[roundIdx] = array of Throw for that round
  const [allThrows, setAllThrows] = useState<Throw[][]>([]);

  // Round state
  const [roundNum, setRoundNum] = useState(1);
  const [draft, setDraft] = useState<DraftEntry[]>([]);
  const [phase, setPhase] = useState<Phase>('drafting');
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleTimeoutRef = useRef<() => void>(() => {});

  // UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRound, setHistoryRound] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [timeoutToast, setTimeoutToast] = useState<{ msg: string; isElim: boolean } | null>(null);

  const { allPlayers, isLoading: isLoadingSquad } = useAllPlayers();

  const usedIds = new Set([
    ...allThrows.flat().map(t => t.playerId),
    ...draft.map(fp => fp.id),
  ]);

  // ── Timer ────────────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimeLeft(null);
  }, []);

  useEffect(() => {
    if (!timerDuration || phase !== 'drafting') { stopTimer(); return; }
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
  }, [roundNum, phase, timerDuration]);

  // ── Core ─────────────────────────────────────────────────────────────────────

  const resolveRound = useCallback((currentDraft: DraftEntry[]) => {
    const hasMiss = currentDraft.some(fp => fp.isMiss);
    const total = hasMiss ? 0 : currentDraft.reduce((s, fp) => s + fp.appearances, 0);
    let elim = false;
    let hitZero = false;
    let reason: RoundResult['reason'];
    let newScore = score;
    let newLives = lives;

    if (hasMiss && allowMisses) {
      newLives = Math.max(0, lives - 1);
      if (newLives <= 0) { elim = true; reason = 'miss'; }
    } else if (hasMiss && !allowMisses) {
      elim = true;
      reason = currentDraft[0]?.id?.startsWith('timeout-') ? 'timeout' : 'miss';
    } else if (total > 180) {
      elim = true; reason = 'over180';
    } else if (score - total < 0) {
      elim = true; reason = 'bust';
    } else {
      newScore = score - total;
      hitZero = newScore === 0;
    }

    const throws: Throw[] = currentDraft.map(fp => ({
      playerId: fp.id,
      playerName: fp.name,
      appearances: fp.appearances,
      timestamp: Date.now(),
      photo: fp.photo,
      position: fp.position,
      missed: fp.isMiss ?? false,
    }));

    setScore(newScore);
    setLives(newLives);
    setEliminated(elim);
    setAllThrows(prev => [...prev, throws]);
    setRoundResult({ apps: hasMiss ? 0 : total, elim, hitZero, reason });
    setPhase(elim || hitZero ? 'game-over' : 'between-rounds');
  }, [score, lives, allowMisses]);

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
    const updatedDraft = [timeoutEntry];
    setDraft(updatedDraft);
    setError(null);
    const isElim = !allowMisses || lives <= 1;
    const msg = isElim
      ? 'Time up! You are eliminated.'
      : `Time up! Lose a life (${lives - 1} ♥ left)`;
    setTimeoutToast({ msg, isElim });
    setTimeout(() => {
      setTimeoutToast(null);
      resolveRound(updatedDraft);
    }, 2200);
  }, [lives, allowMisses, resolveRound, stopTimer]);

  useEffect(() => { handleTimeoutRef.current = handleTimeoutAction; }, [handleTimeoutAction]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleAdd = async (name: string, playerId?: string) => {
    if (!gameState.club) return;
    setIsLoading(true);
    setError(null);
    const fp = await searchPlayer(gameState.club.id, name, playerId);
    const isMiss = !fp || fp.appearances === 0;
    const entry: DraftEntry = isMiss
      ? (fp
          ? { ...fp, isMiss: true }
          : { id: `miss-${Date.now()}`, name, appearances: 0, position: '', nationality: '', photo: '', isMiss: true })
      : fp;
    if (!isMiss && usedIds.has(fp!.id)) { setError(`${fp!.name} already used!`); setIsLoading(false); return; }
    setDraft(prev => [entry, ...prev]);
    setIsLoading(false);
  };

  const handleRemove = (i: number) => {
    setDraft(prev => prev.filter((_, j) => j !== i));
  };

  const handleLockIn = () => {
    if (draft.length === 0) { setError('Add at least one player!'); return; }
    setError(null);
    stopTimer();
    resolveRound(draft);
  };

  const handleNextRound = () => {
    setDraft([]);
    setRoundNum(r => r + 1);
    setPhase('drafting');
    setError(null);
  };

  const handleFinish = () => {
    setPhase('game-over');
  };

  // ── Rules overlay ─────────────────────────────────────────────────────────────

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
            style={{ background: '#ede3ce', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)', borderRadius: 10, padding: '28px 28px 24px', maxWidth: 420, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#1e3a8a', letterSpacing: '0.04em', lineHeight: 1 }}>Rules</div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.72rem', color: '#8a7553', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Football Darts · Solo</div>
              </div>
              <button onClick={() => setShowRules(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7553', padding: 4, marginTop: 2 }}>
                <X size={20} />
              </button>
            </div>
            {[
              { num: '01', title: 'Goal', body: `Start from ${gameState.startingScore} points. Pick players and subtract their appearances. Get as close to zero as possible.`, color: '#1e3a8a' },
              { num: '02', title: 'Each Round', body: 'Pick one or more players from the selected club and confirm. Their total appearances are subtracted from your score.', color: '#1e3a8a' },
              { num: '03', title: 'Bust', body: 'Going below zero or a single throw exceeding 180 — you are eliminated.', color: '#b91c1c' },
              ...(allowMisses
                ? [{ num: '04', title: 'Miss & Lives', body: 'A player with 0 appearances costs you a life (3 total). Lose all → eliminated.', color: '#b91c1c' }]
                : [{ num: '04', title: 'Miss', body: 'A player with 0 appearances = instant bust.', color: '#b91c1c' }]),
              ...(timerDuration
                ? [{ num: '05', title: `Timer (${timerDuration}s)`, body: `You have ${timerDuration} seconds per round. Timeout = treated as a miss${allowMisses ? ' (lose a life)' : ' (eliminated)'}.`, color: '#7a6340' }]
                : []),
              { num: timerDuration ? '06' : '05', title: 'Finish', body: 'Hit exactly zero to win, or choose to finish early after any round. The lower your score, the better.', color: '#15803d' },
            ].map(({ num, title, body, color: c }) => (
              <div key={num} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 4, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>{num}</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: c, letterSpacing: '0.06em', lineHeight: 1, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 500, fontSize: '0.88rem', color: '#5a4a35', lineHeight: 1.45 }}>{body}</div>
                </div>
              </div>
            ))}
            <motion.button
              onClick={() => setShowRules(false)}
              style={{ width: '100%', marginTop: 8, background: '#1e3a8a', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.2em', padding: '11px 0', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,58,138,0.3)' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              Got it — Let's Play!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Header ────────────────────────────────────────────────────────────────────

  const header = (
    <motion.div className="flex items-center justify-between mb-5" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
      {gameState.club ? (
        <div style={{ ...OUTLINE_BTN, color: '#1e3a8a', borderColor: '#1e3a8a', padding: '7px 12px', gap: 8, cursor: 'default' }}>
          <img src={gameState.club.logo} alt={gameState.club.name} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#1e3a8a', letterSpacing: '0.04em' }}>{gameState.club.name}</span>
        </div>
      ) : <div />}
      <motion.button
        onClick={() => setShowRules(true)}
        style={{ ...OUTLINE_BTN, color: '#1e3a8a', borderColor: '#1e3a8a', padding: '7px 10px' }}
        whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
        title="Rules"
      >
        <HelpCircle size={14} />
      </motion.button>
    </motion.div>
  );

  // ── History overlay ───────────────────────────────────────────────────────────

  const activeHistoryRound = Math.min(historyRound, Math.max(0, allThrows.length - 1));

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
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: '#1e3a8a', letterSpacing: '0.06em' }}>Round History</div>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7553', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            {allThrows.length === 0 ? (
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.85rem', color: '#a09070' }}>No rounds played yet</span>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
                  {allThrows.map((_, rIdx) => (
                    <button key={rIdx} onClick={() => setHistoryRound(rIdx)}
                      style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', letterSpacing: '0.14em', padding: '5px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', background: activeHistoryRound === rIdx ? '#1e3a8a' : 'rgba(30,58,138,0.1)', color: activeHistoryRound === rIdx ? 'white' : '#1e3a8a', transition: 'background 0.15s, color 0.15s' }}>
                      R{rIdx + 1}
                    </button>
                  ))}
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {(() => {
                    const roundThrows = allThrows[activeHistoryRound] ?? [];
                    const hasBadThrow = roundThrows.some(t => t.missed || t.playerId.startsWith('timeout-'));
                    return (
                      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 8, borderRadius: 8, minHeight: 100, padding: '5px' }}>
                        {roundThrows.map((t, ti) => {
                          if (t.playerId.startsWith('timeout-')) {
                            return (
                              <motion.div key={t.playerId + ti}
                                initial={{ opacity: 0, scale: 0.55, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: ti * 0.045 }}
                                style={{ width: 90, flexShrink: 0, background: 'white', borderRadius: 6, padding: 3, boxShadow: '0 5px 18px rgba(0,0,0,0.28)' }}
                              >
                                <div style={{ borderRadius: 4, overflow: 'hidden', background: '#1a120a', height: 130, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px)' }} />
                                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em', textAlign: 'center', zIndex: 1 }}>TIMEOUT</div>
                                </div>
                              </motion.div>
                            );
                          }
                          return <PlayerSticker key={t.playerId + ti} throw_={t} index={ti} color={color} />;
                        })}
                        {hasBadThrow && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden', pointerEvents: 'none', zIndex: 20, background: 'rgba(185,28,28,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '4rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.2em' }}>MISS</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── BETWEEN ROUNDS ────────────────────────────────────────────────────────────

  if (phase === 'between-rounds' && roundResult) {
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
        {header}
        {historyOverlay}
        {rulesOverlay}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#1e3a8a', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase' }}>
            Round {roundNum} Result
          </div>
          <div style={{ marginBottom: 28 }}>
            <RoundResultTile
              playerName={player?.name ?? 'Player'}
              color={color}
              apps={roundResult.apps}
              isElim={roundResult.elim}
              isStopped={false}
              isWaiting={false}
              hitZero={roundResult.hitZero}
              score={score}
              lives={lives}
              reason={roundResult.reason}
              allowMisses={allowMisses}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button onClick={handleNextRound}
              style={{ background: '#1e3a8a', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.15em', padding: '12px 32px', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,58,138,0.3)' }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              Next Round
            </motion.button>
            <motion.button onClick={handleFinish}
              style={{ background: '#b91c1c', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.15em', padding: '12px 32px', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(185,28,28,0.3)' }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              Finish Game
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── GAME OVER ──────────────────────────────────────────────────────────────────

  if (phase === 'game-over') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={BG}>
        {historyOverlay}
        {rulesOverlay}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
          style={{ maxWidth: 320, width: '100%' }}
        >
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: '#8a7553', letterSpacing: '0.3em', marginBottom: 16, textTransform: 'uppercase' }}>
            — FINAL SCORE —
          </div>

          {eliminated ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              style={{ background: '#b91c1c', borderRadius: 8, padding: '28px 48px', textAlign: 'center', boxShadow: '0 8px 40px rgba(185,28,28,0.5), 0 0 0 4px white, 0 0 0 7px #b91c1c', marginBottom: 28, width: '100%' }}
            >
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'white', letterSpacing: '0.08em', lineHeight: 1 }}>BUST!</div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              style={{ background: score === 0 ? '#15803d' : color, borderRadius: 8, padding: '28px 48px', textAlign: 'center', boxShadow: `0 8px 40px ${score === 0 ? 'rgba(21,128,61,0.5)' : `${color}55`}, 0 0 0 4px white, 0 0 0 7px ${score === 0 ? '#15803d' : color}`, position: 'relative', overflow: 'hidden', marginBottom: 28, width: '100%' }}
            >
              <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '4.5rem', color: 'white', lineHeight: 1, letterSpacing: '0.02em' }}>
                {score === 0 ? '0 ★' : score}
              </div>
            </motion.div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button onClick={onReset}
              style={{ background: 'white', color: '#1e3a8a', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.15em', padding: '10px 28px', borderRadius: 5, border: '2px solid #1e3a8a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              New Game
            </motion.button>
            {onPickClub && (
              <motion.button
                onClick={onPickClub}
                style={{ background: '#15803d', color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.15em', padding: '10px 28px', borderRadius: 5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(21,128,61,0.3)' }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              >
                Play Again
              </motion.button>
            )}
            {allThrows.length > 0 && (
              <motion.button
                onClick={() => { setHistoryRound(allThrows.length - 1); setShowHistory(true); }}
                style={OUTLINE_BTN}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
              >
                History
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── DRAFTING ──────────────────────────────────────────────────────────────────

  const SCORE_R = 46;
  const SCORE_C = 2 * Math.PI * SCORE_R;
  const scoreFraction = Math.max(0, Math.min(1, score / gameState.startingScore));
  const timerFraction = timerDuration && timeLeft !== null ? timeLeft / timerDuration : 1;
  const timerRingColor = timerFraction > 0.4 ? '#15803d' : timerFraction > 0.2 ? '#d97706' : '#b91c1c';

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
      {header}
      {historyOverlay}
      {rulesOverlay}

      {/* Timeout toast */}
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

      <motion.div
        key={`draft-${roundNum}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col items-center"
      >
        {/* Player strip */}
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: color, borderRadius: 6, padding: '8px 16px' }}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'white', letterSpacing: '0.06em' }}>
              {player?.name ?? 'Player'}
            </span>
            {allowMisses && (
              <span style={{ fontSize: '1.1rem', letterSpacing: '0.08em' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} style={{ color: i < lives ? 'white' : 'rgba(255,255,255,0.25)', transition: 'color 0.2s' }}>♥</span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Score circle + Timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
            <svg width="108" height="108" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="54" cy="54" r={SCORE_R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="10" />
              <circle cx="54" cy="54" r={SCORE_R} fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={SCORE_C} strokeDashoffset={SCORE_C * (1 - scoreFraction)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.span key={score} initial={{ scale: 1.2, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
                style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.9rem', color, lineHeight: 1 }}>
                {score}
              </motion.span>
            </div>
          </div>

          {timerDuration && timeLeft !== null && (
            <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${timerRingColor} ${timerFraction * 360}deg, rgba(0,0,0,0.08) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ede3ce', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: timerRingColor, lineHeight: 1 }}>{timeLeft}</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.42rem', color: timerRingColor, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>sec</span>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 8 }}>
          <PlayerInput
            onSubmit={handleAdd}
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
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ width: '100%', maxWidth: 420, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#b91c1c', letterSpacing: '0.06em', marginBottom: 8, padding: '6px 14px', background: '#fef2f2', border: '1.5px solid #b91c1c', borderRadius: 4 }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm button */}
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
          <motion.button
            onClick={handleLockIn}
            disabled={draft.length === 0}
            style={{
              width: '100%',
              background: draft.length === 0 ? '#c4b89a' : color,
              color: 'white',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.3rem',
              letterSpacing: '0.16em',
              padding: '14px 0',
              borderRadius: 6,
              border: 'none',
              cursor: draft.length === 0 ? 'default' : 'pointer',
              boxShadow: draft.length === 0 ? 'none' : '0 4px 18px rgba(0,0,0,0.2)',
            }}
            whileHover={draft.length > 0 ? { scale: 1.02, y: -2 } : {}}
            whileTap={draft.length > 0 ? { scale: 0.97 } : {}}
          >
            Confirm — Shoot!
          </motion.button>
        </div>

        {/* Draft cards */}
        <div style={{ width: '100%', maxWidth: 420, minHeight: 140 }}>
          {draft.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 8 }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: '#a09070', letterSpacing: '0.12em', textTransform: 'uppercase' }}>pick your players</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {draft.map((fp, i) => (
                <motion.div key={fp.id + i} style={{ flexShrink: 0, position: 'relative' }}
                  initial={{ opacity: 0, scale: 0.5, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <CardBack
                    playerName={player?.name ?? 'Player'}
                    color={color}
                    cardIndex={i}
                    footballPlayerName={fp.name}
                    onRemove={() => handleRemove(i)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Used players */}
        {allThrows.length > 0 && (
          <div style={{ width: '100%', maxWidth: 420, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.58rem', color: '#a09070', letterSpacing: '0.16em', textTransform: 'uppercase', flexShrink: 0 }}>
              Already used:
            </span>
            <div style={{ display: 'flex', gap: 4, overflow: 'hidden', flexWrap: 'nowrap' }}>
              {allThrows.flat().map(t => (
                <span key={t.playerId} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.72rem', color, background: `${color}14`, border: `1px solid ${color}30`, borderRadius: 3, padding: '2px 6px', letterSpacing: '0.02em', whiteSpace: 'nowrap', textDecoration: 'line-through', textDecorationColor: `${color}60`, flexShrink: 0 }}>
                  {t.playerName}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
