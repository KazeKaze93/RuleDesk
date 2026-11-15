/**
 * The height of the search panel, kept between page loads so that its place
 * can be reserved before the first paint and nothing jumps when it mounts.
 *
 * Plain localStorage: it is read before the first paint and must cost
 * nothing. This module imports nothing, so both the boot code and the
 * search-tools feature can use it.
 */

/** Panel height reserved before the panel was ever measured in this browser. */
const DEFAULT_HEIGHT_PX = 168;
const HEIGHT_LIMIT_PX = 2000;

export const SEARCH_TOOLS_HEIGHT_KEY = "ruledesk-web.search-tools-height";
/** On the panel root once the panel is rendered: the reserve is dropped. */
export const SEARCH_TOOLS_MOUNTED_CLASS = "rdw-search-tools--mounted";

/** The height the panel had the last time it was shown, or the default. */
export function readSearchToolsReserveHeight(): number {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SEARCH_TOOLS_HEIGHT_KEY);
  } catch {
    // Storage may be blocked: the default will do.
  }
  const height = raw === null ? Number.NaN : Number(raw);
  if (!Number.isFinite(height) || height <= 0 || height > HEIGHT_LIMIT_PX) {
    return DEFAULT_HEIGHT_PX;
  }
  return Math.round(height);
}

/** Remembers the panel height for the next page load. */
export function rememberSearchToolsHeight(height: number): void {
  if (!Number.isFinite(height) || height <= 0) {
    return;
  }
  try {
    window.localStorage.setItem(SEARCH_TOOLS_HEIGHT_KEY, String(Math.round(height)));
  } catch {
    // Not remembered: the next load reserves the default height.
  }
}
