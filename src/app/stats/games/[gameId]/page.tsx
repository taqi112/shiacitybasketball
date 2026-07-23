import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/datetime";
import type { Game, GameStat, SeasonRegistration, Profile, Team } from "@/lib/types";

type StatRow = GameStat & {
  season_registrations: (SeasonRegistration & { profiles: Profile | null; teams: Team | null }) | null;
};

export default async function GameBoxScorePage({
  params,
}: PageProps<"/stats/games/[gameId]">) {
  await requireUser();
  const { gameId } = await params;

  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single<Game>();
  if (!game) notFound();

  const { data: stats } = await supabase
    .from("game_stats")
    .select("*, season_registrations(*, profiles(*), teams(*))")
    .eq("game_id", gameId)
    .overrideTypes<StatRow[], { merge: false }>();

  const groups = new Map<string, StatRow[]>();
  for (const stat of stats ?? []) {
    const teamName = stat.season_registrations?.teams?.name ?? "Unassigned";
    const list = groups.get(teamName) ?? [];
    list.push(stat);
    groups.set(teamName, list);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <Link href="/stats" className="text-sm text-muted-foreground underline">
          ← Back to Stats
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          Box Score —{" "}
          {new Date(`${game.date}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatTime(game.start_time)}–{formatTime(game.end_time)} · {game.venue}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {[...groups.entries()].map(([teamName, rows]) => (
          <div key={teamName} className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2">{teamName}</th>
                  <th className="px-4 py-2">PTS</th>
                  <th className="px-4 py-2">REB</th>
                  <th className="px-4 py-2">BLK</th>
                  <th className="px-4 py-2">STL</th>
                  <th className="px-4 py-2">3PM</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((stat) => (
                  <tr key={stat.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      {stat.season_registrations?.profiles?.full_name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-2">{stat.points}</td>
                    <td className="px-4 py-2">{stat.rebounds}</td>
                    <td className="px-4 py-2">{stat.blocks}</td>
                    <td className="px-4 py-2">{stat.steals}</td>
                    <td className="px-4 py-2">{stat.three_pm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {!stats?.length && (
          <p className="text-sm text-muted-foreground">No box score entered for this game yet.</p>
        )}
      </div>
    </div>
  );
}
