import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DraftAdminPanel } from "./DraftAdminPanel";
import type { Season, Team, Draft, DraftPick, Profile, SeasonRegistration } from "@/lib/types";

type TeamWithCaptain = Team & { profiles: Profile | null };
type PoolRegistrant = SeasonRegistration & { profiles: Profile | null };

export default async function AdminDraftPage({
  params,
}: PageProps<"/admin/seasons/[id]/draft">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .single<Season>();

  if (!season) notFound();

  const { data: draft } = await supabase
    .from("drafts")
    .select("*")
    .eq("season_id", id)
    .maybeSingle<Draft>();

  const { data: teams } = await supabase
    .from("teams")
    .select("*, profiles(*)")
    .eq("season_id", id)
    .order("draft_position", { ascending: true, nullsFirst: false })
    .overrideTypes<TeamWithCaptain[], { merge: false }>();

  const { count: verifiedPoolCount } = await supabase
    .from("season_registrations")
    .select("*", { count: "exact", head: true })
    .eq("season_id", id)
    .eq("is_captain", false)
    .eq("payment_verified", true)
    .is("team_id", null);

  const { data: pool } = await supabase
    .from("season_registrations")
    .select("*, profiles(*)")
    .eq("season_id", id)
    .eq("is_captain", false)
    .eq("payment_verified", true)
    .is("team_id", null)
    .overrideTypes<PoolRegistrant[], { merge: false }>();

  const { data: picks } = await supabase
    .from("draft_picks")
    .select("*")
    .eq("season_id", id)
    .order("pick_number", { ascending: false })
    .overrideTypes<DraftPick[], { merge: false }>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{season.name} — Draft Room</h1>
      <DraftAdminPanel
        seasonId={id}
        draft={draft}
        teams={teams ?? []}
        captainCount={teams?.length ?? 0}
        verifiedPoolCount={verifiedPoolCount ?? 0}
        pool={pool ?? []}
        recentPicks={picks ?? []}
      />
    </div>
  );
}
