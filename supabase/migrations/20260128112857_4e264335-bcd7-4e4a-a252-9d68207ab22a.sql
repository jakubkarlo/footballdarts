-- Create enum for game status
CREATE TYPE public.game_status AS ENUM ('waiting', 'playing', 'finished');

-- Create enum for game modes
CREATE TYPE public.game_mode AS ENUM ('solo', '1v1-turns', '1v1-one-shot');

-- Create game_sessions table
CREATE TABLE public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) NOT NULL UNIQUE,
    mode game_mode NOT NULL,
    starting_score INTEGER NOT NULL DEFAULT 501,
    club_id VARCHAR(50),
    club_name VARCHAR(100),
    club_logo TEXT,
    club_country VARCHAR(50),
    status game_status NOT NULL DEFAULT 'waiting',
    current_player_index INTEGER NOT NULL DEFAULT 0,
    max_players INTEGER NOT NULL DEFAULT 2,
    host_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_players table
CREATE TABLE public.game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    player_order INTEGER NOT NULL,
    score INTEGER NOT NULL,
    is_busted BOOLEAN NOT NULL DEFAULT false,
    is_finished BOOLEAN NOT NULL DEFAULT false,
    session_token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(session_id, player_order)
);

-- Create game_throws table
CREATE TABLE public.game_throws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES public.game_players(id) ON DELETE CASCADE NOT NULL,
    football_player_id VARCHAR(50) NOT NULL,
    football_player_name VARCHAR(100) NOT NULL,
    appearances INTEGER NOT NULL,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_throws ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public access (no auth required for casual gaming)
CREATE POLICY "Anyone can view game sessions" 
ON public.game_sessions FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create game sessions" 
ON public.game_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update game sessions" 
ON public.game_sessions FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view game players" 
ON public.game_players FOR SELECT 
USING (true);

CREATE POLICY "Anyone can join games" 
ON public.game_players FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update game players" 
ON public.game_players FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view throws" 
ON public.game_throws FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create throws" 
ON public.game_throws FOR INSERT 
WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_throws;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_game_sessions_updated_at
BEFORE UPDATE ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_players_updated_at
BEFORE UPDATE ON public.game_players
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique game code
CREATE OR REPLACE FUNCTION public.generate_game_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        SELECT EXISTS(SELECT 1 FROM public.game_sessions WHERE code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SET search_path = public;