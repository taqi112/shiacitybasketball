import type { GameStat } from "@/lib/types";

export type StatKey = "points" | "rebounds" | "blocks" | "steals" | "three_pm";

export function average(rows: GameStat[], key: StatKey): number | null {
  if (!rows.length) return null;
  const sum = rows.reduce((acc, r) => acc + Number(r[key]), 0);
  return sum / rows.length;
}
