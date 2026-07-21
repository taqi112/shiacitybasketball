"use client";

import { useFormStatus } from "react-dom";

// `pending` lets a caller override the status explicitly -- needed for forms
// that don't submit via a plain <form action={fn}> (see ProfileForm), since
// useFormStatus only tracks that specific submission mechanism.
export function SubmitButton({
  children,
  pending: pendingOverride,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingOverride ?? formPending;

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-50"
    >
      {pending ? "Working..." : children}
    </button>
  );
}
