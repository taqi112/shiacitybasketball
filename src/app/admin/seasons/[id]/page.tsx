import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SeasonEditForm } from "./SeasonEditForm";
import { MakeCaptainButton } from "./MakeCaptainButton";
import { SelfRankSelect } from "./SelfRankSelect";
import { EditableName } from "./EditableName";
import { EditableHeight } from "./EditableHeight";
import { EditableAvatar } from "./EditableAvatar";
import { toggleRegistrationPaymentVerified, toggleFullPaymentVerified } from "../actions";
import type { Profile, Season, SeasonRegistration, Team } from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null; teams: Team | null };

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
    .select("*, profiles(*), teams(*)")
    .eq("season_id", id)
    .order("registered_at", { ascending: true })
    .overrideTypes<RegistrantRow[], { merge: false }>();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{season.name}</h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/seasons/${id}/schedule`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
            >
              Schedule →
            </Link>
            <Link
              href={`/admin/seasons/${id}/draft`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
            >
              Draft Room →
            </Link>
            <Link
              href={`/admin/seasons/${id}/awards`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
            >
              Awards →
            </Link>
          </div>
        </div>
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
                <th className="px-4 py-2">Photo</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Jersey #</th>
                <th className="px-4 py-2">Age</th>
                <th className="px-4 py-2">Height</th>
                <th className="px-4 py-2">Position</th>
                <th className="px-4 py-2">Self Rank</th>
                <th className="px-4 py-2">Team</th>
                <th className="px-4 py-2">Captain</th>
                <th className="px-4 py-2">$40 Payment Verified</th>
                <th className="px-4 py-2">Full $180 Payment Verified</th>
              </tr>
            </thead>
            <tbody>
              {registrants?.map((registrant) => (
                <tr key={registrant.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    {registrant.profiles && (
                      <EditableAvatar
                        profileId={registrant.profiles.id}
                        seasonId={id}
                        photoUrl={registrant.profiles.photo_url}
                        fullName={registrant.profiles.full_name}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {registrant.profiles && (
                      <EditableName
                        profileId={registrant.profiles.id}
                        seasonId={id}
                        fullName={registrant.profiles.full_name}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {registrant.profiles?.email}
                    {registrant.profiles?.phone && ` · ${registrant.profiles.phone}`}
                  </td>
                  <td className="px-4 py-2">{registrant.jersey_number ?? "—"}</td>
                  <td className="px-4 py-2">{registrant.profiles?.age ?? "—"}</td>
                  <td className="px-4 py-2">
                    {registrant.profiles && (
                      <EditableHeight
                        profileId={registrant.profiles.id}
                        seasonId={id}
                        height={registrant.profiles.height}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {registrant.profiles?.position?.length
                      ? registrant.profiles.position.join(" / ")
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {registrant.profiles && (
                      <SelfRankSelect
                        profileId={registrant.profiles.id}
                        seasonId={id}
                        selfRank={registrant.profiles.self_rank}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">{registrant.teams?.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    <MakeCaptainButton
                      registrationId={registrant.id}
                      seasonId={id}
                      isCaptain={registrant.is_captain}
                    />
                  </td>
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
                        {registrant.payment_verified ? "Verified" : "Mark Verified"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={toggleFullPaymentVerified}>
                      <input type="hidden" name="registrationId" value={registrant.id} />
                      <input type="hidden" name="seasonId" value={id} />
                      <input
                        type="hidden"
                        name="verified"
                        value={String(!registrant.full_payment_verified)}
                      />
                      <button
                        type="submit"
                        className={
                          registrant.full_payment_verified
                            ? "rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                            : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                        }
                      >
                        {registrant.full_payment_verified ? "Verified" : "Mark Verified"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!registrants?.length && (
                <tr>
                  <td className="px-4 py-2 text-muted-foreground" colSpan={12}>
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
