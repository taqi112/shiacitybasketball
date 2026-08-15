import Image from "next/image";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { logout } from "@/app/actions";

export async function NavBar() {
  const profile = await getCurrentProfile();

  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border bg-background px-4 py-3 sm:px-6 sm:py-4">
      <Link href="/" className="flex items-center gap-2">
        <span className="inline-flex overflow-hidden rounded-md bg-white">
          <Image
            src="/shiaCityLogo2.png"
            alt="Shia City"
            width={40}
            height={40}
            className="h-9 w-9 object-cover"
          />
        </span>
        <span className="hidden font-display text-sm tracking-wide text-foreground uppercase sm:inline">
          Basketball
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:gap-x-4">
        {profile ? (
          <>
            <Link href="/profile">Profile</Link>
            <Link href="/schedule">Schedule</Link>
            <Link href="/standings">Stats &amp; Standings</Link>
            <Link href="/awards">Awards</Link>
            <Link href="/previous-seasons">Previous Seasons</Link>
            {profile.is_admin && <Link href="/admin/seasons">Admin</Link>}
            <form action={logout} className="contents">
              <button type="submit" className="cursor-pointer border-0 bg-transparent p-0">
                Log Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log In</Link>
            <Link href="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
