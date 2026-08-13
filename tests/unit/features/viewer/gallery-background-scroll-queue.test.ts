import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Background gallery pagination must reuse handleLoadMore (fetch + appendQueueIds),
 * not naked fetchNextPage — see LESSONS.txt "Viewer queue pagination".
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

describe("gallery background scroll queue wiring", () => {
  it.each(MASONRY_HANDLE_LOAD_MORE_SOURCES)(
    "%s masonry onLoadMore is handleLoadMore",
    (relativePath) => {
      const source = readRepoFile(relativePath);
      expect(source).toMatch(
        /useMasonryInfiniteScroll\(\{[\s\S]*?onLoadMore:\s*handleLoadMore/
      );
      expect(source).not.toMatch(
        /useMasonryInfiniteScroll\(\{[\s\S]*?onLoadMore:\s*fetchNextPage/
      );
    }
  );

  it.each(LOCAL_GRID_HANDLE_LOAD_MORE_SOURCES)(
    "%s local grid endReached is handleLoadMore",
    (relativePath) => {
      const source = readRepoFile(relativePath);
      expect(source).toContain("endReached={handleLoadMore}");
    }
  );
});
