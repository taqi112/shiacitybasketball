import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";
import type { Profile, Season, SeasonRegistration } from "@/lib/types";

type RegistrationWithSeason = SeasonRegistration & { seasons: Season | null };

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const params = await searchParams;
  const photoFailed = params.photo === "failed";

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

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-12">
      {photoFailed && (
        <p className="rounded-md border border-amber-900/40 bg-amber-950/50 px-3 py-2 text-sm text-amber-300">
          Your account was created, but we couldn&apos;t upload your profile picture. Try
          uploading it again below.
        </p>
      )}
      <div>
        <h1 className="text-xl font-semibold">Your profile</h1>
        {registration?.seasons && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Registered for {registration.seasons.name}</p>
            <p>
              Team: {registration.team_id ? "Assigned" : "Not assigned yet"}
              {registration.is_captain && " (Captain)"}
            </p>
            <p>
              Jersey number:{" "}
              {registration.jersey_number ?? "Not assigned yet"}
            </p>
          </div>
        )}
      </div>
      <ProfileForm
        profile={profile}
        registrationId={registration?.id ?? null}
        jerseyNumber={registration?.jersey_number ?? null}
      />
    </div>
  );
}
