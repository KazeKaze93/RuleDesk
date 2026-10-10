import { describe, expect, it, vi } from "vitest";
import type { Artist } from "@shared/types/db";
import {
  ensureArtistTrackedAndSynced,
  getTrackAndDownloadCandidateTag,
  isResolvedArtistIncludeTag,
} from "@/renderer/lib/browse-track-download";

function makeArtist(overrides: Partial<Artist> & Pick<Artist, "id" | "tag">): Artist {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.tag,
    tag: overrides.tag,
    type: overrides.type ?? "tag",
    provider: overrides.provider ?? "rule34",
    apiEndpoint: overrides.apiEndpoint ?? "https://api.rule34.xxx/",
    lastPostId: overrides.lastPostId ?? 0,
    lastChecked: overrides.lastChecked ?? null,
    newPostsCount: overrides.newPostsCount ?? 0,
    createdAt: overrides.createdAt ?? new Date(0),
    syncStatus: overrides.syncStatus ?? "idle",
    lastError: overrides.lastError ?? null,
    lastSyncIncomplete: overrides.lastSyncIncomplete ?? false,
  };
}

describe("getTrackAndDownloadCandidateTag", () => {
  it("returns the sole include tag", () => {
    expect(getTrackAndDownloadCandidateTag(["wlop"])).toBe("wlop");
  });

  it("hides when there are multiple include tags", () => {
    expect(getTrackAndDownloadCandidateTag(["wlop", "1girl"])).toBeNull();
  });

  it("hides when include tags are empty", () => {
    expect(getTrackAndDownloadCandidateTag([])).toBeNull();
  });

  it("hides blank sole tag", () => {
    expect(getTrackAndDownloadCandidateTag(["   "])).toBeNull();
  });
});

describe("isResolvedArtistIncludeTag", () => {
  it("accepts a tag present in resolveTags artist results", () => {
    expect(isResolvedArtistIncludeTag("Wlop", ["wlop"])).toBe(true);
  });

  it("rejects non-artist resolve results", () => {
    expect(isResolvedArtistIncludeTag("1girl", [])).toBe(false);
  });

  it("rejects when resolve returned a different tag", () => {
    expect(isResolvedArtistIncludeTag("wlop", ["someone_else"])).toBe(false);
  });
});

describe("ensureArtistTrackedAndSynced", () => {
  it("skips addArtist when already tracked and downloads only after successful sync", async () => {
    const addArtist = vi.fn();
    const repairArtist = vi.fn().mockResolvedValue({ success: true });
    const getTrackedArtists = vi.fn().mockResolvedValue([
      { id: 42, tag: "wlop", provider: "rule34" },
    ]);

    const result = await ensureArtistTrackedAndSynced({
      tag: "wlop",
      provider: "rule34",
      deps: { getTrackedArtists, addArtist, repairArtist },
    });

    expect(result).toEqual({ ok: true, artistId: 42, alreadyTracked: true });
    expect(addArtist).not.toHaveBeenCalled();
    expect(repairArtist).toHaveBeenCalledWith(42);
  });

  it("adds then syncs when not tracked", async () => {
    const added = makeArtist({ id: 7, tag: "wlop" });
    const addArtist = vi.fn().mockResolvedValue(added);
    const repairArtist = vi.fn().mockResolvedValue({ success: true });
    const getTrackedArtists = vi.fn().mockResolvedValue([]);

    const result = await ensureArtistTrackedAndSynced({
      tag: "wlop",
      provider: "rule34",
      deps: { getTrackedArtists, addArtist, repairArtist },
    });

    expect(result).toEqual({ ok: true, artistId: 7, alreadyTracked: false });
    expect(addArtist).toHaveBeenCalledWith({
      name: "wlop",
      tag: "wlop",
      type: "tag",
      provider: "rule34",
    });
    expect(repairArtist).toHaveBeenCalledWith(7);
  });

  it("returns clear sync error and does not report ok", async () => {
    const repairArtist = vi
      .fn()
      .mockResolvedValue({ success: false, error: "HTTP 401: Unauthorized" });
    const getTrackedArtists = vi.fn().mockResolvedValue([
      { id: 3, tag: "wlop", provider: "rule34" },
    ]);

    const result = await ensureArtistTrackedAndSynced({
      tag: "wlop",
      provider: "rule34",
      deps: {
        getTrackedArtists,
        addArtist: vi.fn(),
        repairArtist,
      },
    });

    expect(result).toEqual({
      ok: false,
      reason: "HTTP 401: Unauthorized",
    });
  });

  it("treats sync cancel as failure with reason", async () => {
    const repairArtist = vi
      .fn()
      .mockResolvedValue({ success: false, error: "Sync cancelled" });
    const getTrackedArtists = vi.fn().mockResolvedValue([
      { id: 3, tag: "wlop", provider: "rule34" },
    ]);

    const result = await ensureArtistTrackedAndSynced({
      tag: "wlop",
      provider: "rule34",
      deps: {
        getTrackedArtists,
        addArtist: vi.fn(),
        repairArtist,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("Sync cancelled");
    }
  });

  it("does not match the same tag on a different provider", async () => {
    const added = makeArtist({ id: 9, tag: "wlop", provider: "gelbooru" });
    const addArtist = vi.fn().mockResolvedValue(added);
    const repairArtist = vi.fn().mockResolvedValue({ success: true });
    const getTrackedArtists = vi.fn().mockResolvedValue([
      { id: 1, tag: "wlop", provider: "rule34" },
    ]);

    const result = await ensureArtistTrackedAndSynced({
      tag: "wlop",
      provider: "gelbooru",
      deps: { getTrackedArtists, addArtist, repairArtist },
    });

    expect(result).toEqual({ ok: true, artistId: 9, alreadyTracked: false });
    expect(addArtist).toHaveBeenCalled();
  });
});
