import Image from "next/image";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { logout } from "@/app/actions";

export async function NavBar() {
  const profile = await getCurrentProfile();

  return (
    <nav className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
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
        <span className="font-display text-sm tracking-wide text-foreground uppercase">
          Basketball
        </span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {profile ? (
          <>
            <Link href="/profile">Profile</Link>
            {profile.is_admin && <Link href="/admin/seasons">Admin</Link>}
            <form action={logout}>
              <button type="submit">Log out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
