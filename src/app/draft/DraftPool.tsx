"use client";

import { useMemo, useState } from "react";
import { DraftPlayerCard, type PoolRegistrant } from "./DraftPlayerCard";
import type { LegacySeasonStat } from "@/lib/types";

export function DraftPool({
  registrants,
  legacyStatsByProfile,
}: {
  registrants: PoolRegistrant[];
  legacyStatsByProfile: Record<string, LegacySeasonStat[]>;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return registrants;
    return registrants.filter((r) => r.profiles?.full_name.toLowerCase().includes(query));
  }, [registrants, search]);

  return (
    <div className="flex flex-col gap-6">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search players by name..."
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />
      {filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <DraftPlayerCard
              key={r.id}
              registrant={r}
              legacyStats={r.profiles ? (legacyStatsByProfile[r.profiles.id] ?? []) : []}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {registrants.length ? `No players match "${search}".` : "No draftable players yet."}
        </p>
      )}
    </div>
  );
}
