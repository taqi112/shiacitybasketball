"use client";

import { useActionState } from "react";
import { makeCaptain, undoMakeCaptain } from "../actions";
import { FormError } from "@/components/FormError";

export function MakeCaptainButton({
  registrationId,
  seasonId,
  isCaptain,
}: {
  registrationId: string;
  seasonId: string;
  isCaptain: boolean;
}) {
  const [state, formAction] = useActionState(
    isCaptain ? undoMakeCaptain : makeCaptain,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="registrationId" value={registrationId} />
      <input type="hidden" name="seasonId" value={seasonId} />
      <button
        type="submit"
        className={
          isCaptain
            ? "rounded-full border border-border px-3 py-1 text-xs text-red-500"
            : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
        }
      >
        {isCaptain ? "Undo Captain" : "Make Captain"}
      </button>
      <FormError message={state?.error} />
    </form>
  );
}
