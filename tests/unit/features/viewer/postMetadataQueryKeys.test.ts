import { describe, expect, it } from "vitest";
import {
  buildPostMetadataResolveQueryKey,
  canonicalizePostTagsForResolve,
} from "@/renderer/features/viewer/postMetadataQueryKeys";

describe("postMetadataQueryKeys", () => {
  it("canonicalizes string and string[] tags to the same key token", () => {
    expect(canonicalizePostTagsForResolve("wlop 2b general")).toBe(
      "wlop 2b general"
    );
    expect(canonicalizePostTagsForResolve(["wlop", "2b", "general"])).toBe(
      "wlop 2b general"
    );
    expect(canonicalizePostTagsForResolve("  wlop   2b  ")).toBe("wlop 2b");
    expect(canonicalizePostTagsForResolve(null)).toBe("");
    expect(canonicalizePostTagsForResolve(undefined)).toBe("");
    expect(canonicalizePostTagsForResolve(42)).toBe("");
  });

  it("builds isomorphic resolve query keys from one factory", () => {
    const tags = "wlop 2b general";
    expect(buildPostMetadataResolveQueryKey("artist", tags)).toEqual([
      "resolve-tags-ipc",
      tags,
    ]);
    expect(buildPostMetadataResolveQueryKey("character", tags)).toEqual([
      "resolve-character-tags-ipc",
      tags,
    ]);
    expect(buildPostMetadataResolveQueryKey("copyright", tags)).toEqual([
      "resolve-copyright-tags-ipc",
      tags,
    ]);
    expect(
      buildPostMetadataResolveQueryKey("artist", ["wlop", "2b", "general"])
    ).toEqual(["resolve-tags-ipc", tags]);
  });
});
