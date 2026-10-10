import { describe, expect, it } from "vitest";
import {
  GITHUB_RELEASES_LATEST_URL,
  GITHUB_REPO_RELEASES_BASE,
  buildGitHubReleasePageUrl,
} from "@/main/lib/github-release-url";

describe("buildGitHubReleasePageUrl", () => {
  it("builds a tag URL for a valid semver", () => {
    expect(buildGitHubReleasePageUrl("18.2.0")).toBe(
      `${GITHUB_REPO_RELEASES_BASE}/tag/v18.2.0`
    );
  });

  it("accepts a leading v and optional prerelease", () => {
    expect(buildGitHubReleasePageUrl("v19.0.0-beta.1")).toBe(
      `${GITHUB_REPO_RELEASES_BASE}/tag/v19.0.0-beta.1`
    );
  });

  it("falls back to latest when version is missing or empty", () => {
    expect(buildGitHubReleasePageUrl(undefined)).toBe(GITHUB_RELEASES_LATEST_URL);
    expect(buildGitHubReleasePageUrl(null)).toBe(GITHUB_RELEASES_LATEST_URL);
    expect(buildGitHubReleasePageUrl("   ")).toBe(GITHUB_RELEASES_LATEST_URL);
  });

  it("falls back to latest for non-semver strings (no URL interpolation)", () => {
    expect(buildGitHubReleasePageUrl("../evil")).toBe(GITHUB_RELEASES_LATEST_URL);
    expect(buildGitHubReleasePageUrl("18.2")).toBe(GITHUB_RELEASES_LATEST_URL);
    expect(buildGitHubReleasePageUrl("not-a-version")).toBe(
      GITHUB_RELEASES_LATEST_URL
    );
  });
});
