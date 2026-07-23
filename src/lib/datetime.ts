// datetime-local inputs show/take a timezone-less "wall clock" string. These
// helpers convert between that and a real UTC ISO timestamp using whichever
// timezone the code actually runs in -- call both only from the browser, so
// that's consistently the user's own local timezone, not a server's.

export function isoToDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalToIso(value: string): string {
  if (!value) return "";
  return new Date(value).toISOString();
}

// Postgres `time` columns come back as "HH:MM:SS" with no timezone at all
// (unlike the timestamptz fields above) -- this is just a display format,
// not a timezone conversion.
export function formatTime(value: string): string {
  const [hoursStr, minutesStr] = value.split(":");
  const hours = Number(hoursStr);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutesStr} ${period}`;
}
