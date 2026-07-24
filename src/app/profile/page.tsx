import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "./ProfileView";
import { Toast } from "@/components/Toast";
import { average } from "@/lib/stats";
import type { Profile, Season, SeasonRegistration, GameStat, LegacySeasonStat } from "@/lib/types";

type RegistrationWithSeason = SeasonRegistration & { seasons: Season | null };

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const params = await searchParams;
  const photoFailed = params.photo === "failed";
  const welcome = params.welcome === "1";

  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { data: registration } = await supabase
    .from("season_registrations")
    .select("*, seasons(*)")
    .eq("profile_id", user.id)
    .order("registered_at", { ascending: false })
    .limit(1)
    .maybeSingle<RegistrationWithSeason>();

  if (!profile) return null;

  let currentSeasonName = "Current Season";
  let currentSeasonGamesPlayed = 0;
  let currentSeasonAverages = {
    points: null as number | null,
    rebounds: null as number | null,
    blocks: null as number | null,
    steals: null as number | null,
    three_pm: null as number | null,
  };

  if (registration) {
    currentSeasonName = registration.seasons?.name ?? currentSeasonName;

    const { data: gameStats } = await supabase
      .from("game_stats")
      .select("*")
      .eq("registration_id", registration.id)
      .overrideTypes<GameStat[], { merge: false }>();

    currentSeasonGamesPlayed = gameStats?.length ?? 0;
    currentSeasonAverages = {
      points: average(gameStats ?? [], "points"),
      rebounds: average(gameStats ?? [], "rebounds"),
      blocks: average(gameStats ?? [], "blocks"),
      steals: average(gameStats ?? [], "steals"),
      three_pm: average(gameStats ?? [], "three_pm"),
    };
  }

  const { data: legacyStats } = await supabase
    .from("legacy_season_stats")
    .select("*")
    .eq("profile_id", user.id)
    .order("season_label", { ascending: false })
    .overrideTypes<LegacySeasonStat[], { merge: false }>();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-12">
      {welcome && <Toast message="You're signed up! Welcome to Shia City Basketball." />}
      {photoFailed && (
        <p className="rounded-md border border-amber-900/40 bg-amber-950/50 px-3 py-2 text-sm text-amber-300">
          Your account was created, but we couldn&apos;t upload your profile picture. Try
          uploading it again below.
        </p>
      )}
      <h1 className="text-xl font-semibold">Your Profile</h1>
      <ProfileView
        profile={profile}
        registration={registration}
        currentSeasonName={currentSeasonName}
        currentSeasonGamesPlayed={currentSeasonGamesPlayed}
        currentSeasonAverages={currentSeasonAverages}
        legacyStats={legacyStats ?? []}
      />
    </div>
  );
}
