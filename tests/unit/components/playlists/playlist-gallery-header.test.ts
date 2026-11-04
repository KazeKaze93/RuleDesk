import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatManualPlaylistCountLabel,
  formatSmartPlaylistTotalLabel,
  PLAYLIST_HEADER_ENTRIES_SUFFIX,
  PLAYLIST_HEADER_LOWER_BOUND_SUFFIX,
  PLAYLIST_HEADER_TOTAL_PREFIX,
} from "@/components/playlists/playlist-gallery-header";
import type { PlaylistResolveTotal } from "@shared/schemas/playlist";

const EXACT: NonNullable<PlaylistResolveTotal> = {
  count: 100,
  aiCount: 30,
  kind: "exact",
};
const LOWER: NonNullable<PlaylistResolveTotal> = {
  count: 100,
  aiCount: 30,
  kind: "lowerBound",
};

describe("playlist-gallery-header labels", () => {
  it("manual always shows N entries (postCount has no resolve filters)", () => {
    expect(formatManualPlaylistCountLabel(120)).toBe(
      `120${PLAYLIST_HEADER_ENTRIES_SUFFIX}`
    );
  });

  it.each([
    ["all", EXACT, `${PLAYLIST_HEADER_TOTAL_PREFIX}100`],
    ["hide", EXACT, `${PLAYLIST_HEADER_TOTAL_PREFIX}70`],
    ["only", EXACT, `${PLAYLIST_HEADER_TOTAL_PREFIX}30`],
    ["all", LOWER, `100${PLAYLIST_HEADER_LOWER_BOUND_SUFFIX}`],
    ["hide", LOWER, `70${PLAYLIST_HEADER_LOWER_BOUND_SUFFIX}`],
    ["only", LOWER, `30${PLAYLIST_HEADER_LOWER_BOUND_SUFFIX}`],
  ] as const)(
    "smart %s + %s → display count from count/aiCount",
    (aiFilter, total, expected) => {
      expect(formatSmartPlaylistTotalLabel(total, aiFilter)).toBe(expected);
    }
  );

  it.each(["all", "hide", "only"] as const)(
    "smart null hides the total for aiFilter=%s",
    (aiFilter) => {
      expect(formatSmartPlaylistTotalLabel(null, aiFilter)).toBeNull();
    }
  );
});

describe("PlaylistGallery header source contract", () => {
  it("smart uses resolve total helper; never Loaded or displayedPosts.length as Total", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/renderer/components/playlists/PlaylistGallery.tsx"
      ),
      "utf8"
    );
    expect(source).not.toMatch(/Total:\s*\{displayedPosts\.length\}/);
    expect(source).not.toContain("formatSmartPlaylistLoadedLabel");
    expect(source).not.toContain("PLAYLIST_HEADER_LOADED_PREFIX");
    expect(source).toContain("formatSmartPlaylistTotalLabel");
    expect(source).toContain("formatManualPlaylistCountLabel");
    expect(source).toContain("playlist.postCount");
    // AI toggle must not be in the infinite-query key (client filter only).
    expect(source).not.toMatch(
      /queryKey:\s*\[[^\]]*aiFilter/s
    );
  });
});
