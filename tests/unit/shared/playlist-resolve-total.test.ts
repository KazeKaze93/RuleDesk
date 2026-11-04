import { describe, expect, it } from "vitest";
import { buildPlaylistResolveTotal } from "@shared/playlist-resolve-total";

describe("buildPlaylistResolveTotal", () => {
  it("returns null for manual playlists", () => {
    expect(
      buildPlaylistResolveTotal({
        isSmart: false,
        remoteCompleteness: "exact",
        mergedWindowCount: 10,
        localHitMaterializeCap: false,
      })
    ).toBeNull();
  });

  it("returns exact when remote feed was exhausted", () => {
    expect(
      buildPlaylistResolveTotal({
        isSmart: true,
        remoteCompleteness: "exact",
        mergedWindowCount: 42,
        localHitMaterializeCap: false,
      })
    ).toEqual({ count: 42, kind: "exact" });
  });

  it("returns lowerBound when remote hit the scan limit", () => {
    expect(
      buildPlaylistResolveTotal({
        isSmart: true,
        remoteCompleteness: "lowerBound",
        mergedWindowCount: 1000,
        localHitMaterializeCap: false,
      })
    ).toEqual({ count: 1000, kind: "lowerBound" });
  });

  it("returns null when remote walk failed", () => {
    expect(
      buildPlaylistResolveTotal({
        isSmart: true,
        remoteCompleteness: "failed",
        mergedWindowCount: 0,
        localHitMaterializeCap: false,
      })
    ).toBeNull();
  });

  it("downgrades exact remote to lowerBound when local hit the materialize cap", () => {
    expect(
      buildPlaylistResolveTotal({
        isSmart: true,
        remoteCompleteness: "exact",
        mergedWindowCount: 50_000,
        localHitMaterializeCap: true,
      })
    ).toEqual({ count: 50_000, kind: "lowerBound" });
  });
});
