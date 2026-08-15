"use client";

import { useMemo, useState } from "react";
import { formatTime } from "@/lib/datetime";
import { primaryHex, type ColorBand } from "@/lib/teamColors";
import type { Game } from "@/lib/types";

type TeamMeta = { name: string; colors: ColorBand[] };

const WIN_COLOR = "#4ade80";
const LOSS_COLOR = "#f87171";

function TeamPill({
  teamId,
  teamMeta,
}: {
  teamId: string | null;
  teamMeta: Record<string, TeamMeta>;
}) {
  if (!teamId || !teamMeta[teamId]) {
    return (
      <span className="rounded-md border border-white/15 bg-black/40 px-3 py-1 text-sm text-white/50">
        TBD
      </span>
    );
  }
  const meta = teamMeta[teamId];
  return (
    <span className="px-3 py-1 text-base font-bold tracking-wide text-white uppercase">
      {meta.name}
    </span>
  );
}

// Always each team's own primary jersey color, fading to the card's normal
// surface color by the middle. The win/loss signal lives in the score
// numbers themselves, not the row background.
function rowBackground(leftHex: string, rightHex: string): string {
  return `linear-gradient(to right, ${leftHex}55 0%, var(--surface) 50%, ${rightHex}55 100%)`;
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
              {dateGames.map((g) => {
                const played = g.home_score != null && g.away_score != null;
                const tie = played && g.home_score === g.away_score;
                const homeWon = played && !tie && g.home_score! > g.away_score!;
                const awayWon = played && !tie && g.away_score! > g.home_score!;

                const homeColors = g.home_team_id ? teamMeta[g.home_team_id]?.colors : undefined;
                const awayColors = g.away_team_id ? teamMeta[g.away_team_id]?.colors : undefined;

                const leftHex = homeColors ? primaryHex(homeColors) : "#3f3f46";
                const rightHex = awayColors ? primaryHex(awayColors) : "#3f3f46";

                return (
                  <div
                    key={g.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ background: rowBackground(leftHex, rightHex) }}
                  >
                    <span className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-xs font-mono text-white/70">
                      {g.court ?? "TBD"}
                    </span>
                    <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="relative justify-self-end">
                        {homeWon && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-base leading-none">
                            👑
                          </span>
                        )}
                        <TeamPill teamId={g.home_team_id} teamMeta={teamMeta} />
                      </div>
                      <div className="flex h-9 w-28 items-center justify-center">
                        {played ? (
                          <span className="flex items-center gap-3 font-mono text-3xl font-semibold tracking-tight tabular-nums">
                            <span
                              style={{ color: tie ? "#fff" : homeWon ? WIN_COLOR : LOSS_COLOR }}
                            >
                              {g.home_score}
                            </span>
                            <span className="text-base text-white/50">–</span>
                            <span
                              style={{ color: tie ? "#fff" : awayWon ? WIN_COLOR : LOSS_COLOR }}
                            >
                              {g.away_score}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-white/80">VS</span>
                        )}
                      </div>
                      <div className="relative justify-self-start">
                        {awayWon && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-base leading-none">
                            👑
                          </span>
                        )}
                        <TeamPill teamId={g.away_team_id} teamMeta={teamMeta} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-white/70">
                      {formatTime(g.start_time)}–{formatTime(g.end_time)}
                    </span>
                  </div>
                );
              })}
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
