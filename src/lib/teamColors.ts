// One bold, distinct color per team -- echoes the colored "seed tile" look
// from the league's Instagram bracket graphics (and the rank-tier badges on
// the draft cards) rather than a flat black/white or single accent color.
// Kept as full literal class names (not built from a template string) so
// Tailwind's build-time scanner can actually find and generate them. `hex`
// is the same color's actual value (standard Tailwind palette), needed
// wherever a class name won't do -- e.g. building a per-game CSS gradient,
// where the two colors in play aren't known until render time.
export const TEAM_COLOR_PALETTE = [
  { bg: "bg-sky-500", text: "text-white", hex: "#0ea5e9" },
  { bg: "bg-rose-500", text: "text-white", hex: "#f43f5e" },
  { bg: "bg-violet-500", text: "text-white", hex: "#8b5cf6" },
  { bg: "bg-emerald-500", text: "text-white", hex: "#10b981" },
  { bg: "bg-amber-400", text: "text-black", hex: "#fbbf24" },
  { bg: "bg-cyan-500", text: "text-white", hex: "#06b6d4" },
  { bg: "bg-fuchsia-500", text: "text-white", hex: "#d946ef" },
  { bg: "bg-lime-400", text: "text-black", hex: "#a3e635" },
  { bg: "bg-indigo-500", text: "text-white", hex: "#6366f1" },
  { bg: "bg-orange-500", text: "text-white", hex: "#f97316" },
] as const;

export type TeamColor = (typeof TEAM_COLOR_PALETTE)[number];

// Assigns one color per team by array index -- pass teams in a stable order
// (draft_position) so a given team always gets the same color across
// renders/pages. Deterministic and collision-free as long as there are no
// more teams than palette entries.
export function buildTeamColorMap(teamIds: string[]): Map<string, TeamColor> {
  const map = new Map<string, TeamColor>();
  teamIds.forEach((id, i) => {
    map.set(id, TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length]);
  });
  return map;
}
