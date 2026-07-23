"use client";

import { useActionState, useState, useTransition } from "react";
import { saveBoxScore } from "./actions";
import { FormError } from "@/components/FormError";
import type { Profile, SeasonRegistration, Team, GameStat } from "@/lib/types";

type RegistrantRow = SeasonRegistration & { profiles: Profile | null; teams: Team | null };

const STAT_FIELDS = [
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "blocks", label: "BLK" },
  { key: "steals", label: "STL" },
  { key: "three_pm", label: "3PM" },
] as const;

export function BoxScoreForm({
  seasonId,
  gameId,
  registrants,
  existingStats,
}: {
  seasonId: string;
  gameId: string;
  registrants: RegistrantRow[];
  existingStats: GameStat[];
}) {
  const [state, formAction] = useActionState(saveBoxScore, undefined);
  const [, startTransition] = useTransition();

  const statsByRegistration = new Map(existingStats.map((s) => [s.registration_id, s]));

  const [played, setPlayed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const r of registrants) {
      initial[r.id] = statsByRegistration.has(r.id);
    }
    return initial;
  });

  // Not a plain <form action={fn}> -- editing an already-entered box score
  // would otherwise snap every field back to its original server-rendered
  // value after a successful save (the same React 19 behavior documented in
  // ProfileForm.tsx / SelfRankSelect.tsx).
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("seasonId", seasonId);
    formData.set("gameId", gameId);
    formData.set("registrationIds", registrants.map((r) => r.id).join(","));
    startTransition(() => {
      formAction(formData);
    });
  }

  const groups = new Map<string, RegistrantRow[]>();
  for (const r of registrants) {
    const teamName = r.teams?.name ?? "Unassigned";
    const list = groups.get(teamName) ?? [];
    list.push(r);
    groups.set(teamName, list);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FormError message={state?.error} />
      {[...groups.entries()].map(([teamName, teamRegistrants]) => (
        <div key={teamName} className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2">{teamName}</th>
                <th className="px-4 py-2">Played</th>
                {STAT_FIELDS.map((f) => (
                  <th key={f.key} className="px-4 py-2">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamRegistrants.map((r) => {
                const existing = statsByRegistration.get(r.id);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{r.profiles?.full_name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        name={`played_${r.id}`}
                        defaultChecked={played[r.id]}
                        onChange={(e) =>
                          setPlayed((prev) => ({ ...prev, [r.id]: e.target.checked }))
                        }
                      />
                    </td>
                    {STAT_FIELDS.map((f) => (
                      <td key={f.key} className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          name={`${f.key}_${r.id}`}
                          defaultValue={existing ? existing[f.key] : 0}
                          disabled={!played[r.id]}
                          className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-sm disabled:opacity-40"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      <button
        type="submit"
        className="self-start rounded-full bg-accent px-6 py-2 font-medium text-accent-foreground"
      >
        Save Box Score
      </button>
    </form>
  );
}
