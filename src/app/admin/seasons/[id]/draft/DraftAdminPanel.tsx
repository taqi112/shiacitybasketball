"use client";

import { useActionState, useState } from "react";
import { startDraft, recordDraftPick, undoLastDraftPick } from "../../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { Draft, DraftPick, Profile, SeasonRegistration, Team } from "@/lib/types";

type TeamWithCaptain = Team & { profiles: Profile | null };
type PoolRegistrant = SeasonRegistration & { profiles: Profile | null };

function PickRow({
  seasonId,
  registrant,
}: {
  seasonId: string;
  registrant: PoolRegistrant;
}) {
  const [state, formAction] = useActionState(recordDraftPick, undefined);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2">{registrant.profiles?.full_name}</td>
      <td className="px-4 py-2">{registrant.profiles?.position?.join(" / ") || "—"}</td>
      <td className="px-4 py-2">{registrant.profiles?.self_rank ?? "—"}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">
        {registrant.captain_preference?.join(", ") || "—"}
      </td>
      <td className="px-4 py-2">
        <form action={formAction} className="flex flex-col gap-1">
          <input type="hidden" name="seasonId" value={seasonId} />
          <input type="hidden" name="registrationId" value={registrant.id} />
          <SubmitButton>Record Pick</SubmitButton>
          <FormError message={state?.error} />
        </form>
      </td>
    </tr>
  );
}

export function DraftAdminPanel({
  seasonId,
  draft,
  teams,
  captainCount,
  verifiedPoolCount,
  pool,
  recentPicks,
}: {
  seasonId: string;
  draft: Draft | null;
  teams: TeamWithCaptain[];
  captainCount: number;
  verifiedPoolCount: number;
  pool: PoolRegistrant[];
  recentPicks: DraftPick[];
}) {
  const [startState, startAction] = useActionState(startDraft, undefined);
  const [undoState, undoAction] = useActionState(undoLastDraftPick, undefined);
  const [search, setSearch] = useState("");

  if (!draft || draft.status === "not_started") {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
        <p className="text-sm text-muted-foreground">Captains: {captainCount} / 10</p>
        <p className="text-sm text-muted-foreground">
          Verified, undrafted players: {verifiedPoolCount}
        </p>
        <FormError message={startState?.error} />
        <form action={startAction}>
          <input type="hidden" name="seasonId" value={seasonId} />
          <SubmitButton>Start Draft</SubmitButton>
        </form>
      </div>
    );
  }

  const currentTeam = teams.find((t) => t.id === draft.current_team_id);
  const filteredPool = pool.filter((r) =>
    r.profiles?.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        {draft.status === "in_progress" ? (
          <p className="font-display text-xl tracking-wide uppercase">
            Pick #{draft.current_pick_number} (Round{" "}
            {Math.ceil((draft.current_pick_number ?? 1) / 10)}) — {currentTeam?.name}
            &apos;s Turn
          </p>
        ) : (
          <p className="font-display text-xl tracking-wide uppercase">Draft Complete</p>
        )}
      </div>

      <div className="flex flex-col gap-1 self-start">
        <FormError message={undoState?.error} />
        <form action={undoAction}>
          <input type="hidden" name="seasonId" value={seasonId} />
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
          >
            Undo Last Pick
          </button>
        </form>
      </div>

      {draft.status === "in_progress" && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Position</th>
                  <th className="px-4 py-2">Self Rank</th>
                  <th className="px-4 py-2">Captain Preference</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPool.map((registrant) => (
                  <PickRow key={registrant.id} seasonId={seasonId} registrant={registrant} />
                ))}
                {!filteredPool.length && (
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground" colSpan={5}>
                      No undrafted players match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 font-medium">Picks So Far</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {recentPicks.map((pick) => {
            const team = teams.find((t) => t.id === pick.team_id);
            return (
              <li key={pick.id} className="text-muted-foreground">
                Pick {pick.pick_number} — {team?.name ?? "Unknown team"} selected{" "}
                {pick.player_name}
              </li>
            );
          })}
          {!recentPicks.length && <li className="text-muted-foreground">No picks yet.</li>}
        </ul>
      </div>
    </div>
  );
}
