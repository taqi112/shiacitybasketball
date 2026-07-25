import { SeasonStatsCard } from "@/components/SeasonStatsCard";
import type { LegacySeasonStat, Profile, SeasonRegistration } from "@/lib/types";

// Color-coded by self-rank tier -- doubles as a quick visual "how good is
// this player" signal while scrolling the pool, not just decoration.
const RANK_COLORS: Record<number, string> = {
  5: "bg-amber-400 text-black",
  4: "bg-blue-500 text-white",
  3: "bg-purple-500 text-white",
  2: "bg-red-600 text-white",
  1: "bg-zinc-500 text-white",
};

// Kept as full literal class names (not built from a shared color token) so
// Tailwind's build-time scanner can actually find and generate them.
const RANK_BORDER_COLORS: Record<number, string> = {
  5: "border-amber-400",
  4: "border-blue-500",
  3: "border-purple-500",
  2: "border-red-600",
  1: "border-zinc-500",
};

export function DraftPlayerCard({
  registrant,
  legacyStats,
}: {
  registrant: SeasonRegistration & { profiles: Profile | null };
  legacyStats: LegacySeasonStat[];
}) {
  const profile = registrant.profiles;
  if (!profile) return null;

  const rank = profile.self_rank;
  const rankColor = rank != null ? (RANK_COLORS[rank] ?? "bg-zinc-500 text-white") : null;
  const rankBorderColor = rank != null ? (RANK_BORDER_COLORS[rank] ?? "border-zinc-500") : null;

  return (
    <div
      className={`flex flex-col gap-4 rounded-lg border-2 bg-surface p-5 ${rankBorderColor ?? "border-border"}`}
    >
      <div className="flex items-start gap-4">
        {profile.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photo_url}
            alt={profile.full_name}
            className="h-20 w-20 flex-shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background font-display text-2xl text-muted-foreground">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-1 items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-xl leading-tight tracking-wide uppercase">
              {profile.full_name}
            </h3>
            {profile.position && profile.position.length > 0 && (
              <p className="text-sm text-muted-foreground">{profile.position.join(" / ")}</p>
            )}
          </div>
          <div
            className={`flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-md font-display text-lg ${
              rankColor ?? "border border-border text-muted-foreground"
            }`}
            title="Self rank"
          >
            {rank ?? "—"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.age != null && (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs">
            Age {profile.age}
          </span>
        )}
        {profile.height && (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs">
            {profile.height}
          </span>
        )}
        {registrant.jersey_number != null && (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs">
            #{registrant.jersey_number}
          </span>
        )}
      </div>

      {registrant.captain_preference && registrant.captain_preference.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground uppercase">Captain Preference</p>
          <div className="flex flex-wrap gap-1">
            {registrant.captain_preference.map((name) => (
              <span
                key={name}
                className="rounded-full border border-border bg-background px-2 py-0.5 text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {registrant.availability_notes && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground uppercase">Missing Games?</p>
          <p className="text-sm text-muted-foreground">{registrant.availability_notes}</p>
        </div>
      )}

      {legacyStats.length > 0 && (
        <div className="flex flex-col gap-2">
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
      )}
    </div>
  );
}
