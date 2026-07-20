import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SeasonEditForm } from "./SeasonEditForm";
import type { Profile, Season, SeasonRegistration } from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null };

export default async function AdminSeasonDetailPage({
  params,
}: PageProps<"/admin/seasons/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .single<Season>();

  if (!season) notFound();

  const { data: registrants } = await supabase
    .from("season_registrations")
    .select("*, profiles(*)")
    .eq("season_id", id)
    .order("registered_at", { ascending: true })
    .overrideTypes<RegistrantRow[], { merge: false }>();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-4 text-xl font-semibold">{season.name}</h1>
        <SeasonEditForm season={season} />
      </div>
      <div>
        <h2 className="mb-2 font-medium">
          Registrants ({registrants?.length ?? 0}
          {season.max_players != null ? ` / ${season.max_players}` : ""})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[.08] dark:border-white/[.145]">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Jersey #</th>
                <th className="px-4 py-2">Captain</th>
                <th className="px-4 py-2">Team</th>
              </tr>
            </thead>
            <tbody>
              {registrants?.map((registrant) => (
                <tr key={registrant.id} className="border-b border-black/[.08] last:border-0 dark:border-white/[.145]">
                  <td className="px-4 py-2">{registrant.profiles?.full_name}</td>
                  <td className="px-4 py-2">
                    {registrant.profiles?.email}
                    {registrant.profiles?.phone && ` · ${registrant.profiles.phone}`}
                  </td>
                  <td className="px-4 py-2">{registrant.jersey_number ?? "—"}</td>
                  <td className="px-4 py-2">{registrant.is_captain ? "Yes" : "—"}</td>
                  <td className="px-4 py-2">{registrant.team_id ? "Assigned" : "—"}</td>
                </tr>
              ))}
              {!registrants?.length && (
                <tr>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400" colSpan={5}>
                    No registrants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
