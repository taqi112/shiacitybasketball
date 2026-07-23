"use client";

import { useActionState, useState } from "react";
import { createSeason } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { datetimeLocalToIso } from "@/lib/datetime";
import { inputClass } from "@/lib/ui";

export function CreateSeasonForm() {
  const [state, formAction] = useActionState(createSeason, undefined);
  const [opensAtLocal, setOpensAtLocal] = useState("");
  const [closesAtLocal, setClosesAtLocal] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="font-medium">Create a Season</h2>
      <input type="hidden" name="registrationOpensAt" value={datetimeLocalToIso(opensAtLocal)} />
      <input type="hidden" name="registrationClosesAt" value={datetimeLocalToIso(closesAtLocal)} />
      <FormError message={state?.error} />
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="registrationOpensAtLocal" className="text-sm font-medium">
          Registration Opens
        </label>
        <input
          id="registrationOpensAtLocal"
          type="datetime-local"
          value={opensAtLocal}
          onChange={(e) => setOpensAtLocal(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="registrationClosesAtLocal" className="text-sm font-medium">
          Registration Closes (optional)
        </label>
        <input
          id="registrationClosesAtLocal"
          type="datetime-local"
          value={closesAtLocal}
          onChange={(e) => setClosesAtLocal(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="maxPlayers" className="text-sm font-medium">
          Player Cap (optional)
        </label>
        <input
          id="maxPlayers"
          name="maxPlayers"
          type="number"
          min={1}
          placeholder="e.g. 60"
          className={inputClass}
        />
      </div>
      <SubmitButton>Create Season</SubmitButton>
    </form>
  );
}
