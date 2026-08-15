import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentSeason } from "@/lib/season";
import type { PlayerCardProfile, PlayerCardRegistrant } from "@/components/PlayerProfileCard";
import type { LegacySeasonStat } from "@/lib/types";

export type PlayerPopupData = {
  registrant: PlayerCardRegistrant;
  legacyStats: LegacySeasonStat[];
  currentTeamName: string | null;
  isCaptain: boolean;
};

type CurrentRegistrationRow = {
  id: string;
  profile_id: string;
  jersey_number: number | null;
  captain_preference: string[] | null;
  availability_notes: string | null;
  is_captain: boolean;
  teams: { name: string } | null;
};

// Fetches everything the player-profile popup needs (photo, rank, current
// Season 4 team, captain status, and every legacy season on record) for a
// batch of profile ids in one round trip -- used by any page that lists
// player names (leaderboards, stats, previous seasons) so a click doesn't
// need its own request. Service-role client is required here: profiles and
// season_registrations only have "view your own row" RLS policies (see
// supabase/schema.sql), same reason /players and /draft use it -- a normal
// per-request client would only ever return the viewing user's own row.
export async function getPlayerPopupDataByProfileId(
  profileIds: string[],
): Promise<Record<string, PlayerPopupData>> {
  const uniqueIds = [...new Set(profileIds)];
  if (!uniqueIds.length) return {};

  const supabase = createServiceRoleClient();
  const season = await getCurrentSeason();

  const [{ data: profiles }, { data: registrations }, { data: legacyStats }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, photo_url, self_rank, height, age, position")
      .in("id", uniqueIds)
      .overrideTypes<PlayerCardProfile[], { merge: false }>(),
    season
      ? supabase
          .from("season_registrations")
          .select(
            "id, profile_id, jersey_number, captain_preference, availability_notes, is_captain, teams(name)",
          )
          .eq("season_id", season.id)
          .in("profile_id", uniqueIds)
          .overrideTypes<CurrentRegistrationRow[], { merge: false }>()
      : Promise.resolve({ data: [] as CurrentRegistrationRow[] }),
    supabase
      .from("legacy_season_stats")
      .select("*")
      .in("profile_id", uniqueIds)
      .order("season_label", { ascending: false })
      .overrideTypes<LegacySeasonStat[], { merge: false }>(),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const registrationByProfile = new Map((registrations ?? []).map((r) => [r.profile_id, r]));

  const legacyByProfile: Record<string, LegacySeasonStat[]> = {};
  for (const stat of legacyStats ?? []) {
    if (!stat.profile_id) continue;
    (legacyByProfile[stat.profile_id] ??= []).push(stat);
  }

  const result: Record<string, PlayerPopupData> = {};
  for (const profileId of uniqueIds) {
    const profile = profileById.get(profileId);
    if (!profile) continue;
    const reg = registrationByProfile.get(profileId);
    result[profileId] = {
      registrant: {
        id: reg?.id ?? profileId,
        jersey_number: reg?.jersey_number ?? null,
        captain_preference: reg?.captain_preference ?? null,
        availability_notes: reg?.availability_notes ?? null,
        profiles: profile,
      },
      legacyStats: legacyByProfile[profileId] ?? [],
      currentTeamName: reg?.teams?.name ?? null,
      isCaptain: reg?.is_captain ?? false,
    };
  }
  return result;
}
