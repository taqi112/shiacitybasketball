import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { logout } from "@/app/actions";

export async function NavBar() {
  const profile = await getCurrentProfile();

  return (
    <nav className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
      <Link href="/" className="font-semibold">
        Shia City Basketball
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
