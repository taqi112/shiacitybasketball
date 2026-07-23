import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeason } from "@/lib/season";
import { formatTime } from "@/lib/datetime";
import type { Game } from "@/lib/types";

function GameRow({ game }: { game: Game }) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium">
        {new Date(`${game.date}T00:00:00`).toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </span>
      <span className="text-sm text-muted-foreground">
        {formatTime(game.start_time)}–{formatTime(game.end_time)} · {game.venue}
      </span>
    </li>
  );
}

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
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("season_id", season.id)
    .order("date", { ascending: true })
    .overrideTypes<Game[], { merge: false }>();

  const regularSeasonGames = (games ?? []).filter((g) => g.game_type === "regular_season");
  const playoffGames = (games ?? []).filter((g) => g.game_type === "playoff");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12">
      <h1 className="text-xl font-semibold">{season.name} Schedule</h1>
      <div>
        <h2 className="mb-2 font-medium">Regular Season</h2>
        <ul className="flex flex-col gap-2">
          {regularSeasonGames.map((game) => (
            <GameRow key={game.id} game={game} />
          ))}
          {!regularSeasonGames.length && (
            <li className="text-sm text-muted-foreground">No games scheduled yet.</li>
          )}
        </ul>
      </div>
      <div>
        <h2 className="mb-2 font-medium">Playoffs</h2>
        <ul className="flex flex-col gap-2">
          {playoffGames.map((game) => (
            <GameRow key={game.id} game={game} />
          ))}
          {!playoffGames.length && (
            <li className="text-sm text-muted-foreground">No games scheduled yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
