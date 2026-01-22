import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SquadPlayer {
  id: number;
  name: string;
  photo: string;
  position: string;
}

export const useSquad = (teamId: string | null) => {
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSquad = useCallback(async () => {
    if (!teamId) {
      setSquad([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-squad', {
        body: { teamId },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.players) {
        setSquad(data.players);
      } else {
        setSquad([]);
      }
    } catch (err) {
      console.error('Failed to fetch squad:', err);
      setError('Failed to load squad');
      setSquad([]);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  const filterPlayers = useCallback((query: string): SquadPlayer[] => {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    return squad
      .filter(player => {
        const nameParts = player.name.toLowerCase().split(' ');
        return player.name.toLowerCase().includes(normalizedQuery) ||
               nameParts.some(part => part.startsWith(normalizedQuery));
      })
      .slice(0, 5);
  }, [squad]);

  return {
    squad,
    isLoading,
    error,
    filterPlayers,
    refetch: fetchSquad,
  };
};
