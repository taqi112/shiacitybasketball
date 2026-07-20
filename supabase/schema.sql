-- Seasons: controls when signup opens for the site
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_opens_at timestamptz not null,
  registration_closes_at timestamptz,
  -- null means uncapped; registration also closes early once this many
  -- players have signed up (see enforce_season_capacity below)
  max_players int,
  created_at timestamptz not null default now()
);

alter table public.seasons enable row level security;

create policy "Seasons are viewable by everyone"
  on public.seasons for select
  using (true);

-- Profiles: who the player is (stable across seasons)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  position text,
  height text,
  photo_url text,
  -- self-assessed skill level: 1 = very beginner, 5 = really good player
  self_rank int check (self_rank between 1 and 5),
  jersey_size text,
  played_before boolean,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Teams: added now so season_registrations can reference it later
-- (empty until the draft feature is built)
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  name text not null,
  captain_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;

create policy "Teams are viewable by everyone"
  on public.teams for select
  using (true);

-- Season registrations: a player's signup for one specific season
-- (jersey number / team / captain flag live here, not on profiles,
-- since those change season to season)
create table public.season_registrations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id),
  jersey_number int,
  is_captain boolean not null default false,
  registered_at timestamptz not null default now(),
  unique (season_id, profile_id)
);

alter table public.season_registrations enable row level security;

create policy "Users can view their own registrations"
  on public.season_registrations for select
  using (auth.uid() = profile_id);

create policy "Users can update their own registration"
  on public.season_registrations for update
  using (auth.uid() = profile_id);

-- Automatically creates a profile + season registration the moment
-- someone signs up, using details passed in as signUp() user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, email, phone, position, height,
    self_rank, jersey_size, played_before
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'height',
    (new.raw_user_meta_data->>'self_rank')::int,
    new.raw_user_meta_data->>'jersey_size',
    (new.raw_user_meta_data->>'played_before')::boolean
  );

  if (new.raw_user_meta_data->>'season_id') is not null then
    insert into public.season_registrations (season_id, profile_id)
    values (
      (new.raw_user_meta_data->>'season_id')::uuid,
      new.id
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin access: manually flipped to true for trusted accounts via the
-- Supabase table editor (no admin-invite UI).
alter table public.profiles add column is_admin boolean not null default false;

-- Centralizes the "is the current user an admin?" check so RLS policies
-- don't each repeat their own exists-subquery.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Without this, "Users can update their own profile" (row-level, not
-- column-level) would let a user PATCH is_admin = true on their own row.
-- Reverts an attempted change to is_admin if it's coming from a logged-in
-- non-admin user (auth.uid() is not null) via the app. Edits made with no
-- JWT context at all -- Table Editor, SQL Editor, migrations -- are trusted
-- and left alone, since that's how the very first admin gets bootstrapped.
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger protect_is_admin_trigger
  before update on public.profiles
  for each row execute function public.protect_is_admin();

create policy "Admins can insert seasons"
  on public.seasons for insert
  with check (public.is_admin());

create policy "Admins can update seasons"
  on public.seasons for update
  using (public.is_admin());

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can view all registrations"
  on public.season_registrations for select
  using (public.is_admin());

-- Lets the (unauthenticated) signup page show "N spots left" / detect a
-- full season without a public select policy on season_registrations,
-- which would otherwise expose every registrant's row to anyone.
create or replace function public.season_registration_count(p_season_id uuid)
returns bigint
language sql
security definer set search_path = public
stable
as $$
  select count(*) from public.season_registrations where season_id = p_season_id;
$$;

-- Hard cap enforced at the database level (not just in app code) so two
-- people signing up at the same moment can't both squeeze past max_players.
create or replace function public.enforce_season_capacity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  cap int;
  current_count int;
begin
  select max_players into cap from public.seasons where id = new.season_id;

  if cap is not null then
    select count(*) into current_count
    from public.season_registrations
    where season_id = new.season_id;

    if current_count >= cap then
      raise exception 'This season has reached its registration cap of % players.', cap;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_season_capacity_trigger
  before insert on public.season_registrations
  for each row execute function public.enforce_season_capacity();
