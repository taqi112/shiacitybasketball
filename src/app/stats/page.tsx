import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentSeason } from "@/lib/season";
import { average } from "@/lib/stats";
import { getPlayerPopupDataByProfileId } from "@/lib/playerPopup";
import { buildTeamColorsById, teamGradient, TEAM_TEXT_SHADOW } from "@/lib/teamColors";
import { StatsStandingsSubNav } from "@/components/StatsStandingsSubNav";
import { PlayerNameLink } from "@/components/PlayerNameLink";
import type { Game, Profile, SeasonRegistration, Team, GameStat } from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null; teams: Team | null };

async function LiveSeasonStats({ seasonId }: { seasonId: string }) {
  // Service-role client -- season_registrations/profiles only have "view
  // your own row" RLS policies (see supabase/schema.sql), so a normal
  // per-request client would silently only return the viewing user's own
  // registration instead of the whole league. Same reasoning as /players
  // and /draft. games/game_stats are publicly readable either way.
  const supabase = createServiceRoleClient();

  const [{ data: registrants }, { data: gameStats }, { data: games }] = await Promise.all([
    supabase
      .from("season_registrations")
      .select("*, profiles(*), teams(*)")
      .eq("season_id", seasonId)
      .overrideTypes<RegistrantRow[], { merge: false }>(),
    supabase
      .from("game_stats")
      .select("*")
      .eq("season_id", seasonId)
      .overrideTypes<GameStat[], { merge: false }>(),
    supabase
      .from("games")
      .select("*")
      .eq("season_id", seasonId)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .order("id", { ascending: true })
      .overrideTypes<Game[], { merge: false }>(),
  ]);

  const popupDataByProfile = await getPlayerPopupDataByProfileId(
    (registrants ?? []).map((r) => r.profile_id),
  );

  const statsByRegistration = new Map<string, GameStat[]>();
  for (const stat of gameStats ?? []) {
    const list = statsByRegistration.get(stat.registration_id) ?? [];
    list.push(stat);
    statsByRegistration.set(stat.registration_id, list);
  }

  const groups = new Map<string, { team: Team | null; registrants: RegistrantRow[] }>();
  for (const r of registrants ?? []) {
    const teamName = r.teams?.name ?? "Unassigned";
    const group = groups.get(teamName) ?? { team: r.teams, registrants: [] };
    group.registrants.push(r);
    groups.set(teamName, group);
  }

  const uniqueTeams = [...groups.values()]
    .map((g) => g.team)
    .filter((t): t is Team => t != null);
  const teamColorsById = buildTeamColorsById(uniqueTeams);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        {[...groups.entries()].map(([teamName, { team, registrants: teamRegistrants }]) => {
          const colors = team ? (teamColorsById.get(team.id) ?? []) : [];
          return (
            <div
              key={teamName}
              className="overflow-hidden rounded-lg border border-border"
              style={
                colors.length
                  ? {
                      // A flat dark scrim layered over the full team gradient
                      // (not a fade-to-solid) -- keeps the blend visible
                      // the whole way down the card instead of the gradient
                      // getting swallowed by an opaque background after the
                      // first row or two, while still giving the stat text
                      // enough contrast to read.
                      background: `linear-gradient(rgba(10,10,10,0.55), rgba(10,10,10,0.55)), ${teamGradient(colors, "to bottom")}`,
                    }
                  : undefined
              }
            >
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col />
                  <col className="w-14" />
                  <col className="w-14" />
                  <col className="w-14" />
                  <col className="w-14" />
                  <col className="w-14" />
                  <col className="w-14" />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/15">
                    <th
                      className="px-4 py-2 text-base font-bold tracking-wide text-white uppercase"
                      style={colors.length ? { textShadow: TEAM_TEXT_SHADOW } : undefined}
                    >
                      {teamName}
                    </th>
                    <th className="px-4 py-2 text-white/80">GP</th>
                    <th className="px-4 py-2 text-white/80">PTS</th>
                    <th className="px-4 py-2 text-white/80">REB</th>
                    <th className="px-4 py-2 text-white/80">BLK</th>
                    <th className="px-4 py-2 text-white/80">STL</th>
                    <th className="px-4 py-2 text-white/80">3PM</th>
                  </tr>
                </thead>
                <tbody className={colors.length ? "text-white" : undefined}>
                  {teamRegistrants.map((r) => {
                    const rows = statsByRegistration.get(r.id) ?? [];
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">
                          {r.profiles && (
                            <PlayerNameLink
                              name={r.profiles.full_name}
                              data={popupDataByProfile[r.profile_id]}
                            />
                          )}
                        </td>
                        <td className="px-4 py-2">{rows.length}</td>
                        <td className="px-4 py-2">{average(rows, "points")?.toFixed(1) ?? "—"}</td>
                        <td className="px-4 py-2">
                          {average(rows, "rebounds")?.toFixed(1) ?? "—"}
                        </td>
                        <td className="px-4 py-2">{average(rows, "blocks")?.toFixed(1) ?? "—"}</td>
                        <td className="px-4 py-2">{average(rows, "steals")?.toFixed(1) ?? "—"}</td>
                        <td className="px-4 py-2">
                          {average(rows, "three_pm")?.toFixed(1) ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
        {!registrants?.length && (
          <p className="text-sm text-muted-foreground">No registrants yet.</p>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-medium">Box Scores</h2>
        <ul className="flex flex-col gap-2">
          {(games ?? []).map((game) => (
            <li key={game.id}>
              <Link
                href={`/stats/games/${game.id}`}
                className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">
                  {new Date(`${game.date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-sm text-muted-foreground">{game.venue}</span>
              </Link>
            </li>
          ))}
          {!games?.length && <li className="text-sm text-muted-foreground">No games yet.</li>}
        </ul>
      </div>
    </div>
  );
}

export default async function StatsPage() {
  await requireUser();

  const season = await getCurrentSeason();
  if (!season) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <StatsStandingsSubNav active="stats" />
        <h1 className="text-xl font-semibold">Stats</h1>
        <p className="text-sm text-muted-foreground">No season has been set up yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <StatsStandingsSubNav active="stats" />
      <h1 className="text-xl font-semibold">{season.name} Stats</h1>
      <LiveSeasonStats seasonId={season.id} />
    </div>
  );
}
