import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Favorites header source contract", () => {
  it("does not expose Download All for loaded favorites", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/renderer/components/pages/Favorites.tsx"),
      "utf8"
    );

    expect(source).not.toContain("DownloadAllButton");
    expect(source).not.toContain("useDownloadAll");
    expect(source).not.toContain('labelMode="loaded"');
    expect(source).toContain('aria-label="Toggle bulk selection mode"');
  });
});
