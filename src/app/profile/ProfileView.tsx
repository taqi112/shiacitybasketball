"use client";

import { useState } from "react";
import { ProfileForm } from "./ProfileForm";
import { PlayerCard } from "./PlayerCard";
import { PlayerStatsStack } from "./PlayerStatsStack";
import { Toast } from "@/components/Toast";
import type { Profile, Season, SeasonRegistration, LegacySeasonStat } from "@/lib/types";

type RegistrationWithSeason = SeasonRegistration & { seasons: Season | null };

type SeasonAverages = {
  points: number | null;
  rebounds: number | null;
  blocks: number | null;
  steals: number | null;
  three_pm: number | null;
};

export function ProfileView({
  profile,
  registration,
  currentSeasonName,
  currentSeasonGamesPlayed,
  currentSeasonAverages,
  legacyStats,
}: {
  profile: Profile;
  registration: RegistrationWithSeason | null;
  currentSeasonName: string;
  currentSeasonGamesPlayed: number;
  currentSeasonAverages: SeasonAverages;
  legacyStats: LegacySeasonStat[];
}) {
  const [editing, setEditing] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  function handleSuccess() {
    setEditing(false);
    setToastKey((key) => key + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      {toastKey > 0 && <Toast key={toastKey} message="Profile updated." />}
      {editing ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="self-start text-sm text-muted-foreground underline"
          >
            ← Back to Profile
          </button>
          <ProfileForm
            profile={profile}
            registrationId={registration?.id ?? null}
            jerseyNumber={registration?.jersey_number ?? null}
            onSuccess={handleSuccess}
          />
        </div>
      ) : (
        <>
          <PlayerCard profile={profile} registration={registration} />
          <PlayerStatsStack
            currentSeasonName={currentSeasonName}
            currentSeasonGamesPlayed={currentSeasonGamesPlayed}
            currentSeasonAverages={currentSeasonAverages}
            legacyStats={legacyStats}
          />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Edit Profile
          </button>
        </>
      )}
    </div>
  );
}
