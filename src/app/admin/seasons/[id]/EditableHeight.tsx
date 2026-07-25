"use client";

import { useActionState, useRef, useTransition } from "react";
import { updateHeight } from "../actions";
import { FormError } from "@/components/FormError";

export function EditableHeight({
  profileId,
  seasonId,
  height,
}: {
  profileId: string;
  seasonId: string;
  height: string | null;
}) {
  const [state, formAction] = useActionState(updateHeight, undefined);
  const [, startTransition] = useTransition();
  const lastSavedRef = useRef(height ?? "");

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value.trim();
    if (value === lastSavedRef.current) return;
    lastSavedRef.current = value;
    const formData = new FormData();
    formData.set("profileId", profileId);
    formData.set("seasonId", seasonId);
    formData.set("height", value);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        defaultValue={height ?? ""}
        placeholder="—"
        onBlur={handleBlur}
        className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm"
      />
      <FormError message={state?.error} />
    </div>
  );
}
