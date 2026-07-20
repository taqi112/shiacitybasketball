"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOpenSeason } from "@/lib/season";

export type SignupState = { error?: string } | undefined;

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const position = String(formData.get("position") ?? "");
  const height = String(formData.get("height") ?? "");
  const selfRank = String(formData.get("selfRank") ?? "");
  const jerseySize = String(formData.get("jerseySize") ?? "");
  const playedBefore = String(formData.get("playedBefore") ?? "");

  const season = await getOpenSeason();
  if (!season) {
    return { error: "Registration is not currently open." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        position,
        height,
        self_rank: selfRank || null,
        jersey_size: jerseySize || null,
        played_before: playedBefore || null,
        season_id: season.id,
      },
    },
  });

  if (error) {
    if (error.message.includes("registration cap")) {
      return { error: "That season just filled up. Registration is now closed." };
    }
    return { error: error.message };
  }

  redirect("/profile");
}
