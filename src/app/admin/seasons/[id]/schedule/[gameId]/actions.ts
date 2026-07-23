"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type BoxScoreState = { error?: string } | undefined;

const STAT_KEYS = ["points", "rebounds", "blocks", "steals", "three_pm"] as const;

export async function saveBoxScore(
  _prevState: BoxScoreState,
  formData: FormData,
): Promise<BoxScoreState> {
  await requireAdmin();

  const seasonId = String(formData.get("seasonId") ?? "");
  const gameId = String(formData.get("gameId") ?? "");
  const registrationIds = String(formData.get("registrationIds") ?? "")
    .split(",")
    .filter(Boolean);

  const toUpsert: Record<string, unknown>[] = [];
  const toDeleteIds: string[] = [];

  for (const registrationId of registrationIds) {
    const played = formData.get(`played_${registrationId}`) === "on";
    if (!played) {
      toDeleteIds.push(registrationId);
      continue;
    }

    const row: Record<string, unknown> = {
      season_id: seasonId,
      game_id: gameId,
      registration_id: registrationId,
    };
    for (const key of STAT_KEYS) {
      const raw = String(formData.get(`${key}_${registrationId}`) ?? "0");
      const parsed = Number(raw);
      row[key] = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
    }
    toUpsert.push(row);
  }

  const supabase = await createClient();

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("game_stats")
      .upsert(toUpsert, { onConflict: "game_id,registration_id" });
    if (error) return { error: error.message };
  }

  if (toDeleteIds.length > 0) {
    const { error } = await supabase
      .from("game_stats")
      .delete()
      .eq("game_id", gameId)
      .in("registration_id", toDeleteIds);
    if (error) return { error: error.message };
  }

  revalidatePath(`/admin/seasons/${seasonId}/schedule/${gameId}`);
  revalidatePath("/stats");
  revalidatePath(`/stats/games/${gameId}`);
  return undefined;
}
