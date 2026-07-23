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

  const rosterByTeam = new Map<string, DraftPick[]>();
  for (const pick of picks) {
    const list = rosterByTeam.get(pick.team_id) ?? [];
    list.push(pick);
    rosterByTeam.set(pick.team_id, list);
  }

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

      <div>
        <h2 className="mb-2 font-medium">Picks In Order</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {picks.map((pick) => {
            const team = teams.find((t) => t.id === pick.team_id);
            return (
              <li key={pick.id} className="text-muted-foreground">
                Pick {pick.pick_number} — {team?.name ?? "Unknown team"} selected{" "}
                {pick.player_name}
              </li>
            );
          })}
          {!picks.length && <li className="text-muted-foreground">No picks yet.</li>}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-medium">Rosters</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-2 font-medium">{team.name}</p>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {(rosterByTeam.get(team.id) ?? []).map((pick) => (
                  <li key={pick.id}>{pick.player_name}</li>
                ))}
                {!(rosterByTeam.get(team.id) ?? []).length && <li>No picks yet.</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
