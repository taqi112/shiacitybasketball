"use client";

import { useActionState } from "react";
import { createGame } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { inputClass } from "@/lib/ui";

export function CreateGameForm({ seasonId }: { seasonId: string }) {
  const [state, formAction] = useActionState(createGame, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4"
    >
      <h2 className="font-medium">Add Game Date</h2>
      <input type="hidden" name="seasonId" value={seasonId} />
      <FormError message={state?.error} />
      <div className="flex flex-col gap-1">
        <label htmlFor="date" className="text-sm font-medium">
          Date
        </label>
        <input id="date" name="date" type="date" required className={inputClass} />
      </div>
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="startTime" className="text-sm font-medium">
            Start Time
          </label>
          <input id="startTime" name="startTime" type="time" required className={inputClass} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="endTime" className="text-sm font-medium">
            End Time
          </label>
          <input id="endTime" name="endTime" type="time" required className={inputClass} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="venue" className="text-sm font-medium">
          Venue
        </label>
        <input
          id="venue"
          name="venue"
          required
          defaultValue="BR @ The Fieldhouse, Massapequa"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="gameType" className="text-sm font-medium">
          Game Type
        </label>
        <select
          id="gameType"
          name="gameType"
          defaultValue="regular_season"
          className={inputClass}
        >
          <option value="regular_season">Regular Season</option>
          <option value="playoff">Playoff</option>
        </select>
      </div>
      <SubmitButton>Add Game</SubmitButton>
    </form>
  );
}
