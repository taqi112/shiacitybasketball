type SeasonAverages = {
  points: number | null;
  rebounds: number | null;
  blocks: number | null;
  steals: number | null;
  three_pm: number | null;
};

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground uppercase">{label}</span>
      <span className="font-display text-lg">{value}</span>
    </div>
  );
}

function fmt(value: number | null) {
  return value != null ? value.toFixed(1) : "—";
}

export function SeasonStatsCard({
  title,
  gamesPlayed,
  averages,
}: {
  title: string;
  gamesPlayed: number;
  averages: SeasonAverages;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg tracking-wide uppercase">{title}</h3>
        <span className="text-xs text-muted-foreground">{gamesPlayed} GP</span>
      </div>
      {gamesPlayed > 0 ? (
        <div className="grid grid-cols-5 gap-2">
          <StatCell label="PTS" value={fmt(averages.points)} />
          <StatCell label="REB" value={fmt(averages.rebounds)} />
          <StatCell label="BLK" value={fmt(averages.blocks)} />
          <StatCell label="STL" value={fmt(averages.steals)} />
          <StatCell label="3PM" value={fmt(averages.three_pm)} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No games played yet.</p>
      )}
    </div>
  );
}
