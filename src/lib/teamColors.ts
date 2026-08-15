// Real jersey colors per team, keyed by team name (stable and human-chosen,
// unlike draft_position). Each team is a list of color "bands" that must
// sum to 100 -- either a flat solid color spanning its share, or a smooth
// light-to-dark gradient spanning its share (for teams explicitly described
// as a gradient rather than a solid block).
export type ColorBand = { hex: string; pct: number } | { from: string; to: string; pct: number };

// Percentage templates below are tuned against a ~6-row team card, not the
// literal jersey split -- 50/30/20 for a 3-color team puts the 2nd color's
// blend starting around the 3rd row and the 3rd color's around the 5th, and
// 70/30 for a 2-color team starts that blend around the 4th row. Secondary
// colors stay clearly smaller than the primary so the jersey's dominant
// color still reads first.
export const TEAM_JERSEY_COLORS: Record<string, ColorBand[]> = {
  Azadars: [
    { hex: "#1e3a8a", pct: 50 }, // navy
    { hex: "#facc15", pct: 30 }, // yellow
    { hex: "#7dd3fc", pct: 20 }, // sky blue
  ],
  // Explicitly "a full gradient of gray and light blue" -- one continuous
  // sweep across the whole width, no black, no solid stripe.
  Ghazis: [{ from: "#d1d5db", to: "#38bdf8", pct: 100 }],
  Intifada: [
    { hex: "#facc15", pct: 50 }, // gold
    { hex: "#14b8a6", pct: 30 }, // teal
    { hex: "#1e3a8a", pct: 20 }, // navy
  ],
  "House of Hyder": [
    { hex: "#7c3aed", pct: 50 }, // purple
    { hex: "#f97316", pct: 30 }, // orange
    { hex: "#ffffff", pct: 20 }, // white
  ],
  bWood: [
    { hex: "#f97316", pct: 50 }, // orange
    { hex: "#fbbf24", pct: 30 }, // gold
    { hex: "#1e3a8a", pct: 20 }, // navy
  ],
  "The Resistance": [
    { hex: "#38bdf8", pct: 70 }, // sky blue
    { hex: "#ffffff", pct: 30 }, // white
  ],
  "313 Wolves": [
    { hex: "#000000", pct: 50 }, // black
    { hex: "#ffffff", pct: 30 }, // white
    { hex: "#d1d5db", pct: 20 }, // silver
  ],
  Jabal: [
    { from: "#c4b5fd", to: "#6b21a8", pct: 70 }, // light -> dark purple
    { hex: "#ffffff", pct: 30 }, // white
  ],
  Benchwarmers: [
    { hex: "#22c55e", pct: 50 }, // green
    { hex: "#dc2626", pct: 30 }, // red
    { hex: "#ffffff", pct: 20 }, // white
  ],
  "Unc Time": [
    { hex: "#dc2626", pct: 50 }, // red
    { hex: "#000000", pct: 30 }, // black
    { hex: "#ffffff", pct: 20 }, // white
  ],
};

const FALLBACK_COLORS: ColorBand[] = [{ hex: "#71717a", pct: 100 }];

// Team name text on a colored gradient can cross light and dark stops in
// the same pill, so every consumer that renders team-colored text should
// pair it with this shadow rather than picking a single text color that
// only works for part of the gradient.
export const TEAM_TEXT_SHADOW = "0 1px 3px rgba(0,0,0,0.9)";

// Builds a fully continuous CSS gradient -- no flat plateau between colors,
// no hard edges. Each solid ("hex") band's color fully "arrives" by the end
// of its own proportional share (so a 70%-weighted color still reads as
// dominant up front), then blends the rest of the way into the next color
// the whole way to its own arrival point -- there's no gap or dead zone
// anywhere in the gradient. A { from, to } band is already a smooth gradient
// across its own span and is stitched into the same chain the same way.
export function teamGradient(bands: ColorBand[], direction = "to right"): string {
  if (!bands.length) return "var(--surface)";
  if (bands.length === 1) {
    const only = bands[0];
    return "hex" in only ? only.hex : `linear-gradient(${direction}, ${only.from}, ${only.to})`;
  }

  const boundaries: number[] = [0];
  for (const band of bands) boundaries.push(boundaries[boundaries.length - 1] + band.pct);

  const stops: string[] = [];
  bands.forEach((band, i) => {
    if ("hex" in band) {
      stops.push(`${band.hex} ${boundaries[i + 1]}%`);
    } else {
      stops.push(`${band.from} ${boundaries[i]}%`, `${band.to} ${boundaries[i + 1]}%`);
    }
  });

  return `linear-gradient(${direction}, ${stops.join(", ")})`;
}

// The team's single most representative color (first/dominant band) --
// used wherever a full gradient would be too busy, e.g. the schedule row's
// ambient side-glow or a table's background fade.
export function primaryHex(bands: ColorBand[]): string {
  if (!bands.length) return "#71717a";
  const first = bands[0];
  return "hex" in first ? first.hex : first.from;
}

// Looks colors up by team name (falls back to a neutral gray for any team
// not in TEAM_JERSEY_COLORS, e.g. a future season's teams).
export function buildTeamColorsById(
  teams: { id: string; name: string }[],
): Map<string, ColorBand[]> {
  const map = new Map<string, ColorBand[]>();
  for (const t of teams) {
    map.set(t.id, TEAM_JERSEY_COLORS[t.name] ?? FALLBACK_COLORS);
  }
  return map;
}
