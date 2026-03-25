import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, FootballPlayer, Throw } from '@/types/game';
import { PlayerInput } from './PlayerInput';
import { PlayerSticker } from './PlayerSticker';
import { RotateCcw, EyeOff, X } from 'lucide-react';
import { useSquad } from '@/hooks/useSquad';
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
  reason?: 'over180' | 'bust';
}

interface TurnsGameBoardProps {
  gameState: GameState;
  onReset: () => void;
}

export const TurnsGameBoard = ({ gameState, onReset }: TurnsGameBoardProps) => {
  const players = gameState.players;

  // Persistent game state
  const [scores, setScores] = useState<number[]>(() => players.map(() => gameState.startingScore));
  const [eliminated, setEliminated] = useState<boolean[]>(() => players.map(() => false));
  // allThrows[playerIdx][roundIdx] = throws for that player in that round
  const [allThrows, setAllThrows] = useState<Throw[][][]>(() => players.map(() => []));

  // Round state
  const [roundNum, setRoundNum] = useState(1);
  const [draft, setDraft] = useState<FootballPlayer[][]>(() => players.map(() => []));
  const [draftOrder, setDraftOrder] = useState<number[]>(() => players.map((_, i) => i));
  const [draftStep, setDraftStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('drafting');
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRound, setHistoryRound] = useState(0);

  const { squad, isLoading: isLoadingSquad } = useSquad(gameState.club?.id || null);

  const curIdx = draftOrder[draftStep] ?? 0;
  const curPlayer = players[curIdx];
  const curColor = PLAYER_COLORS[curIdx] ?? '#1e3a8a';
  const curDraft = draft[curIdx] ?? [];

  const usedIds = new Set([
    ...allThrows[curIdx].flat().map(t => t.playerId),
    ...curDraft.map(fp => fp.id),
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAdd = async (name: string) => {
    if (!gameState.club) return;
    setIsLoading(true);
    setError(null);
    const fp = await searchPlayer(gameState.club.id, name);
    if (!fp) { setError(`Not found: ${name}`); setIsLoading(false); return; }
    if (usedIds.has(fp.id)) { setError(`${fp.name} already used!`); setIsLoading(false); return; }
    setDraft(prev => { const n = prev.map(a => [...a]); n[curIdx] = [...n[curIdx], fp]; return n; });
    setIsLoading(false);
  };

  const handleRemove = (i: number) => {
    setDraft(prev => { const n = prev.map(a => [...a]); n[curIdx] = n[curIdx].filter((_, j) => j !== i); return n; });
  };

  const handleLockIn = () => {
    if (curDraft.length === 0) { setError('Add at least one player!'); return; }
    setError(null);
    if (draftStep < draftOrder.length - 1) {
      setPhase('handover');
    } else {
      resolveRound();
    }
  };

  const handleHandover = () => {
    setDraftStep(s => s + 1);
    setPhase('drafting');
  };

  const resolveRound = () => {
    const newScores = [...scores];
    const newElim = [...eliminated];
    const newThrows = allThrows.map(a => [...a]); // shallow copy of rounds array per player
    const results: RoundResult[] = [];

    for (const pIdx of draftOrder) {
      const d = draft[pIdx] ?? [];
      const total = d.reduce((s, fp) => s + fp.appearances, 0);
      let elim = false;
      let reason: RoundResult['reason'];
      if (total > 180) {
        elim = true; reason = 'over180'; newElim[pIdx] = true;
      } else if (newScores[pIdx] - total < 0) {
        elim = true; reason = 'bust'; newElim[pIdx] = true;
      } else {
        newScores[pIdx] -= total;
      }

      const throws: Throw[] = d.map(fp => ({
        playerId: fp.id,
        playerName: fp.name,
        appearances: fp.appearances,
        timestamp: Date.now(),
        photo: fp.photo,
        position: fp.position,
        busted: elim,
      }));
      newThrows[pIdx] = [...newThrows[pIdx], throws]; // push whole round as its own array
      results.push({ pIdx, apps: total, elim, reason });
    }

    setScores(newScores);
    setEliminated(newElim);
    setAllThrows(newThrows);
    setRoundResults(results);

    const activeCount = newElim.filter(e => !e).length;
    if (activeCount <= 1) {
      setWinnerIdx(findWinner(newScores, newElim));
      setPhase('game-over');
    } else {
      setPhase('between-rounds');
    }
  };

  const findWinner = (sc: number[], el: boolean[]): number | null => {
    const active = sc.map((s, i) => ({ s, i })).filter((_, i) => !el[i]);
    if (active.length === 0) return null;
    return active.reduce((b, c) => c.s < b.s ? c : b).i;
  };

  const handleNextRound = () => {
    const active = players.map((_, i) => i).filter(i => !eliminated[i]);
    setDraftOrder(active);
    setDraftStep(0);
    setDraft(players.map(() => []));
    setRoundNum(r => r + 1);
    setPhase('drafting');
  };

  const handleFinish = () => {
    setWinnerIdx(findWinner(scores, eliminated));
    setPhase('game-over');
  };

  // ── Shared UI pieces ──────────────────────────────────────────────────────

  const header = (
    <motion.div
      className="flex items-center justify-between mb-5"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.button onClick={onReset} style={OUTLINE_BTN} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
        <RotateCcw size={13} /> New Game
      </motion.button>
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
            {/* Header */}
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
                  {/* Round tabs */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
                    {Array.from({ length: totalRounds }, (_, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => setHistoryRound(rIdx)}
                        style={{
                          fontFamily: 'Bebas Neue, sans-serif',
                          fontSize: '0.85rem',
                          letterSpacing: '0.14em',
                          padding: '5px 14px',
                          borderRadius: 4,
                          border: 'none',
                          cursor: 'pointer',
                          background: activeRound === rIdx ? '#1e3a8a' : 'rgba(30,58,138,0.1)',
                          color: activeRound === rIdx ? 'white' : '#1e3a8a',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        R{rIdx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Active round content */}
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
                                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#b91c1c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>• out</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {roundThrows.map((t, ti) => (
                                <PlayerSticker key={t.playerId + ti} throw_={t} index={ti} />
                              ))}
                            </div>
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
            {curPlayer.name}'s picks are locked.<br />
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
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
        {header}
        {historyOverlay}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: '#1e3a8a', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase' }}>
            Round {roundNum} Results
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            {roundResults.map(({ pIdx, apps, elim, reason }) => (
              <motion.div
                key={pIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pIdx * 0.08 }}
                style={{
                  background: elim ? '#b91c1c' : 'white',
                  borderRadius: 6,
                  padding: '16px 20px',
                  textAlign: 'center',
                  boxShadow: elim
                    ? '0 0 0 3px #b91c1c, 0 0 28px rgba(185,28,28,0.5)'
                    : '0 2px 10px rgba(0,0,0,0.1)',
                  minWidth: 110,
                  borderTop: elim ? 'none' : `4px solid ${PLAYER_COLORS[pIdx] ?? '#1e3a8a'}`,
                }}
              >
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', color: elim ? 'rgba(255,255,255,0.8)' : PLAYER_COLORS[pIdx], letterSpacing: '0.06em', marginBottom: 6 }}>
                  {players[pIdx].name}
                </div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.68rem', color: elim ? 'rgba(255,255,255,0.6)' : '#8a7553', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  -{apps} apps
                </div>
                {elim ? (
                  <>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'white', lineHeight: 1, letterSpacing: '0.08em' }}>OUT!</div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>
                      {reason === 'over180' ? 'over 180' : 'below zero'}
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: PLAYER_COLORS[pIdx], lineHeight: 1 }}>
                    {scores[pIdx]}
                  </div>
                )}
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
    const wColor = winnerIdx !== null ? (PLAYER_COLORS[winnerIdx] ?? '#5a4a35') : '#5a4a35';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={BG}>
        {historyOverlay}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          style={{ background: wColor, borderRadius: 8, padding: '32px 52px', textAlign: 'center', boxShadow: `0 8px 40px ${wColor}55, 0 0 0 4px white, 0 0 0 7px ${wColor}`, position: 'relative', overflow: 'hidden' }}
        >
          <div className="foil-shimmer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3em', marginBottom: 4 }}>
            {winnerIdx !== null ? '★ WINNER ★' : '— NO WINNER —'}
          </div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3.5rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1 }}>
            {winnerIdx !== null ? players[winnerIdx].name : 'Wszyscy odpadli'}
          </div>
          {winnerIdx !== null && (
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
              {scores[winnerIdx]} points remaining
            </div>
          )}
        </motion.div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
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
      </div>
    );
  }

  // ── DRAFTING ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-5" style={BG}>
      {header}
      {historyOverlay}
      <motion.div
        key={`draft-${curIdx}-${roundNum}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col items-center"
      >
        {/* Player label */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: curColor, borderRadius: 4, padding: '6px 20px', marginBottom: 20 }}>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'white', letterSpacing: '0.06em' }}>
            {curPlayer.name}
          </span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            — pick your players
          </span>
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
            suggestions={squad}
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

        {/* Lock In */}
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
      </motion.div>
    </div>
  );
};
