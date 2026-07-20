"use client";

import { useActionState, useState } from "react";
import { updateSeason } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import { isoToDatetimeLocal, datetimeLocalToIso } from "@/lib/datetime";
import type { Season } from "@/lib/types";

const inputClass =
  "rounded-md border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black";

export function SeasonEditForm({ season }: { season: Season }) {
  const [state, formAction] = useActionState(updateSeason, undefined);
  const [opensAtLocal, setOpensAtLocal] = useState(
    isoToDatetimeLocal(season.registration_opens_at),
  );
  const [closesAtLocal, setClosesAtLocal] = useState(
    isoToDatetimeLocal(season.registration_closes_at),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
      <input type="hidden" name="id" value={season.id} />
      <input type="hidden" name="registrationOpensAt" value={datetimeLocalToIso(opensAtLocal)} />
      <input type="hidden" name="registrationClosesAt" value={datetimeLocalToIso(closesAtLocal)} />
      <FormError message={state?.error} />
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input id="name" name="name" defaultValue={season.name} required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="registrationOpensAtLocal" className="text-sm font-medium">
          Registration opens
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
          Registration closes (optional)
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
          Player cap (optional)
        </label>
        <input
          id="maxPlayers"
          name="maxPlayers"
          type="number"
          min={1}
          defaultValue={season.max_players ?? ""}
          className={inputClass}
        />
      </div>
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
