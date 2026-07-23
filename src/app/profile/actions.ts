"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth";
import { AVATAR_BUCKET, avatarPath, validateAvatarFile, withCacheBust } from "@/lib/avatar";

export type ProfileState = { error?: string; success?: boolean } | undefined;

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const selfRank = String(formData.get("selfRank") ?? "");
  const playedBefore = String(formData.get("playedBefore") ?? "");
  const registrationId = String(formData.get("registrationId") ?? "");
  const jerseyNumber = String(formData.get("jerseyNumber") ?? "");
  const positions = formData.getAll("position").map(String);

  if (positions.length === 0) {
    return { error: "Please select at least one position." };
  }

  const supabase = await createClient();

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const validationError = validateAvatarFile(photo);
    if (validationError) return { error: validationError };

    const path = avatarPath(user.id);
    const storage = createServiceRoleClient();
    const { error: uploadError } = await storage.storage
      .from(AVATAR_BUCKET)
      .upload(path, photo, { upsert: true, contentType: photo.type });

    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = storage.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    photoUrl = withCacheBust(publicUrl);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      position: positions,
      height: String(formData.get("height") ?? ""),
      self_rank: selfRank ? Number(selfRank) : null,
      jersey_size: String(formData.get("jerseySize") ?? "") || null,
      played_before: playedBefore ? playedBefore === "true" : null,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  if (registrationId) {
    const { error: registrationError } = await supabase
      .from("season_registrations")
      .update({ jersey_number: jerseyNumber ? Number(jerseyNumber) : null })
      .eq("id", registrationId)
      .eq("profile_id", user.id);

    if (registrationError) return { error: registrationError.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
