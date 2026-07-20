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
