export function normalizeTag(input: string): string {
  return input
    .trim()
    .replace(/^#\s*/g, "")
    .replace(/^user:/i, "")
    .replace(/\s*\(\d+\)\s*$/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}
