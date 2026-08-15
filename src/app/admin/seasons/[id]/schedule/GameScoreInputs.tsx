"use client";

import { useActionState, useRef, useTransition } from "react";
import { updateGameScore } from "./actions";
import { FormError } from "@/components/FormError";

export function GameScoreInputs({
  gameId,
  seasonId,
  homeScore,
  awayScore,
}: {
  gameId: string;
  seasonId: string;
  homeScore: number | null;
  awayScore: number | null;
}) {
  const [state, formAction] = useActionState(updateGameScore, undefined);
  const [, startTransition] = useTransition();
  const homeRef = useRef<HTMLInputElement>(null);
  const awayRef = useRef<HTMLInputElement>(null);
  const lastSavedRef = useRef(`${homeScore ?? ""}-${awayScore ?? ""}`);

  // Saves both fields together on blur -- a lone home/away score isn't
  // meaningful, and this avoids firing a save on every keystroke.
  function handleBlur() {
    const home = homeRef.current?.value.trim() ?? "";
    const away = awayRef.current?.value.trim() ?? "";
    const key = `${home}-${away}`;
    if (key === lastSavedRef.current) return;
    lastSavedRef.current = key;
    const formData = new FormData();
    formData.set("gameId", gameId);
    formData.set("seasonId", seasonId);
    formData.set("homeScore", home);
    formData.set("awayScore", away);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          ref={homeRef}
          type="number"
          min={0}
          defaultValue={homeScore ?? ""}
          onBlur={handleBlur}
          placeholder="—"
          className="w-14 rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <input
          ref={awayRef}
          type="number"
          min={0}
          defaultValue={awayScore ?? ""}
          onBlur={handleBlur}
          placeholder="—"
          className="w-14 rounded-md border border-border bg-surface px-2 py-1 text-sm"
        />
      </div>
      <FormError message={state?.error} />
    </div>
  );
}
