import { requireUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentSeason } from "@/lib/season";
import { average, type StatKey } from "@/lib/stats";
import { getPlayerPopupDataByProfileId } from "@/lib/playerPopup";
import { StatsStandingsSubNav } from "@/components/StatsStandingsSubNav";
import { PlayerNameLink } from "@/components/PlayerNameLink";
import type { Profile, SeasonRegistration, Team, GameStat } from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null; teams: Team | null };

const CATEGORIES: { key: StatKey; label: string }[] = [
  { key: "points", label: "Points" },
  { key: "rebounds", label: "Rebounds" },
  { key: "blocks", label: "Blocks" },
  { key: "steals", label: "Steals" },
  { key: "three_pm", label: "3-Pointers Made" },
];

const TOP_N = 5;

export default async function LeaderboardsPage() {
  await requireUser();

  const season = await getCurrentSeason();
  if (!season) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <StatsStandingsSubNav active="leaderboards" />
        <h1 className="text-xl font-semibold">Leaderboards</h1>
        <p className="text-sm text-muted-foreground">No season has been set up yet.</p>
      </div>
    );
  }

  // Service-role client -- see the same note in /stats: season_registrations
  // and profiles only have "view your own row" RLS policies, so a normal
  // client would only ever see the viewing user's own registration.
  const supabase = createServiceRoleClient();

  const [{ data: registrants }, { data: gameStats }] = await Promise.all([
    supabase
      .from("season_registrations")
      .select("*, profiles(*), teams(*)")
      .eq("season_id", season.id)
      .overrideTypes<RegistrantRow[], { merge: false }>(),
    supabase
      .from("game_stats")
      .select("*")
      .eq("season_id", season.id)
      .overrideTypes<GameStat[], { merge: false }>(),
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

  const leaderboards = CATEGORIES.map((category) => {
    const ranked = (registrants ?? [])
      .map((r) => {
        const rows = statsByRegistration.get(r.id) ?? [];
        const avg = average(rows, category.key);
        return avg == null
          ? null
          : {
              profileId: r.profile_id,
              name: r.profiles?.full_name ?? "Unknown",
              teamName: r.teams?.name ?? "Unassigned",
              avg,
            };
      })
      .filter((row) => row != null)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, TOP_N);
    return { ...category, ranked };
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <StatsStandingsSubNav active="leaderboards" />
      <div>
        <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">
          {season.name} Leaderboards
        </h1>
        <p className="text-sm text-muted-foreground">Top {TOP_N} per game average, league-wide</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {leaderboards.map((board) => (
          <div key={board.key} className="overflow-hidden rounded-lg border border-border">
            <p className="border-b border-border px-4 py-2 font-display tracking-wide text-foreground uppercase">
              {board.label}
            </p>
            <ol className="flex flex-col">
              {board.ranked.map((row, i) => (
                <li
                  key={`${row.profileId}-${i}`}
                  className="flex items-center justify-between border-b border-border px-4 py-2 text-sm last:border-0"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span className="font-medium">
                      <PlayerNameLink name={row.name} data={popupDataByProfile[row.profileId]} />
                    </span>
                    <span className="text-xs text-muted-foreground">{row.teamName}</span>
                  </span>
                  <span className="font-mono font-semibold">{row.avg.toFixed(1)}</span>
                </li>
              ))}
              {!board.ranked.length && (
                <li className="px-4 py-2 text-sm text-muted-foreground">No stats yet.</li>
              )}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
