import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeason, getDraftSeason } from "@/lib/season";
import { DraftResults } from "@/components/draft/DraftResults";
import { DraftPool } from "./DraftPool";
import type {
  Team,
  DraftPick,
  Profile,
  SeasonRegistration,
  LegacySeasonStat,
} from "@/lib/types";

type PoolRegistrant = SeasonRegistration & { profiles: Profile | null };

async function renderPool() {
  const season = await getCurrentSeason();
  if (!season) {
    return <p className="text-sm text-muted-foreground">No season has been set up yet.</p>;
  }

  const supabase = await createClient();

  const { data: registrants } = await supabase
    .from("season_registrations")
    .select("*, profiles(*)")
    .eq("season_id", season.id)
    .eq("is_captain", false)
    .eq("payment_verified", true)
    .is("team_id", null)
    .order("registered_at", { ascending: true })
    .overrideTypes<PoolRegistrant[], { merge: false }>();

  const pool = registrants ?? [];
  const profileIds = pool
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

  const sorted = [...pool].sort((a, b) => {
    const rankA = a.profiles?.self_rank ?? -1;
    const rankB = b.profiles?.self_rank ?? -1;
    if (rankA !== rankB) return rankB - rankA;
    return (a.profiles?.full_name ?? "").localeCompare(b.profiles?.full_name ?? "");
  });

  return <DraftPool registrants={sorted} legacyStatsByProfile={legacyByProfile} />;
}

async function renderResults(draftSeason: Awaited<ReturnType<typeof getDraftSeason>>) {
  if (!draftSeason) {
    return <p className="text-sm text-muted-foreground">The draft hasn&apos;t started yet.</p>;
  }

  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("season_id", draftSeason.season_id)
    .order("draft_position", { ascending: true, nullsFirst: false })
    .overrideTypes<Team[], { merge: false }>();

  const { data: picks } = await supabase
    .from("draft_picks")
    .select("*")
    .eq("season_id", draftSeason.season_id)
    .order("pick_number", { ascending: true })
    .overrideTypes<DraftPick[], { merge: false }>();

  return (
    <DraftResults
      seasonId={draftSeason.season_id}
      initialDraft={{
        status: draftSeason.status,
        current_pick_number: draftSeason.current_pick_number,
        current_team_id: draftSeason.current_team_id,
        total_picks: draftSeason.total_picks,
      }}
      teams={teams ?? []}
      initialPicks={picks ?? []}
    />
  );
}

export default async function DraftPage({ searchParams }: PageProps<"/draft">) {
  await requireUser();
  const params = await searchParams;
  const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;

  const draftSeason = await getDraftSeason();
  const view = viewParam === "results" ? "results" : "pool";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12">
      <h1 className="text-xl font-semibold">Draft</h1>
      <div className="flex gap-2 border-b border-border pb-4">
        <Link
          href="/draft?view=pool"
          className={
            view === "pool"
              ? "rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white"
              : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
          }
        >
          Draft Pool
        </Link>
        <Link
          href="/draft?view=results"
          className={
            view === "results"
              ? "rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white"
              : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
          }
        >
          Draft Results
        </Link>
      </div>

      {view === "pool" ? await renderPool() : await renderResults(draftSeason)}
    </div>
  );
}
