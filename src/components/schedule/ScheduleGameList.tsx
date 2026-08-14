"use client";

import { useMemo, useState } from "react";
import { formatTime } from "@/lib/datetime";
import type { Game } from "@/lib/types";

type TeamMeta = { name: string; bg: string; text: string; hex: string };

// Full team color at each edge, fading through the card's own surface color
// by the midpoint -- a colored glow rather than a solid block, so the court
// badge/time text sitting near the edges stay readable. "44" is a hex alpha
// suffix (~27% opacity).
function rowGradient(homeHex: string | undefined, awayHex: string | undefined): string {
  const left = homeHex ? `${homeHex}44` : "var(--surface)";
  const right = awayHex ? `${awayHex}44` : "var(--surface)";
  return `linear-gradient(to right, ${left} 0%, var(--surface) 50%, ${right} 100%)`;
}

function TeamPill({
  teamId,
  teamMeta,
}: {
  teamId: string | null;
  teamMeta: Record<string, TeamMeta>;
}) {
  if (!teamId || !teamMeta[teamId]) {
    return (
      <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
        TBD
      </span>
    );
  }
  const meta = teamMeta[teamId];
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${meta.bg} ${meta.text}`}>
      {meta.name}
    </span>
  );
}

export function ScheduleGameList({
  games,
  teamMeta,
}: {
  games: Game[];
  teamMeta: Record<string, TeamMeta>;
}) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [courtFilter, setCourtFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");

  const dates = useMemo(() => [...new Set(games.map((g) => g.date))].sort(), [games]);
  const courts = useMemo(
    () => [...new Set(games.map((g) => g.court).filter((c): c is string => Boolean(c)))].sort(),
    [games],
  );
  const timeSlots = useMemo(() => {
    const set = new Set(games.map((g) => `${g.start_time}-${g.end_time}`));
    return [...set].sort();
  }, [games]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return games.filter((g) => {
      const homeName = g.home_team_id ? (teamMeta[g.home_team_id]?.name ?? "") : "";
      const awayName = g.away_team_id ? (teamMeta[g.away_team_id]?.name ?? "") : "";
      const matchesTeam =
        !query || homeName.toLowerCase().includes(query) || awayName.toLowerCase().includes(query);
      const matchesDate = !dateFilter || g.date === dateFilter;
      const matchesCourt = !courtFilter || g.court === courtFilter;
      const matchesTime = !timeFilter || `${g.start_time}-${g.end_time}` === timeFilter;
      return matchesTeam && matchesDate && matchesCourt && matchesTime;
    });
  }, [games, search, dateFilter, courtFilter, timeFilter, teamMeta]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, Game[]>();
    for (const g of filtered) {
      const list = map.get(g.date) ?? [];
      list.push(g);
      map.set(g.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function reset() {
    setSearch("");
    setDateFilter("");
    setCourtFilter("");
    setTimeFilter("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team name..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm md:w-64"
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-2 text-xs"
          >
            <option value="">All Dates</option>
            {dates.map((d) => (
              <option key={d} value={d}>
                {new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </option>
            ))}
          </select>
          <select
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-2 text-xs"
          >
            <option value="">All Courts</option>
            {courts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-2 text-xs"
          >
            <option value="">All Times</option>
            {timeSlots.map((t) => {
              const [start, end] = t.split("-");
              return (
                <option key={t} value={t}>
                  {formatTime(start)}–{formatTime(end)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-muted-foreground">
          Showing {filtered.length} game{filtered.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-accent underline underline-offset-4"
        >
          Reset Filters
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {groupedByDate.map(([date, dateGames]) => (
          <div key={date} className="flex flex-col gap-2">
            <h3 className="font-display text-sm tracking-wide text-muted-foreground uppercase">
              {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>
            <div className="flex flex-col gap-2">
              {dateGames.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{
                    background: rowGradient(
                      g.home_team_id ? teamMeta[g.home_team_id]?.hex : undefined,
                      g.away_team_id ? teamMeta[g.away_team_id]?.hex : undefined,
                    ),
                  }}
                >
                  <span className="rounded-md border border-border px-2 py-1 text-xs font-mono text-muted-foreground">
                    {g.court ?? "TBD"}
                  </span>
                  <div className="flex flex-1 items-center justify-center gap-3">
                    <TeamPill teamId={g.home_team_id} teamMeta={teamMeta} />
                    <span className="text-xs font-bold text-muted-foreground">VS</span>
                    <TeamPill teamId={g.away_team_id} teamMeta={teamMeta} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatTime(g.start_time)}–{formatTime(g.end_time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!groupedByDate.length && (
          <p className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No games match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
