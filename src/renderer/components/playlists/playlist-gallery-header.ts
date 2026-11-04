/**
 * Copy and label helpers for PlaylistGallery header counts.
 * Manual: getPlaylists → getManualPlaylistsWithStats (COUNT playlist_entries only —
 * no mediaType / blacklist / AI). Smart: resolvePlaylistPosts.total (hybrid window
 * + aiCount); display count depends on client aiFilter.
 */

import { HYBRID_SNAPSHOT_IDLE_TTL_MS } from "../../../shared/constants";
import type { PlaylistResolveTotal } from "../../../shared/schemas/playlist";

const MS_PER_MINUTE = 60_000;

export const PLAYLIST_HEADER_SMART_TYPE_LABEL = "Smart Collection";
export const PLAYLIST_HEADER_SMART_SUBTITLE = `Live search · refreshed every ${
  HYBRID_SNAPSHOT_IDLE_TTL_MS / MS_PER_MINUTE
} min or on Refresh`;
export const PLAYLIST_HEADER_REFRESH_ARIA_LABEL = "Refresh collection";
export const PLAYLIST_HEADER_TOTAL_LOADING_ARIA_LABEL = "Loading total";
export const PLAYLIST_HEADER_TOTAL_PREFIX = "Total: ";
export const PLAYLIST_HEADER_LOWER_BOUND_SUFFIX = "+ posts";
export const PLAYLIST_HEADER_ENTRIES_SUFFIX = " entries";
export const PLAYLIST_HEADER_NEWER_POSTS_MESSAGE = "New posts available";
export const PLAYLIST_HEADER_NEWER_POSTS_REFRESH_LABEL = "Refresh";

export type PlaylistHeaderAiFilter = "all" | "hide" | "only";

/**
 * Manual playlist count. postCount is raw entry COUNT (no resolve filters), so
 * always "N entries" — never claim Total when media/blacklist/AI can diverge.
 */
export function formatManualPlaylistCountLabel(postCount: number): string {
  return `${postCount}${PLAYLIST_HEADER_ENTRIES_SUFFIX}`;
}

/**
 * Effective header count for the current AI filter from a hybrid window total.
 * all → count; hide → count − aiCount; only → aiCount. null total → null.
 */
export function resolveSmartPlaylistDisplayCount(
  total: PlaylistResolveTotal,
  aiFilter: PlaylistHeaderAiFilter
): number | null {
  if (total === null) {
    return null;
  }
  if (aiFilter === "hide") {
    return Math.max(0, total.count - total.aiCount);
  }
  if (aiFilter === "only") {
    return total.aiCount;
  }
  return total.count;
}

/**
 * Total for a smart header: the first page's total wins; otherwise the
 * `getPlaylistResolveTotal` result (undefined while that query is pending/failed).
 */
export function pickSmartPlaylistTotal(
  firstPageTotal: PlaylistResolveTotal,
  queriedTotal: PlaylistResolveTotal | undefined
): PlaylistResolveTotal {
  return firstPageTotal ?? queriedTotal ?? null;
}

/**
 * Header shows a loading indicator only while a smart total is still expected:
 * no total yet and neither the page query nor the total query has failed.
 */
export function isSmartPlaylistTotalLoading(params: {
  isSmart: boolean;
  total: PlaylistResolveTotal;
  hasFailed: boolean;
}): boolean {
  return params.isSmart && params.total === null && !params.hasFailed;
}

/**
 * Smart hybrid window total. exact → "Total: N"; lowerBound → "N+ posts";
 * null → hide (caller renders nothing). N is derived via aiFilter.
 */
export function formatSmartPlaylistTotalLabel(
  total: PlaylistResolveTotal,
  aiFilter: PlaylistHeaderAiFilter = "all"
): string | null {
  const displayCount = resolveSmartPlaylistDisplayCount(total, aiFilter);
  if (displayCount === null || total === null) {
    return null;
  }
  if (total.kind === "exact") {
    return `${PLAYLIST_HEADER_TOTAL_PREFIX}${displayCount}`;
  }
  return `${displayCount}${PLAYLIST_HEADER_LOWER_BOUND_SUFFIX}`;
}
