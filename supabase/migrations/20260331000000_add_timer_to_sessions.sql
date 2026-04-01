-- Add timer column to game_sessions
-- timer stores the per-turn countdown in seconds (30, 60, 90, 180, 300) or null for no timer
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS timer INTEGER NULL;
