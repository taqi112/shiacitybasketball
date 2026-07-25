"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { updateAvatar } from "../actions";
import { compressIfNeeded } from "@/lib/imageCompression";
import { FormError } from "@/components/FormError";

export function EditableAvatar({
  profileId,
  seasonId,
  photoUrl,
  fullName,
}: {
  profileId: string;
  seasonId: string;
  photoUrl: string | null;
  fullName: string;
}) {
  const [state, formAction] = useActionState(updateAvatar, undefined);
  const [, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setProcessing(true);

    try {
      const compressed = await compressIfNeeded(file);
      const formData = new FormData();
      formData.set("profileId", profileId);
      formData.set("seasonId", seasonId);
      formData.set("photo", compressed);
      startTransition(() => {
        formAction(formData);
      });
    } catch {
      setError("Couldn't process that photo.");
      setPreview(photoUrl);
    } finally {
      setProcessing(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <label htmlFor={inputId} className="cursor-pointer">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={fullName}
            className="h-10 w-10 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-xs text-muted-foreground">
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
      {processing && <span className="text-xs text-muted-foreground">Uploading…</span>}
      <FormError message={state?.error ?? error ?? undefined} />
    </div>
  );
}
