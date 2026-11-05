import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_LAYOUT_SOURCE_PATH = resolve(
  process.cwd(),
  "src/renderer/components/layout/AppLayout.tsx"
);

describe("AppLayout panic button mount", () => {
  it("mounts PanicButton only when settings.showPanicButton is true", () => {
    const source = readFileSync(APP_LAYOUT_SOURCE_PATH, "utf8");

    expect(source).toContain("settings?.showPanicButton === true");
    expect(source).toContain("{showPanicButton ? <PanicButton /> : null}");
    expect(source).not.toMatch(/<PanicButton\s*\/>\s*\n\s*<\/div>/);
  });
});
