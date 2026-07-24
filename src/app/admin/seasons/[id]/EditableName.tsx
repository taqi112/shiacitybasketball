"use client";

import { useActionState, useRef, useTransition } from "react";
import { updateFullName } from "../actions";
import { FormError } from "@/components/FormError";

export function EditableName({
  profileId,
  seasonId,
  fullName,
}: {
  profileId: string;
  seasonId: string;
  fullName: string;
}) {
  const [state, formAction] = useActionState(updateFullName, undefined);
  const [, startTransition] = useTransition();
  const lastSavedRef = useRef(fullName);

  // Saves on blur rather than on every keystroke -- and only if the value
  // actually changed -- so it's not re-fired on tab/click-away.
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value.trim();
    if (!value || value === lastSavedRef.current) {
      e.target.value = lastSavedRef.current;
      return;
    }
    lastSavedRef.current = value;
    const formData = new FormData();
    formData.set("profileId", profileId);
    formData.set("seasonId", seasonId);
    formData.set("fullName", value);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        defaultValue={fullName}
        onBlur={handleBlur}
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
      />
      <FormError message={state?.error} />
    </div>
  );
}
