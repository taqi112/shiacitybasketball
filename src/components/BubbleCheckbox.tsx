"use client";

export function BubbleCheckbox({
  name,
  label,
  required,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  required?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`inline-flex w-fit cursor-pointer items-center rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
        checked
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-foreground"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        value="true"
        checked={checked}
        required={required}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {label}
    </label>
  );
}
