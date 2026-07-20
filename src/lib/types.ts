// Hand-written to match supabase/schema.sql — no Supabase CLI/codegen is
// set up in this project yet, so these aren't auto-generated.

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  height: string | null;
  photo_url: string | null;
  self_rank: number | null;
  jersey_size: string | null;
  played_before: boolean | null;
  is_admin: boolean;
  created_at: string;
}

export interface Season {
  id: string;
  name: string;
  registration_opens_at: string;
  registration_closes_at: string | null;
  max_players: number | null;
  created_at: string;
}

export interface SeasonRegistration {
  id: string;
  season_id: string;
  profile_id: string;
  team_id: string | null;
  jersey_number: number | null;
  is_captain: boolean;
  registered_at: string;
}
