import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getRegistrationCount = cache(async (seasonId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("season_registration_count", {
    p_season_id: seasonId,
  });
  return data ?? 0;
});

// Returns the season currently open for signup, or null if none is open
// or the open season has already hit its max_players cap.
export const getOpenSeason = cache(async () => {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .lte("registration_opens_at", now)
    .or(`registration_closes_at.is.null,registration_closes_at.gte.${now}`)
    .order("registration_opens_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!season) return null;

  if (season.max_players != null) {
    const count = await getRegistrationCount(season.id);
    if (count >= season.max_players) return null;
  }

  return season;
});

// The next season whose registration window hasn't opened yet, if any.
export const getNextSeason = cache(async () => {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("seasons")
    .select("*")
    .gt("registration_opens_at", now)
    .order("registration_opens_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
});

// The most recently created season -- used by pages (schedule, standings,
// etc.) that show "the current season" without needing a season id in the
// URL, since this league only ever runs one season at a time.
export const getCurrentSeason = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
});

// The most recently started/created draft (with its season nested), so
// /draft and other draft-related views don't need a season id in the URL
// for the common case of "there's one active season". Returns null if no
// draft has ever been started.
export const getDraftSeason = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("drafts")
    .select("*, seasons(*)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
});
