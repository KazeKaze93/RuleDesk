/**
 * Copy and label helpers for PlaylistGallery header counts.
 * Manual totals come from getPlaylists → getManualPlaylistsWithStats (COUNT entries).
 */

export const PLAYLIST_HEADER_SMART_TYPE_LABEL = "Smart Collection";
export const PLAYLIST_HEADER_SMART_SUBTITLE =
  "Live search · refreshes when opened";
export const PLAYLIST_HEADER_REFRESH_ARIA_LABEL = "Refresh collection";
export const PLAYLIST_HEADER_LOADED_PREFIX = "Loaded ";
export const PLAYLIST_HEADER_TOTAL_PREFIX = "Total: ";
export const PLAYLIST_HEADER_ENTRIES_SUFFIX = " entries";

export function formatManualPlaylistCountLabel(args: {
  postCount: number;
  filtersNarrowResults: boolean;
}): string {
  if (args.filtersNarrowResults) {
    return `${args.postCount}${PLAYLIST_HEADER_ENTRIES_SUFFIX}`;
  }
  return `${PLAYLIST_HEADER_TOTAL_PREFIX}${args.postCount}`;
}

export function formatSmartPlaylistLoadedLabel(loadedCount: number): string {
  return `${PLAYLIST_HEADER_LOADED_PREFIX}${loadedCount}`;
}
