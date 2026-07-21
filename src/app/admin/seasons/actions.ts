"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type SeasonFormState = { error?: string } | undefined;

function parseMaxPlayers(formData: FormData): number | null {
  const raw = String(formData.get("maxPlayers") ?? "").trim();
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

// The client already converts these to real UTC ISO strings (see
// src/lib/datetime.ts) before submitting, using the browser's own
// timezone -- re-parsing with `new Date()` here would re-interpret an
// already-UTC value as the server's local time and shift it again.
function toTimestamp(formData: FormData, field: string): string | null {
  const raw = String(formData.get(field) ?? "").trim();
  return raw === "" ? null : raw;
}

export async function createSeason(
  _prevState: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const opensAt = toTimestamp(formData, "registrationOpensAt");
  const closesAt = toTimestamp(formData, "registrationClosesAt");
  const maxPlayers = parseMaxPlayers(formData);

  if (!name || !opensAt) {
    return { error: "Name and registration open date are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasons")
    .insert({
      name,
      registration_opens_at: opensAt,
      registration_closes_at: closesAt,
      max_players: maxPlayers,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/seasons");
  redirect(`/admin/seasons/${data.id}`);
}

export async function updateSeason(
  _prevState: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const opensAt = toTimestamp(formData, "registrationOpensAt");
  const closesAt = toTimestamp(formData, "registrationClosesAt");
  const maxPlayers = parseMaxPlayers(formData);

  if (!id || !name || !opensAt) {
    return { error: "Name and registration open date are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("seasons")
    .update({
      name,
      registration_opens_at: opensAt,
      registration_closes_at: closesAt,
      max_players: maxPlayers,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/admin/seasons/${id}`);
  revalidatePath("/admin/seasons");
  return undefined;
}

export async function toggleRegistrationPaymentVerified(formData: FormData) {
  await requireAdmin();

  const registrationId = String(formData.get("registrationId") ?? "");
  const seasonId = String(formData.get("seasonId") ?? "");
  const verified = formData.get("verified") === "true";

  const supabase = await createClient();
  await supabase
    .from("season_registrations")
    .update({ payment_verified: verified })
    .eq("id", registrationId);

  revalidatePath(`/admin/seasons/${seasonId}`);
}
