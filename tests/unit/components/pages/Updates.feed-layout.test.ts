import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * VirtuosoGrid needs a non-zero height parent. jsdom cannot measure the
 * flex → h-full collapse, so this is a source contract against the working
 * Favorites/ArtistGallery chain (`flex flex-col flex-1 min-h-0`).
 */
describe("Updates feed layout source contract", () => {
  it("keeps a flex-col height chain for the feed VirtuosoGrid", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/renderer/components/pages/Updates.tsx"),
      "utf8"
    );

    // Feed shell must be flex-col so the VirtuosoGrid `h-full` child gets height.
    expect(source).toMatch(
      /\/\* flex-col so the feed\/creators child can flex-1[\s\S]*?className="flex flex-col flex-1 min-h-0"/
    );
    expect(source).toContain("<VirtuosoGrid");
    expect(source).toContain('className="h-full"');
    // Header Download All (loaded) must stay off Updates.
    expect(source).not.toContain("DownloadAllButton");
    expect(source).not.toContain("useDownloadAll");
    expect(source).not.toContain('labelMode="loaded"');
  });
});
