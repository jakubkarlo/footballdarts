import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { DartboardBackground } from '@/components/game/DartboardBackground';
import { GameMenu } from '@/components/game/GameMenu';
import { GameSetup } from '@/components/game/GameSetup';
import { GameBoard } from '@/components/game/GameBoard';
import { GameResult } from '@/components/game/GameResult';
import { BlitzGameBoard } from '@/components/game/BlitzGameBoard';
import { BlitzResult } from '@/components/game/BlitzResult';
import { OnlineLobby } from '@/components/game/OnlineLobby';
import { CreateGameModal } from '@/components/game/CreateGameModal';
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
    isMyTurn,
    isLoading: isOnlineLoading,
    error: onlineError,
    createGame,
    joinGame,
    setClub: setOnlineClub,
    startOnlineGame,
    makeOnlineThrow,
    endOnlineTurn,
    finishOnlinePlayer,
    leaveGame,
  } = useOnlineGame();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleThrow = async (playerName: string) => {
    await makeThrow(playerName);
  };

  const handleFinish = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    finishGame(currentPlayer.id);
  };

  const handleCreateOnline = () => {
    setShowCreateModal(true);
  };

  const handleJoinOnline = () => {
    setShowJoinModal(true);
  };

  const handleCreateGame = async (
    mode: GameMode,
    startingScore: StartingScore,
    maxPlayers: number,
    playerName: string
  ) => {
    const result = await createGame(mode, startingScore, maxPlayers, playerName);
    if (result) {
      setShowCreateModal(false);
    }
  };

  const handleJoinGame = async (code: string, playerName: string) => {
    const result = await joinGame(code, playerName);
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
            onStartGame={startOnlineGame}
            onLeave={handleLeaveOnline}
          />
        </div>
      </div>
    );
  }

  // TODO: Handle online game playing state
  // For now, online games will use a similar flow

  return (
    <div className="relative min-h-screen overflow-hidden">
      <DartboardBackground />
      
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {gameState.phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameMenu
                selectedMode={gameState.mode}
                selectedScore={gameState.startingScore}
                onModeSelect={setMode}
                onScoreSelect={setStartingScore}
                onStart={goToSetup}
                onCreateOnline={handleCreateOnline}
                onJoinOnline={handleJoinOnline}
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
                selectedClub={gameState.club}
                onClubSelect={setClub}
                onStart={startGame}
                onBack={resetGame}
              />
            </motion.div>
          )}

          {gameState.phase === 'playing' && !isBlitzMode && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameBoard
                gameState={gameState}
                isLoading={isLoading}
                lastThrowResult={lastThrowResult}
                onThrow={handleThrow}
                onEndTurn={endTurn}
                onFinish={handleFinish}
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

      {/* Modals */}
      <CreateGameModal
        isOpen={showCreateModal}
        isLoading={isOnlineLoading}
        error={onlineError}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGame}
      />

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
