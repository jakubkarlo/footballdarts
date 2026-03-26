import { useState, useEffect, useCallback } from 'react';
import { fetchPlayersForClub } from '@/data/mockData';

export interface SquadPlayer {
  id: number;
  name: string;
  photo: string;
  position: string;
}

// Fallback squad data for popular clubs when API is not available
const fallbackSquads: Record<string, SquadPlayer[]> = {
  '33': [ // Manchester United
    { id: 1, name: 'André Onana', photo: '', position: 'Goalkeeper' },
    { id: 2, name: 'Diogo Dalot', photo: '', position: 'Defender' },
    { id: 3, name: 'Harry Maguire', photo: '', position: 'Defender' },
    { id: 4, name: 'Lisandro Martínez', photo: '', position: 'Defender' },
    { id: 5, name: 'Luke Shaw', photo: '', position: 'Defender' },
    { id: 6, name: 'Casemiro', photo: '', position: 'Midfielder' },
    { id: 7, name: 'Bruno Fernandes', photo: '', position: 'Midfielder' },
    { id: 8, name: 'Mason Mount', photo: '', position: 'Midfielder' },
    { id: 9, name: 'Kobbie Mainoo', photo: '', position: 'Midfielder' },
    { id: 10, name: 'Marcus Rashford', photo: '', position: 'Attacker' },
    { id: 11, name: 'Rasmus Højlund', photo: '', position: 'Attacker' },
    { id: 12, name: 'Alejandro Garnacho', photo: '', position: 'Attacker' },
    { id: 13, name: 'Antony', photo: '', position: 'Attacker' },
  ],
  '541': [ // Real Madrid
    { id: 14, name: 'Thibaut Courtois', photo: '', position: 'Goalkeeper' },
    { id: 15, name: 'Dani Carvajal', photo: '', position: 'Defender' },
    { id: 16, name: 'Éder Militão', photo: '', position: 'Defender' },
    { id: 17, name: 'Antonio Rüdiger', photo: '', position: 'Defender' },
    { id: 18, name: 'Ferland Mendy', photo: '', position: 'Defender' },
    { id: 19, name: 'Eduardo Camavinga', photo: '', position: 'Midfielder' },
    { id: 20, name: 'Jude Bellingham', photo: '', position: 'Midfielder' },
    { id: 21, name: 'Luka Modrić', photo: '', position: 'Midfielder' },
    { id: 22, name: 'Federico Valverde', photo: '', position: 'Midfielder' },
    { id: 23, name: 'Vinícius Júnior', photo: '', position: 'Attacker' },
    { id: 24, name: 'Rodrygo', photo: '', position: 'Attacker' },
    { id: 25, name: 'Kylian Mbappé', photo: '', position: 'Attacker' },
  ],
  '529': [ // Barcelona
    { id: 26, name: 'Marc-André ter Stegen', photo: '', position: 'Goalkeeper' },
    { id: 27, name: 'Jules Koundé', photo: '', position: 'Defender' },
    { id: 28, name: 'Ronald Araújo', photo: '', position: 'Defender' },
    { id: 29, name: 'Alejandro Balde', photo: '', position: 'Defender' },
    { id: 30, name: 'Pedri', photo: '', position: 'Midfielder' },
    { id: 31, name: 'Gavi', photo: '', position: 'Midfielder' },
    { id: 32, name: 'Frenkie de Jong', photo: '', position: 'Midfielder' },
    { id: 33, name: 'Lamine Yamal', photo: '', position: 'Attacker' },
    { id: 34, name: 'Raphinha', photo: '', position: 'Attacker' },
    { id: 35, name: 'Robert Lewandowski', photo: '', position: 'Attacker' },
  ],
  '40': [ // Liverpool
    { id: 36, name: 'Alisson Becker', photo: '', position: 'Goalkeeper' },
    { id: 37, name: 'Trent Alexander-Arnold', photo: '', position: 'Defender' },
    { id: 38, name: 'Virgil van Dijk', photo: '', position: 'Defender' },
    { id: 39, name: 'Andrew Robertson', photo: '', position: 'Defender' },
    { id: 40, name: 'Alexis Mac Allister', photo: '', position: 'Midfielder' },
    { id: 41, name: 'Dominik Szoboszlai', photo: '', position: 'Midfielder' },
    { id: 42, name: 'Ryan Gravenberch', photo: '', position: 'Midfielder' },
    { id: 43, name: 'Mohamed Salah', photo: '', position: 'Attacker' },
    { id: 44, name: 'Luis Díaz', photo: '', position: 'Attacker' },
    { id: 45, name: 'Darwin Núñez', photo: '', position: 'Attacker' },
  ],
  '50': [ // Manchester City
    { id: 46, name: 'Ederson', photo: '', position: 'Goalkeeper' },
    { id: 47, name: 'Kyle Walker', photo: '', position: 'Defender' },
    { id: 48, name: 'Rúben Dias', photo: '', position: 'Defender' },
    { id: 49, name: 'John Stones', photo: '', position: 'Defender' },
    { id: 50, name: 'Rodri', photo: '', position: 'Midfielder' },
    { id: 51, name: 'Kevin De Bruyne', photo: '', position: 'Midfielder' },
    { id: 52, name: 'Bernardo Silva', photo: '', position: 'Midfielder' },
    { id: 53, name: 'Phil Foden', photo: '', position: 'Attacker' },
    { id: 54, name: 'Erling Haaland', photo: '', position: 'Attacker' },
    { id: 55, name: 'Jack Grealish', photo: '', position: 'Attacker' },
  ],
  '42': [ // Arsenal
    { id: 56, name: 'David Raya', photo: '', position: 'Goalkeeper' },
    { id: 57, name: 'Ben White', photo: '', position: 'Defender' },
    { id: 58, name: 'William Saliba', photo: '', position: 'Defender' },
    { id: 59, name: 'Gabriel Magalhães', photo: '', position: 'Defender' },
    { id: 60, name: 'Declan Rice', photo: '', position: 'Midfielder' },
    { id: 61, name: 'Martin Ødegaard', photo: '', position: 'Midfielder' },
    { id: 62, name: 'Bukayo Saka', photo: '', position: 'Attacker' },
    { id: 63, name: 'Gabriel Martinelli', photo: '', position: 'Attacker' },
    { id: 64, name: 'Kai Havertz', photo: '', position: 'Attacker' },
  ],
  '85': [ // PSG
    { id: 65, name: 'Gianluigi Donnarumma', photo: '', position: 'Goalkeeper' },
    { id: 66, name: 'Achraf Hakimi', photo: '', position: 'Defender' },
    { id: 67, name: 'Marquinhos', photo: '', position: 'Defender' },
    { id: 68, name: 'Warren Zaïre-Emery', photo: '', position: 'Midfielder' },
    { id: 69, name: 'Vitinha', photo: '', position: 'Midfielder' },
    { id: 70, name: 'Ousmane Dembélé', photo: '', position: 'Attacker' },
    { id: 71, name: 'Bradley Barcola', photo: '', position: 'Attacker' },
  ],
  '157': [ // Bayern Munich
    { id: 72, name: 'Manuel Neuer', photo: '', position: 'Goalkeeper' },
    { id: 73, name: 'Joshua Kimmich', photo: '', position: 'Defender' },
    { id: 74, name: 'Dayot Upamecano', photo: '', position: 'Defender' },
    { id: 75, name: 'Jamal Musiala', photo: '', position: 'Midfielder' },
    { id: 76, name: 'Leroy Sané', photo: '', position: 'Attacker' },
    { id: 77, name: 'Harry Kane', photo: '', position: 'Attacker' },
    { id: 78, name: 'Serge Gnabry', photo: '', position: 'Attacker' },
  ],
};

export const useSquad = (teamId: string | null) => {
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSquad = useCallback(() => {
    if (!teamId) { setSquad([]); return; }
    setIsLoading(true);
    fetchPlayersForClub(teamId)
      .then(players => {
        const mapped = players.map(p => ({
          id: p.id ? Number(p.id) : 0,
          name: p.name,
          photo: p.photo ?? '',
          position: p.position ?? '',
        }));
        setSquad(mapped.length > 0 ? mapped : (fallbackSquads[teamId] ?? []));
      })
      .catch(() => setSquad(fallbackSquads[teamId] ?? []))
      .finally(() => setIsLoading(false));
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
