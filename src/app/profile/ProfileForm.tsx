"use client";

import { useActionState, useState, useTransition } from "react";
import { updateProfile } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { Profile } from "@/lib/types";
import { inputClass } from "@/lib/ui";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateProfile, undefined);
  const [isPending, startTransition] = useTransition();

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

  const [position, setPosition] = useState(profile.position ?? "");
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
      {state?.success && (
        <p className="rounded-md border border-emerald-900/40 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-300">
          Profile updated.
        </p>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
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
        <label htmlFor="position" className="text-sm font-medium">
          Position
        </label>
        <select
          id="position"
          name="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select a position
          </option>
          <option value="Point Guard">Point Guard</option>
          <option value="Shooting Guard">Shooting Guard</option>
          <option value="Small Forward">Small Forward</option>
          <option value="Power Forward">Power Forward</option>
          <option value="Center">Center</option>
        </select>
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
          Self ranking
        </label>
        <select
          id="selfRank"
          name="selfRank"
          value={selfRank}
          onChange={(e) => setSelfRank(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select a rating
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
          Jersey size
        </label>
        <select
          id="jerseySize"
          name="jerseySize"
          value={jerseySize}
          onChange={(e) => setJerseySize(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select a size
          </option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
        </select>
      </div>
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
      <SubmitButton pending={isPending}>Save changes</SubmitButton>
    </form>
  );
}
