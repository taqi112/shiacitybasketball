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
  -- self-assessed skill level: 1 = very beginner, 5 = advanced
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

-- Age is a personal attribute like height/position, not season-specific.
alter table public.profiles add column age int check (age > 0 and age <= 100);

-- These four are season-specific (different schedule/captains/fee each
-- season), so they live on season_registrations rather than profiles --
-- unlike self_rank/jersey_size/played_before, a returning player's answers
-- here shouldn't carry over from a prior season.
alter table public.season_registrations
  add column availability_notes text,
  add column captain_preference text[],
  add column waiver_consent boolean not null default false,
  add column payment_confirmed boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, email, phone, position, height,
    self_rank, jersey_size, played_before, age
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
    (new.raw_user_meta_data->>'played_before')::boolean,
    (new.raw_user_meta_data->>'age')::int
  );

  if (new.raw_user_meta_data->>'season_id') is not null then
    insert into public.season_registrations (
      season_id, profile_id, availability_notes, captain_preference,
      waiver_consent, payment_confirmed
    )
    values (
      (new.raw_user_meta_data->>'season_id')::uuid,
      new.id,
      new.raw_user_meta_data->>'availability_notes',
      case
        when new.raw_user_meta_data->'captain_preference' is not null
          then array(select jsonb_array_elements_text(new.raw_user_meta_data->'captain_preference'))
        else null
      end,
      coalesce((new.raw_user_meta_data->>'waiver_consent')::boolean, false),
      coalesce((new.raw_user_meta_data->>'payment_confirmed')::boolean, false)
    );
  end if;

  return new;
end;
$$;

-- payment_confirmed (above) is just the player's self-reported claim --
-- easy to lie about since payment is via Zelle with no API to verify
-- against. payment_verified is the admin's actual confirmation after
-- checking the real Zelle account, and is the real gate for the draft pool.
alter table public.season_registrations add column payment_verified boolean not null default false;

create policy "Admins can update registrations"
  on public.season_registrations for update
  using (public.is_admin());

-- "Users can update their own registration" (row-level, not column-level)
-- lets a player self-report jersey_number, which is the point -- but as
-- written it would also let them set is_captain/team_id on themselves via
-- a direct API call. Reverts those two fields to their prior value unless
-- the actor is an admin, same pattern as protect_is_admin.
create or replace function public.protect_registration_admin_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.is_captain is distinct from old.is_captain then
      new.is_captain := old.is_captain;
    end if;
    if new.team_id is distinct from old.team_id then
      new.team_id := old.team_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_registration_admin_fields_trigger
  before update on public.season_registrations
  for each row execute function public.protect_registration_admin_fields();

-- Avatars bucket: public read (served via getPublicUrl), writes restricted
-- to each user's own folder (path is always "<user id>/avatar", no file
-- extension, so re-uploads cleanly overwrite in place instead of piling up).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===================== Phase 2: captains & draft =====================

alter table public.teams add column draft_position int;

create unique index teams_season_draft_position_key
  on public.teams (season_id, draft_position)
  where draft_position is not null;

create policy "Admins can insert teams"
  on public.teams for insert
  with check (public.is_admin());

create policy "Admins can update teams"
  on public.teams for update
  using (public.is_admin());

-- One row per season. No write policies at all -- every write goes through
-- the admin-gated functions below, never a raw client .update().
create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade unique,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'complete')),
  current_pick_number int,
  current_team_id uuid references public.teams(id),
  total_picks int,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.drafts enable row level security;

create policy "Drafts are viewable by everyone"
  on public.drafts for select
  using (true);

-- Audit log of every pick, in order. player_name is denormalized (snapshot
-- at pick time) specifically so the public results page never needs to join
-- to profiles -- which non-admins can't read for other players -- to render
-- "Team X selected Player Y". Team name is NOT denormalized since `teams`
-- already has a public select policy.
create table public.draft_picks (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  pick_number int not null,
  round int not null,
  team_id uuid not null references public.teams(id),
  registration_id uuid not null references public.season_registrations(id),
  player_name text not null,
  picked_at timestamptz not null default now(),
  unique (season_id, pick_number),
  unique (season_id, registration_id)
);

alter table public.draft_picks enable row level security;

create policy "Draft picks are viewable by everyone"
  on public.draft_picks for select
  using (true);

