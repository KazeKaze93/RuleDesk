import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * VirtuosoGrid totalCount must match the rendered (filtered) collection,
 * not the raw unfiltered page size — see LESSONS.txt #4.
 *
 * Full gallery pages are too heavy to mount here; this suite asserts the
 * production source still wires totalCount to the displayed list length.
 */
const GALLERY_TOTAL_COUNT_SOURCES = [
  {
    relativePath: "src/renderer/components/pages/Browse.tsx",
    lengthExpr: "displayPosts.length",
  },
  {
    relativePath: "src/renderer/components/pages/Favorites.tsx",
    lengthExpr: "allPosts.length",
  },
  {
    relativePath: "src/renderer/components/pages/Updates.tsx",
    lengthExpr: "allPosts.length",
  },
  {
    relativePath: "src/renderer/features/artists/ArtistGallery.tsx",
    lengthExpr: "allPosts.length",
  },
  {
    relativePath: "src/renderer/components/playlists/PlaylistGallery.tsx",
    lengthExpr: "displayedPosts.length",
  },
] as const;

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("VirtuosoGrid totalCount wiring", () => {
  it.each(GALLERY_TOTAL_COUNT_SOURCES)(
    "$relativePath passes totalCount={$lengthExpr}",
    ({ relativePath, lengthExpr }) => {
      const source = readRepoFile(relativePath);
      const expected = `totalCount={${lengthExpr}}`;

      expect(source).toContain(expected);
      expect(source).not.toMatch(/totalCount=\{rawPosts\.length\}/);
    }
  );
});
