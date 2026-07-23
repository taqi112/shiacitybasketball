"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type ScheduleActionState = { error?: string } | undefined;

export async function createGame(
  _prevState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  await requireAdmin();

  const seasonId = String(formData.get("seasonId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const venue = String(formData.get("venue") ?? "");
  const gameType = String(formData.get("gameType") ?? "regular_season");

  if (!date || !startTime || !endTime || !venue) {
    return { error: "Date, time, and venue are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("games").insert({
    season_id: seasonId,
    date,
    start_time: startTime,
    end_time: endTime,
    venue,
    game_type: gameType,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/seasons/${seasonId}/schedule`);
  revalidatePath("/schedule");
  return undefined;
}

export async function deleteGame(formData: FormData) {
  await requireAdmin();

  const gameId = String(formData.get("gameId") ?? "");
  const seasonId = String(formData.get("seasonId") ?? "");

  const supabase = await createClient();
  await supabase.from("games").delete().eq("id", gameId);

  revalidatePath(`/admin/seasons/${seasonId}/schedule`);
  revalidatePath("/schedule");
}
