import { describe, expect, it } from "vitest";
import {
  assertTagMatchesPackageVersion,
  parseReleaseArgs,
  stripVersionPrefix,
} from "../../../scripts/release-lib.mjs";

describe("stripVersionPrefix", () => {
  it("strips a leading v", () => {
    expect(stripVersionPrefix("v18.3.2")).toBe("18.3.2");
  });

  it("leaves bare semver unchanged", () => {
    expect(stripVersionPrefix("18.3.2")).toBe("18.3.2");
  });
});

describe("assertTagMatchesPackageVersion", () => {
  it("accepts matching tag and package version", () => {
    expect(
      assertTagMatchesPackageVersion({
        tagName: "v18.3.2",
        packageVersion: "18.3.2",
      }),
    ).toEqual({ ok: true, version: "18.3.2" });
  });

  it("rejects mismatched versions", () => {
    const result = assertTagMatchesPackageVersion({
      tagName: "v18.3.2",
      packageVersion: "18.3.1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/does not match/);
    }
  });

  it("rejects tag without v prefix", () => {
    const result = assertTagMatchesPackageVersion({
      tagName: "18.3.2",
      packageVersion: "18.3.2",
    });
    expect(result.ok).toBe(false);
  });
});

describe("parseReleaseArgs", () => {
  it("parses bump and dry-run", () => {
    expect(parseReleaseArgs(["patch", "--dry-run"])).toEqual({
      bump: "patch",
      dryRun: true,
    });
  });

  it("rejects unknown bump", () => {
    const result = parseReleaseArgs(["hotfix"]);
    expect(result).toHaveProperty("error");
  });
});
