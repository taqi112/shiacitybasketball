import Link from "next/link";
import { getOpenSeason, getRegistrationCount } from "@/lib/season";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const season = await getOpenSeason();

  if (!season) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Registration is closed</h1>
        <p className="text-sm text-muted-foreground">
          There&apos;s no open registration window right now. Check back soon.
        </p>
        <p className="text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  const spotsRemaining =
    season.max_players != null
      ? season.max_players - (await getRegistrationCount(season.id))
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Sign up for {season.name}</h1>
        {spotsRemaining != null && (
          <p className="text-sm text-muted-foreground">
            {spotsRemaining} spot{spotsRemaining === 1 ? "" : "s"} left
          </p>
        )}
      </div>
      <SignupForm />
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
