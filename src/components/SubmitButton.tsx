"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
    >
      {pending ? "Working..." : children}
    </button>
  );
}
