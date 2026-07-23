"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { updateProfile } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { AvatarInput } from "@/components/AvatarInput";
import { PositionPicker } from "@/components/PositionPicker";
import type { Profile } from "@/lib/types";
import { inputClass } from "@/lib/ui";

export function ProfileForm({
  profile,
  registrationId,
  jerseyNumber,
  onSuccess,
}: {
  profile: Profile;
  registrationId: string | null;
  jerseyNumber: number | null;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(updateProfile, undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Submitting via onSubmit + startTransition instead of <form action={formAction}>
  // deliberately -- a form using the action prop directly gets its fields
  // reset to their original server-rendered defaults after a successful
  // submission (React's built-in behavior, meant for "create new record"
  // forms). That's wrong for an edit-in-place form like this one: it kept
  // snapping Position/Self ranking/Jersey size back to their placeholder
  // even though the save itself had already succeeded.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  const [positions, setPositions] = useState<string[]>(profile.position ?? []);
  const [selfRank, setSelfRank] = useState(
    profile.self_rank != null ? String(profile.self_rank) : "",
  );
  const [jerseySize, setJerseySize] = useState(profile.jersey_size ?? "");
  const [playedBefore, setPlayedBefore] = useState(
    profile.played_before == null ? "" : String(profile.played_before),
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <AvatarInput name="photo" currentUrl={profile.photo_url} />
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={profile.full_name}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Position (up to 2)</label>
        <PositionPicker name="position" selected={positions} onChange={setPositions} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="height" className="text-sm font-medium">
          Height
        </label>
        <input
          id="height"
          name="height"
          defaultValue={profile.height ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="selfRank" className="text-sm font-medium">
          Self Ranking
        </label>
        <select
          id="selfRank"
          name="selfRank"
          value={selfRank}
          onChange={(e) => setSelfRank(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select a Rating
          </option>
          <option value="1">1 - Very beginner</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5 - Advanced</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="jerseySize" className="text-sm font-medium">
          Jersey Size
        </label>
        <select
          id="jerseySize"
          name="jerseySize"
          value={jerseySize}
          onChange={(e) => setJerseySize(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select a Size
          </option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
        </select>
      </div>
      {registrationId && (
        <div className="flex flex-col gap-1">
          <input type="hidden" name="registrationId" value={registrationId} />
          <label htmlFor="jerseyNumber" className="text-sm font-medium">
            Jersey Number
          </label>
          <input
            id="jerseyNumber"
            name="jerseyNumber"
            type="number"
            min={0}
            max={99}
            defaultValue={jerseyNumber ?? ""}
            placeholder="Enter once known"
            className={inputClass}
          />
        </div>
      )}
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Did you play in past seasons?</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="playedBefore"
              value="true"
              checked={playedBefore === "true"}
              onChange={() => setPlayedBefore("true")}
              required
            />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="playedBefore"
              value="false"
              checked={playedBefore === "false"}
              onChange={() => setPlayedBefore("false")}
              required
            />
            No
          </label>
        </div>
      </fieldset>
      <SubmitButton pending={isPending}>Save Changes</SubmitButton>
    </form>
  );
}
