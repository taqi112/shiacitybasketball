import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { average } from "@/lib/stats";
import { getPlayerPopupDataByProfileId } from "@/lib/playerPopup";
import { buildTeamColorsById, teamGradient, TEAM_TEXT_SHADOW } from "@/lib/teamColors";
import { PlayerNameLink } from "@/components/PlayerNameLink";
import type { SeasonAward, SeasonRegistration, Profile, Team, GameStat } from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null; teams: Team | null };

export default async function AwardsPage({ searchParams }: PageProps<"/awards">) {
  await requireUser();
  const params = await searchParams;
  const seasonParam = Array.isArray(params.season) ? params.season[0] : params.season;

  // season_awards and seasons both have public-select RLS, so no service
  // role needed just to figure out which seasons have awards.
  const supabase = await createClient();
  const { data: seasonRows } = await supabase
    .from("season_awards")
    .select("season_id, seasons(id, name, created_at)");

  const seasonsWithAwards = new Map<string, { id: string; name: string; created_at: string }>();
  for (const row of seasonRows ?? []) {
    const season = row.seasons as unknown as { id: string; name: string; created_at: string } | null;
    if (season) seasonsWithAwards.set(season.id, season);
  }
  const seasons = [...seasonsWithAwards.values()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  if (!seasons.length) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <h1 className="text-xl font-semibold">Awards</h1>
        <p className="text-sm text-muted-foreground">No awards posted yet.</p>
      </div>
    );
  }

  const activeSeason = seasons.find((s) => s.id === seasonParam) ?? seasons[0];

  // Service-role client -- season_registrations/profiles only have "view
  // your own row" RLS policies (see supabase/schema.sql), same reasoning as
  // /stats and /leaderboards.
  const adminSupabase = createServiceRoleClient();

  const [{ data: awards }, { data: teams }] = await Promise.all([
    adminSupabase
      .from("season_awards")
      .select("*, profiles(id, full_name, photo_url)")
      .eq("season_id", activeSeason.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    adminSupabase
      .from("teams")
      .select("*")
      .eq("season_id", activeSeason.id)
      .overrideTypes<Team[], { merge: false }>(),
  ]);

  const profileIds = (awards ?? [])
    .map((a) => a.profile_id)
    .filter((id): id is string => Boolean(id));

  const [{ data: registrants }, { data: gameStats }] = await Promise.all([
    profileIds.length
      ? adminSupabase
          .from("season_registrations")
          .select("*, profiles(*), teams(*)")
          .eq("season_id", activeSeason.id)
          .in("profile_id", profileIds)
          .overrideTypes<RegistrantRow[], { merge: false }>()
      : Promise.resolve({ data: [] as RegistrantRow[] }),
    profileIds.length
      ? adminSupabase.from("game_stats").select("*").eq("season_id", activeSeason.id)
      : Promise.resolve({ data: [] as GameStat[] }),
  ]);

  const registrantByProfile = new Map((registrants ?? []).map((r) => [r.profile_id, r]));
  const statsByRegistration = new Map<string, GameStat[]>();
  for (const stat of gameStats ?? []) {
    const list = statsByRegistration.get(stat.registration_id) ?? [];
    list.push(stat);
    statsByRegistration.set(stat.registration_id, list);
  }

  // Feeds the click-to-view player popup -- pulls the player's CURRENT
  // season team/captain status, not necessarily what it was when the award
  // was given, since that's what the popup shows everywhere else on the
  // site. Good enough for "who is this," not meant to be historically exact.
  const popupDataByProfile = await getPlayerPopupDataByProfileId(profileIds);
  const teamColorsById = buildTeamColorsById(teams ?? []);

  const groups = new Map<string, (SeasonAward & { profiles: Profile | null })[]>();
  for (const award of (awards ?? []) as (SeasonAward & { profiles: Profile | null })[]) {
    const list = groups.get(award.award_name) ?? [];
    list.push(award);
    groups.set(award.award_name, list);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">
          {activeSeason.name} Awards
        </h1>
        <p className="text-sm text-muted-foreground">Season awards, hand-picked by the league</p>
      </div>

      {seasons.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {seasons.map((s) => (
            <Link
              key={s.id}
              href={`/awards?season=${encodeURIComponent(s.id)}`}
              className={
                s.id === activeSeason.id
                  ? "rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground"
                  : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
              }
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-10">
        {[...groups.entries()].map(([awardName, recipients]) => (
          <div key={awardName} className="flex flex-col gap-4">
            <h2 className="font-display text-xl tracking-wide text-foreground uppercase">
              {awardName}
            </h2>
            <div
              className={
                recipients.length > 1
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid grid-cols-1 gap-4 sm:max-w-sm"
              }
            >
              {recipients.map((award) => {
                const profile = award.profiles;
                const registrant = profile ? registrantByProfile.get(profile.id) : undefined;
                const rows = registrant ? (statsByRegistration.get(registrant.id) ?? []) : [];
                const colors =
                  registrant?.team_id && teamColorsById.has(registrant.team_id)
                    ? (teamColorsById.get(registrant.team_id) ?? [])
                    : [];

                return (
                  <div
                    key={award.id}
                    className="flex flex-col items-center gap-3 overflow-hidden rounded-lg border border-border bg-surface p-5 text-center"
                  >
                    {profile?.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.photo_url}
                        alt={profile.full_name}
                        className="h-24 w-24 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-background font-display text-3xl text-muted-foreground">
                        {(profile?.full_name ?? award.recipient_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-display text-lg tracking-wide uppercase">
                        {profile ? (
                          <PlayerNameLink
                            name={profile.full_name}
                            data={popupDataByProfile[profile.id]}
                          />
                        ) : (
                          award.recipient_name
                        )}
                      </p>
                      {registrant?.teams?.name && (
                        <span
                          className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                          style={
                            colors.length
                              ? { background: teamGradient(colors), textShadow: TEAM_TEXT_SHADOW }
                              : undefined
                          }
                        >
                          {registrant.teams.name}
                        </span>
                      )}
                    </div>
                    {rows.length > 0 && (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{average(rows, "points")?.toFixed(1)} PPG</span>
                        <span>{average(rows, "rebounds")?.toFixed(1)} RPG</span>
                        <span>{average(rows, "three_pm")?.toFixed(1)} 3PM</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
