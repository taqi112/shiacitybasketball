"use client";

import { useId, useState } from "react";

export function AvatarInput({
  name,
  currentUrl,
  required,
}: {
  name: string;
  currentUrl?: string | null;
  required?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const inputId = useId();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        Profile Picture
      </label>
      <p className="text-xs text-muted-foreground">
        Please upload a clear photo of your face.
      </p>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Profile preview"
          className="h-24 w-24 rounded-full border border-border object-cover"
        />
      )}
      <div className="flex items-center gap-3">
        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground"
        >
          Choose File
        </label>
        <span className="text-sm text-muted-foreground">
          {preview ? "File Uploaded" : "No File Chosen"}
        </span>
      </div>
      <input
        id={inputId}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        required={required && !currentUrl}
        className="sr-only"
      />
    </div>
  );
}
