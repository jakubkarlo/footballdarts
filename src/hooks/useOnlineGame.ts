import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameMode, StartingScore, Club, OnlineGameSession, OnlinePlayer, OnlineDraftEntry, Throw } from '@/types/game';
import { RealtimeChannel } from '@supabase/supabase-js';

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useOnlineGame = () => {
  const [session, setSession] = useState<OnlineGameSession | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [mySessionToken, setMySessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continueRoundSignal, setContinueRoundSignal] = useState(0);
  const [revealSignal, setRevealSignal] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchSessionData = useCallback(async (sessionId: string) => {
    // Fetch session
    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError || !sessionData) {
      console.error('Error fetching session:', sessionError);
      return null;
    }

    // Fetch players
    const { data: playersData, error: playersError } = await supabase
      .from('game_players')
      .select('*')
      .eq('session_id', sessionId)
      .order('player_order', { ascending: true });

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return null;
    }

    // Fetch throws for each player
    const playersWithThrows: OnlinePlayer[] = await Promise.all(
      (playersData || []).map(async (player) => {
        const { data: throwsData } = await supabase
          .from('game_throws')
          .select('*')
          .eq('player_id', player.id)
          .order('created_at', { ascending: true });

        const throws: Throw[] = (throwsData || []).map((t) => ({
          playerId: t.football_player_id,
          playerName: t.football_player_name,
          appearances: t.appearances,
          timestamp: new Date(t.created_at).getTime(),
          photo: t.photo || undefined,
        }));

        return {
          id: player.id,
          sessionId: player.session_id,
          playerName: player.player_name,
          playerOrder: player.player_order,
          score: player.score,
          isBusted: player.is_busted,
          isFinished: player.is_finished,
          sessionToken: player.session_token,
          throws,
          lives: player.lives ?? 3,
        };
      })
    );

    // Map DB mode to app mode
    const dbModeToAppMode = (dbMode: string): GameMode => {
      if (dbMode === '1v1-turns') return 'multiplayer-turns';
      if (dbMode === '1v1-one-shot') return 'multiplayer-blitz';
      return 'solo';
    };

    const gameSession: OnlineGameSession = {
      id: sessionData.id,
      code: sessionData.code,
      mode: dbModeToAppMode(sessionData.mode),
      startingScore: sessionData.starting_score,
      club: sessionData.club_id ? {
        id: sessionData.club_id,
        name: sessionData.club_name || '',
        logo: sessionData.club_logo || '',
        country: sessionData.club_country || '',
      } : null,
      status: sessionData.status as 'waiting' | 'playing' | 'finished',
      currentPlayerIndex: sessionData.current_player_index,
      maxPlayers: sessionData.max_players,
      players: playersWithThrows,
      roundNumber: sessionData.round_number ?? 1,
      allowMisses: sessionData.allow_misses ?? false,
      timer: (sessionData.timer as 30 | 60 | 90 | 180 | 300 | null) ?? null,
    };

    setSession(gameSession);
    return gameSession;
  }, []);

  const subscribeToSession = useCallback((sessionId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`game-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        () => fetchSessionData(sessionId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `session_id=eq.${sessionId}` },
        () => fetchSessionData(sessionId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_throws', filter: `session_id=eq.${sessionId}` },
        () => fetchSessionData(sessionId)
      )
      .on('broadcast', { event: 'continue_round' }, () => setContinueRoundSignal(prev => prev + 1))
      .on('broadcast', { event: 'blitz_shoot' }, () => setRevealSignal(prev => prev + 1))
      .subscribe();

    channelRef.current = channel;
  }, [fetchSessionData]);

  const createGame = useCallback(async (
    mode: GameMode,
    startingScore: StartingScore,
    maxPlayers: number,
    allowMisses: boolean = false,
    timer: 30 | 60 | 90 | 180 | 300 | null = null,
  ): Promise<{ code: string; sessionId: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const code = generateCode();

      // Create session - need to cast mode for DB enum compatibility
      const dbMode = mode === 'multiplayer-turns' ? '1v1-turns' : mode === 'multiplayer-blitz' ? '1v1-one-shot' : 'solo';
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          code,
          mode: dbMode,
          starting_score: startingScore,
          max_players: maxPlayers,
          status: 'waiting',
          allow_misses: allowMisses,
          timer: timer,
        } as any)
        .select()
        .single();

      if (sessionError || !sessionData) {
        throw new Error(sessionError?.message || 'Failed to create game');
      }

      // Add host as first player with default name
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          session_id: sessionData.id,
          player_name: 'Player 1',
          player_order: 0,
          score: startingScore,
        })
        .select()
        .single();

      if (playerError || !playerData) {
        throw new Error(playerError?.message || 'Failed to add player');
      }

      setMyPlayerId(playerData.id);
      setMySessionToken(playerData.session_token);
      
      await fetchSessionData(sessionData.id);
      subscribeToSession(sessionData.id);

      setIsLoading(false);
      return { code, sessionId: sessionData.id };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
      return null;
    }
  }, [fetchSessionData, subscribeToSession]);

  const joinGame = useCallback(async (
    code: string,
  ): Promise<{ sessionId: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Find session by code
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'waiting')
        .maybeSingle();

      if (sessionError || !sessionData) {
        throw new Error('Game not found or already started');
      }

      // Check current player count
      const { count, error: countError } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionData.id);

      if (countError) throw new Error(countError.message);

      if ((count || 0) >= sessionData.max_players) {
        throw new Error('Game is full');
      }

      const playerOrder = count || 0;
      const defaultName = `Player ${playerOrder + 1}`;

      // Add player
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          session_id: sessionData.id,
          player_name: defaultName,
          player_order: playerOrder,
          score: sessionData.starting_score,
        })
        .select()
        .single();

      if (playerError || !playerData) {
        throw new Error(playerError?.message || 'Failed to join game');
      }

      setMyPlayerId(playerData.id);
      setMySessionToken(playerData.session_token);
      
      await fetchSessionData(sessionData.id);
      subscribeToSession(sessionData.id);

      setIsLoading(false);
      return { sessionId: sessionData.id };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
      return null;
    }
  }, [fetchSessionData, subscribeToSession]);

  const setClub = useCallback(async (club: Club) => {
    if (!session) return;

    await supabase
      .from('game_sessions')
      .update({
        club_id: club.id,
        club_name: club.name,
        club_logo: club.logo,
        club_country: club.country,
      })
      .eq('id', session.id);
  }, [session]);

  const setPlayerReady = useCallback(async (name: string) => {
    if (!myPlayerId) return;
    const finalName = name.trim() || `Player ${(session?.players.find(p => p.id === myPlayerId)?.playerOrder ?? 0) + 1}`;
    await supabase.from('game_players')
      .update({ player_name: finalName, is_finished: true })
      .eq('id', myPlayerId);
  }, [myPlayerId, session]);

  const startOnlineGame = useCallback(async () => {
    if (!session) return;
    // Reset is_finished (was repurposed as lobby "ready") before starting
    await supabase.from('game_players')
      .update({ is_finished: false })
      .eq('session_id', session.id);
    await supabase
      .from('game_sessions')
      .update({ status: 'playing' })
      .eq('id', session.id);
  }, [session]);

  const makeOnlineThrow = useCallback(async (
    footballPlayerId: string,
    footballPlayerName: string,
    appearances: number,
    photo?: string
  ) => {
    if (!session || !myPlayerId) return;

    const myPlayer = session.players.find(p => p.id === myPlayerId);
    if (!myPlayer) return;

    const newScore = myPlayer.score - appearances;
    const isBusted = newScore < 0;

    // Add throw
    await supabase.from('game_throws').insert({
      session_id: session.id,
      player_id: myPlayerId,
      football_player_id: footballPlayerId,
      football_player_name: footballPlayerName,
      appearances,
      photo,
    });

    // Update player score
    await supabase
      .from('game_players')
      .update({
        score: newScore,
        is_busted: isBusted,
      })
      .eq('id', myPlayerId);

    return { newScore, isBusted };
  }, [session, myPlayerId]);

  const endOnlineTurn = useCallback(async () => {
    if (!session) return;

    const nextIndex = (session.currentPlayerIndex + 1) % session.players.length;

    await supabase
      .from('game_sessions')
      .update({ current_player_index: nextIndex })
      .eq('id', session.id);
  }, [session]);

  const finishOnlinePlayer = useCallback(async () => {
    if (!session || !myPlayerId) return;

    await supabase
      .from('game_players')
      .update({ is_finished: true })
      .eq('id', myPlayerId);

    // Check if all players finished
    const allFinished = session.players.every(p => 
      p.id === myPlayerId || p.isFinished || p.isBusted
    );

    if (allFinished) {
      await supabase
        .from('game_sessions')
        .update({ status: 'finished' })
        .eq('id', session.id);
    }
  }, [session, myPlayerId]);

  // ── Round-based gameplay ────────────────────────────────────────────────────

  const lockInDraft = useCallback(async (
    draftEntries: OnlineDraftEntry[]
  ): Promise<{ isEliminated: boolean; isFinished: boolean; newScore: number; newLives: number } | null> => {
    if (!session || !myPlayerId) return null;

    const myPlayer = session.players.find(p => p.id === myPlayerId);
    if (!myPlayer) return null;

    setIsLoading(true);
    setError(null);

    const roundNum = session.roundNumber ?? 1;
    const allowMisses = session.allowMisses ?? false;

    try {
      // 1. Insert throws
      for (const entry of draftEntries) {
        await supabase.from('game_throws').insert({
          session_id: session.id,
          player_id: myPlayerId,
          football_player_id: entry.id,
          football_player_name: entry.name,
          appearances: entry.appearances,
          photo: entry.photo || null,
          round_number: roundNum,
          is_miss: entry.isMiss || false,
        });
      }

      // 2. Compute result
      const hasMiss = draftEntries.some(e => e.isMiss);
      const total = hasMiss ? 0 : draftEntries.reduce((s, e) => s + e.appearances, 0);
      const currentLives = myPlayer.lives ?? 3;

      let newScore = myPlayer.score;
      let newLives = currentLives;
      let isElim = false;
      let isFinished = false;

      if (hasMiss) {
        if (allowMisses) {
          newLives = Math.max(0, currentLives - 1);
          isElim = newLives <= 0;
        } else {
          isElim = true;
          newLives = 0;
        }
      } else if (total > 180) {
        isElim = true;
        newLives = 0;
      } else if (myPlayer.score - total < 0) {
        isElim = true;
        newLives = 0;
      } else {
        newScore = myPlayer.score - total;
        isFinished = newScore === 0;
      }

      // 3. Update my player state
      await supabase.from('game_players').update({
        score: newScore,
        lives: newLives,
        is_busted: isElim,
        is_finished: isFinished,
      }).eq('id', myPlayerId);

      // 4. Advance turn
      const updatedPlayers = session.players.map(p =>
        p.id === myPlayerId ? { ...p, score: newScore, lives: newLives, isBusted: isElim, isFinished } : p
      );
      const activePlayers = updatedPlayers
        .filter(p => !p.isBusted && !p.isFinished)
        .sort((a, b) => a.playerOrder - b.playerOrder);

      const myOrder = myPlayer.playerOrder;
      const nextInRound = activePlayers.find(p => p.playerOrder > myOrder);
      const isLastInRound = !nextInRound;

      // Check all players — someone earlier in the round may have already hit zero
      const anyoneHitZero = updatedPlayers.some(p => p.score === 0 && p.isFinished && !p.isBusted);
      const noActivePlayers = activePlayers.length === 0;
      // Someone who voluntarily stopped (not busted, score > 0) — last active player can keep going
      const hasVoluntaryStopped = updatedPlayers.some(p => p.isFinished && !p.isBusted && p.score > 0);
      // Mirrors local game: game ends when hit zero, no active players, OR
      // exactly 1 active left with nobody having voluntarily stopped (all others eliminated)
      const gameOver = isLastInRound && (anyoneHitZero || noActivePlayers || (activePlayers.length === 1 && !hasVoluntaryStopped));

      if (gameOver) {
        await supabase.from('game_sessions')
          .update({ status: 'finished' })
          .eq('id', session.id);
      } else if (isLastInRound) {
        const firstActive = activePlayers[0];
        await supabase.from('game_sessions').update({
          current_player_index: firstActive?.playerOrder ?? 0,
          round_number: roundNum + 1,
        }).eq('id', session.id);
      } else {
        await supabase.from('game_sessions')
          .update({ current_player_index: nextInRound.playerOrder })
          .eq('id', session.id);
      }

      setIsLoading(false);
      return { isEliminated: isElim, isFinished, newScore, newLives };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error locking in draft');
      setIsLoading(false);
      return null;
    }
  }, [session, myPlayerId]);

  const stopOnline = useCallback(async () => {
    if (!session || !myPlayerId) return;

    const myPlayer = session.players.find(p => p.id === myPlayerId);
    if (!myPlayer) return;

    setIsLoading(true);
    setError(null);

    try {
      await supabase.from('game_players')
        .update({ is_finished: true })
        .eq('id', myPlayerId);

      const updatedPlayers = session.players.map(p =>
        p.id === myPlayerId ? { ...p, isFinished: true } : p
      );

      // All non-busted players stopped → game over
      const allStopped = updatedPlayers
        .filter(p => !p.isBusted)
        .every(p => p.isFinished);

      if (allStopped) {
        await supabase.from('game_sessions')
          .update({ status: 'finished' })
          .eq('id', session.id);
        return;
      }

      // Advance turn — skip busted and stopped players
      const activePlayers = updatedPlayers
        .filter(p => !p.isBusted && !p.isFinished)
        .sort((a, b) => a.playerOrder - b.playerOrder);

      const myOrder = myPlayer.playerOrder;
      const nextInRound = activePlayers.find(p => p.playerOrder > myOrder);
      const isLastInRound = !nextInRound;
      const roundNum = session.roundNumber ?? 1;

      if (isLastInRound) {
        await supabase.from('game_sessions').update({
          current_player_index: activePlayers[0]?.playerOrder ?? 0,
          round_number: roundNum + 1,
        }).eq('id', session.id);
      } else {
        await supabase.from('game_sessions')
          .update({ current_player_index: nextInRound.playerOrder })
          .eq('id', session.id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [session, myPlayerId]);

  const lockInBlitzDraft = useCallback(async (draftEntries: OnlineDraftEntry[]) => {
    if (!session || !myPlayerId) return;
    const myPlayer = session.players.find(p => p.id === myPlayerId);
    if (!myPlayer) return;

    // Insert throws
    for (const entry of draftEntries) {
      await supabase.from('game_throws').insert({
        session_id: session.id,
        player_id: myPlayerId,
        football_player_id: entry.id,
        football_player_name: entry.name,
        appearances: entry.appearances,
        photo: entry.photo || null,
        round_number: 1,
        is_miss: false,
      });
    }

    // Calculate result — bust if score drops below zero
    const total = draftEntries.reduce((s, e) => s + e.appearances, 0);
    const newScore = myPlayer.score - total;
    const isBusted = newScore < 0;

    await supabase.from('game_players').update({
      score: newScore,
      is_busted: isBusted,
      is_finished: true,
    }).eq('id', myPlayerId);

    // Query fresh player data — snapshot in session can be stale when multiple players
    // time out simultaneously, causing the allDone check to miss concurrent lock-ins.
    const { data: freshPlayers } = await supabase
      .from('game_players')
      .select('id, is_finished, is_busted')
      .eq('session_id', session.id);
    const allDone = freshPlayers?.every(p => p.is_finished || p.is_busted) ?? false;
    if (allDone) {
      await supabase.from('game_sessions')
        .update({ status: 'finished' })
        .eq('id', session.id);
    }
  }, [session, myPlayerId]);

  const finishOnlineGame = useCallback(async () => {
    if (!session) return;
    await supabase
      .from('game_sessions')
      .update({ status: 'finished' })
      .eq('id', session.id);
  }, [session]);

  const continueRound = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'continue_round',
      payload: {},
    });
  }, []);

  const triggerReveal = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'blitz_shoot',
      payload: {},
    });
    // Also trigger locally for the host
    setRevealSignal(prev => prev + 1);
  }, []);

  const leaveGame = useCallback(async () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (myPlayerId && session?.status === 'waiting') {
      await supabase
        .from('game_players')
        .delete()
        .eq('id', myPlayerId);
    }

    setSession(null);
    setMyPlayerId(null);
    setMySessionToken(null);
    setError(null);
  }, [myPlayerId, session?.status]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  const myPlayerOrder = session?.players.find(p => p.id === myPlayerId)?.playerOrder ?? null;
  const isMyTurn = myPlayerOrder !== null && session?.currentPlayerIndex === myPlayerOrder && session?.status === 'playing';
  const myPlayerIndex = session?.players.findIndex(p => p.id === myPlayerId) ?? null;

  return {
    session,
    myPlayerId,
    mySessionToken,
    myPlayerIndex,
    myPlayerOrder,
    isMyTurn,
    isLoading,
    error,
    continueRoundSignal,
    revealSignal,
    createGame,
    joinGame,
    setClub,
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
  };
};
