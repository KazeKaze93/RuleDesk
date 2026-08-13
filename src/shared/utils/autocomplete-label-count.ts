/** Trailing `(123)` post count used by Rule34 autocomplete.php labels (`wlop (16)`). */
const AUTOCOMPLETE_COUNT_SUFFIX = /\((\d+)\)\s*$/;

/**
 * Parse post_count from an autocomplete label. Returns 0 when the suffix is absent or invalid.
 */
export function parseAutocompleteLabelCount(label: string): number {
  const match = AUTOCOMPLETE_COUNT_SUFFIX.exec(label.trim());
  if (!match) {
    return 0;
  }
  const count = Number.parseInt(match[1], 10);
  return Number.isFinite(count) ? count : 0;
}
