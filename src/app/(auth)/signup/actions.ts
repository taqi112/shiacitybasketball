"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getOpenSeason } from "@/lib/season";
import { AVATAR_BUCKET, avatarPath, validateAvatarFile } from "@/lib/avatar";

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

  // Doesn't block signup if it fails -- the account already exists by this
  // point, and blocking here would just dead-end them into "email already
  // registered" if they tried to resubmit. Instead flag it via a query param
  // so /profile can show a clear "try again" notice instead of failing silently.
  const photo = formData.get("photo");
  let photoFailed = false;
  if (photo instanceof File && photo.size > 0 && data.user) {
    const validationError = validateAvatarFile(photo);
    if (validationError) {
      photoFailed = true;
      console.error("Signup photo upload skipped (validation):", validationError);
    } else {
      const path = avatarPath(data.user.id);
      const storage = createServiceRoleClient();
      const { error: uploadError } = await storage.storage
        .from(AVATAR_BUCKET)
        .upload(path, photo, { upsert: true, contentType: photo.type });

      if (uploadError) {
        photoFailed = true;
        console.error("Signup photo upload failed:", uploadError.message);
      } else {
        const {
          data: { publicUrl },
        } = storage.storage.from(AVATAR_BUCKET).getPublicUrl(path);
        const { error: photoUrlError } = await supabase
          .from("profiles")
          .update({ photo_url: publicUrl })
          .eq("id", data.user.id);
        if (photoUrlError) {
          photoFailed = true;
          console.error("Signup photo_url save failed:", photoUrlError.message);
        }
      }
    }
  }

  redirect(photoFailed ? "/profile?photo=failed" : "/profile");
}
