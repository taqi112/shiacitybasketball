"use client";

import { useId, useRef, useState } from "react";
import { compressIfNeeded } from "@/lib/imageCompression";

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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setProcessing(true);

    try {
      const compressed = await compressIfNeeded(file);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressed);
      if (inputRef.current) {
        inputRef.current.files = dataTransfer.files;
      }
    } catch {
      setError(
        "Couldn't process that photo. Try a different image, or take a new photo with your camera instead.",
      );
      setPreview(currentUrl ?? null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } finally {
      setProcessing(false);
    }
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
          {processing ? "Processing Image..." : preview ? "File Uploaded" : "No File Chosen"}
        </span>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <input
        ref={inputRef}
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
