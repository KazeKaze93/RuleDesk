import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEBUG_KEY,
  MAX_UPDATES_GROUP_SIZE,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "../src/config/constants";
import { clearFavsCache, isFav } from "../src/storage/favs";
import {
  MARKS_KEEP_LIMIT,
  marksPruneThreshold,
} from "../src/storage/marks-prune";
import { createDefaultStorage } from "../src/storage/schema";
import {
  addArtist,
  addCollection,
  addPostToPlaylist,
  clearStorageCache,
  createPlaylist,
  exportJson,
  getPlaylistChunkSize,
  getUpdatesGroupSize,
  importJson,
  listArtistTags,
  listPlaylists,
  load,
  playlistsContaining,
  reloadFromStorage,
  removeArtist,
  removePostFromPlaylist,
  save,
  setPlaylistChunkSize,
  setUpdatesGroupSize,
} from "../src/storage/store";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
  clearStorageCache();
  vi.stubGlobal(
    "GM_getValue",
    (key: string, defaultValue?: unknown): unknown => {
      if (!memory.has(key)) {
        return defaultValue;
      }
      return memory.get(key);
    },
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

describe("store", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
  });

  it("returns the default object when storage is empty", () => {
    expect(load()).toEqual(createDefaultStorage());
    expect(memory.has(STORAGE_KEY)).toBe(false);
  });

  it("backs up invalid content and returns default without overwriting", () => {
    memory.set(STORAGE_KEY, { version: 1, broken: true });
    const result = load();
    expect(result).toEqual(createDefaultStorage());
    expect(memory.get(STORAGE_BACKUP_KEY)).toEqual({
      version: 1,
      broken: true,
    });
    expect(memory.get(STORAGE_KEY)).toEqual({ version: 1, broken: true });
  });

  it("round-trips a valid save through load", () => {
    const data = createDefaultStorage();
    data.collections.push({
      id: "c1",
      name: "Cats",
      tags: [{ tag: "cat", type: "include" }],
    });
    save(data);
    expect(load()).toEqual(data);
  });

  it("imports valid JSON by merging collections on id", () => {
    save({
      version: 1,
      collections: [
        {
          id: "keep",
          name: "Keep me",
          tags: [{ tag: "a", type: "include" }],
        },
        {
          id: "replace",
          name: "Old",
          tags: [{ tag: "old", type: "include" }],
        },
      ],
      artists: [],
      marks: {},
    });

    const merged = importJson(
      JSON.stringify({
        version: 1,
        collections: [
          {
            id: "replace",
            name: "New",
            tags: [{ tag: "new", type: "include" }],
          },
          {
            id: "added",
            name: "Added",
            tags: [{ tag: "x", type: "exclude" }],
          },
        ],
        artists: [],
        marks: {},
      }),
    );

    expect(merged.collections).toEqual([
      {
        id: "keep",
        name: "Keep me",
        tags: [{ tag: "a", type: "include" }],
      },
      {
        id: "replace",
        name: "New",
        tags: [{ tag: "new", type: "include" }],
      },
      {
        id: "added",
        name: "Added",
        tags: [{ tag: "x", type: "exclude" }],
      },
    ]);
  });

  it("allows duplicate names on import", () => {
    save({
      version: 1,
      collections: [
        {
          id: "a",
          name: "Same",
          tags: [{ tag: "a", type: "include" }],
        },
      ],
      artists: [],
      marks: {},
    });

    const merged = importJson(
      JSON.stringify({
        version: 1,
        collections: [
          {
            id: "b",
            name: "Same",
            tags: [{ tag: "b", type: "include" }],
          },
        ],
        artists: [],
        marks: {},
      }),
    );

    expect(merged.collections.map((item) => item.name)).toEqual([
      "Same",
      "Same",
    ]);
  });

  it("rejects invalid JSON on import without writing", () => {
    const before = createDefaultStorage();
    save(before);
    expect(() => importJson("{not-json")).toThrow();
    expect(load()).toEqual(before);
  });

  it("rejects schema-invalid JSON on import without writing", () => {
    const before = createDefaultStorage();
    save(before);
    expect(() =>
      importJson(JSON.stringify({ version: 1, collections: "nope" })),
    ).toThrow(
      /^File is not a RuleDesk Web export: collections: /,
    );
    expect(load()).toEqual(before);
  });

  it("exportJson returns pretty JSON of current storage", () => {
    const data = createDefaultStorage();
    data.collections.push({
      id: "c1",
      name: "Cats",
      tags: [{ tag: "cat", type: "include" }],
    });
    save(data);
    expect(JSON.parse(exportJson())).toEqual({ ...data, favIds: [] });
  });

  it("loads legacy storage without settings and migrates fav marks", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: { "7": { fav: true } },
    });
    const data = load();
    expect(data.settings).toBeUndefined();
    expect(data.marks["7"]).toBeUndefined();
    expect(isFav(7)).toBe(true);
  });

  it("loads legacy artists with lastSeenPostId and storage without updates", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [{ tag: "nyx_x", lastSeenPostId: 99 }],
      marks: {},
    });
    const data = load();
    expect(data.artists).toEqual([{ tag: "nyx_x" }]);
    expect(data.updates).toBeUndefined();
  });

  it("imports artists by tag and keeps max seenPostId", () => {
    save({
      version: 1,
      collections: [],
      artists: [{ tag: "a" }],
      marks: {},
      updates: { seenPostId: 10 },
    });

    const merged = importJson(
      JSON.stringify({
        version: 1,
        collections: [],
        artists: [{ tag: "b" }, { tag: "a" }],
        marks: {},
        updates: { seenPostId: 25 },
      }),
    );

    expect(merged.artists.map((item) => item.tag).sort()).toEqual(["a", "b"]);
    expect(merged.updates?.seenPostId).toBe(25);
  });

  it("caches load in memory so GM_getValue runs once per page lifetime", () => {
    const data = createDefaultStorage();
    data.artists.push({ tag: "nyx_x" });
    save(data);

    const getSpy = vi.fn(
      (key: string, defaultValue?: unknown): unknown => {
        if (!memory.has(key)) {
          return defaultValue;
        }
        return memory.get(key);
      },
    );
    vi.stubGlobal("GM_getValue", getSpy);

    clearStorageCache();
    const first = load();
    const getCallsAfterFirst = getSpy.mock.calls.filter(
      (call) => call[0] === STORAGE_KEY,
    ).length;
    expect(getCallsAfterFirst).toBeGreaterThanOrEqual(1);

    const second = load();
    const getCallsAfterSecond = getSpy.mock.calls.filter(
      (call) => call[0] === STORAGE_KEY,
    ).length;
    expect(getCallsAfterSecond).toBe(getCallsAfterFirst);
    expect(second).toBe(first);
    expect(second.artists).toEqual([{ tag: "nyx_x" }]);
  });

  it("save updates the in-memory cache", () => {
    const data = createDefaultStorage();
    save(data);
    data.artists.push({ tag: "cached" });
    save(data);
    expect(load().artists).toEqual([{ tag: "cached" }]);
  });

  it("reloadFromStorage re-reads from GM and replaces the cache", () => {
    save(createDefaultStorage());
    expect(load().artists).toEqual([]);

    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [{ tag: "external" }],
      marks: {},
    });

    expect(load().artists).toEqual([]);
    expect(reloadFromStorage().artists).toEqual([{ tag: "external" }]);
    expect(load().artists).toEqual([{ tag: "external" }]);
  });

  it("loads legacy collections without kind/postIds as saved searches", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [
        {
          id: "legacy",
          name: "Cats",
          tags: [{ tag: "cat", type: "include" }],
        },
      ],
      artists: [],
      marks: {},
    });
    const data = load();
    expect(data.collections[0]).toEqual({
      id: "legacy",
      name: "Cats",
      tags: [{ tag: "cat", type: "include" }],
    });
    expect(listPlaylists()).toEqual([]);
  });

  it("createPlaylist stores kind posts with empty tags and unique ids", () => {
    const first = createPlaylist("  Watch later  ");
    const second = createPlaylist("Watch later");
    expect(first).toMatchObject({
      name: "Watch later",
      kind: "posts",
      tags: [],
      postIds: [],
    });
    expect(second.id).not.toBe(first.id);
    expect(listPlaylists()).toHaveLength(2);
  });

  it("add/remove post ids uniquely and playlistsContaining finds them", () => {
    const playlist = createPlaylist("A");
    const other = createPlaylist("B");
    expect(addPostToPlaylist(playlist.id, 10)?.postIds).toEqual([10]);
    expect(addPostToPlaylist(playlist.id, 10)?.postIds).toEqual([10]);
    expect(addPostToPlaylist(playlist.id, 20)?.postIds).toEqual([10, 20]);
    expect(addPostToPlaylist(other.id, 10)?.postIds).toEqual([10]);
    expect(playlistsContaining(10).map((item) => item.id).sort()).toEqual(
      [playlist.id, other.id].sort(),
    );
    expect(removePostFromPlaylist(playlist.id, 10)?.postIds).toEqual([20]);
    expect(playlistsContaining(10).map((item) => item.id)).toEqual([other.id]);
    expect(addPostToPlaylist("missing", 1)).toBeNull();
    expect(removePostFromPlaylist("missing", 1)).toBeNull();
  });

  it("listPlaylists ignores saved searches", () => {
    addCollection("Search", [{ tag: "cat", type: "include" }]);
    const playlist = createPlaylist("Posts");
    expect(listPlaylists().map((item) => item.id)).toEqual([playlist.id]);
  });

  it("playlistChunkSize defaults to 40 and can be set", () => {
    expect(getPlaylistChunkSize()).toBe(40);
    setPlaylistChunkSize(7);
    expect(getPlaylistChunkSize()).toBe(7);
    expect(load().settings?.playlistChunkSize).toBe(7);
  });

  it("getUpdatesGroupSize maps 0 to max 400 and caps higher values", () => {
    expect(MAX_UPDATES_GROUP_SIZE).toBe(400);
    expect(getUpdatesGroupSize()).toBe(MAX_UPDATES_GROUP_SIZE);
    setUpdatesGroupSize(0);
    expect(load().settings?.updatesGroupSize).toBe(0);
    expect(getUpdatesGroupSize()).toBe(MAX_UPDATES_GROUP_SIZE);
    setUpdatesGroupSize(50);
    expect(getUpdatesGroupSize()).toBe(50);
    setUpdatesGroupSize(1000);
    expect(load().settings?.updatesGroupSize).toBe(MAX_UPDATES_GROUP_SIZE);
    expect(getUpdatesGroupSize()).toBe(MAX_UPDATES_GROUP_SIZE);
  });

  it("listArtistTags shares one read within a second and re-reads GM after it", () => {
    const start = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(start);
    save(createDefaultStorage());
    expect(listArtistTags()).toEqual([]);
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [{ tag: "from_gm" }],
      marks: {},
    });
    // Within the same moment the page's modules share one read.
    clock.mockReturnValue(start + 500);
    expect(listArtistTags()).toEqual([]);
    // Later the cache counts as stale and storage is read again.
    clock.mockReturnValue(start + 1500);
    expect(listArtistTags()).toEqual(["from_gm"]);
    clock.mockRestore();
  });

  it("addArtist reloads before write so a stale cache cannot drop peers", () => {
    save({
      version: 1,
      collections: [],
      artists: [{ tag: "alpha" }],
      marks: {},
    });
    expect(load().artists).toEqual([{ tag: "alpha" }]);

    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [{ tag: "alpha" }, { tag: "beta" }],
      marks: {},
    });

    addArtist("gamma");
    expect(listArtistTags().sort()).toEqual(["alpha", "beta", "gamma"]);
  });

  it("removeArtist reloads before write so a stale cache cannot drop peers", () => {
    save({
      version: 1,
      collections: [],
      artists: [{ tag: "alpha" }],
      marks: {},
    });
    expect(load().artists).toEqual([{ tag: "alpha" }]);

    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [{ tag: "alpha" }, { tag: "beta" }, { tag: "gamma" }],
      marks: {},
    });

    expect(removeArtist("beta")).toBe(true);
    expect(listArtistTags().sort()).toEqual(["alpha", "gamma"]);
  });

  it("save prunes marks when size exceeds keep limit by 10%", () => {
    const marks: Record<string, { seen: true }> = {};
    const overThreshold = marksPruneThreshold() + 1;
    for (let id = 1; id <= overThreshold; id += 1) {
      marks[String(id)] = { seen: true };
    }
    const data = createDefaultStorage();
    data.marks = marks;
    save(data);
    const stored = load();
    const ids = Object.keys(stored.marks)
      .map(Number)
      .sort((a, b) => a - b);
    expect(ids).toHaveLength(MARKS_KEEP_LIMIT);
    expect(ids[0]).toBe(overThreshold - MARKS_KEEP_LIMIT + 1);
    expect(ids[ids.length - 1]).toBe(overThreshold);
  });

  it("export/import includes playlists in collections and omits blacklist", () => {
    const search = addCollection("Search", [
      { tag: "cat", type: "include" },
    ]);
    const playlist = createPlaylist("Later");
    addPostToPlaylist(playlist.id, 99);
    setPlaylistChunkSize(12);

    const exported = JSON.parse(exportJson()) as {
      collections: unknown[];
      settings?: { playlistChunkSize?: number };
      blacklist?: unknown;
      tag_blacklist?: unknown;
    };
    expect(exported.blacklist).toBeUndefined();
    expect(exported.tag_blacklist).toBeUndefined();
    expect(exported.settings?.playlistChunkSize).toBe(12);
    const exportedSearch = exported.collections.find(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        item.id === search.id,
    );
    expect(exportedSearch).toEqual({
      id: search.id,
      name: "Search",
      tags: [{ tag: "cat", type: "include" }],
    });
    expect(exported.collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: playlist.id,
          kind: "posts",
          postIds: [99],
          tags: [],
        }),
      ]),
    );

    memory.clear();
    clearFavsCache();
    clearStorageCache();
    const merged = importJson(JSON.stringify(exported));
    expect(merged.collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: search.id }),
        expect.objectContaining({
          id: playlist.id,
          kind: "posts",
          postIds: [99],
        }),
      ]),
    );
    expect(getPlaylistChunkSize()).toBe(12);
  });
});
