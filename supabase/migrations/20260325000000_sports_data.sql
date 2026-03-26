-- Sports data tables: teams, players, player_appearances
-- These are populated by the sync-sports-data Edge Function (daily cron).

create table if not exists public.teams (
  id              uuid primary key default gen_random_uuid(),
  external_id     integer not null unique,   -- ID from the data provider (e.g. api-football team id)
  name            text    not null,
  short_name      text,
  logo_url        text,
  country         text,
  league_id       integer,                   -- provider-specific league id
  season          integer not null,
  synced_at       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create table if not exists public.players (
  id              uuid primary key default gen_random_uuid(),
  external_id     integer not null unique,   -- ID from the data provider
  name            text    not null,
  firstname       text,
  lastname        text,
  position        text,
  nationality     text,
  photo_url       text,
  synced_at       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create table if not exists public.player_appearances (
  player_id       uuid    not null references public.players(id) on delete cascade,
  team_id         uuid    not null references public.teams(id)   on delete cascade,
  season          integer not null,
  appearances     integer not null default 0,
  synced_at       timestamptz not null default now(),
  primary key (player_id, team_id, season)
);

-- Indexes for common query patterns
create index if not exists idx_teams_external_id     on public.teams(external_id);
create index if not exists idx_players_external_id   on public.players(external_id);
create index if not exists idx_pa_team_season        on public.player_appearances(team_id, season);
create index if not exists idx_pa_player             on public.player_appearances(player_id);

-- Convenience view: players with their team appearances summed across ALL seasons
-- (no season column — the game shows career totals per club)
create or replace view public.squad_appearances as
  select
    p.id              as player_id,
    p.external_id     as player_external_id,
    p.name            as player_name,
    p.firstname       as player_firstname,
    p.lastname        as player_lastname,
    p.position,
    p.nationality,
    p.photo_url,
    t.id              as team_id,
    t.external_id     as team_external_id,
    t.name            as team_name,
    t.logo_url        as team_logo,
    t.country         as team_country,
    sum(pa.appearances) as appearances
  from public.player_appearances pa
  join public.players p on p.id = pa.player_id
  join public.teams   t on t.id = pa.team_id
  group by
    p.id, p.external_id, p.name, p.firstname, p.lastname, p.position, p.nationality, p.photo_url,
    t.id, t.external_id, t.name, t.logo_url, t.country;

-- RLS: read-only for anonymous (the game only reads this data)
alter table public.teams               enable row level security;
alter table public.players             enable row level security;
alter table public.player_appearances  enable row level security;

create policy "public read teams"
  on public.teams for select using (true);

create policy "public read players"
  on public.players for select using (true);

create policy "public read player_appearances"
  on public.player_appearances for select using (true);
