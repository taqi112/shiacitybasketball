"use client";

import { useId, useRef, useState } from "react";

// Vercel's serverless functions hard-cap request bodies at ~4.5MB regardless
// of Next.js's own bodySizeLimit config -- an over-that request gets dropped
// at the platform edge as a raw connection failure, before our code (and its
// friendlier validateAvatarFile error) ever runs. Compressing client-side
// keeps virtually every upload well under that ceiling.
const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.8;

async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setProcessing(true);

    const compressed = await compressImage(file);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(compressed);
    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files;
    }

    setProcessing(false);
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
