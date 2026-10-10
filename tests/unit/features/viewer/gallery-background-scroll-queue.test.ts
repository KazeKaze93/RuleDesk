import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Background gallery pagination must reuse handleLoadMore (fetch + appendQueueIds),
 * not naked fetchNextPage — see LESSONS.txt "Viewer queue pagination".
 *
 * Call sites may wrap with void+catch (no-misused-promises / checksVoidReturn):
 * inline arrow, triggerLoadMore, or handleEndReached from useGalleryInfiniteScroll.
 */
const MASONRY_HANDLE_LOAD_MORE_SOURCES = [
  "src/renderer/components/pages/Browse.tsx",
  "src/renderer/features/artists/ArtistGallery.tsx",
  "src/renderer/components/pages/Favorites.tsx",
  "src/renderer/components/pages/Updates.tsx",
  "src/renderer/components/playlists/PlaylistGallery.tsx",
] as const;

const LOCAL_GRID_HANDLE_LOAD_MORE_SOURCES = [
  "src/renderer/components/pages/Favorites.tsx",
  "src/renderer/components/pages/Updates.tsx",
  "src/renderer/components/playlists/PlaylistGallery.tsx",
] as const;

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function masonryInfiniteScrollBlock(source: string): string {
  const match = source.match(/useMasonryInfiniteScroll\(\{[\s\S]*?\n\s*\}\);/);
  expect(match).toBeTruthy();
  return match?.[0] ?? "";
}

describe("gallery background scroll queue wiring", () => {
  it.each(MASONRY_HANDLE_LOAD_MORE_SOURCES)(
    "%s masonry onLoadMore wires handleLoadMore (not naked fetchNextPage)",
    (relativePath) => {
      const source = readRepoFile(relativePath);
      expect(source).toContain("appendQueueIds");
      expect(source).toMatch(/\bhandleLoadMore\b/);

      const masonryBlock = masonryInfiniteScrollBlock(source);
      expect(masonryBlock).toMatch(/handleLoadMore|triggerLoadMore/);
      expect(masonryBlock).not.toMatch(/onLoadMore:\s*fetchNextPage\b/);
    }
  );

  it.each(LOCAL_GRID_HANDLE_LOAD_MORE_SOURCES)(
    "%s local grid endReached wires handleLoadMore",
    (relativePath) => {
      const source = readRepoFile(relativePath);
      expect(source).toContain("appendQueueIds");
      expect(source).toMatch(/\bhandleLoadMore\b/);
      expect(source).toMatch(
        /endReached=\{(?:handleLoadMore|triggerLoadMore|handleEndReached)\}/
      );
      if (
        source.includes("endReached={triggerLoadMore}") ||
        source.includes("endReached={handleEndReached}")
      ) {
        expect(source).toMatch(/void handleLoadMore\(\)/);
      }
    }
  );
});
