import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const GLOBAL_TOP_BAR_SOURCE = readFileSync(
  resolve(process.cwd(), "src/renderer/components/layout/GlobalTopBar.tsx"),
  "utf8"
);

describe("GlobalTopBar sort tooltip contract", () => {
  it("exposes named disabled-sort tooltip copy", () => {
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("DISABLED_SORT_TOOLTIP");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain(
      "Sorting is available after you enter a tag"
    );
  });

  it("wraps the disabled Sort control in a focusable TooltipTrigger span", () => {
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("TooltipProvider");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("TooltipTrigger");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("TooltipContent");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("tabIndex={0}");
    expect(GLOBAL_TOP_BAR_SOURCE).toMatch(
      /TooltipTrigger[\s\S]*?<span className="inline-flex" tabIndex=\{0\}>/
    );
    expect(GLOBAL_TOP_BAR_SOURCE).toMatch(
      /TooltipContent[\s\S]*?\{DISABLED_SORT_TOOLTIP\}/
    );
  });

  it("keeps enabled Sort aria-label/title as named date-direction labels", () => {
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("SORT_BY_DATE_NEWEST_LABEL");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("SORT_BY_DATE_OLDEST_LABEL");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("Sort by date (newest first)");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("Sort by date (oldest first)");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("aria-label={sortDirectionLabel}");
    expect(GLOBAL_TOP_BAR_SOURCE).toContain("title={sortDirectionLabel}");
  });
});
