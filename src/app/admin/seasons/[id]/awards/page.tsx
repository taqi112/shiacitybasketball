import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddAwardForm } from "./AddAwardForm";
import { deleteAward } from "./actions";
import type { Season, SeasonRegistration, Profile, SeasonAward } from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null };
type AwardRow = SeasonAward & { profiles: Profile | null };

export default async function AdminAwardsPage({
  params,
}: PageProps<"/admin/seasons/[id]/awards">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .single<Season>();

  if (!season) notFound();

  const [{ data: registrants }, { data: awards }] = await Promise.all([
    supabase
      .from("season_registrations")
      .select("*, profiles(*)")
      .eq("season_id", id)
      .order("registered_at", { ascending: true })
      .overrideTypes<RegistrantRow[], { merge: false }>(),
    supabase
      .from("season_awards")
      .select("*, profiles(*)")
      .eq("season_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .overrideTypes<AwardRow[], { merge: false }>(),
  ]);

  const registrantOptions = (registrants ?? [])
    .filter((r) => r.profiles)
    .map((r) => ({ id: r.profiles!.id, name: r.profiles!.full_name }));

  const existingAwardNames = [...new Set((awards ?? []).map((a) => a.award_name))];

  const groups = new Map<string, AwardRow[]>();
  for (const award of awards ?? []) {
    const list = groups.get(award.award_name) ?? [];
    list.push(award);
    groups.set(award.award_name, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">{season.name} — Awards</h1>
      <div className="flex flex-col gap-4">
        {[...groups.entries()].map(([awardName, recipients]) => (
          <div key={awardName} className="rounded-lg border border-border">
            <p className="border-b border-border px-4 py-2 font-medium">{awardName}</p>
            <ul className="flex flex-col">
              {recipients.map((award) => (
                <li
                  key={award.id}
                  className="flex items-center justify-between border-b border-border px-4 py-2 text-sm last:border-0"
                >
                  <span>{award.profiles?.full_name ?? award.recipient_name}</span>
                  <form action={deleteAward}>
                    <input type="hidden" name="awardId" value={award.id} />
                    <input type="hidden" name="seasonId" value={id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!groups.size && (
          <p className="text-sm text-muted-foreground">No awards added yet.</p>
        )}
      </div>
      <AddAwardForm
        seasonId={id}
        registrants={registrantOptions}
        existingAwardNames={existingAwardNames}
      />
    </div>
  );
}
