import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY } from "../src/config/constants";
import {
  ARTISTS_MIRROR_KEY,
  clearArtistsMirror,
  readArtistsMirror,
  writeArtistsMirror,
} from "../src/storage/artists-mirror";
import { clearFavsCache } from "../src/storage/favs";
import {
  addArtist,
  clearStorageCache,
  load,
  reloadFromStorage,
  removeArtist,
  save,
  syncArtistsMirrorFromStorage,
} from "../src/storage/store";
import { createDefaultStorage } from "../src/storage/schema";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
  clearStorageCache();
  clearArtistsMirror();
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

describe("artists-mirror", () => {
  beforeEach(() => {
    installGmMocks();
    localStorage.clear();
  });

  it("round-trips tags through write/read", () => {
    writeArtistsMirror(["a", "b"]);
    expect(readArtistsMirror()).toEqual(["a", "b"]);
    expect(localStorage.getItem(ARTISTS_MIRROR_KEY)).toBe(
      JSON.stringify(["a", "b"]),
    );
  });

  it("returns null for missing or unparseable mirror", () => {
    expect(readArtistsMirror()).toBeNull();
    localStorage.setItem(ARTISTS_MIRROR_KEY, "{");
    expect(readArtistsMirror()).toBeNull();
    localStorage.setItem(ARTISTS_MIRROR_KEY, JSON.stringify([1, "x"]));
    expect(readArtistsMirror()).toBeNull();
  });

  it("clearArtistsMirror removes the key", () => {
    writeArtistsMirror(["z"]);
    clearArtistsMirror();
    expect(localStorage.getItem(ARTISTS_MIRROR_KEY)).toBeNull();
    expect(readArtistsMirror()).toBeNull();
  });

  it("swallows localStorage write errors without throwing", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    expect(() => writeArtistsMirror(["a"])).not.toThrow();
    setItem.mockRestore();
  });

  it("store load seeds the mirror from GM only when missing", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [{ tag: "nyx_x" }, { tag: "other" }],
      marks: {},
    });
    expect(readArtistsMirror()).toBeNull();
    load();
    expect(readArtistsMirror()).toEqual(["nyx_x", "other"]);
  });

  it("load / reloadFromStorage do not replace a fresher mirror with stale GM", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [{ tag: "stale_only" }],
      marks: {},
    });
    writeArtistsMirror(["stale_only", "fresher_follow"]);
    clearStorageCache();
    load();
    expect(readArtistsMirror()).toEqual(["stale_only", "fresher_follow"]);
    clearStorageCache();
    reloadFromStorage();
    expect(readArtistsMirror()).toEqual(["stale_only", "fresher_follow"]);
  });

  it("addArtist / removeArtist / save keep the mirror in sync", () => {
    save(createDefaultStorage());
    expect(readArtistsMirror()).toEqual([]);
    addArtist("alpha");
    expect(readArtistsMirror()).toEqual(["alpha"]);
    addArtist("beta");
    expect(readArtistsMirror()).toEqual(["alpha", "beta"]);
    removeArtist("alpha");
    expect(readArtistsMirror()).toEqual(["beta"]);
  });

  it("syncArtistsMirrorFromStorage seeds when missing but leaves an existing mirror", () => {
    save(createDefaultStorage());
    addArtist("gamma");
    clearArtistsMirror();
    expect(readArtistsMirror()).toBeNull();
    syncArtistsMirrorFromStorage();
    expect(readArtistsMirror()).toEqual(["gamma"]);

    writeArtistsMirror(["gamma", "mirror_only"]);
    syncArtistsMirrorFromStorage();
    expect(readArtistsMirror()).toEqual(["gamma", "mirror_only"]);
  });
});
