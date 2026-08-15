import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlayerPopupDataByProfileId, type PlayerPopupData } from "@/lib/playerPopup";
import { PlayerNameLink } from "@/components/PlayerNameLink";
import type { LegacySeasonStat } from "@/lib/types";

function LegacyStatsTable({
  stats,
  popupDataByProfile,
}: {
  stats: LegacySeasonStat[];
  popupDataByProfile: Record<string, PlayerPopupData>;
}) {
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
                <th className="px-4 py-2">FLS</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    {p.profile_id ? (
                      <PlayerNameLink
                        name={p.player_name}
                        data={popupDataByProfile[p.profile_id]}
                      />
                    ) : (
                      p.player_name
                    )}
                  </td>
                  <td className="px-4 py-2">{Number(p.games_played)}</td>
                  <td className="px-4 py-2">{Number(p.points).toFixed(1)}</td>
                  <td className="px-4 py-2">{Number(p.rebounds).toFixed(1)}</td>
                  <td className="px-4 py-2">{Number(p.blocks).toFixed(1)}</td>
                  <td className="px-4 py-2">{Number(p.steals).toFixed(1)}</td>
                  <td className="px-4 py-2">{Number(p.three_pm).toFixed(1)}</td>
                  <td className="px-4 py-2">{p.fouls != null ? Number(p.fouls).toFixed(1) : "—"}</td>
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

export default async function PreviousSeasonsPage({
  searchParams,
}: PageProps<"/previous-seasons">) {
  await requireUser();
  const params = await searchParams;
  const seasonParam = Array.isArray(params.season) ? params.season[0] : params.season;

  const supabase = await createClient();
  const { data: legacyStats } = await supabase
    .from("legacy_season_stats")
    .select("*")
    .overrideTypes<LegacySeasonStat[], { merge: false }>();

  const labels = [...new Set((legacyStats ?? []).map((s) => s.season_label))];

  const popupDataByProfile = await getPlayerPopupDataByProfileId(
    (legacyStats ?? [])
      .map((s) => s.profile_id)
      .filter((id): id is string => Boolean(id)),
  );

  if (!labels.length) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <h1 className="text-xl font-semibold">Previous Seasons</h1>
        <p className="text-sm text-muted-foreground">No previous seasons on record yet.</p>
      </div>
    );
  }

  const activeLabel = labels.includes(seasonParam ?? "") ? seasonParam! : labels[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <h1 className="text-xl font-semibold">Previous Seasons</h1>
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {labels.map((label) => (
          <Link
            key={label}
            href={`/previous-seasons?season=${encodeURIComponent(label)}`}
            className={
              label === activeLabel
                ? "rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground"
                : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
            }
          >
            {label}
          </Link>
        ))}
      </div>
      <LegacyStatsTable
        stats={(legacyStats ?? []).filter((s) => s.season_label === activeLabel)}
        popupDataByProfile={popupDataByProfile}
      />
    </div>
  );
}
