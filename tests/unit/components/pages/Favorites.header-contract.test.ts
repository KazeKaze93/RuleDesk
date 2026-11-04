import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Favorites header source contract", () => {
  it("exposes Download all favorites via backend cursor (not loaded-list mode)", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/renderer/components/pages/Favorites.tsx"),
      "utf8"
    );

    expect(source).toContain("DownloadAllButton");
    expect(source).toContain("useDownloadAllFromBackend");
    expect(source).toContain('labelMode="favorites"');
    expect(source).not.toContain('labelMode="loaded"');
    expect(source).toContain('kind: "favorites"');
    expect(source).toContain('aria-label="Toggle bulk selection mode"');
  });
});
