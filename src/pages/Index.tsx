import { useGame } from '@/hooks/useGame';
import { DartboardBackground } from '@/components/game/DartboardBackground';
import { GameMenu } from '@/components/game/GameMenu';
import { GameSetup } from '@/components/game/GameSetup';
import { GameBoard } from '@/components/game/GameBoard';
import { GameResult } from '@/components/game/GameResult';
import { AnimatePresence, motion } from 'framer-motion';

const Index = () => {
  const {
    gameState,
    isLoading,
    lastThrowResult,
    setMode,
    setStartingScore,
    setClub,
    startGame,
    makeThrow,
    endTurn,
    finishGame,
    resetGame,
    goToSetup,
  } = useGame();

  const handleThrow = async (playerName: string) => {
    await makeThrow(playerName);
  };

  const handleFinish = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    finishGame(currentPlayer.id);
  };

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

          {gameState.phase === 'playing' && (
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

          {gameState.phase === 'result' && (
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
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
