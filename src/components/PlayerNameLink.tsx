"use client";

import { useState } from "react";
import { PlayerProfileModal } from "./PlayerProfileModal";
import type { PlayerPopupData } from "@/lib/playerPopup";

// Renders plain text when there's no popup data (e.g. an old legacy stat row
// never linked to a profile) -- nothing to show, so nothing clickable.
export function PlayerNameLink({ name, data }: { name: string; data: PlayerPopupData | undefined }) {
  const [open, setOpen] = useState(false);

  if (!data) return <>{name}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="underline decoration-dotted underline-offset-2 hover:text-accent"
      >
        {name}
      </button>
      {open && <PlayerProfileModal data={data} onClose={() => setOpen(false)} />}
    </>
  );
}
