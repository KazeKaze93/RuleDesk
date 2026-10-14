import { describe, expect, it } from "vitest";
import { isForbiddenRelativePath } from "../../../scripts/check-release-artifacts-lib.mjs";

describe("isForbiddenRelativePath", () => {
  it("flags .cursor directory entries", () => {
    expect(isForbiddenRelativePath(".cursor/rules/foo.mdc")).toBe(true);
    expect(isForbiddenRelativePath("out/.cursor/skills/bar.md")).toBe(true);
    expect(isForbiddenRelativePath(".cursor")).toBe(true);
  });

  it("still flags existing forbidden paths", () => {
    expect(isForbiddenRelativePath(".ai/LESSONS.txt")).toBe(true);
    expect(isForbiddenRelativePath("tests/unit/foo.test.ts")).toBe(true);
    expect(isForbiddenRelativePath(".cursorrules")).toBe(true);
    expect(isForbiddenRelativePath("out/main/main.js.map")).toBe(true);
    expect(isForbiddenRelativePath(".env")).toBe(true);
  });

  it("allows normal app bundle paths", () => {
    expect(isForbiddenRelativePath("out/main/main.js")).toBe(false);
    expect(isForbiddenRelativePath("package.json")).toBe(false);
    expect(isForbiddenRelativePath("drizzle/0001_init.sql")).toBe(false);
  });
});
