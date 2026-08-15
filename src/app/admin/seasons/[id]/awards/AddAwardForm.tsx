"use client";

import { useActionState } from "react";
import { addAward } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { inputClass } from "@/lib/ui";

export function AddAwardForm({
  seasonId,
  registrants,
  existingAwardNames,
}: {
  seasonId: string;
  registrants: { id: string; name: string }[];
  existingAwardNames: string[];
}) {
  const [state, formAction] = useActionState(addAward, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4"
    >
      <h2 className="font-medium">Add Award</h2>
      <input type="hidden" name="seasonId" value={seasonId} />
      <FormError message={state?.error} />
      <div className="flex flex-col gap-1">
        <label htmlFor="awardName" className="text-sm font-medium">
          Award Name
        </label>
        <input
          id="awardName"
          name="awardName"
          required
          list="award-name-suggestions"
          placeholder="e.g. All-Shia City 1st Team"
          className={inputClass}
        />
        <datalist id="award-name-suggestions">
          {existingAwardNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          Reuse the exact same name to add more players to the same award (e.g. a 5-player team).
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="profileId" className="text-sm font-medium">
          Player
        </label>
        <select id="profileId" name="profileId" defaultValue="" className={inputClass}>
          <option value="">— none, use custom name below —</option>
          {registrants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="recipientName" className="text-sm font-medium">
          Or Custom Name
        </label>
        <input
          id="recipientName"
          name="recipientName"
          placeholder="e.g. Coach Ali (for non-player awards)"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="sortOrder" className="text-sm font-medium">
          Sort Order (optional)
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          placeholder="Lower shows first"
          className={inputClass}
        />
      </div>
      <SubmitButton>Add Award</SubmitButton>
    </form>
  );
}
