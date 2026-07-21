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
  const age = String(formData.get("age") ?? "");
  const selfRank = String(formData.get("selfRank") ?? "");
  const jerseySize = String(formData.get("jerseySize") ?? "");
  const playedBefore = String(formData.get("playedBefore") ?? "");
  const availabilityNotes = String(formData.get("availabilityNotes") ?? "");
  const captainPreference = formData.getAll("captainPreference").map(String);
  const waiverConsent = formData.get("waiverConsent") === "true";
  const paymentConfirmed = formData.get("paymentConfirmed") === "true";

  if (!waiverConsent) {
    return { error: "You must agree to the liability waiver and media consent to sign up." };
  }

  if (!paymentConfirmed) {
    return { error: "You must Zelle the $40 payment before signing up." };
  }

  const season = await getOpenSeason();
  if (!season) {
    return { error: "Registration is not currently open." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
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
        age: age || null,
        availability_notes: availabilityNotes || null,
        captain_preference: captainPreference,
        waiver_consent: waiverConsent,
        payment_confirmed: paymentConfirmed,
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

  // When "confirm email" is on, Supabase returns a fake success (an empty
  // identities array, no error) for an already-registered email, instead of
  // a normal error -- this is intentional, to stop attackers from probing
  // which emails exist. Detect that case explicitly.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "An account with that email already exists. Try logging in instead." };
  }

  redirect("/profile");
}
