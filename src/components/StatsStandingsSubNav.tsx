import Link from "next/link";

const TABS = [
  { key: "standings", label: "Standings", href: "/standings" },
  { key: "leaderboards", label: "Leaderboards", href: "/leaderboards" },
  { key: "stats", label: "Stats", href: "/stats" },
] as const;

export function StatsStandingsSubNav({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-4">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={
            tab.key === active
              ? "rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground"
              : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground"
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
