import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeason } from "@/lib/season";
import { formatTime } from "@/lib/datetime";
import { ScheduleGameList } from "@/components/schedule/ScheduleGameList";
import { buildTeamColorsById, type ColorBand } from "@/lib/teamColors";
import type { Game, Team } from "@/lib/types";

const PLAYOFF_LABELS = ["Round 1", "Semifinals", "Championship"];

export default async function SchedulePage() {
  await requireUser();

  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <h1 className="text-xl font-semibold">Schedule</h1>
        <p className="text-sm text-muted-foreground">No season has been set up yet.</p>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("season_id", season.id)
    .order("draft_position", { ascending: true, nullsFirst: false })
    .overrideTypes<Team[], { merge: false }>();

  // Deterministic tiebreakers -- see the same note in the admin schedule
  // page -- without them, same-date rows can silently reorder between
  // requests.
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("season_id", season.id)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .order("court", { ascending: true, nullsFirst: true })
    .order("id", { ascending: true })
    .overrideTypes<Game[], { merge: false }>();

  const teamColorsById = buildTeamColorsById(teams ?? []);
  const teamMeta: Record<string, { name: string; colors: ColorBand[] }> = {};
  for (const team of teams ?? []) {
    teamMeta[team.id] = { name: team.name, colors: teamColorsById.get(team.id) ?? [] };
  }

  const regularSeasonGames = (games ?? []).filter((g) => g.game_type === "regular_season");
  const playoffGames = (games ?? []).filter((g) => g.game_type === "playoff");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">
          {season.name} Schedule
        </h1>
        <p className="text-sm text-muted-foreground">Regular season matchups &amp; playoffs</p>
      </div>

      <div>
        <h2 className="mb-3 font-medium">Regular Season</h2>
        {regularSeasonGames.length ? (
          <ScheduleGameList games={regularSeasonGames} teamMeta={teamMeta} />
        ) : (
          <p className="text-sm text-muted-foreground">No games scheduled yet.</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg tracking-wide text-accent uppercase">
          Postseason &amp; Playoff Roadmap
        </h2>
        {playoffGames.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {playoffGames.map((game, i) => (
              <div key={game.id} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {PLAYOFF_LABELS[i] ?? `Round ${i + 1}`}
                </p>
                <p className="mt-1 font-display text-lg text-foreground">
                  {new Date(`${game.date}T00:00:00`).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-sm text-accent">
                  {formatTime(game.start_time)} – {formatTime(game.end_time)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No playoff dates scheduled yet.</p>
        )}
      </div>
    </div>
  );
}
