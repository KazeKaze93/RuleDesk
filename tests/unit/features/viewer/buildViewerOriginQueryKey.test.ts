import { describe, expect, it } from "vitest";
import { buildViewerOriginQueryKey } from "@/renderer/features/viewer/buildViewerOriginQueryKey";
import { buildBrowseSearchQueryKey } from "@/renderer/utils/react-query-cache";

describe("buildViewerOriginQueryKey", () => {
  it("returns null for undefined origin", () => {
    expect(buildViewerOriginQueryKey(undefined)).toBeNull();
  });

  it("matches ArtistGallery infinite query key", () => {
    expect(
      buildViewerOriginQueryKey({
        kind: "artist",
        artistId: 42,
        aiFilter: "hide",
        mediaType: "images",
        source: "favorites",
        sortOrder: "asc",
      })
    ).toEqual(["posts", 42, "hide", "images", "favorites", "asc"]);
  });

  it("fills ArtistGallery defaults when openViewer omits all-filters", () => {
    expect(
      buildViewerOriginQueryKey({
        kind: "artist",
        artistId: 7,
        tags: undefined,
        source: "all",
        sortOrder: "desc",
      })
    ).toEqual(["posts", 7, "all", "all", "all", "desc"]);
  });

  it("matches Browse search query key", () => {
    const origin = {
      kind: "search" as const,
      tags: ["foo", "-bar"],
      source: "subscriptions" as const,
      aiFilter: "only" as const,
      mediaType: "videos" as const,
      sortOrder: "asc" as const,
    };
    expect(buildViewerOriginQueryKey(origin)).toEqual(
      buildBrowseSearchQueryKey({
        tags: origin.tags,
        source: origin.source,
        aiFilter: origin.aiFilter,
        mediaType: origin.mediaType,
        sortOrder: origin.sortOrder,
      })
    );
  });

  it("matches Favorites infinite query key", () => {
    expect(
      buildViewerOriginQueryKey({ kind: "favorites", tags: ["a", "b"] })
    ).toEqual(["posts", "favorites", ["a", "b"]]);
    expect(buildViewerOriginQueryKey({ kind: "favorites" })).toEqual([
      "posts",
      "favorites",
      [],
    ]);
  });

  it("matches PlaylistGallery infinite query key for manual and smart", () => {
    expect(
      buildViewerOriginQueryKey({
        kind: "playlist",
        playlistId: 11,
        mediaType: "all",
        aiFilter: "hide",
        sortOrder: "desc",
      })
    ).toEqual(["playlist-posts", 11, "all", "hide", "desc"]);
  });

  it("matches Updates infinite query key", () => {
    expect(
      buildViewerOriginQueryKey({ kind: "updates", tags: ["x"] })
    ).toEqual(["posts", "updates", ["x"]]);
  });

  it("maps unused browse origin to empty-tag search key", () => {
    expect(buildViewerOriginQueryKey({ kind: "browse" })).toEqual(
      buildBrowseSearchQueryKey({ tags: [] })
    );
  });
});
