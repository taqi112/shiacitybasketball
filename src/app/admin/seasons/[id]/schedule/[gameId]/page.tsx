import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BoxScoreForm } from "./BoxScoreForm";
import type { Season, Game, Profile, SeasonRegistration, Team, GameStat } from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null; teams: Team | null };

export default async function AdminBoxScorePage({
  params,
}: PageProps<"/admin/seasons/[id]/schedule/[gameId]">) {
  const { id, gameId } = await params;
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .single<Season>();
  if (!season) notFound();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single<Game>();
  if (!game) notFound();

  const { data: registrants } = await supabase
    .from("season_registrations")
    .select("*, profiles(*), teams(*)")
    .eq("season_id", id)
    .order("registered_at", { ascending: true })
    .overrideTypes<RegistrantRow[], { merge: false }>();

  const { data: stats } = await supabase
    .from("game_stats")
    .select("*")
    .eq("game_id", gameId)
    .overrideTypes<GameStat[], { merge: false }>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {season.name} — Box Score —{" "}
        {new Date(`${game.date}T00:00:00`).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </h1>
      <BoxScoreForm
        seasonId={id}
        gameId={gameId}
        registrants={registrants ?? []}
        existingStats={stats ?? []}
      />
    </div>
  );
}
