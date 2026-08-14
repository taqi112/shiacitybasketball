import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeason } from "@/lib/season";
import { formatTime } from "@/lib/datetime";
import { buildTeamColorMap } from "@/lib/teamColors";
import { ScheduleGameList } from "@/components/schedule/ScheduleGameList";
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

  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("season_id", season.id)
    .order("date", { ascending: true })
    .overrideTypes<Game[], { merge: false }>();

  const teamColorMap = buildTeamColorMap((teams ?? []).map((t) => t.id));
  const teamMeta: Record<string, { name: string; bg: string; text: string; hex: string }> = {};
  for (const team of teams ?? []) {
    const color = teamColorMap.get(team.id);
    if (color) {
      teamMeta[team.id] = { name: team.name, bg: color.bg, text: color.text, hex: color.hex };
    }
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
