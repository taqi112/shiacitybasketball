import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Season,
  Game,
  Profile,
  SeasonRegistration,
  Team,
  GameStat,
  LegacySeasonStat,
} from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null; teams: Team | null };

type StatKey = "points" | "rebounds" | "blocks" | "steals" | "three_pm";

function LegacyStatsTable({ stats }: { stats: LegacySeasonStat[] }) {
  const groups = new Map<string, LegacySeasonStat[]>();
  for (const s of stats) {
    const list = groups.get(s.team_name) ?? [];
    list.push(s);
    groups.set(s.team_name, list);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.entries()].map(([teamName, players]) => (
        <div key={teamName} className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2">{teamName}</th>
                <th className="px-4 py-2">GP</th>
                <th className="px-4 py-2">PTS</th>
                <th className="px-4 py-2">REB</th>
                <th className="px-4 py-2">BLK</th>
                <th className="px-4 py-2">STL</th>
                <th className="px-4 py-2">3PM</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{p.player_name}</td>
                  <td className="px-4 py-2">{Number(p.games_played)}</td>
                  <td className="px-4 py-2">{Number(p.points).toFixed(1)}</td>
                  <td className="px-4 py-2">{Number(p.rebounds).toFixed(1)}</td>
                  <td className="px-4 py-2">{Number(p.blocks).toFixed(1)}</td>
                  <td className="px-4 py-2">{Number(p.steals).toFixed(1)}</td>
                  <td className="px-4 py-2">{Number(p.three_pm).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {!stats.length && <p className="text-sm text-muted-foreground">No stats for this season.</p>}
    </div>
  );
}

function average(rows: GameStat[], key: StatKey) {
  if (!rows.length) return null;
  const sum = rows.reduce((acc, r) => acc + Number(r[key]), 0);
  return sum / rows.length;
}

async function LiveSeasonStats({ seasonId }: { seasonId: string }) {
  const supabase = await createClient();

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
      .overrideTypes<Game[], { merge: false }>(),
  ]);

  const statsByRegistration = new Map<string, GameStat[]>();
  for (const stat of gameStats ?? []) {
    const list = statsByRegistration.get(stat.registration_id) ?? [];
    list.push(stat);
    statsByRegistration.set(stat.registration_id, list);
  }

  const groups = new Map<string, RegistrantRow[]>();
  for (const r of registrants ?? []) {
    const teamName = r.teams?.name ?? "Unassigned";
    const list = groups.get(teamName) ?? [];
    list.push(r);
    groups.set(teamName, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        {[...groups.entries()].map(([teamName, teamRegistrants]) => (
          <div key={teamName} className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2">{teamName}</th>
                  <th className="px-4 py-2">GP</th>
                  <th className="px-4 py-2">PTS</th>
                  <th className="px-4 py-2">REB</th>
                  <th className="px-4 py-2">BLK</th>
                  <th className="px-4 py-2">STL</th>
                  <th className="px-4 py-2">3PM</th>
                </tr>
              </thead>
              <tbody>
                {teamRegistrants.map((r) => {
                  const rows = statsByRegistration.get(r.id) ?? [];
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2">{r.profiles?.full_name}</td>
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
        ))}
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

export default async function StatsPage({ searchParams }: PageProps<"/stats">) {
  await requireUser();
  const params = await searchParams;
  const seasonParam = Array.isArray(params.season) ? params.season[0] : params.season;

  const supabase = await createClient();

  const [{ data: seasons }, { data: legacyStats }] = await Promise.all([
    supabase
      .from("seasons")
      .select("*")
      .order("created_at", { ascending: false })
      .overrideTypes<Season[], { merge: false }>(),
    supabase
      .from("legacy_season_stats")
      .select("*")
      .overrideTypes<LegacySeasonStat[], { merge: false }>(),
  ]);

  const legacyLabels = [...new Set((legacyStats ?? []).map((s) => s.season_label))];

  const tabs = [
    ...(seasons ?? []).map((s) => ({ key: s.id, label: s.name, kind: "live" as const })),
    ...legacyLabels.map((label) => ({ key: label, label, kind: "legacy" as const })),
  ];

  if (!tabs.length) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <h1 className="text-xl font-semibold">Stats</h1>
        <p className="text-sm text-muted-foreground">No stats available yet.</p>
      </div>
    );
  }

  const activeKey = tabs.some((t) => t.key === seasonParam) ? seasonParam! : tabs[0].key;
  const activeTab = tabs.find((t) => t.key === activeKey)!;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <h1 className="text-xl font-semibold">Stats</h1>
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/stats?season=${encodeURIComponent(tab.key)}`}
            className={
              tab.key === activeKey
                ? "rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground"
                : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {activeTab.kind === "legacy" ? (
        <LegacyStatsTable
          stats={(legacyStats ?? []).filter((s) => s.season_label === activeTab.key)}
        />
      ) : (
        <LiveSeasonStats seasonId={activeTab.key} />
      )}
    </div>
  );
}