-- One click, atomic: creates the team and auto-rosters the captain onto it,
-- so there's no window where one exists without the other.
create or replace function public.make_captain(
  p_registration_id uuid,
  p_team_name text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_registration record;
  v_team_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can designate captains.';
  end if;

  select sr.*, p.full_name into v_registration
  from public.season_registrations sr
  join public.profiles p on p.id = sr.profile_id
  where sr.id = p_registration_id
  for update of sr;

  if v_registration is null then
    raise exception 'Registration not found.';
  end if;
  if v_registration.is_captain then
    raise exception '% is already a captain.', v_registration.full_name;
  end if;

  insert into public.teams (season_id, name, captain_id)
  values (
    v_registration.season_id,
    coalesce(nullif(trim(p_team_name), ''), v_registration.full_name || '''s Team'),
    v_registration.profile_id
  )
  returning id into v_team_id;

  update public.season_registrations
  set is_captain = true, team_id = v_team_id
  where id = p_registration_id;

  return v_team_id;
end;
$$;

-- Reverts an accidental "Make Captain" click. Only safe to do while the team
-- is still empty and untouched by the draft -- otherwise deleting it would
-- orphan draft_picks rows and any other registration pointing at it, or
-- desync a draft already in progress (which assumes exactly 10 teams with
-- fixed draft_position slots).
create or replace function public.undo_make_captain(p_registration_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_registration record;
  v_team record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can undo a captain designation.';
  end if;

  select * into v_registration
  from public.season_registrations
  where id = p_registration_id
  for update;

  if v_registration is null then
    raise exception 'Registration not found.';
  end if;
  if not v_registration.is_captain or v_registration.team_id is null then
    raise exception 'That player is not currently a captain.';
  end if;

  select * into v_team from public.teams where id = v_registration.team_id for update;

  if v_team is null or v_team.captain_id <> v_registration.profile_id then
    raise exception 'That player is not the captain of their assigned team.';
  end if;

  if exists (
    select 1 from public.season_registrations
    where team_id = v_team.id and id <> p_registration_id
  ) then
    raise exception 'Cannot undo -- this team already has other players on it.';
  end if;

  if exists (select 1 from public.draft_picks where team_id = v_team.id) then
    raise exception 'Cannot undo -- picks have already been recorded for this team.';
  end if;

  update public.season_registrations
  set is_captain = false, team_id = null
  where id = p_registration_id;

  delete from public.teams where id = v_team.id;
end;
$$;

-- Randomizes round-1 order and opens pick #1. Requires exactly 10 teams
-- (the snake formula is written for exactly 10 slots); only warns (doesn't
-- block) if the eligible pool isn't a clean multiple of 10, so a slightly
-- off registration count doesn't block the whole event.
create or replace function public.start_draft(p_season_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_team_count int;
  v_pool_count int;
  v_first_team uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can start the draft.';
  end if;

  if exists (
    select 1 from public.drafts
    where season_id = p_season_id and status <> 'not_started'
  ) then
    raise exception 'Draft has already been started for this season.';
  end if;

  select count(*) into v_team_count from public.teams where season_id = p_season_id;
  if v_team_count <> 10 then
    raise exception 'Expected exactly 10 teams (captains) before starting, found %.', v_team_count;
  end if;

  select count(*) into v_pool_count
  from public.season_registrations
  where season_id = p_season_id
    and is_captain = false
    and payment_verified = true
    and team_id is null;

  if v_pool_count = 0 then
    raise exception 'No payment-verified, undrafted players found for this season.';
  end if;
  if v_pool_count % 10 <> 0 then
    raise warning
      'Pool of % players does not divide evenly across 10 teams -- some teams will end up with fewer picks.',
      v_pool_count;
  end if;

  with shuffled as (
    select id, row_number() over (order by random()) - 1 as pos
    from public.teams
    where season_id = p_season_id
  )
  update public.teams t
  set draft_position = shuffled.pos
  from shuffled
  where t.id = shuffled.id;

  select id into v_first_team
  from public.teams
  where season_id = p_season_id and draft_position = 0;

  insert into public.drafts (season_id, status, current_pick_number, current_team_id, total_picks, started_at)
  values (p_season_id, 'in_progress', 1, v_first_team, v_pool_count, now())
  on conflict (season_id) do update
  set status = 'in_progress',
      current_pick_number = 1,
      current_team_id = v_first_team,
      total_picks = v_pool_count,
      started_at = now(),
      completed_at = null;
end;
$$;

-- The only place a pick is ever recorded. Admin-gated (is_admin() check),
-- and since the caller IS the admin, the existing protect_registration_admin_fields
-- trigger's own is_admin() check already permits the team_id write below --
-- no special bypass needed (that trigger only blocks non-admin callers).
create or replace function public.record_draft_pick(p_season_id uuid, p_registration_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_draft record;
  v_target record;
  v_next_pick_number int;
  v_round int;
  v_index_in_round int;
  v_position int;
  v_next_team_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can record draft picks.';
  end if;

  select * into v_draft from public.drafts where season_id = p_season_id for update;
  if v_draft is null or v_draft.status <> 'in_progress' then
    raise exception 'Draft is not currently in progress.';
  end if;

  select sr.*, p.full_name into v_target
  from public.season_registrations sr
  join public.profiles p on p.id = sr.profile_id
  where sr.id = p_registration_id and sr.season_id = p_season_id
  for update of sr;

  if v_target is null then
    raise exception 'Player registration not found for this season.';
  end if;
  if v_target.is_captain then
    raise exception 'Captains cannot be drafted.';
  end if;
  if not v_target.payment_verified then
    raise exception 'That player is not payment-verified.';
  end if;
  if v_target.team_id is not null then
    raise exception 'That player has already been drafted.';
  end if;

  insert into public.draft_picks (season_id, pick_number, round, team_id, registration_id, player_name)
  values (
    p_season_id, v_draft.current_pick_number,
    ((v_draft.current_pick_number - 1) / 10) + 1,
    v_draft.current_team_id, p_registration_id, v_target.full_name
  );

  update public.season_registrations
  set team_id = v_draft.current_team_id
  where id = p_registration_id;

  v_next_pick_number := v_draft.current_pick_number + 1;

  if v_next_pick_number > v_draft.total_picks then
    update public.drafts
    set status = 'complete', current_pick_number = null, current_team_id = null, completed_at = now()
    where season_id = p_season_id;
    return;
  end if;

  v_round := ((v_next_pick_number - 1) / 10) + 1;
  v_index_in_round := (v_next_pick_number - 1) % 10;
  v_position := case when v_round % 2 = 1 then v_index_in_round else 9 - v_index_in_round end;

  select id into v_next_team_id
  from public.teams
  where season_id = p_season_id and draft_position = v_position;

  update public.drafts
  set current_pick_number = v_next_pick_number, current_team_id = v_next_team_id
  where season_id = p_season_id;
end;
$$;

-- Safety valve for a misclick during fast manual entry -- rewinds the draft
-- by exactly one pick (including re-opening a 'complete' draft if the last
-- pick was the final one).
create or replace function public.undo_last_draft_pick(p_season_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_last record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can undo picks.';
  end if;

  select * into v_last from public.draft_picks
  where season_id = p_season_id
  order by pick_number desc
  limit 1
  for update;

  if v_last is null then
    raise exception 'No picks to undo.';
  end if;

  update public.season_registrations set team_id = null where id = v_last.registration_id;
  delete from public.draft_picks where id = v_last.id;

  update public.drafts
  set status = 'in_progress',
      current_pick_number = v_last.pick_number,
      current_team_id = v_last.team_id,
      completed_at = null
  where season_id = p_season_id;
end;
$$;

alter publication supabase_realtime add table public.drafts;
alter publication supabase_realtime add table public.draft_picks;

-- Some players can play more than one position (e.g. PG/SG, PF/C) --
-- widened from a single text value to an array of up to 2. The USING clause
-- wraps any existing single value in a one-element array so no data is lost.
alter table public.profiles
  alter column position type text[]
  using case when position is null or position = '' then null else array[position] end;

alter table public.profiles
  add constraint profiles_position_max_two check (position is null or array_length(position, 1) <= 2);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, email, phone, position, height,
    self_rank, jersey_size, played_before, age
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    case
      when new.raw_user_meta_data->'position' is not null
        then array(select jsonb_array_elements_text(new.raw_user_meta_data->'position'))
      else null
    end,
    new.raw_user_meta_data->>'height',
    (new.raw_user_meta_data->>'self_rank')::int,
    new.raw_user_meta_data->>'jersey_size',
    (new.raw_user_meta_data->>'played_before')::boolean,
    (new.raw_user_meta_data->>'age')::int
  );

  if (new.raw_user_meta_data->>'season_id') is not null then
    insert into public.season_registrations (
      season_id, profile_id, availability_notes, captain_preference,
      waiver_consent, payment_confirmed
    )
    values (
      (new.raw_user_meta_data->>'season_id')::uuid,
      new.id,
      new.raw_user_meta_data->>'availability_notes',
      case
        when new.raw_user_meta_data->'captain_preference' is not null
          then array(select jsonb_array_elements_text(new.raw_user_meta_data->'captain_preference'))
        else null
      end,
      coalesce((new.raw_user_meta_data->>'waiver_consent')::boolean, false),
      coalesce((new.raw_user_meta_data->>'payment_confirmed')::boolean, false)
    );
  end if;

  return new;
end;
$$;

-- No admin UPDATE policy on profiles existed until now (only self-update +
-- admin select-all). Needed so admin can correct a player's self-reported
-- self_rank. Row-level like every other admin policy here -- doesn't grant
-- anything beyond what "Admins can update registrations"/"...teams"/"...seasons"
-- already establish as the pattern for this app.
create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

-- Games: a scheduled date/time/venue for a season. Deliberately no
-- home/away team columns yet -- matchups aren't decided until the draft
-- produces real teams, and building that assignment logic now would be
-- speculative. Add those columns (and a court label) via ALTER TABLE once
-- matchups are actually being scheduled.
create table public.games (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  venue text not null,
  game_type text not null default 'regular_season'
    check (game_type in ('regular_season', 'playoff')),
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "Games are viewable by everyone"
  on public.games for select
  using (true);

create policy "Admins can insert games"
  on public.games for insert
  with check (public.is_admin());

create policy "Admins can update games"
  on public.games for update
  using (public.is_admin());

create policy "Admins can delete games"
  on public.games for delete
  using (public.is_admin());

-- ===================== Phase 4: stats =====================

-- One row per player who actually played in a given game. Absence of a row
-- means they didn't play that game (not that they scored zero) -- this is
-- what makes "games played" for season averages just a row count.
create table public.game_stats (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  registration_id uuid not null references public.season_registrations(id) on delete cascade,
  points int not null default 0,
  rebounds int not null default 0,
  blocks int not null default 0,
  steals int not null default 0,
  three_pm int not null default 0,
  created_at timestamptz not null default now(),
  unique (game_id, registration_id)
);

alter table public.game_stats enable row level security;

create policy "Game stats are viewable by everyone"
  on public.game_stats for select
  using (true);

create policy "Admins can insert game stats"
  on public.game_stats for insert
  with check (public.is_admin());

create policy "Admins can update game stats"
  on public.game_stats for update
  using (public.is_admin());

create policy "Admins can delete game stats"
  on public.game_stats for delete
  using (public.is_admin());

-- Read-only reference data imported once from a past season's spreadsheet.
-- Deliberately not linked to profiles/teams -- these seasons predate the
-- site and most of these players never made accounts here.
create table public.legacy_season_stats (
  id uuid primary key default gen_random_uuid(),
  season_label text not null,
  team_name text not null,
  player_name text not null,
  games_played numeric not null,
  points numeric not null,
  rebounds numeric not null,
  blocks numeric not null,
  steals numeric not null,
  three_pm numeric not null,
  created_at timestamptz not null default now()
);

alter table public.legacy_season_stats enable row level security;

create policy "Legacy stats are viewable by everyone"
  on public.legacy_season_stats for select
  using (true);

-- Nullable -- not every imported season's spreadsheet tracked fouls
-- (Season 3's didn't; Season 2's does).
alter table public.legacy_season_stats add column fouls numeric;

-- Tracks the remaining $140 (of the season's $180 total) paid in cash
-- during the first week, separate from payment_verified (the $40 deposit
-- that gates a spot in the draft pool -- see start_draft/record_draft_pick).
alter table public.season_registrations
  add column full_payment_verified boolean not null default false;

-- Nullable link from a legacy stat row to a real profile, for players who
-- signed up on the site and also played in an imported historical season.
-- Auto-matched by exact name on signup (see the trigger below) -- a
-- mismatch (nickname, old team sheet using a different name) still needs a
-- one-off manual UPDATE, since name matching alone can't catch that.
alter table public.legacy_season_stats
  add column profile_id uuid references public.profiles(id) on delete set null;

-- Runs once per new signup rather than matching at query time, so a legacy
-- row someone manually linked (e.g. a name-mismatch case) is never
-- overwritten and every profile only gets checked once.
create or replace function public.link_legacy_stats_on_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.legacy_season_stats
  set profile_id = new.id
  where profile_id is null
    and lower(trim(player_name)) = lower(trim(new.full_name));
  return new;
end;
$$;

create trigger link_legacy_stats_on_signup_trigger
  after insert on public.profiles
  for each row execute function public.link_legacy_stats_on_signup();

-- Self rank is now admin-only (players used to self-report it at signup and
-- edit it on their profile). The app UI no longer offers a way to change
-- it, but "Users can update their own profile" is row-level, not
-- column-level, so without this a player could still PATCH self_rank
-- directly via the API. Same pattern as protect_is_admin.
create or replace function public.protect_self_rank()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.self_rank is distinct from old.self_rank
     and auth.uid() is not null
     and not public.is_admin() then
    new.self_rank := old.self_rank;
  end if;
  return new;
end;
$$;

create trigger protect_self_rank_trigger
  before update on public.profiles
  for each row execute function public.protect_self_rank();

-- Nullable -- the draft has now happened so real matchups can be scheduled,
-- but playoff games still won't have a matchup (or court) until seeding is
-- decided by regular-season standings.
alter table public.games add column court text;
alter table public.games add column home_team_id uuid references public.teams(id);
alter table public.games add column away_team_id uuid references public.teams(id);
