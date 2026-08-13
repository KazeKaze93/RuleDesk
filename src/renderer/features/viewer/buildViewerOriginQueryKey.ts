import type { ViewerOrigin } from "../../store/viewerStore";
import {
  buildBrowseSearchQueryKey,
  type BrowseSearchQueryKey,
} from "../../utils/react-query-cache";

export type ViewerOriginQueryKey =
  | readonly ["posts", "updates", string[]]
  | readonly ["posts", "favorites", string[]]
  | readonly ["posts", number, string, string, string, string]
  | BrowseSearchQueryKey
  | readonly ["playlist-posts", number, string, string, string];

/**
 * Canonical viewer cache key for an origin. Must stay isomorphic with
 * ArtistGallery / Browse / Favorites / Updates / PlaylistGallery query keys.
 */
export function buildViewerOriginQueryKey(
  origin: ViewerOrigin | undefined
): ViewerOriginQueryKey | null {
  if (!origin) {
    return null;
  }

  switch (origin.kind) {
    case "updates":
      return ["posts", "updates", origin.tags ?? []] as const;
    case "favorites":
      return ["posts", "favorites", origin.tags ?? []] as const;
    case "artist":
      return [
        "posts",
        origin.artistId,
        origin.aiFilter ?? "all",
        origin.mediaType ?? "all",
        origin.source ?? "all",
        origin.sortOrder ?? "desc",
      ] as const;
    case "search":
      return buildBrowseSearchQueryKey({
        tags: origin.tags,
        source: origin.source,
        aiFilter: origin.aiFilter,
        mediaType: origin.mediaType,
        sortOrder: origin.sortOrder,
      });
    case "browse":
      return buildBrowseSearchQueryKey({ tags: [] });
    case "playlist":
      return [
        "playlist-posts",
        origin.playlistId,
        origin.mediaType ?? "all",
        origin.aiFilter ?? "all",
        origin.sortOrder ?? "desc",
      ] as const;
    default:
      return null;
  }
}
