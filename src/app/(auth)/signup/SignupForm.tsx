"use client";

import { useActionState, useState } from "react";
import { signup } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { BubbleCheckbox } from "@/components/BubbleCheckbox";
import { AvatarInput } from "@/components/AvatarInput";
import { inputClass } from "@/lib/ui";

const CAPTAINS = [
  "Ali Zaidi",
  "Ali Abbas Naqvi",
  "Danesh Jafri",
  "Hasnain Zaidi",
  "Hussan Ali",
  "Hussain Khan",
  "Mo Naqvi",
  "Syed Daniyal",
  "Taqi Hussain",
  "Zain Jafri",
  "No Preference",
];

export function SignupForm() {
  const [state, formAction] = useActionState(signup, undefined);
  const [captainPreference, setCaptainPreference] = useState<string[]>(["No Preference"]);
  const [waiverConsent, setWaiverConsent] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  function toggleCaptain(name: string) {
    setCaptainPreference((prev) => {
      if (name === "No Preference") {
        return prev.includes("No Preference") ? prev : ["No Preference"];
      }
      const withoutNoPreference = prev.filter((c) => c !== "No Preference");
      if (withoutNoPreference.includes(name)) {
        const next = withoutNoPreference.filter((c) => c !== name);
        return next.length > 0 ? next : ["No Preference"];
      }
      return [...withoutNoPreference, name];
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <p className="text-sm text-muted-foreground">
        All fields are required except your profile picture.
      </p>
      <AvatarInput name="photo" />
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
        <input id="phone" name="phone" type="tel" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="age" className="text-sm font-medium">
          Age
        </label>
        <input
          id="age"
          name="age"
          type="number"
          min={1}
          max={100}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="position" className="text-sm font-medium">
          Position
        </label>
        <select id="position" name="position" defaultValue="" required className={inputClass}>
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
          required
          placeholder={'e.g. 6\'2"'}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="selfRank" className="text-sm font-medium">
          Self ranking
        </label>
        <select id="selfRank" name="selfRank" defaultValue="" required className={inputClass}>
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
        <select id="jerseySize" name="jerseySize" defaultValue="" required className={inputClass}>
          <option value="" disabled>
            Select a size
          </option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
          <option value="XXXL">XXXL</option>
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
      <div className="flex flex-col gap-1">
        <label htmlFor="availabilityNotes" className="text-sm font-medium">
          Will you be unavailable for any of the dates on the schedule so captains can take your
          availability into account during draft?
        </label>
        <textarea
          id="availabilityNotes"
          name="availabilityNotes"
          required
          rows={3}
          className={inputClass}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">
          Which captains would you like to be selected by?
        </legend>
        <p className="text-xs text-muted-foreground">
          This will be sent to the captains prior to the draft.
        </p>
        <div className="flex flex-wrap gap-2">
          {CAPTAINS.map((name) => (
            <label
              key={name}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                captainPreference.includes(name)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-foreground"
              }`}
            >
              <input
                type="checkbox"
                name="captainPreference"
                value={name}
                checked={captainPreference.includes(name)}
                onChange={() => toggleCaptain(name)}
                className="sr-only"
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
        <p className="text-sm font-medium">Liability Waiver &amp; Media Consent</p>
        <p className="text-sm text-muted-foreground">
          By submitting this form, I agree to the following: I release Shia City and its
          organizers from any liability for injuries or accidents during the event. I consent to
          being photographed and recorded, with content potentially shared on Shia City&apos;s
          Instagram (@shia.city) and other promotional materials.
        </p>
        <BubbleCheckbox
          name="waiverConsent"
          label="Yes, I give consent"
          required
          checked={waiverConsent}
          onChange={setWaiverConsent}
        />
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
        <p className="text-sm font-medium">IMPORTANT: How to secure your spot in the draft?</p>
        <p className="text-sm text-muted-foreground">
          Filling out this form does not secure your spot in the league.
        </p>
        <p className="text-sm text-muted-foreground">
          The first 60 players to Zelle $40 to (917) 863-7162 will have their spots confirmed in
          the draft pool. Even if you are one of the first 60 to fill out this form, your spot
          will not be confirmed unless you send the required payment. Any payments received after
          the first 60 will be refunded. The draft will be held within the next week.
        </p>
        <p className="text-sm text-muted-foreground">
          The remaining $140 should be paid in cash during the first week (8/28).
        </p>
        <p className="text-sm font-medium">Have you Zelled $40 to (917) 863-7162?</p>
        <BubbleCheckbox
          name="paymentConfirmed"
          label="Yes, I have paid"
          required
          checked={paymentConfirmed}
          onChange={setPaymentConfirmed}
        />
      </div>
      <SubmitButton>Sign up</SubmitButton>
    </form>
  );
}
