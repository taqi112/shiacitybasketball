import { requireUser, getCurrentProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentSeason } from "@/lib/season";
import type { Team, SeasonRegistration, Profile } from "@/lib/types";

type RosterEntry = SeasonRegistration & { profiles: Profile | null };

export default async function TeamsPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  const season = await getCurrentSeason();
  if (!season) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
        <h1 className="text-xl font-semibold">Teams</h1>
        <p className="text-sm text-muted-foreground">No season has been set up yet.</p>
      </div>
    );
  }

  // Regular users can't read other players' season_registrations/profiles
  // rows via RLS (see the same note in src/app/draft/page.tsx) -- this page
  // is meant to be visible to everyone, so it reads via the service-role
  // client. Unlike the draft pool, this stays entirely server-rendered (no
  // Client Component holding the fetched data), so a phone number never
  // reaches the browser for anyone except the viewing captain's own team --
  // it's simply never printed into that team's JSX.
  const supabase = createServiceRoleClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("season_id", season.id)
    .order("draft_position", { ascending: true, nullsFirst: false })
    .overrideTypes<Team[], { merge: false }>();

  const { data: registrations } = await supabase
    .from("season_registrations")
    .select("*, profiles(*)")
    .eq("season_id", season.id)
    .not("team_id", "is", null)
    .overrideTypes<RosterEntry[], { merge: false }>();

  const myCaptainTeamId =
    registrations?.find((r) => r.profile_id === profile?.id && r.is_captain)?.team_id ?? null;

  const rosterByTeam = new Map<string, RosterEntry[]>();
  for (const r of registrations ?? []) {
    if (!r.team_id) continue;
    const list = rosterByTeam.get(r.team_id) ?? [];
    list.push(r);
    rosterByTeam.set(r.team_id, list);
  }
  for (const roster of rosterByTeam.values()) {
    roster.sort((a, b) => Number(b.is_captain) - Number(a.is_captain));
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12">
      <h1 className="text-xl font-semibold">Teams</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(teams ?? []).map((team) => {
          const roster = rosterByTeam.get(team.id) ?? [];
          const showPhones = team.id === myCaptainTeamId;
          return (
            <div
              key={team.id}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <p className="border-b border-border px-4 py-3 font-display tracking-wide text-white uppercase">
                {team.name}
              </p>
              <ul className="flex flex-col gap-1 p-4 text-sm">
                {roster.map((r) => (
                  <li key={r.id} className="text-muted-foreground">
                    <span className={r.is_captain ? "font-medium text-foreground" : undefined}>
                      {r.profiles?.full_name}
                    </span>
                    {r.is_captain && " (Captain)"}
                    {showPhones && r.profiles?.phone && ` · ${r.profiles.phone}`}
                  </li>
                ))}
                {!roster.length && <li className="text-muted-foreground">No players yet.</li>}
              </ul>
            </div>
          );
        })}
        {!teams?.length && (
          <p className="text-sm text-muted-foreground">No teams yet.</p>
        )}
      </div>
    </div>
  );
}
