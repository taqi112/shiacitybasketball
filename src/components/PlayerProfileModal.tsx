"use client";

import { useEffect } from "react";
import { PlayerProfileCard } from "./PlayerProfileCard";
import type { PlayerPopupData } from "@/lib/playerPopup";

export function PlayerProfileModal({ data, onClose }: { data: PlayerPopupData; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-lg leading-none"
        >
          ×
        </button>
        <PlayerProfileCard
          registrant={data.registrant}
          legacyStats={data.legacyStats}
          currentTeamName={data.currentTeamName}
          isCaptain={data.isCaptain}
        />
      </div>
    </div>
  );
}
