export const FAVORITES_EMPTY_KIND = {
  NONE: "none",
  FILTERED: "filtered",
} as const;

export type FavoritesEmptyKind =
  (typeof FAVORITES_EMPTY_KIND)[keyof typeof FAVORITES_EMPTY_KIND];

export type ResolveFavoritesEmptyKindInput = {
  hasActiveFilter: boolean;
};

/**
 * Pure selector for Favorites empty-state copy.
 * Call only when the visible favorites list is empty (and not loading).
 * hasActiveFilter = include/exclude tags present OR aiFilter !== "all" OR mediaType !== "all".
 */
export function resolveFavoritesEmptyKind(
  input: ResolveFavoritesEmptyKindInput
): FavoritesEmptyKind {
  if (input.hasActiveFilter) {
    return FAVORITES_EMPTY_KIND.FILTERED;
  }
  return FAVORITES_EMPTY_KIND.NONE;
}
