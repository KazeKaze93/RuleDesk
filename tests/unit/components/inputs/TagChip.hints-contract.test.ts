import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TAG_EXCLUDE_INTERACTION_TOOLTIP,
  TAG_INCLUDE_INTERACTION_TOOLTIP,
} from "@/components/inputs/TagChip";

const TAG_CHIP_SOURCE = readFileSync(
  resolve(process.cwd(), "src/renderer/components/inputs/TagChip.tsx"),
  "utf8"
);

const TAGS_DRAWER_SOURCE = readFileSync(
  resolve(process.cwd(), "src/renderer/features/viewer/TagsDrawer.tsx"),
  "utf8"
);

describe("TagChip / TagsDrawer right-click hint contract", () => {
  it("exposes include and exclude tooltip copy constants", () => {
    expect(TAG_INCLUDE_INTERACTION_TOOLTIP).toBe(
      "Click to include · Right-click to exclude"
    );
    expect(TAG_EXCLUDE_INTERACTION_TOOLTIP).toBe(
      "Click to exclude · Right-click to include"
    );
  });

  it("TagChip uses Tooltip for the hint and does not set title on the chip", () => {
    expect(TAG_CHIP_SOURCE).toContain("TooltipTrigger");
    expect(TAG_CHIP_SOURCE).toContain("TooltipContent");
    expect(TAG_CHIP_SOURCE).toContain("TAG_INCLUDE_INTERACTION_TOOLTIP");
    expect(TAG_CHIP_SOURCE).toContain("TAG_EXCLUDE_INTERACTION_TOOLTIP");
    expect(TAG_CHIP_SOURCE).toContain('className="pointer-events-none"');
    expect(TAG_CHIP_SOURCE).not.toMatch(/\btitle=\{/);
    expect(TAG_CHIP_SOURCE).not.toContain("titleForHint");
  });

  it("TagsDrawer reuses TagChip tooltip constants and drops title on tag actions", () => {
    expect(TAGS_DRAWER_SOURCE).toContain("TAG_INCLUDE_INTERACTION_TOOLTIP");
    expect(TAGS_DRAWER_SOURCE).toContain("TAG_EXCLUDE_INTERACTION_TOOLTIP");
    expect(TAGS_DRAWER_SOURCE).toContain('from "../../components/inputs/TagChip"');
    expect(TAGS_DRAWER_SOURCE).toContain("pointer-events-none");
    expect(TAGS_DRAWER_SOURCE).not.toContain(
      "Click to include, right-click to exclude"
    );
    expect(TAGS_DRAWER_SOURCE).not.toContain(
      "Excluded (right-click to toggle)"
    );
    expect(TAGS_DRAWER_SOURCE).not.toContain(
      "Included (right-click to exclude)"
    );
  });
});
