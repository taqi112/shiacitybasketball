import type { Profile, Season, SeasonRegistration } from "@/lib/types";

type RegistrationWithSeason = SeasonRegistration & { seasons: Season | null };

export function PlayerCard({
  profile,
  registration,
}: {
  profile: Profile;
  registration: RegistrationWithSeason | null;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6 text-center">
      {profile.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.photo_url}
          alt={profile.full_name}
          className="h-28 w-28 rounded-full border border-border object-cover"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-border bg-background font-display text-3xl text-muted-foreground">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h2 className="font-display text-2xl tracking-wide text-foreground uppercase">
          {profile.full_name}
        </h2>
        {profile.position && profile.position.length > 0 && (
          <p className="text-sm text-muted-foreground">{profile.position.join(" / ")}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {registration?.jersey_number != null && (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-sm font-medium">
            #{registration.jersey_number}
          </span>
        )}
        {profile.height && (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-sm">
            {profile.height}
          </span>
        )}
        {profile.age != null && (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-sm">
            Age {profile.age}
          </span>
        )}
        {profile.self_rank != null && (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-sm">
            Self Rank {profile.self_rank}/5
          </span>
        )}
        {profile.played_before && (
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            Returning Player
          </span>
        )}
        {registration?.is_captain && (
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            Captain
          </span>
        )}
      </div>
      {registration?.seasons && (
        <div className="text-sm text-muted-foreground">
          <p>Registered for {registration.seasons.name}</p>
          <p>Team: {registration.team_id ? "Assigned" : "Not assigned yet"}</p>
        </div>
      )}
    </div>
  );
}
