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

describe("playlist-gallery-header labels", () => {
  it("manual always shows N entries (postCount has no resolve filters)", () => {
    expect(formatManualPlaylistCountLabel(120)).toBe(
      `120${PLAYLIST_HEADER_ENTRIES_SUFFIX}`
    );
  });

  it("smart exact shows Total: N", () => {
    expect(
      formatSmartPlaylistTotalLabel({ count: 1818, kind: "exact" })
    ).toBe(`${PLAYLIST_HEADER_TOTAL_PREFIX}1818`);
  });

  it("smart lowerBound shows N+ posts", () => {
    expect(
      formatSmartPlaylistTotalLabel({ count: 20000, kind: "lowerBound" })
    ).toBe(`20000${PLAYLIST_HEADER_LOWER_BOUND_SUFFIX}`);
  });

  it("smart null hides the total", () => {
    expect(formatSmartPlaylistTotalLabel(null)).toBeNull();
  });
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
  });
});
