import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PendingDownloadBanner copy contract", () => {
  it("exposes favorites-specific interrupted message and shared Resume label", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/renderer/components/downloads/PendingDownloadBanner.tsx"
      ),
      "utf8"
    );

    expect(source).toContain("INTERRUPTED_FAVORITES_MESSAGE");
    expect(source).toContain("Interrupted favorites download —");
    expect(source).toContain('pending.kind === "favorites"');
    expect(source).toContain("RESUME_LABEL");
    expect(source).toContain("Resume");
  });
});
