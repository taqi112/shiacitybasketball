export const AVATAR_BUCKET = "avatars";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

// No extension -- re-uploading always overwrites the same object instead of
// leaving old files behind in storage.
export function avatarPath(userId: string): string {
  return `${userId}/avatar`;
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return "Profile picture must be a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Profile picture must be smaller than 5MB.";
  }
  return null;
}
