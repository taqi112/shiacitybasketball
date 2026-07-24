// "imran ladak" -> "Imran Ladak", "IMRAN LADAK" -> "Imran Ladak". Doesn't
// special-case hyphenated names (e.g. "mary-jane" stays "Mary-jane") --
// simple word-by-word title casing is enough for what this is used for.
export function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}
