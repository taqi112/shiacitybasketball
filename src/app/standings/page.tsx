import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeason } from "@/lib/season";
import { buildTeamColorsById, primaryHex } from "@/lib/teamColors";
import { StatsStandingsSubNav } from "@/components/StatsStandingsSubNav";
import type { Team, Game } from "@/lib/types";

const WIN_COLOR = "#4ade80";
const LOSS_COLOR = "#f87171";
const MEDALS = ["🥇", "🥈", "🥉"];

type TeamStanding = {
  team: Team;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
};

function formatWinPct(pct: number): string {
  return pct.toFixed(3).replace(/^0\./, ".");
}

export default async function StandingsPage() {
  await requireUser();

  const season = await getCurrentSeason();
  if (!season) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <StatsStandingsSubNav active="standings" />
        <h1 className="text-xl font-semibold">Standings</h1>
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

  // Standings only ever count regular-season games -- they determine
  // playoff seeding, not the other way around.
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("season_id", season.id)
    .eq("game_type", "regular_season")
    .not("home_score", "is", null)
    .not("away_score", "is", null)
    .overrideTypes<Game[], { merge: false }>();

  const teamColorsById = buildTeamColorsById(teams ?? []);

  const standingsByTeam = new Map<string, TeamStanding>();
  for (const team of teams ?? []) {
    standingsByTeam.set(team.id, { team, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
  }

  for (const game of games ?? []) {
    if (!game.home_team_id || !game.away_team_id) continue;
    const home = standingsByTeam.get(game.home_team_id);
    const away = standingsByTeam.get(game.away_team_id);
    if (!home || !away) continue;

    home.pointsFor += game.home_score!;
    home.pointsAgainst += game.away_score!;
    away.pointsFor += game.away_score!;
    away.pointsAgainst += game.home_score!;

    if (game.home_score! > game.away_score!) {
      home.wins++;
      away.losses++;
    } else if (game.away_score! > game.home_score!) {
      away.wins++;
      home.losses++;
    }
  }

  // Sort by win% desc, then point differential desc (the explicit seeding
  // tiebreaker), then total points scored as a further tiebreak.
  const standings = [...standingsByTeam.values()].sort((a, b) => {
    const playedA = a.wins + a.losses;
    const playedB = b.wins + b.losses;
    const winPctA = playedA > 0 ? a.wins / playedA : 0;
    const winPctB = playedB > 0 ? b.wins / playedB : 0;
    if (winPctA !== winPctB) return winPctB - winPctA;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffA !== diffB) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <StatsStandingsSubNav active="standings" />
      <div>
        <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">
          {season.name} Standings
        </h1>
        <p className="text-sm text-muted-foreground">
          Seeded by win percentage, then point differential
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-14" />
            <col />
            <col className="w-12" />
            <col className="w-12" />
            <col className="w-28" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-16" />
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-2 text-center text-xs font-bold tracking-wide text-muted-foreground uppercase">
                #
              </th>
              <th className="px-4 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Team
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold tracking-wide text-muted-foreground uppercase">
                W
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold tracking-wide text-muted-foreground uppercase">
                L
              </th>
              <th className="px-4 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Win%
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Total Points
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Points Allowed
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Diff
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const played = s.wins + s.losses;
              const winPct = played > 0 ? s.wins / played : 0;
              const diff = s.pointsFor - s.pointsAgainst;
              const colors = teamColorsById.get(s.team.id) ?? [];
              const dotColor = colors.length ? primaryHex(colors) : "#71717a";
              return (
                <tr
                  key={s.team.id}
                  className={i % 2 === 1 ? "border-b border-border bg-white/[0.03]" : "border-b border-border"}
                >
                  <td className="px-2 py-2 text-center text-base text-white/70">
                    {i < MEDALS.length ? MEDALS[i] : i + 1}
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2 font-bold tracking-wide text-white uppercase">
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ background: dotColor }}
                      />
                      {s.team.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-white">{s.wins}</td>
                  <td className="px-4 py-2 text-center text-white">{s.losses}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-white">
                        {played > 0 ? formatWinPct(winPct) : "—"}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${Math.round(winPct * 100)}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center text-white/90">{s.pointsFor}</td>
                  <td className="px-4 py-2 text-center text-white/90">{s.pointsAgainst}</td>
                  <td
                    className="px-4 py-2 text-center font-mono font-semibold"
                    style={{ color: diff === 0 ? "#fff" : diff > 0 ? WIN_COLOR : LOSS_COLOR }}
                  >
                    {diff > 0 ? "+" : ""}
                    {diff}
                  </td>
                </tr>
              );
            })}
            {!standings.length && (
              <tr>
                <td className="px-4 py-2 text-muted-foreground" colSpan={8}>
                  No teams yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
