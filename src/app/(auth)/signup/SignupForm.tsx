"use client";

import { useActionState } from "react";
import { signup } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";

const inputClass =
  "rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black";

export function SignupForm() {
  const [state, formAction] = useActionState(signup, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </label>
        <input id="fullName" name="fullName" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <input id="phone" name="phone" type="tel" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="position" className="text-sm font-medium">
          Position
        </label>
        <input id="position" name="position" placeholder="e.g. Guard" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="height" className="text-sm font-medium">
          Height
        </label>
        <input id="height" name="height" placeholder={'e.g. 6\'2"'} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="selfRank" className="text-sm font-medium">
          Self ranking
        </label>
        <select id="selfRank" name="selfRank" defaultValue="" className={inputClass}>
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
        <select id="jerseySize" name="jerseySize" defaultValue="" className={inputClass}>
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
            <input type="radio" name="playedBefore" value="true" required />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="playedBefore" value="false" required />
            No
          </label>
        </div>
      </fieldset>
      <SubmitButton>Sign up</SubmitButton>
    </form>
  );
}
