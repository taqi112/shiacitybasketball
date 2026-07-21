import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";
import type { Profile, Season, SeasonRegistration } from "@/lib/types";

type RegistrationWithSeason = SeasonRegistration & { seasons: Season | null };

export default async function ProfilePage() {
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
      <ProfileForm profile={profile} />
    </div>
  );
}
