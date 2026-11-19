import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FAVS_STORAGE_KEY,
  STORAGE_KEY,
} from "../src/config/constants";
import {
  addFav,
  addFavs,
  cheapParseFavs,
  clearFavsCache,
  getSyncState,
  isFav,
  loadFavSet,
  migrateMarksFavToFavs,
  parseFavsStrict,
  removeFav,
  setSyncState,
} from "../src/storage/favs";
import {
  FavsSchema,
  LEGACY_PANEL_FEATURE_STATE_ID,
  createDefaultStorage,
  stripLegacyPanelWindowSize,
} from "../src/storage/schema";
import {
  clearStorageCache,
  exportJson,
  importJson,
  load,
  save,
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

describe("favs storage", () => {
  beforeEach(() => {
    installGmMocks();
  });

  it("migrates marks.fav into favs.ids and strips fav from marks", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: {
        "10": { fav: true },
        "20": { fav: true, seen: true },
        "30": { seen: true },
      },
    });

    migrateMarksFavToFavs();

    expect(isFav(10)).toBe(true);
    expect(isFav(20)).toBe(true);
    expect(isFav(30)).toBe(false);
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([10, 20]);

    const main = load();
    expect(main.marks["10"]).toBeUndefined();
    expect(main.marks["20"]).toEqual({ seen: true });
    expect(main.marks["30"]).toEqual({ seen: true });
    expect(main.marks["10"]?.fav).toBeUndefined();
    expect(main.marks["20"]?.fav).toBeUndefined();

    const rawFavs = memory.get(FAVS_STORAGE_KEY);
    expect(rawFavs).toEqual({
      version: 1,
      ids: expect.arrayContaining([10, 20]),
    });
  });

  it("migration is idempotent", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: {
        "5": { fav: true, seen: true },
      },
    });

    migrateMarksFavToFavs();
    const afterFirst = structuredClone(memory.get(FAVS_STORAGE_KEY));
    const marksAfterFirst = structuredClone(
      (memory.get(STORAGE_KEY) as { marks: unknown }).marks,
    );

    clearFavsCache();
    migrateMarksFavToFavs();
    migrateMarksFavToFavs();

    expect(memory.get(FAVS_STORAGE_KEY)).toEqual(afterFirst);
    expect(
      (memory.get(STORAGE_KEY) as { marks: unknown }).marks,
    ).toEqual(marksAfterFirst);
    expect(isFav(5)).toBe(true);
    expect(load().marks["5"]).toEqual({ seen: true });
  });

  it("round-trips 15_000 ids through read/write", () => {
    const ids = Array.from({ length: 15_000 }, (_, index) => index + 1);
    addFavs(ids);

    clearFavsCache();
    const loaded = loadFavSet();
    expect(loaded.size).toBe(15_000);
    expect(isFav(1)).toBe(true);
    expect(isFav(15_000)).toBe(true);
    expect(isFav(15_001)).toBe(false);

    const stored = memory.get(FAVS_STORAGE_KEY) as { ids: number[] };
    expect(stored.ids).toHaveLength(15_000);
  });

  it("does not call FavsSchema.safeParse on ordinary first load", () => {
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [11, 22] });
    const spy = vi.spyOn(FavsSchema, "safeParse");
    clearFavsCache();
    expect(loadFavSet().has(11)).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("cheapParseFavs keeps ids when sync is invalid (full zod would reject)", () => {
    const raw = {
      version: 1,
      ids: [7, 8, 9],
      sync: {
        nextPid: "not-an-int",
        lastPid: 0,
        startedAt: "2020-01-01T00:00:00.000Z",
      },
    };
    expect(FavsSchema.safeParse(raw).success).toBe(false);
    expect(parseFavsStrict(raw)).toBeNull();
    const cheap = cheapParseFavs(raw);
    expect(cheap).toEqual({ version: 1, ids: [7, 8, 9] });

    memory.set(FAVS_STORAGE_KEY, raw);
    clearFavsCache();
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([7, 8, 9]);
  });

  it("lazy-reads favs only on first access", () => {
    const getValue = vi.fn((key: string, defaultValue?: unknown): unknown => {
      if (!memory.has(key)) {
        return defaultValue;
      }
      return memory.get(key);
    });
    vi.stubGlobal("GM_getValue", getValue);
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [42] });
    clearFavsCache();

    const favReadsBefore = getValue.mock.calls.filter(
      (call) => call[0] === FAVS_STORAGE_KEY,
    ).length;
    expect(favReadsBefore).toBe(0);

    expect(isFav(42)).toBe(true);
    const favReadsAfter = getValue.mock.calls.filter(
      (call) => call[0] === FAVS_STORAGE_KEY,
    ).length;
    expect(favReadsAfter).toBeGreaterThan(0);

    getValue.mockClear();
    expect(isFav(42)).toBe(true);
    expect(
      getValue.mock.calls.filter((call) => call[0] === FAVS_STORAGE_KEY),
    ).toHaveLength(0);
  });

  it("parseFavsStrict uses full FavsSchema for import validation", () => {
    expect(parseFavsStrict({ version: 1, ids: [1] })).toEqual({
      version: 1,
      ids: [1],
    });
    expect(parseFavsStrict({ version: 1, ids: ["1"] })).toBeNull();
  });

  it("addFav / removeFav update cache for subsequent isFav", () => {
    expect(isFav(99)).toBe(false);
    addFav(99);
    expect(isFav(99)).toBe(true);
    expect(isFav("99")).toBe(true);
    removeFav("99");
    expect(isFav(99)).toBe(false);
  });

  it("getSyncState / setSyncState persist on the favs key", () => {
    addFav(1);
    expect(getSyncState()).toBeUndefined();
    setSyncState({
      nextPid: 42,
      lastPid: 0,
      startedAt: "2026-01-01T00:00:00.000Z",
      running: true,
      userId: 479099,
      lock: { tabId: "t1", beatAt: 1_700_000_000_000 },
    });
    expect(getSyncState()).toEqual({
      nextPid: 42,
      lastPid: 0,
      startedAt: "2026-01-01T00:00:00.000Z",
      running: true,
      userId: 479099,
      lock: { tabId: "t1", beatAt: 1_700_000_000_000 },
    });
    clearFavsCache();
    expect(getSyncState()).toEqual({
      nextPid: 42,
      lastPid: 0,
      startedAt: "2026-01-01T00:00:00.000Z",
      running: true,
      userId: 479099,
      lock: { tabId: "t1", beatAt: 1_700_000_000_000 },
    });
    expect(isFav(1)).toBe(true);
  });

  it("reads legacy sync blobs without running/userId/lock", () => {
    memory.set(FAVS_STORAGE_KEY, {
      version: 1,
      ids: [1],
      sync: {
        nextPid: 50,
        lastPid: 100,
        startedAt: "2020-01-01T00:00:00.000Z",
      },
    });
    clearFavsCache();
    expect(getSyncState()).toEqual({
      nextPid: 50,
      lastPid: 100,
      startedAt: "2020-01-01T00:00:00.000Z",
    });
    expect(isFav(1)).toBe(true);
  });

  it("strips legacy panel window size without SCHEMA_VERSION bump", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [{ tag: "artist_a" }],
      marks: {
        "9": { seen: true },
      },
      settings: {
        gridFavButtons: true,
        featureState: {
          [LEGACY_PANEL_FEATURE_STATE_ID]: {
            tab: "favorites",
            width: 480,
            height: 640,
          },
          "tag-groups": { collapsed: true },
        },
      },
    });

    migrateMarksFavToFavs();

    const main = load();
    expect(main.version).toBe(1);
    expect(main.artists).toEqual([{ tag: "artist_a" }]);
    expect(main.marks["9"]).toEqual({ seen: true });
    expect(main.settings?.featureState?.[LEGACY_PANEL_FEATURE_STATE_ID]).toEqual({
      tab: "favorites",
    });
    expect(main.settings?.featureState?.["tag-groups"]).toEqual({
      collapsed: true,
    });

    const again = stripLegacyPanelWindowSize(main);
    expect(again.changed).toBe(false);
  });

  it("rewrites saved masonry to default and drops the post panel tab", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: {},
      settings: {
        gridFavButtons: true,
        featureChoice: {
          "grid-density": "masonry",
          "post-actions": "comments",
          "video-player": "fit-width",
        },
      },
    });

    migrateMarksFavToFavs();

    expect(load().settings?.featureChoice).toEqual({
      "grid-density": "default",
      "video-player": "fit-width",
    });

    migrateMarksFavToFavs();
    expect(load().settings?.featureChoice).toEqual({
      "grid-density": "default",
      "video-player": "fit-width",
    });
  });

  it("imports old format with marks.fav into favs", () => {
    save(createDefaultStorage());
    addFav(1);

    importJson(
      JSON.stringify({
        version: 1,
        collections: [],
        artists: [],
        marks: {
          "2": { fav: true },
          "3": { fav: true, seen: true },
        },
      }),
    );

    expect(isFav(1)).toBe(true);
    expect(isFav(2)).toBe(true);
    expect(isFav(3)).toBe(true);
    expect(load().marks["2"]).toBeUndefined();
    expect(load().marks["3"]).toEqual({ seen: true });
  });

  it("imports new format with favIds and merges sets", () => {
    save(createDefaultStorage());
    addFav(10);

    importJson(
      JSON.stringify({
        version: 1,
        collections: [],
        artists: [],
        marks: {},
        favIds: [10, 20, 30],
      }),
    );

    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([
      10, 20, 30,
    ]);
  });

  it("exportJson includes favIds and omits marks.fav", () => {
    const data = createDefaultStorage();
    data.marks["7"] = { fav: true, seen: true };
    save(data);

    const exported = JSON.parse(exportJson()) as {
      favIds: number[];
      marks: Record<string, { fav?: boolean; seen?: boolean }>;
    };
    expect(exported.favIds).toEqual([7]);
    expect(exported.marks["7"]).toEqual({ seen: true });
    expect(exported.marks["7"]?.fav).toBeUndefined();
  });
});
