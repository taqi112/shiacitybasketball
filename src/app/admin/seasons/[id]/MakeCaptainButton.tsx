"use client";

import { useActionState } from "react";
import { makeCaptain } from "../actions";
import { FormError } from "@/components/FormError";

export function MakeCaptainButton({
  registrationId,
  seasonId,
}: {
  registrationId: string;
  seasonId: string;
}) {
  const [state, formAction] = useActionState(makeCaptain, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="registrationId" value={registrationId} />
      <input type="hidden" name="seasonId" value={seasonId} />
      <button
        type="submit"
        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
      >
        Make Captain
      </button>
      <FormError message={state?.error} />
    </form>
  );
}
