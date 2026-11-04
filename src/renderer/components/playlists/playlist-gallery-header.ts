/**
 * Copy and label helpers for PlaylistGallery header counts.
 * Manual: getPlaylists → getManualPlaylistsWithStats (COUNT playlist_entries only —
 * no mediaType / blacklist / AI). Smart: resolvePlaylistPosts.total (hybrid window).
 */

import type { PlaylistResolveTotal } from "../../../shared/schemas/playlist";

export const PLAYLIST_HEADER_SMART_TYPE_LABEL = "Smart Collection";
export const PLAYLIST_HEADER_SMART_SUBTITLE =
  "Live search · refreshes when opened";
export const PLAYLIST_HEADER_REFRESH_ARIA_LABEL = "Refresh collection";
export const PLAYLIST_HEADER_TOTAL_PREFIX = "Total: ";
export const PLAYLIST_HEADER_LOWER_BOUND_SUFFIX = "+ posts";
export const PLAYLIST_HEADER_ENTRIES_SUFFIX = " entries";

/**
 * Manual playlist count. postCount is raw entry COUNT (no resolve filters), so
 * always "N entries" — never claim Total when media/blacklist/AI can diverge.
 */
export function formatManualPlaylistCountLabel(postCount: number): string {
  return `${postCount}${PLAYLIST_HEADER_ENTRIES_SUFFIX}`;
}

/**
 * Smart hybrid window total from main. exact → "Total: N"; lowerBound → "N+ posts";
 * null → hide (caller renders nothing).
 */
export function formatSmartPlaylistTotalLabel(
  total: PlaylistResolveTotal
): string | null {
  if (total === null) {
    return null;
  }
  if (total.kind === "exact") {
    return `${PLAYLIST_HEADER_TOTAL_PREFIX}${total.count}`;
  }
  return `${total.count}${PLAYLIST_HEADER_LOWER_BOUND_SUFFIX}`;
}
