import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnlineGameSession, GameMode, StartingScore, Club } from '@/types/game';
import { Users, Copy, Check, ArrowLeft, Play, Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClubBadge } from './ClubBadge';
import { GameSetup } from './GameSetup';

interface OnlineLobbyProps {
  session: OnlineGameSession;
  myPlayerId: string | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  onSetClub: (club: Club) => void;
  onStartGame: () => void;
  onLeave: () => void;
}

export const OnlineLobby = ({
  session,
  myPlayerId,
  isHost,
  isLoading,
  error,
  onSetClub,
  onStartGame,
  onLeave,
}: OnlineLobbyProps) => {
  const [copied, setCopied] = useState(false);
  const [showClubSelect, setShowClubSelect] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(session.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = session.players.length >= 2 && session.club !== null && isHost;

  if (showClubSelect && isHost) {
    return (
      <GameSetup
        mode={session.mode}
        selectedClub={session.club}
        onClubSelect={(club) => {
          onSetClub(club);
          setShowClubSelect(false);
        }}
        onStart={() => setShowClubSelect(false)}
        onBack={() => setShowClubSelect(false)}
        hidePlayerNames
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stadium-gradient">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onLeave}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <Wifi className="w-5 h-5" />
            <span className="font-medium">Online Game</span>
          </div>
        </div>

        {/* Game Code */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <p className="text-sm text-muted-foreground mb-2">Game Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-display font-bold tracking-[0.3em] text-primary">
              {session.code}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={copyCode}
              className="rounded-xl"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Share this code with friends to join
          </p>
        </motion.div>

        {/* Mode & Score */}
        <div className="flex justify-center gap-4 mb-6">
          <span className="px-4 py-2 bg-card/80 rounded-xl text-sm border border-border/50">
            {session.mode === 'multiplayer-turns' ? 'Turns Mode' : 'Blitz Mode'}
          </span>
          <span className="px-4 py-2 bg-card/80 rounded-xl text-sm border border-border/50">
            {session.startingScore} pts
          </span>
          <span className="px-4 py-2 bg-card/80 rounded-xl text-sm border border-border/50">
            Max {session.maxPlayers} players
          </span>
        </div>

        {/* Club Selection */}
        {session.club ? (
          <div className="flex justify-center mb-6">
            <div 
              className={cn(
                "flex items-center gap-3 px-4 py-2 bg-card/80 rounded-xl border border-border/50",
                isHost && "cursor-pointer hover:border-primary/50"
              )}
              onClick={() => isHost && setShowClubSelect(true)}
            >
              <ClubBadge club={session.club} size="sm" />
              {isHost && <span className="text-xs text-muted-foreground">(click to change)</span>}
            </div>
          </div>
        ) : isHost ? (
          <Button
            variant="outline"
            onClick={() => setShowClubSelect(true)}
            className="w-full mb-6 h-14 rounded-xl border-dashed"
          >
            Select Club
          </Button>
        ) : (
          <p className="text-center text-muted-foreground mb-6">
            Waiting for host to select a club...
          </p>
        )}

        {/* Players */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/50 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold">
              Players ({session.players.length}/{session.maxPlayers})
            </h3>
          </div>

          <div className="space-y-3">
            {session.players.map((player, index) => (
              <motion.div
                key={player.id}
                className={cn(
                  'flex items-center justify-between p-4 rounded-xl border',
                  player.id === myPlayerId 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-muted/30 border-border/30'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {player.playerName}
                    {player.id === myPlayerId && (
                      <span className="text-xs text-primary ml-2">(You)</span>
                    )}
                    {index === 0 && (
                      <span className="text-xs text-secondary ml-2">(Host)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">Connected</span>
                </div>
              </motion.div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: session.maxPlayers - session.players.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center justify-center p-4 rounded-xl border border-dashed border-border/30 text-muted-foreground"
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Waiting for player...
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Start Button */}
        {isHost ? (
          <Button
            onClick={onStartGame}
            disabled={!canStart || isLoading}
            className="w-full h-14 text-lg font-display font-bold bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </>
            )}
          </Button>
        ) : (
          <div className="text-center text-muted-foreground">
            Waiting for host to start the game...
          </div>
        )}

        {!canStart && isHost && (
          <p className="text-center text-muted-foreground text-sm mt-4">
            {session.players.length < 2 
              ? 'Need at least 2 players to start' 
              : 'Select a club to start the game'}
          </p>
        )}
      </motion.div>
    </div>
  );
};
