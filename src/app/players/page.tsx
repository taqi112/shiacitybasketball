import { requireUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentSeason } from "@/lib/season";
import { PlayerGrid } from "@/components/PlayerGrid";
import type { PlayerCardRegistrant } from "@/components/PlayerProfileCard";
import type { LegacySeasonStat } from "@/lib/types";

export default async function PlayersPage() {
  await requireUser();

  const season = await getCurrentSeason();
  if (!season) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12">
        <h1 className="text-xl font-semibold">Player Profiles</h1>
        <p className="text-sm text-muted-foreground">No season has been set up yet.</p>
      </div>
    );
  }

  // Same RLS gap as the draft pool (see src/app/draft/page.tsx) -- regular
  // users can't read other players' season_registrations/profiles rows, so
  // this reads via the service-role client with the same deliberately
  // narrow select (no email/phone/payment fields ever fetched).
  const supabase = createServiceRoleClient();

  const { data: registrants } = await supabase
    .from("season_registrations")
    .select(
      "id, jersey_number, captain_preference, availability_notes, profiles(id, full_name, photo_url, self_rank, height, age, position)",
    )
    .eq("season_id", season.id)
    .order("registered_at", { ascending: true })
    .overrideTypes<PlayerCardRegistrant[], { merge: false }>();

  const players = registrants ?? [];
  const profileIds = players
    .map((r) => r.profiles?.id)
    .filter((id): id is string => Boolean(id));

  const { data: legacyStats } = profileIds.length
    ? await supabase
        .from("legacy_season_stats")
        .select("*")
        .in("profile_id", profileIds)
        .order("season_label", { ascending: false })
        .overrideTypes<LegacySeasonStat[], { merge: false }>()
    : { data: [] as LegacySeasonStat[] };

  const legacyByProfile: Record<string, LegacySeasonStat[]> = {};
  for (const stat of legacyStats ?? []) {
    if (!stat.profile_id) continue;
    (legacyByProfile[stat.profile_id] ??= []).push(stat);
  }

  const sorted = [...players].sort((a, b) => {
    const rankA = a.profiles?.self_rank ?? -1;
    const rankB = b.profiles?.self_rank ?? -1;
    if (rankA !== rankB) return rankB - rankA;
    return (a.profiles?.full_name ?? "").localeCompare(b.profiles?.full_name ?? "");
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12">
      <h1 className="text-xl font-semibold">Player Profiles</h1>
      <PlayerGrid registrants={sorted} legacyStatsByProfile={legacyByProfile} />
    </div>
  );
}
