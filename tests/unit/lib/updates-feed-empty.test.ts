import { describe, expect, it } from "vitest";
import {
  resolveUpdatesFeedEmptyKind,
  UPDATES_FEED_EMPTY_KIND,
} from "@/renderer/lib/updates-feed-empty";

describe("resolveUpdatesFeedEmptyKind", () => {
  it("returns no_artists when nothing is tracked", () => {
    expect(
      resolveUpdatesFeedEmptyKind({
        trackedArtistCount: 0,
        lastSyncAtMs: null,
        hasActiveTagFilter: false,
        unfilteredFeedCount: 0,
      })
    ).toBe(UPDATES_FEED_EMPTY_KIND.NO_ARTISTS);
  });

  it("returns never_synced when artists exist but last sync is null", () => {
    expect(
      resolveUpdatesFeedEmptyKind({
        trackedArtistCount: 2,
        lastSyncAtMs: null,
        hasActiveTagFilter: false,
        unfilteredFeedCount: 0,
      })
    ).toBe(UPDATES_FEED_EMPTY_KIND.NEVER_SYNCED);
  });

  it("returns filtered when tags hide a non-empty unfiltered feed", () => {
    expect(
      resolveUpdatesFeedEmptyKind({
        trackedArtistCount: 2,
        lastSyncAtMs: Date.now(),
        hasActiveTagFilter: true,
        unfilteredFeedCount: 12,
      })
    ).toBe(UPDATES_FEED_EMPTY_KIND.FILTERED);
  });

  it("returns no_new_posts when synced and unfiltered feed is empty", () => {
    expect(
      resolveUpdatesFeedEmptyKind({
        trackedArtistCount: 2,
        lastSyncAtMs: Date.now(),
        hasActiveTagFilter: true,
        unfilteredFeedCount: 0,
      })
    ).toBe(UPDATES_FEED_EMPTY_KIND.NO_NEW_POSTS);
  });
});
