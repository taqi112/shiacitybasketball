import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12">
      <nav className="flex gap-4 text-sm font-medium">
        <Link href="/admin/seasons">Seasons</Link>
      </nav>
      {children}
    </div>
  );
}
