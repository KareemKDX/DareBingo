-- =========================================================
-- Bingo / challenge app – database schema
-- Run this whole file in Supabase -> SQL Editor.
-- =========================================================


-- ---------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------

-- One profile per user (created automatically at signup)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  is_admin boolean not null default false
);

-- A game (e.g. "Kryssningen 2026")
create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'finished')),
  created_at timestamptz not null default now()
);

-- Challenge cards that belong to a game
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  text text not null,
  points int not null default 1 check (points >= 0),
  created_at timestamptz not null default now()
);

-- A user has completed a challenge
create table public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index completions_game_id_idx on public.completions (game_id);
create index challenges_game_id_idx on public.challenges (game_id);


-- ---------------------------------------------------------
-- 2. HELPER FUNCTIONS AND TRIGGERS
-- ---------------------------------------------------------

-- Returns true if the logged in user is an admin.
-- "security definer" lets it read profiles without hitting RLS loops.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Creates a profile automatically when a new user signs up.
-- The username comes from the signup metadata: { username: '...' }
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_username text;
begin
  new_username := trim(new.raw_user_meta_data ->> 'username');

  -- Fallback if no username was sent: use the part before @ in the email
  if new_username is null or new_username = '' then
    new_username := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, username)
  values (new.id, new_username);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the signup page check if a username is free (even before login).
create or replace function public.username_available(wanted_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(wanted_username))
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- Always use the server time for completions, so nobody can fake
-- an early time to win a tie.
create or replace function public.set_completion_time()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  return new;
end;
$$;

create trigger completions_set_time
  before insert on public.completions
  for each row execute function public.set_completion_time();


-- ---------------------------------------------------------
-- 3. LEADERBOARD VIEW
-- Total points per player and game.
-- reached_at = when the player reached their current score
-- (used to break ties: earliest wins).
-- security_invoker = the view follows the RLS of the tables.
-- ---------------------------------------------------------

create or replace view public.leaderboard
with (security_invoker = true)
as
select
  c.game_id,
  c.user_id,
  p.username,
  sum(ch.points)::int as total_points,
  max(c.created_at) as reached_at
from public.completions c
join public.challenges ch on ch.id = c.challenge_id
join public.profiles p on p.id = c.user_id
group by c.game_id, c.user_id, p.username;


-- ---------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.challenges enable row level security;
alter table public.completions enable row level security;

-- PROFILES: logged in users can read. Nobody can update via the API
-- (so nobody can make themselves admin). Make admins in the SQL Editor.
create policy "Logged in users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- GAMES
create policy "Logged in users can read games"
  on public.games for select
  to authenticated
  using (true);

create policy "Admins can create games"
  on public.games for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update games"
  on public.games for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete games"
  on public.games for delete
  to authenticated
  using (public.is_admin());

-- CHALLENGES
create policy "Logged in users can read challenges"
  on public.challenges for select
  to authenticated
  using (true);

create policy "Admins can create challenges"
  on public.challenges for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update challenges"
  on public.challenges for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete challenges"
  on public.challenges for delete
  to authenticated
  using (public.is_admin());

-- COMPLETIONS
create policy "Logged in users can read completions"
  on public.completions for select
  to authenticated
  using (true);

-- Only your own completion, the challenge must belong to the game,
-- and the game must be active.
create policy "Users can complete challenges in active games"
  on public.completions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.challenges ch
      join public.games g on g.id = ch.game_id
      where ch.id = challenge_id
        and ch.game_id = completions.game_id
        and g.status = 'active'
    )
  );

create policy "Users can undo their own completions in active games"
  on public.completions for delete
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.games g
      where g.id = game_id
        and g.status = 'active'
    )
  );

create policy "Admins can delete any completion"
  on public.completions for delete
  to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------
-- 5. REALTIME
-- completions: live leaderboard
-- games: players see live when a game is finished/reset
-- ---------------------------------------------------------

alter publication supabase_realtime add table public.completions;
alter publication supabase_realtime add table public.games;
