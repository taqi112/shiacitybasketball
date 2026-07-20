"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { Profile } from "@/lib/types";

const inputClass =
  "rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      {state?.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
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
        <input
          id="position"
          name="position"
          defaultValue={profile.position ?? ""}
          className={inputClass}
        />
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
          defaultValue={profile.self_rank ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Select a rating
          </option>
          <option value="1">1 - Very beginner</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5 - Really good player</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="jerseySize" className="text-sm font-medium">
          Jersey size
        </label>
        <select
          id="jerseySize"
          name="jerseySize"
          defaultValue={profile.jersey_size ?? ""}
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
              defaultChecked={profile.played_before === true}
              required
            />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="playedBefore"
              value="false"
              defaultChecked={profile.played_before === false}
              required
            />
            No
          </label>
        </div>
      </fieldset>
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
