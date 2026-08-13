import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Viewer queue `hasNextPage` must be the infinite-query flag, not a
 * loaded-count vs page-size derivative. A full last page (50/50) makes
 * `displayedPosts.length < pages * 50` / `allPosts.length < totalCount`
 * false while react-query still reports more data — see LESSONS.txt
 * "Viewer queue pagination".
 *
 * Gallery pages are too heavy to mount here; this suite asserts the
 * production `openViewer` payload still passes the query flag through.
 */
const OPEN_VIEWER_HAS_NEXT_PAGE_SOURCES = [
  "src/renderer/components/pages/Browse.tsx",
  "src/renderer/components/pages/Favorites.tsx",
  "src/renderer/components/pages/Updates.tsx",
  "src/renderer/features/artists/ArtistGallery.tsx",
  "src/renderer/components/playlists/PlaylistGallery.tsx",
] as const;

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("openViewer hasNextPage wiring", () => {
  it.each(OPEN_VIEWER_HAS_NEXT_PAGE_SOURCES)(
    "%s passes hasNextPage: hasNextPage (query flag, not a count predicate)",
    (relativePath) => {
      const source = readRepoFile(relativePath);

      expect(source).toContain("hasNextPage: hasNextPage,");
      expect(source).not.toMatch(
        /hasNextPage:\s*hasNextPage\s*&&\s*displayedPosts\.length/
      );
      expect(source).not.toMatch(
        /hasNextPage:\s*hasNextPage\s*&&\s*allPosts\.length/
      );
    }
  );
});
