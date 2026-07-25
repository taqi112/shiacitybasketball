import { MAX_AVATAR_BYTES } from "@/lib/avatar";

// Vercel's serverless functions hard-cap request bodies at ~4.5MB regardless
// of Next.js's own bodySizeLimit config -- an over-that request gets dropped
// at the platform edge as a raw connection failure, before our code (and its
// friendlier validateAvatarFile error) ever runs. Compressing client-side
// keeps virtually every upload well under that ceiling.
const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.8;

// Throws rather than falling back to the original file -- gallery photos in
// particular can be large enough that a failed decode/compression (low
// memory, an unsupported format) would otherwise silently resubmit the same
// oversized file that caused the failure in the first place.
async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob || blob.size > MAX_AVATAR_BYTES) throw new Error("Could not encode image.");

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

// Only compress when the file actually exceeds the limit -- decoding a
// gallery photo at full resolution just to compress it can require holding
// 100+MB of raw pixels in memory even when the file itself is only a couple
// MB on disk (high-megapixel phone cameras compress well), which was
// crashing mobile browser tabs outright on already-small photos.
export async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= MAX_AVATAR_BYTES) return file;
  return compressImage(file);
}
