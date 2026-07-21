import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SeasonEditForm } from "./SeasonEditForm";
import { toggleRegistrationPaymentVerified } from "../actions";
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Jersey #</th>
                <th className="px-4 py-2">Captain</th>
                <th className="px-4 py-2">Team</th>
                <th className="px-4 py-2">Payment claimed</th>
                <th className="px-4 py-2">Payment verified</th>
              </tr>
            </thead>
            <tbody>
              {registrants?.map((registrant) => (
                <tr key={registrant.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{registrant.profiles?.full_name}</td>
                  <td className="px-4 py-2">
                    {registrant.profiles?.email}
                    {registrant.profiles?.phone && ` · ${registrant.profiles.phone}`}
                  </td>
                  <td className="px-4 py-2">{registrant.jersey_number ?? "—"}</td>
                  <td className="px-4 py-2">{registrant.is_captain ? "Yes" : "—"}</td>
                  <td className="px-4 py-2">{registrant.team_id ? "Assigned" : "—"}</td>
                  <td className="px-4 py-2">{registrant.payment_confirmed ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">
                    <form action={toggleRegistrationPaymentVerified}>
                      <input type="hidden" name="registrationId" value={registrant.id} />
                      <input type="hidden" name="seasonId" value={id} />
                      <input
                        type="hidden"
                        name="verified"
                        value={String(!registrant.payment_verified)}
                      />
                      <button
                        type="submit"
                        className={
                          registrant.payment_verified
                            ? "rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                            : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                        }
                      >
                        {registrant.payment_verified ? "Verified" : "Mark verified"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!registrants?.length && (
                <tr>
                  <td className="px-4 py-2 text-muted-foreground" colSpan={7}>
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
