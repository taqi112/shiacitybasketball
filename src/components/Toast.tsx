"use client";

import { useEffect, useState } from "react";

export function Toast({
  message,
  durationMs = 4000,
}: {
  message: string;
  durationMs?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground shadow-2xl shadow-black/50">
      {message}
    </div>
  );
}
