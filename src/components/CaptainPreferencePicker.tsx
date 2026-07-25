"use client";

const CAPTAINS = [
  "Ali Zaidi",
  "Ali Abbas Naqvi",
  "Danesh Jafri",
  "Hasnain Zaidi",
  "Hussan Ali",
  "Imran Ladak",
  "Mo Naqvi",
  "Syed Daniyal",
  "Taqi Hussain",
  "Zain Jafri",
  "No Preference",
];

export function CaptainPreferencePicker({
  name,
  selected,
  onChange,
}: {
  name: string;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(captain: string) {
    if (captain === "No Preference") {
      onChange(selected.includes("No Preference") ? selected : ["No Preference"]);
      return;
    }
    const withoutNoPreference = selected.filter((c) => c !== "No Preference");
    if (withoutNoPreference.includes(captain)) {
      const next = withoutNoPreference.filter((c) => c !== captain);
      onChange(next.length > 0 ? next : ["No Preference"]);
    } else {
      onChange([...withoutNoPreference, captain]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CAPTAINS.map((captain) => {
        const isSelected = selected.includes(captain);
        return (
          <label
            key={captain}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
              isSelected
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-foreground"
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={captain}
              checked={isSelected}
              onChange={() => toggle(captain)}
              className="sr-only"
            />
            {captain}
          </label>
        );
      })}
    </div>
  );
}
