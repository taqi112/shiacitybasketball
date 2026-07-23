"use client";

const POSITIONS = ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"];

export function PositionPicker({
  name,
  selected,
  onChange,
  max = 2,
}: {
  name: string;
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  function toggle(position: string) {
    if (selected.includes(position)) {
      onChange(selected.filter((p) => p !== position));
    } else if (selected.length < max) {
      onChange([...selected, position]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {POSITIONS.map((position) => {
        const isSelected = selected.includes(position);
        const disabled = !isSelected && selected.length >= max;
        return (
          <label
            key={position}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              isSelected
                ? "cursor-pointer border-accent bg-accent text-accent-foreground"
                : disabled
                  ? "cursor-not-allowed border-border bg-surface text-muted-foreground opacity-50"
                  : "cursor-pointer border-border bg-surface text-foreground"
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={position}
              checked={isSelected}
              disabled={disabled}
              onChange={() => toggle(position)}
              className="sr-only"
            />
            {position}
          </label>
        );
      })}
    </div>
  );
}
