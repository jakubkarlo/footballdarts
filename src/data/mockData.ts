import { Club, FootballPlayer } from '@/types/game';

export const mockClubs: Club[] = [
  { id: '1', name: 'Manchester United', logo: '🔴', country: 'Anglia' },
  { id: '2', name: 'Real Madrid', logo: '⚪', country: 'Hiszpania' },
  { id: '3', name: 'Barcelona', logo: '🔵🔴', country: 'Hiszpania' },
  { id: '4', name: 'Bayern Monachium', logo: '🔴', country: 'Niemcy' },
  { id: '5', name: 'Liverpool', logo: '🔴', country: 'Anglia' },
  { id: '6', name: 'Juventus', logo: '⚫⚪', country: 'Włochy' },
  { id: '7', name: 'PSG', logo: '🔵🔴', country: 'Francja' },
  { id: '8', name: 'Chelsea', logo: '🔵', country: 'Anglia' },
  { id: '9', name: 'Manchester City', logo: '🩵', country: 'Anglia' },
  { id: '10', name: 'AC Milan', logo: '🔴⚫', country: 'Włochy' },
  { id: '11', name: 'Legia Warszawa', logo: '🟢⚪', country: 'Polska' },
  { id: '12', name: 'Lech Poznań', logo: '🔵⚪', country: 'Polska' },
];

