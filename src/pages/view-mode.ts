import { getFeatureState, setFeatureState } from "../storage/store";
import { PAGE_CONTENT_MAX_WIDTH_PX } from "./constants";
import type { SegmentedOption } from "../ui/kit";

/**
 * How the Collections and Following pages show their items (tiles or a list),
 * remembered per page, and the sizes those two pages share.
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

/** Smallest width of a tile on Collections and Following; the same on both. */
export const TILE_MIN_WIDTH_PX = 170;

/**
 * Side padding that keeps a full-width block's content in the centred column
 * of the page (see host.tsx: the pages with tiles span the window).
 */
export const PAGE_CENTRE_PADDING = `max(0px, calc((100% - ${String(PAGE_CONTENT_MAX_WIDTH_PX)}px) / 2))`;

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
