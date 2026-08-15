"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type AwardActionState = { error?: string } | undefined;

export async function addAward(
  _prevState: AwardActionState,
  formData: FormData,
): Promise<AwardActionState> {
  await requireAdmin();

  const seasonId = String(formData.get("seasonId") ?? "");
  const awardName = String(formData.get("awardName") ?? "").trim();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();

  if (!awardName) return { error: "Award name is required." };
  if (!profileId && !recipientName) {
    return { error: "Pick a player or enter a custom recipient name." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("season_awards").insert({
    season_id: seasonId,
    award_name: awardName,
    profile_id: profileId || null,
    recipient_name: profileId ? null : recipientName,
    sort_order: sortOrderRaw ? Number(sortOrderRaw) : 0,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/seasons/${seasonId}/awards`);
  revalidatePath("/awards");
  return undefined;
}

export async function deleteAward(formData: FormData) {
  await requireAdmin();

  const awardId = String(formData.get("awardId") ?? "");
  const seasonId = String(formData.get("seasonId") ?? "");

  const supabase = await createClient();
  await supabase.from("season_awards").delete().eq("id", awardId);

  revalidatePath(`/admin/seasons/${seasonId}/awards`);
  revalidatePath("/awards");
}
