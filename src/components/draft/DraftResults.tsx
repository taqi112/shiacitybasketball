"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DraftPick, Team } from "@/lib/types";

type DraftState = {
  status: "not_started" | "in_progress" | "complete";
  current_pick_number: number | null;
  current_team_id: string | null;
  total_picks: number | null;
};

// Subtle per-round tinting, echoing the colored round bands on the offline
// draftboard tool -- kept low-opacity so it reads on the dark theme instead
// of fighting it.
const ROUND_TINTS = [
  "bg-red-950/40",
  "bg-amber-950/40",
  "bg-emerald-950/40",
  "bg-blue-950/40",
  "bg-purple-950/40",
];

export function DraftResults({
  seasonId,
  initialDraft,
  teams,
  initialPicks,
}: {
  seasonId: string;
  initialDraft: DraftState;
  teams: Team[];
  initialPicks: DraftPick[];
}) {
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [picks, setPicks] = useState<DraftPick[]>(initialPicks);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`draft:${seasonId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "draft_picks",
          filter: `season_id=eq.${seasonId}`,
        },
        (payload) => {
          setPicks((prev) => {
            const next = payload.new as DraftPick;
            if (prev.some((p) => p.id === next.id)) return prev;
            return [...prev, next].sort((a, b) => a.pick_number - b.pick_number);
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drafts",
          filter: `season_id=eq.${seasonId}`,
        },
        (payload) => {
          setDraft(payload.new as DraftState);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seasonId]);

  const currentTeam = teams.find((t) => t.id === draft.current_team_id);

  const teamsOrdered = [...teams].sort(
    (a, b) => (a.draft_position ?? 999) - (b.draft_position ?? 999),
  );

  const pickByTeamRound = new Map<string, DraftPick>();
  for (const pick of picks) {
    pickByTeamRound.set(`${pick.team_id}-${pick.round}`, pick);
  }
  const maxRound = picks.length ? Math.max(...picks.map((p) => p.round)) : 0;
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-lg border border-border bg-surface p-4">
        {draft.status === "in_progress" ? (
          <p className="font-display text-xl tracking-wide uppercase">
            Pick #{draft.current_pick_number} (Round{" "}
            {Math.ceil((draft.current_pick_number ?? 1) / 10)}) — {currentTeam?.name}
            &apos;s Turn
          </p>
        ) : draft.status === "complete" ? (
          <p className="font-display text-xl tracking-wide uppercase">Draft Complete</p>
        ) : (
          <p className="font-display text-xl tracking-wide uppercase">Draft Not Started</p>
        )}
      </div>

      {rounds.length ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2">Round</th>
                {teamsOrdered.map((team, i) => (
                  <th key={team.id} className="px-3 py-2 whitespace-nowrap">
                    {i + 1}. {team.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <tr
                  key={round}
                  className={`border-b border-border last:border-0 ${ROUND_TINTS[(round - 1) % ROUND_TINTS.length]}`}
                >
                  <td className="px-3 py-2 font-display text-muted-foreground">R{round}</td>
                  {teamsOrdered.map((team) => {
                    const pick = pickByTeamRound.get(`${team.id}-${round}`);
                    return (
                      <td key={team.id} className="px-3 py-2 whitespace-nowrap">
                        {pick ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground">
                              {pick.pick_number}
                            </span>
                            <span className="font-medium">{pick.player_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No picks yet.</p>
      )}
    </div>
  );
}
