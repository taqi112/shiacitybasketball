"use client";

import { useActionState, useTransition } from "react";
import { updateSelfRank } from "../actions";
import { FormError } from "@/components/FormError";

export function SelfRankSelect({
  profileId,
  seasonId,
  selfRank,
}: {
  profileId: string;
  seasonId: string;
  selfRank: number | null;
}) {
  const [state, formAction] = useActionState(updateSelfRank, undefined);
  const [, startTransition] = useTransition();

  // Not a plain <form action={formAction}> -- that resets this uncontrolled
  // select back to its original server-rendered value after a successful
  // submission (the same React 19 behavior documented in ProfileForm.tsx),
  // which would visibly snap the dropdown back to the old rank for a moment.
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.set("profileId", profileId);
    formData.set("seasonId", seasonId);
    formData.set("selfRank", e.target.value);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        defaultValue={selfRank ?? ""}
        onChange={handleChange}
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
      >
        <option value="">—</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      <FormError message={state?.error} />
    </div>
  );
}
