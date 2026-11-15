import { getFeatureEnabled, getFeatureState, setFeatureState } from "../storage/store";
import type { SegmentedOption } from "../ui/kit";

/**
 * How the Collections and Following pages show their items (tiles or a list),
 * remembered per page, and whether those pages take the whole window width.
 */

export const VIEW_TILES = "tiles";
export const VIEW_LIST = "list";
export type ViewMode = typeof VIEW_TILES | typeof VIEW_LIST;

export const VIEW_LABEL = "View";
export const VIEW_OPTIONS: readonly SegmentedOption[] = [
  { value: VIEW_TILES, label: "Tiles" },
  { value: VIEW_LIST, label: "List" },
];

export const FOLLOWING_VIEW_STATE_ID = "following-view";
export const COLLECTIONS_VIEW_STATE_ID = "collections-view";

/** Setting: Collections and Following fill the window instead of a centred column. */
export const WIDE_PAGES_SETTING_ID = "wide-pages";
export const WIDE_PAGES_SETTING_LABEL = "Full-width Collections and Following";
export const WIDE_PAGES_SWITCH_ID = "rdw-wide-pages";

export function isViewMode(value: unknown): value is ViewMode {
  return value === VIEW_TILES || value === VIEW_LIST;
}

/** The remembered view of a page; tiles until the user chose otherwise. */
export function readViewMode(stateId: string): ViewMode {
  const stored = getFeatureState(stateId);
  return isViewMode(stored) ? stored : VIEW_TILES;
}

export function writeViewMode(stateId: string, mode: ViewMode): void {
  setFeatureState(stateId, mode);
}

export function widePagesEnabled(): boolean {
  return getFeatureEnabled(WIDE_PAGES_SETTING_ID, false);
}
