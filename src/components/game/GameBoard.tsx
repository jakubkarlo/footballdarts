import { useState } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '@/types/game';
import { ScoreDisplay } from './ScoreDisplay';
import { PlayerInput } from './PlayerInput';
import { ThrowResult } from './ThrowResult';
import { ThrowHistory } from './ThrowHistory';
import { RotateCcw, Flag, ArrowRight, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSquad } from '@/hooks/useSquad';
import { PlayerSticker } from './PlayerSticker';

interface GameBoardProps {
  gameState: GameState;
  isLoading: boolean;
  lastThrowResult: {
    type: 'success' | 'bust' | 'over' | 'invalid';
    message: string;
    value?: number;
  } | null;
  onThrow: (playerName: string) => Promise<void>;
  onEndTurn: () => void;
  onFinish: () => void;
  onReset: () => void;
}

const iconBtn = {
  fontFamily: 'Barlow Condensed, sans-serif' as const,
  fontWeight: 700 as const,
  fontSize: '0.78rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
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

export const GameBoard = ({
  gameState,
  isLoading,
  lastThrowResult,
  onThrow,
  onEndTurn,
  onFinish,
  onReset,
}: GameBoardProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMultiplayer = gameState.mode !== 'solo';

  const { squad, isLoading: isLoadingSquad } = useSquad(gameState.club?.id || null);

  return (
    <div
      className="min-h-screen flex flex-col p-4 md:p-5 relative"
      style={{
        backgroundColor: '#ede3ce',
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(165,138,90,0.18) 47px, rgba(165,138,90,0.18) 48px)`,
      }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-5"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          onClick={onReset}
          style={iconBtn}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
        >
          <RotateCcw size={13} />
          New Game
        </motion.button>

        {/* Club sticker in header */}
        {gameState.club && (
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              borderRadius: '4px',
              padding: '6px 12px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <img
              src={gameState.club.logo}
              alt={gameState.club.name}
              style={{ width: 26, height: 26, objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            />
            <span
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1rem',
                color: '#1e3a8a',
                letterSpacing: '0.04em',
              }}
            >
              {gameState.club.name}
            </span>
          </motion.div>
        )}

        <motion.button
          onClick={() => setShowInfo(!showInfo)}
          style={iconBtn}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
        >
          <Info size={13} />
          Rules
        </motion.button>
      </motion.div>

      {/* Rules panel */}
      {showInfo && (
        <motion.div
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            background: 'white',
            borderRadius: '5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)',
            position: 'relative',
          }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <button
            onClick={() => setShowInfo(false)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8a7553',
            }}
          >
            <X size={14} />
          </button>
          <div
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1rem',
              color: '#1e3a8a',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}
          >
            Game Rules
          </div>
          <ul
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 500,
              color: '#5a4a35',
              lineHeight: 1.6,
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            <li>· Max throw value: 180 appearances</li>
            <li>· Going below zero = BUST (lose turn)</li>
            <li>· Exceeding 180 = invalid throw{gameState.mode === 'multiplayer-blitz' && ' (disqualified)'}</li>
            <li>· You decide when to finish — closer to zero wins!</li>
          </ul>
        </motion.div>
      )}

      {/* Mode badge */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span
          style={{
            display: 'inline-block',
            background: '#1e3a8a',
            color: 'white',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '4px 14px',
            borderRadius: '3px',
          }}
        >
          {gameState.mode === 'solo' && 'Solo Mode'}
          {gameState.mode === 'multiplayer-turns' && 'Multiplayer · Turns'}
          {gameState.mode === 'multiplayer-blitz' && 'Multiplayer · Blitz'}
        </span>
      </motion.div>

      {/* Score sticker cards */}
      <div
        className={cn(
          'grid gap-3 mb-5',
          isMultiplayer ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 max-w-xs mx-auto w-full'
        )}
      >
        {gameState.players.map((player, index) => (
          <ScoreDisplay
            key={player.id}
            player={player}
            isActive={index === gameState.currentPlayerIndex && !player.isBusted}
            stickerNumber={index + 1}
            showAnimation={
              index === gameState.currentPlayerIndex
                ? lastThrowResult?.type === 'success'
                  ? 'success'
                  : lastThrowResult?.type === 'bust'
                  ? 'bust'
                  : null
                : null
            }
          />
        ))}
      </div>

      {/* Throw result */}
      <div className="mb-4 max-w-md mx-auto w-full">
        <ThrowResult result={lastThrowResult} />
      </div>

      {/* Player input */}
      <div className="mb-4 max-w-md mx-auto w-full">
        <PlayerInput
          onSubmit={onThrow}
          isLoading={isLoading}
          disabled={currentPlayer.isBusted || currentPlayer.isFinished}
          placeholder={`Search player from ${gameState.club?.name || ''}...`}
          suggestions={squad}
          isLoadingSuggestions={isLoadingSquad}
        />
      </div>

      {/* Actions */}
      <motion.div
        className="flex justify-center gap-3 mb-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >

        <motion.button
          onClick={onFinish}
          disabled={currentPlayer.isBusted}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '10px 22px',
            borderRadius: '5px',
            background: currentPlayer.isBusted ? '#a09080' : '#b91c1c',
            color: 'white',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: currentPlayer.isBusted ? 'default' : 'pointer',
            boxShadow: currentPlayer.isBusted ? 'none' : '0 3px 14px rgba(185,28,28,0.35)',
            border: 'none',
          }}
          whileHover={!currentPlayer.isBusted ? { scale: 1.03, y: -1 } : {}}
          whileTap={!currentPlayer.isBusted ? { scale: 0.97 } : {}}
        >
          <Flag size={14} />
          Finish Game
        </motion.button>
      </motion.div>

      {/* Sticker collection */}
      {(() => {
        const isTurns = gameState.mode === 'multiplayer-turns';
        const allThrows = isMultiplayer
          ? gameState.players.flatMap((p, pIdx) =>
              p.throws.map(t => ({
                throw_: t,
                owner: p.name,
                isCurrentPlayer: pIdx === gameState.currentPlayerIndex,
              }))
            )
          : currentPlayer.throws.map(t => ({ throw_: t, owner: '', isCurrentPlayer: true }));
        if (allThrows.length === 0) return null;
        return (
          <motion.div
            className="max-w-2xl mx-auto w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.26 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ height: 2, flex: 1, background: '#b91c1c' }} />
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.28em',
                color: '#8a7553',
                textTransform: 'uppercase',
              }}>
                Used Players
              </span>
              <div style={{ height: 2, flex: 1, background: '#b91c1c' }} />
            </div>
            {/* Sticker grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allThrows.map(({ throw_, owner, isCurrentPlayer }, i) => (
                <PlayerSticker
                  key={throw_.playerId + owner}
                  throw_={throw_}
                  index={i}
                  ownerName={isMultiplayer ? owner : undefined}
                  hidden={isTurns && !isCurrentPlayer}
                />
              ))}
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
};
