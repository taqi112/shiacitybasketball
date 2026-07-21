import Image from "next/image";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { getOpenSeason, getNextSeason, getRegistrationCount } from "@/lib/season";
import { BrandTexture } from "@/components/BrandTexture";

export default async function Home() {
  const [profile, openSeason, nextSeason] = await Promise.all([
    getCurrentProfile(),
    getOpenSeason(),
    getNextSeason(),
  ]);

  const spotsRemaining =
    openSeason?.max_players != null
      ? openSeason.max_players - (await getRegistrationCount(openSeason.id))
      : null;

  let statusText: string;
  if (openSeason) {
    statusText =
      spotsRemaining != null
        ? `${spotsRemaining} spot${spotsRemaining === 1 ? "" : "s"} left for ${openSeason.name}`
        : `Registration is open for ${openSeason.name}`;
  } else if (nextSeason) {
    statusText = `Registration for ${nextSeason.name} opens ${new Date(
      nextSeason.registration_opens_at,
    ).toLocaleDateString()}`;
  } else {
    statusText = "Registration is closed right now. Check back soon.";
  }

  const ctaHref = profile ? "/profile" : openSeason ? "/signup" : "/login";
  const ctaLabel = profile
    ? "View your profile"
    : openSeason
      ? `Sign up for ${openSeason.name}`
      : "Log in";

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex min-h-[70dvh] flex-col items-center justify-center gap-6 overflow-hidden px-6 py-24 text-center">
        <BrandTexture className="absolute inset-0" />
        <div className="relative z-10 inline-flex rounded-3xl bg-white p-5 shadow-2xl shadow-black/50">
          <Image
            src="/shiaCityLogo2.png"
            alt="Shia City"
            width={180}
            height={179}
            priority
            className="h-auto w-32 sm:w-40"
          />
        </div>
        <p className="relative z-10 text-sm tracking-widest text-muted-foreground uppercase">
          Basketball League
        </p>
        <h1 className="relative z-10 font-display text-4xl tracking-wide text-foreground uppercase sm:text-6xl">
          Shia City Basketball
        </h1>
        <p className="relative z-10 text-muted-foreground">{statusText}</p>
        <Link
          href={ctaHref}
          className="relative z-10 rounded-full bg-accent px-8 py-3 font-medium text-accent-foreground"
        >
          {ctaLabel}
        </Link>
      </section>
      <p className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Schedule, standings, and stats are coming soon.
      </p>
    </div>
  );
}