// Mock players database - w rzeczywistości będzie z API
export const mockPlayers: Record<string, FootballPlayer[]> = {
  '1': [ // Manchester United
    { id: 'mu1', name: 'Ryan Giggs', appearances: 963, position: 'Pomocnik', nationality: 'Walia' },
    { id: 'mu2', name: 'Bobby Charlton', appearances: 758, position: 'Pomocnik', nationality: 'Anglia' },
    { id: 'mu3', name: 'Paul Scholes', appearances: 718, position: 'Pomocnik', nationality: 'Anglia' },
    { id: 'mu4', name: 'Wayne Rooney', appearances: 559, position: 'Napastnik', nationality: 'Anglia' },
    { id: 'mu5', name: 'Gary Neville', appearances: 602, position: 'Obrońca', nationality: 'Anglia' },
    { id: 'mu6', name: 'Denis Irwin', appearances: 529, position: 'Obrońca', nationality: 'Irlandia' },
    { id: 'mu7', name: 'David Beckham', appearances: 394, position: 'Pomocnik', nationality: 'Anglia' },
    { id: 'mu8', name: 'Cristiano Ronaldo', appearances: 346, position: 'Napastnik', nationality: 'Portugalia' },
    { id: 'mu9', name: 'Eric Cantona', appearances: 185, position: 'Napastnik', nationality: 'Francja' },
    { id: 'mu10', name: 'Rio Ferdinand', appearances: 455, position: 'Obrońca', nationality: 'Anglia' },
    { id: 'mu11', name: 'Bryan Robson', appearances: 461, position: 'Pomocnik', nationality: 'Anglia' },
    { id: 'mu12', name: 'Marcus Rashford', appearances: 350, position: 'Napastnik', nationality: 'Anglia' },
    { id: 'mu13', name: 'Bruno Fernandes', appearances: 180, position: 'Pomocnik', nationality: 'Portugalia' },
    { id: 'mu14', name: 'Harry Maguire', appearances: 160, position: 'Obrońca', nationality: 'Anglia' },
    { id: 'mu15', name: 'Casemiro', appearances: 75, position: 'Pomocnik', nationality: 'Brazylia' },
  ],
  '2': [ // Real Madrid
    { id: 'rm1', name: 'Raul Gonzalez', appearances: 741, position: 'Napastnik', nationality: 'Hiszpania' },
    { id: 'rm2', name: 'Iker Casillas', appearances: 725, position: 'Bramkarz', nationality: 'Hiszpania' },
    { id: 'rm3', name: 'Sergio Ramos', appearances: 671, position: 'Obrońca', nationality: 'Hiszpania' },
    { id: 'rm4', name: 'Karim Benzema', appearances: 648, position: 'Napastnik', nationality: 'Francja' },
    { id: 'rm5', name: 'Marcelo', appearances: 546, position: 'Obrońca', nationality: 'Brazylia' },
    { id: 'rm6', name: 'Luka Modric', appearances: 480, position: 'Pomocnik', nationality: 'Chorwacja' },
    { id: 'rm7', name: 'Cristiano Ronaldo', appearances: 438, position: 'Napastnik', nationality: 'Portugalia' },
    { id: 'rm8', name: 'Zinedine Zidane', appearances: 227, position: 'Pomocnik', nationality: 'Francja' },
    { id: 'rm9', name: 'Toni Kroos', appearances: 465, position: 'Pomocnik', nationality: 'Niemcy' },
    { id: 'rm10', name: 'Roberto Carlos', appearances: 527, position: 'Obrońca', nationality: 'Brazylia' },
    { id: 'rm11', name: 'Vinicius Jr', appearances: 250, position: 'Napastnik', nationality: 'Brazylia' },
    { id: 'rm12', name: 'Jude Bellingham', appearances: 50, position: 'Pomocnik', nationality: 'Anglia' },
  ],
  '3': [ // Barcelona
    { id: 'bc1', name: 'Lionel Messi', appearances: 778, position: 'Napastnik', nationality: 'Argentyna' },
    { id: 'bc2', name: 'Xavi Hernandez', appearances: 767, position: 'Pomocnik', nationality: 'Hiszpania' },
    { id: 'bc3', name: 'Andres Iniesta', appearances: 674, position: 'Pomocnik', nationality: 'Hiszpania' },
    { id: 'bc4', name: 'Sergio Busquets', appearances: 722, position: 'Pomocnik', nationality: 'Hiszpania' },
    { id: 'bc5', name: 'Gerard Pique', appearances: 616, position: 'Obrońca', nationality: 'Hiszpania' },
    { id: 'bc6', name: 'Carles Puyol', appearances: 593, position: 'Obrońca', nationality: 'Hiszpania' },
    { id: 'bc7', name: 'Dani Alves', appearances: 408, position: 'Obrońca', nationality: 'Brazylia' },
    { id: 'bc8', name: 'Neymar Jr', appearances: 186, position: 'Napastnik', nationality: 'Brazylia' },
    { id: 'bc9', name: 'Luis Suarez', appearances: 283, position: 'Napastnik', nationality: 'Urugwaj' },
    { id: 'bc10', name: 'Pedri', appearances: 150, position: 'Pomocnik', nationality: 'Hiszpania' },
    { id: 'bc11', name: 'Robert Lewandowski', appearances: 95, position: 'Napastnik', nationality: 'Polska' },
  ],
  '4': [ // Bayern
    { id: 'by1', name: 'Thomas Muller', appearances: 710, position: 'Napastnik', nationality: 'Niemcy' },
    { id: 'by2', name: 'Sepp Maier', appearances: 700, position: 'Bramkarz', nationality: 'Niemcy' },
    { id: 'by3', name: 'Gerd Muller', appearances: 566, position: 'Napastnik', nationality: 'Niemcy' },
    { id: 'by4', name: 'Manuel Neuer', appearances: 529, position: 'Bramkarz', nationality: 'Niemcy' },
    { id: 'by5', name: 'Robert Lewandowski', appearances: 375, position: 'Napastnik', nationality: 'Polska' },
    { id: 'by6', name: 'Philipp Lahm', appearances: 517, position: 'Obrońca', nationality: 'Niemcy' },
    { id: 'by7', name: 'Bastian Schweinsteiger', appearances: 500, position: 'Pomocnik', nationality: 'Niemcy' },
    { id: 'by8', name: 'Joshua Kimmich', appearances: 350, position: 'Pomocnik', nationality: 'Niemcy' },
    { id: 'by9', name: 'Franck Ribery', appearances: 425, position: 'Pomocnik', nationality: 'Francja' },
    { id: 'by10', name: 'Arjen Robben', appearances: 309, position: 'Pomocnik', nationality: 'Holandia' },
  ],
  '5': [ // Liverpool
    { id: 'lp1', name: 'Ian Callaghan', appearances: 857, position: 'Pomocnik', nationality: 'Anglia' },
    { id: 'lp2', name: 'Jamie Carragher', appearances: 737, position: 'Obrońca', nationality: 'Anglia' },
    { id: 'lp3', name: 'Steven Gerrard', appearances: 710, position: 'Pomocnik', nationality: 'Anglia' },
    { id: 'lp4', name: 'Emlyn Hughes', appearances: 665, position: 'Obrońca', nationality: 'Anglia' },
    { id: 'lp5', name: 'Mohamed Salah', appearances: 350, position: 'Napastnik', nationality: 'Egipt' },
    { id: 'lp6', name: 'Virgil van Dijk', appearances: 280, position: 'Obrońca', nationality: 'Holandia' },
    { id: 'lp7', name: 'Sadio Mane', appearances: 269, position: 'Napastnik', nationality: 'Senegal' },
    { id: 'lp8', name: 'Roberto Firmino', appearances: 362, position: 'Napastnik', nationality: 'Brazylia' },
    { id: 'lp9', name: 'Trent Alexander-Arnold', appearances: 310, position: 'Obrońca', nationality: 'Anglia' },
    { id: 'lp10', name: 'Kenny Dalglish', appearances: 515, position: 'Napastnik', nationality: 'Szkocja' },
  ],
  '11': [ // Legia Warszawa
    { id: 'lg1', name: 'Lucjan Brychczy', appearances: 452, position: 'Napastnik', nationality: 'Polska' },
    { id: 'lg2', name: 'Kazimierz Deyna', appearances: 340, position: 'Pomocnik', nationality: 'Polska' },
    { id: 'lg3', name: 'Artur Boruc', appearances: 200, position: 'Bramkarz', nationality: 'Polska' },
    { id: 'lg4', name: 'Jakub Kosecki', appearances: 180, position: 'Pomocnik', nationality: 'Polska' },
    { id: 'lg5', name: 'Bartosz Kapustka', appearances: 95, position: 'Pomocnik', nationality: 'Polska' },
    { id: 'lg6', name: 'Josue', appearances: 160, position: 'Pomocnik', nationality: 'Portugalia' },
    { id: 'lg7', name: 'Artur Jędrzejczyk', appearances: 230, position: 'Obrońca', nationality: 'Polska' },
    { id: 'lg8', name: 'Miroslav Radovic', appearances: 175, position: 'Pomocnik', nationality: 'Serbia' },
  ],
  '12': [ // Lech Poznań
    { id: 'lch1', name: 'Piotr Reiss', appearances: 420, position: 'Pomocnik', nationality: 'Polska' },
    { id: 'lch2', name: 'Robert Lewandowski', appearances: 58, position: 'Napastnik', nationality: 'Polska' },
    { id: 'lch3', name: 'Bartosz Bosacki', appearances: 280, position: 'Obrońca', nationality: 'Polska' },
    { id: 'lch4', name: 'Semir Stilic', appearances: 165, position: 'Pomocnik', nationality: 'Bośnia' },
    { id: 'lch5', name: 'Mikael Ishak', appearances: 145, position: 'Napastnik', nationality: 'Szwecja' },
    { id: 'lch6', name: 'Jakub Moder', appearances: 70, position: 'Pomocnik', nationality: 'Polska' },
    { id: 'lch7', name: 'Antonio Colak', appearances: 55, position: 'Napastnik', nationality: 'Chorwacja' },
  ],
};

