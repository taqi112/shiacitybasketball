"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ProfileState = { error?: string; success?: boolean } | undefined;

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const selfRank = String(formData.get("selfRank") ?? "");
  const playedBefore = String(formData.get("playedBefore") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      position: String(formData.get("position") ?? ""),
      height: String(formData.get("height") ?? ""),
      self_rank: selfRank ? Number(selfRank) : null,
      jersey_size: String(formData.get("jerseySize") ?? "") || null,
      played_before: playedBefore ? playedBefore === "true" : null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
