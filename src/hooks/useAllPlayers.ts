import { useState, useEffect } from 'react';
import { fetchAllPlayers } from '@/data/mockData';
import { SquadPlayer } from './useSquad';

export const useAllPlayers = () => {
  const [allPlayers, setAllPlayers] = useState<SquadPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllPlayers()
      .then(players => {
        setAllPlayers(players.map(p => ({
          id: p.id ? Number(p.id) : 0,
          playerId: p.id,
          name: p.name,
          fullName: (p.firstname && p.lastname) ? `${p.firstname} ${p.lastname}` : undefined,
          photo: p.photo ?? '',
          position: p.position ?? '',
        })));
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { allPlayers, isLoading };
};
