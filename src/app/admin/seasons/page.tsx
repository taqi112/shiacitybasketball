import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateSeasonForm } from "./CreateSeasonForm";
import type { Season } from "@/lib/types";

export default async function AdminSeasonsPage() {
  const supabase = await createClient();
  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .order("registration_opens_at", { ascending: false })
    .overrideTypes<Season[], { merge: false }>();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-4 text-xl font-semibold">Seasons</h1>
        <ul className="flex flex-col gap-2">
          {seasons?.map((season) => (
            <li key={season.id}>
              <Link
                href={`/admin/seasons/${season.id}`}
                className="flex flex-col gap-1 rounded-md border border-border px-4 py-4 hover:bg-white/[.05]"
              >
                <span className="font-medium">{season.name}</span>
                <span className="text-sm text-muted-foreground">
                  Opens {new Date(season.registration_opens_at).toLocaleDateString()}
                  {season.max_players != null && ` · cap ${season.max_players}`}
                </span>
              </Link>
            </li>
          ))}
          {!seasons?.length && (
            <li className="text-sm text-muted-foreground">No seasons yet.</li>
          )}
        </ul>
      </div>
      <CreateSeasonForm />
    </div>
  );
}
