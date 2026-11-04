import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatManualPlaylistCountLabel,
  formatSmartPlaylistLoadedLabel,
  PLAYLIST_HEADER_LOADED_PREFIX,
  PLAYLIST_HEADER_TOTAL_PREFIX,
} from "@/components/playlists/playlist-gallery-header";

describe("playlist-gallery-header labels", () => {
  it("manual unfiltered shows Total with the entry count (not loaded length)", () => {
    expect(
      formatManualPlaylistCountLabel({
        postCount: 120,
        filtersNarrowResults: false,
      })
    ).toBe(`${PLAYLIST_HEADER_TOTAL_PREFIX}120`);
  });

  it("manual with narrowing filters shows N entries (still the real entry count)", () => {
    expect(
      formatManualPlaylistCountLabel({
        postCount: 120,
        filtersNarrowResults: true,
      })
    ).toBe("120 entries");
  });

  it("smart shows Loaded N and never the Total prefix", () => {
    const label = formatSmartPlaylistLoadedLabel(50);
    expect(label).toBe(`${PLAYLIST_HEADER_LOADED_PREFIX}50`);
    expect(label.startsWith(PLAYLIST_HEADER_TOTAL_PREFIX)).toBe(false);
  });
});

describe("PlaylistGallery header source contract", () => {
  it("smart path must not render a Total: label; manual uses postCount helper", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/renderer/components/playlists/PlaylistGallery.tsx"
      ),
      "utf8"
    );
    expect(source).not.toMatch(/Total:\s*\{displayedPosts\.length\}/);
    expect(source).toContain("formatSmartPlaylistLoadedLabel(displayedPosts.length)");
    expect(source).toContain("formatManualPlaylistCountLabel");
    expect(source).toContain("playlist.postCount");
  });
});
