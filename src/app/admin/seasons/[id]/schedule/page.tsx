import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateGameForm } from "./CreateGameForm";
import { GameScoreInputs } from "./GameScoreInputs";
import { deleteGame } from "./actions";
import { formatTime } from "@/lib/datetime";
import type { Season, Game, Team } from "@/lib/types";

export default async function AdminSchedulePage({
  params,
}: PageProps<"/admin/seasons/[id]/schedule">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .single<Season>();

  if (!season) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("season_id", id)
    .order("draft_position", { ascending: true, nullsFirst: false })
    .overrideTypes<Team[], { merge: false }>();

  // Multiple games share the same date, and Postgres doesn't guarantee a
  // stable order for ties on a single sort column -- without a fully
  // deterministic sort, same-date rows could come back in a different order
  // on every request (e.g. right after saving a score triggers a refetch),
  // making rows appear to randomly reorder.
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("season_id", id)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("court", { ascending: true, nullsFirst: true })
    .order("id", { ascending: true })
    .overrideTypes<Game[], { merge: false }>();

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">{season.name} — Schedule</h1>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Venue</th>
              <th className="px-4 py-2">Court</th>
              <th className="px-4 py-2">Matchup</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {games?.map((game) => (
              <tr key={game.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 whitespace-nowrap">
                  {new Date(`${game.date}T00:00:00`).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatTime(game.start_time)}–{formatTime(game.end_time)}
                </td>
                <td className="px-4 py-2">{game.venue}</td>
                <td className="px-4 py-2">{game.court ?? "—"}</td>
                <td className="px-4 py-2">
                  {game.home_team_id || game.away_team_id
                    ? `${game.home_team_id ? (teamNameById.get(game.home_team_id) ?? "—") : "TBD"} vs ${game.away_team_id ? (teamNameById.get(game.away_team_id) ?? "—") : "TBD"}`
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {game.home_team_id && game.away_team_id ? (
                    <GameScoreInputs
                      gameId={game.id}
                      seasonId={id}
                      homeScore={game.home_score}
                      awayScore={game.away_score}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  {game.game_type === "playoff" ? "Playoff" : "Regular Season"}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/seasons/${id}/schedule/${game.id}`}
                    className="rounded-md border border-border px-3 py-1 text-xs font-medium"
                  >
                    Box Score
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <form action={deleteGame}>
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="seasonId" value={id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!games?.length && (
              <tr>
                <td className="px-4 py-2 text-muted-foreground" colSpan={9}>
                  No games scheduled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CreateGameForm seasonId={id} teams={teams ?? []} />
    </div>
  );
}