// Default players for clubs without specific data
const defaultPlayers: FootballPlayer[] = [
  { id: 'def1', name: 'Nieznany Piłkarz 1', appearances: 150, position: 'Pomocnik', nationality: 'Nieznany' },
  { id: 'def2', name: 'Nieznany Piłkarz 2', appearances: 100, position: 'Obrońca', nationality: 'Nieznany' },
  { id: 'def3', name: 'Nieznany Piłkarz 3', appearances: 75, position: 'Napastnik', nationality: 'Nieznany' },
];

export const getPlayersForClub = (clubId: string): FootballPlayer[] => {
  return mockPlayers[clubId] || defaultPlayers;
};

// Simulate API call with delay
export const searchPlayer = async (
  clubId: string,
  playerName: string
): Promise<FootballPlayer | null> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
  
  const players = getPlayersForClub(clubId);
  const normalizedSearch = playerName.toLowerCase().trim();
  
  const found = players.find(
    (p) => p.name.toLowerCase().includes(normalizedSearch) ||
           normalizedSearch.includes(p.name.toLowerCase().split(' ')[0]) ||
           normalizedSearch.includes(p.name.toLowerCase().split(' ').pop() || '')
  );
  
  return found || null;
};

// Get random club
export const getRandomClub = (): Club => {
  const randomIndex = Math.floor(Math.random() * mockClubs.length);
  return mockClubs[randomIndex];
};
