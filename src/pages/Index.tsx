import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { DartboardBackground } from '@/components/game/DartboardBackground';
import { GameMenu } from '@/components/game/GameMenu';
import { GameSetup } from '@/components/game/GameSetup';
import { SoloGameBoard } from '@/components/game/SoloGameBoard';
import { GameResult } from '@/components/game/GameResult';
import { BlitzGameBoard } from '@/components/game/BlitzGameBoard';
import { BlitzResult } from '@/components/game/BlitzResult';
import { TurnsGameBoard } from '@/components/game/TurnsGameBoard';
import { OnlineLobby } from '@/components/game/OnlineLobby';
import { OnlineTurnsGameBoard } from '@/components/game/OnlineTurnsGameBoard';
import { OnlineBlitzGameBoard } from '@/components/game/OnlineBlitzGameBoard';
import { CreateOnlineScreen } from '@/components/game/CreateOnlineScreen';
import { JoinGameModal } from '@/components/game/JoinGameModal';
import { AnimatePresence, motion } from 'framer-motion';
import { GameMode, StartingScore, Club } from '@/types/game';

const Index = () => {
  const {
    gameState,
    isLoading,
    lastThrowResult,
    blitzResult,
    setMode,
    setStartingScore,
    setClub,
    startGame,
    makeThrow,
    endTurn,
    finishGame,
    finishBlitzGame,
    resetGame,
    goToSetup,
  } = useGame();

  const {
    session: onlineSession,
    myPlayerId,
    myPlayerIndex,
    myPlayerOrder,
    isMyTurn,
    isLoading: isOnlineLoading,
    error: onlineError,
    continueRoundSignal,
    createGame,
    joinGame,
    setClub: setOnlineClub,
    setPlayerReady,
    startOnlineGame,
    makeOnlineThrow,
    endOnlineTurn,
    finishOnlinePlayer,
    lockInDraft,
    lockInBlitzDraft,
    stopOnline,
    finishOnlineGame,
    continueRound,
    triggerReveal,
    leaveGame,
    revealSignal,
  } = useOnlineGame();

  const [showCreateOnline, setShowCreateOnline] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleThrow = async (playerName: string, playerId?: string) => {
    await makeThrow(playerName, playerId);
  };

  const handleFinish = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    finishGame(currentPlayer.id);
  };

  const handleCreateOnline = () => {
    setShowCreateOnline(true);
  };

  const handleJoinOnline = () => {
    setShowJoinModal(true);
  };

  const handleCreateGame = async (
    mode: GameMode,
    startingScore: StartingScore,
    maxPlayers: number,
    allowMisses: boolean,
    timer: 30 | 60 | 90 | 180 | 300 | null,
  ) => {
    const result = await createGame(mode, startingScore, maxPlayers, allowMisses, timer);
    if (result) {
      setShowCreateOnline(false);
    }
  };

  const handleJoinGame = async (code: string) => {
    const result = await joinGame(code);
    if (result) {
      setShowJoinModal(false);
    }
  };

  const handleLeaveOnline = () => {
    leaveGame();
  };

  const isBlitzMode = gameState.mode === 'multiplayer-blitz';
  const isOnlineMode = onlineSession !== null;

  // Show online lobby if we have an online session
  if (isOnlineMode && onlineSession.status === 'waiting') {
    const isHost = myPlayerIndex === 0;
    return (
      <div className="relative min-h-screen overflow-hidden">
        <DartboardBackground />
        <div className="relative z-10">
          <OnlineLobby
            session={onlineSession}
            myPlayerId={myPlayerId}
            isHost={isHost}
            isLoading={isOnlineLoading}
            error={onlineError}
            onSetClub={setOnlineClub}
            onSetReady={setPlayerReady}
            onStartGame={startOnlineGame}
            onLeave={handleLeaveOnline}
          />
        </div>
      </div>
    );
  }

  // Online blitz game in progress or finished
  if (isOnlineMode && onlineSession.mode === 'multiplayer-blitz' && (onlineSession.status === 'playing' || onlineSession.status === 'finished')) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <OnlineBlitzGameBoard
          session={onlineSession}
          myPlayerId={myPlayerId}
          myPlayerOrder={myPlayerOrder}
          revealSignal={revealSignal}
          isLoading={isOnlineLoading}
          error={onlineError}
          onLockIn={lockInBlitzDraft}
          onTriggerReveal={triggerReveal}
          onLeave={handleLeaveOnline}
        />
      </div>
    );
  }

  // Online turns game in progress
  if (isOnlineMode && onlineSession.status === 'playing') {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <OnlineTurnsGameBoard
          session={onlineSession}
          myPlayerId={myPlayerId}
          myPlayerOrder={myPlayerOrder}
          isMyTurn={isMyTurn}
          isLoading={isOnlineLoading}
          error={onlineError}
          continueRoundSignal={continueRoundSignal}
          onLockIn={lockInDraft}
          onStop={stopOnline}
          onContinueRound={continueRound}
          onLeave={handleLeaveOnline}
        />
      </div>
    );
  }

  // Online turns game finished
  if (isOnlineMode && onlineSession.status === 'finished') {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <OnlineTurnsGameBoard
          session={onlineSession}
          myPlayerId={myPlayerId}
          myPlayerOrder={myPlayerOrder}
          isMyTurn={false}
          isLoading={false}
          error={null}
          continueRoundSignal={continueRoundSignal}
          onLockIn={lockInDraft}
          onStop={stopOnline}
          onContinueRound={continueRound}
          onLeave={handleLeaveOnline}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <DartboardBackground />
      
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {gameState.phase === 'menu' && !showCreateOnline && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameMenu
                selectedMode={gameState.mode}
                onModeSelect={setMode}
                onStart={goToSetup}
                onCreateOnline={handleCreateOnline}
                onJoinOnline={handleJoinOnline}
              />
            </motion.div>
          )}

          {gameState.phase === 'menu' && showCreateOnline && (
            <motion.div
              key="create-online"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              <CreateOnlineScreen
                isLoading={isOnlineLoading}
                error={onlineError}
                onBack={() => setShowCreateOnline(false)}
                onCreate={handleCreateGame}
              />
            </motion.div>
          )}

          {gameState.phase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameSetup
                mode={gameState.mode}
                selectedScore={gameState.startingScore}
                selectedClub={gameState.club}
                onModeSelect={setMode}
                onScoreSelect={setStartingScore}
                onClubSelect={setClub}
                onStart={startGame}
                onBack={resetGame}
              />
            </motion.div>
          )}

          {gameState.phase === 'playing' && gameState.mode === 'solo' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SoloGameBoard
                gameState={gameState}
                onReset={resetGame}
              />
            </motion.div>
          )}

          {gameState.phase === 'playing' && gameState.mode === 'multiplayer-turns' && (
            <motion.div
              key="turns-playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TurnsGameBoard
                gameState={gameState}
                onReset={resetGame}
              />
            </motion.div>
          )}

          {gameState.phase === 'playing' && isBlitzMode && (
            <motion.div
              key="blitz-playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BlitzGameBoard
                gameState={gameState}
                onFinishBlitz={finishBlitzGame}
                onReset={resetGame}
              />
            </motion.div>
          )}

          {gameState.phase === 'result' && !isBlitzMode && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameResult
                gameState={gameState}
                onPlayAgain={resetGame}
              />
            </motion.div>
          )}

          {gameState.phase === 'result' && isBlitzMode && blitzResult && (
            <motion.div
              key="blitz-result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BlitzResult
                gameState={gameState}
                player1Score={blitzResult.player1Score}
                player2Score={blitzResult.player2Score}
                player1Throws={blitzResult.player1Throws}
                player2Throws={blitzResult.player2Throws}
                onPlayAgain={resetGame}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <JoinGameModal
        isOpen={showJoinModal}
        isLoading={isOnlineLoading}
        error={onlineError}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinGame}
      />
    </div>
  );
};

export default Index;
