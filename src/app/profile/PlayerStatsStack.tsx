import { SeasonStatsCard } from "@/components/SeasonStatsCard";
import type { LegacySeasonStat } from "@/lib/types";

type SeasonAverages = {
  points: number | null;
  rebounds: number | null;
  blocks: number | null;
  steals: number | null;
  three_pm: number | null;
};

export function PlayerStatsStack({
  currentSeasonName,
  currentSeasonGamesPlayed,
  currentSeasonAverages,
  legacyStats,
}: {
  currentSeasonName: string;
  currentSeasonGamesPlayed: number;
  currentSeasonAverages: SeasonAverages;
  legacyStats: LegacySeasonStat[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <SeasonStatsCard
        title={currentSeasonName}
        gamesPlayed={currentSeasonGamesPlayed}
        averages={currentSeasonAverages}
      />
      {legacyStats.map((s) => (
        <SeasonStatsCard
          key={s.id}
          title={s.season_label}
          gamesPlayed={Number(s.games_played)}
          averages={{
            points: Number(s.points),
            rebounds: Number(s.rebounds),
            blocks: Number(s.blocks),
            steals: Number(s.steals),
            three_pm: Number(s.three_pm),
          }}
        />
      ))}
    </div>
  );
}
