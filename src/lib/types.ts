// Hand-written to match supabase/schema.sql — no Supabase CLI/codegen is
// set up in this project yet, so these aren't auto-generated.

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string[] | null;
  height: string | null;
  photo_url: string | null;
  self_rank: number | null;
  jersey_size: string | null;
  played_before: boolean | null;
  age: number | null;
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
  availability_notes: string | null;
  captain_preference: string[] | null;
  waiver_consent: boolean;
  payment_confirmed: boolean;
  payment_verified: boolean;
  full_payment_verified: boolean;
  registered_at: string;
}

export interface Team {
  id: string;
  season_id: string;
  name: string;
  captain_id: string | null;
  draft_position: number | null;
  created_at: string;
}

export interface Draft {
  id: string;
  season_id: string;
  status: "not_started" | "in_progress" | "complete";
  current_pick_number: number | null;
  current_team_id: string | null;
  total_picks: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface DraftPick {
  id: string;
  season_id: string;
  pick_number: number;
  round: number;
  team_id: string;
  registration_id: string;
  player_name: string;
  picked_at: string;
}

export interface Game {
  id: string;
  season_id: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  court: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  game_type: "regular_season" | "playoff";
  created_at: string;
}

export interface GameStat {
  id: string;
  season_id: string;
  game_id: string;
  registration_id: string;
  points: number;
  rebounds: number;
  blocks: number;
  steals: number;
  three_pm: number;
  created_at: string;
}

export interface LegacySeasonStat {
  id: string;
  season_label: string;
  team_name: string;
  player_name: string;
  profile_id: string | null;
  games_played: number;
  points: number;
  rebounds: number;
  blocks: number;
  steals: number;
  three_pm: number;
  fouls: number | null;
  created_at: string;
}

export interface SeasonAward {
  id: string;
  season_id: string;
  award_name: string;
  profile_id: string | null;
  recipient_name: string | null;
  sort_order: number;
  created_at: string;
}
