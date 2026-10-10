export const UPDATES_FEED_EMPTY_KIND = {
  NO_ARTISTS: "no_artists",
  NEVER_SYNCED: "never_synced",
  NO_NEW_POSTS: "no_new_posts",
  FILTERED: "filtered",
} as const;

export type UpdatesFeedEmptyKind =
  (typeof UPDATES_FEED_EMPTY_KIND)[keyof typeof UPDATES_FEED_EMPTY_KIND];

export type ResolveUpdatesFeedEmptyKindInput = {
  trackedArtistCount: number;
  lastSyncAtMs: number | null;
  hasActiveTagFilter: boolean;
  unfilteredFeedCount: number;
};

/**
 * Pure selector for Updates Feed empty-state copy.
 * Call only when the visible feed list is empty (and not loading).
 */
export function resolveUpdatesFeedEmptyKind(
  input: ResolveUpdatesFeedEmptyKindInput
): UpdatesFeedEmptyKind {
  if (input.trackedArtistCount === 0) {
    return UPDATES_FEED_EMPTY_KIND.NO_ARTISTS;
  }
  if (input.lastSyncAtMs === null) {
    return UPDATES_FEED_EMPTY_KIND.NEVER_SYNCED;
  }
  if (input.hasActiveTagFilter && input.unfilteredFeedCount > 0) {
    return UPDATES_FEED_EMPTY_KIND.FILTERED;
  }
  return UPDATES_FEED_EMPTY_KIND.NO_NEW_POSTS;
}
