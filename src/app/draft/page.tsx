import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDraftSeason } from "@/lib/season";
import { DraftResults } from "@/components/draft/DraftResults";
import type { Team, DraftPick } from "@/lib/types";

export default async function DraftPage() {
  await requireUser();

  const draftSeason = await getDraftSeason();

  if (!draftSeason) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <h1 className="text-xl font-semibold">Draft</h1>
        <p className="text-sm text-muted-foreground">The draft hasn&apos;t started yet.</p>
      </div>
    );
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="text-xl font-semibold">{draftSeason.seasons?.name} Draft</h1>
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
    </div>
  );
}
