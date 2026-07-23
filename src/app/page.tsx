import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import {
  getOpenSeason,
  getNextSeason,
  getRegistrationCount,
  getCurrentSeason,
} from "@/lib/season";
import { formatTime } from "@/lib/datetime";
import { BrandTexture } from "@/components/BrandTexture";
import type { Game } from "@/lib/types";

function Tile({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col border border-border bg-surface">
      <div className="border-b border-border px-5 py-3">
        <h2 className="font-display text-lg tracking-wide text-foreground uppercase">
          {title}
        </h2>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">{children}</div>
      {href && linkLabel && (
        <Link
          href={href}
          className="border-t border-border px-5 py-3 text-sm font-medium tracking-wide uppercase"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const [profile, openSeason, nextSeason, currentSeason] = await Promise.all([
    getCurrentProfile(),
    getOpenSeason(),
    getNextSeason(),
    getCurrentSeason(),
  ]);

  const supabase = await createClient();

  let upcomingGames: Game[] = [];
  if (currentSeason) {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("season_id", currentSeason.id)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(3)
      .overrideTypes<Game[], { merge: false }>();
    upcomingGames = data ?? [];
  }

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
    ? "View Your Profile"
    : openSeason
      ? `Sign Up for ${openSeason.name}`
      : "Log In";

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
      <section className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row">
          <Tile title="Next Games" href="/schedule" linkLabel="Full Schedule">
            {upcomingGames.length ? (
              <ul className="flex flex-col gap-3">
                {upcomingGames.map((game) => (
                  <li key={game.id} className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {new Date(`${game.date}T00:00:00`).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(game.start_time)}–{formatTime(game.end_time)} · {game.venue}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No games scheduled yet.</p>
            )}
          </Tile>
          <Tile title="Standings">
            <p className="text-sm text-muted-foreground">
              Standings open once the season starts.
            </p>
          </Tile>
          <Tile title="Draft">
            <p className="text-sm text-muted-foreground">Teams and draft results coming soon.</p>
          </Tile>
        </div>
      </section>
    </div>
  );
}
