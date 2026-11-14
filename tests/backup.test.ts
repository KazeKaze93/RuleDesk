import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPEARANCE_BACKGROUND_KEY,
  FAVS_STORAGE_KEY,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "../src/config/constants";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  buildBackupFile,
  importBackupJson,
  IMPORT_MODE_MERGE,
  IMPORT_MODE_REPLACE,
  serializeBackupFile,
} from "../src/storage/backup";
import { saveBackground } from "../src/storage/background-store";
import { clearFavsCache, loadFavSet } from "../src/storage/favs";
import { createDefaultFavs, createDefaultStorage } from "../src/storage/schema";
import {
  addArtist,
  addCollection,
  addPostToCollection,
  clearStorageCache,
  createPlaylist,
  load,
  save,
} from "../src/storage/store";

const memory = new Map<string, unknown>();

type StoreMap = Map<IDBValidKey, unknown>;
type DbStores = Map<string, StoreMap>;

const fakeDatabases = new Map<string, DbStores>();

function getOrCreateStore(dbName: string, storeName: string): StoreMap {
  let stores = fakeDatabases.get(dbName);
  if (stores === undefined) {
    stores = new Map();
    fakeDatabases.set(dbName, stores);
  }
  let store = stores.get(storeName);
  if (store === undefined) {
    store = new Map();
    stores.set(storeName, store);
  }
  return store;
}

function installFakeIndexedDb(): void {
  fakeDatabases.clear();

  class FakeRequest {
    result: unknown = undefined;
    error: DOMException | null = null;
    onsuccess: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onupgradeneeded: ((event: Event) => void) | null = null;

    succeed(value: unknown): void {
      this.result = value;
      queueMicrotask(() => {
        this.onsuccess?.(new Event("success"));
      });
    }

    fail(message: string): void {
      this.error = new DOMException(message);
      queueMicrotask(() => {
        this.onerror?.(new Event("error"));
      });
    }
  }

  class FakeTransaction {
    oncomplete: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    error: DOMException | null = null;
    readonly #store: StoreMap;
    readonly #mode: IDBTransactionMode;
    #pending = 0;

    constructor(store: StoreMap, mode: IDBTransactionMode) {
      this.#store = store;
      this.#mode = mode;
    }

    objectStore(_name: string): {
      get: (key: IDBValidKey) => FakeRequest;
      put: (value: unknown, key: IDBValidKey) => FakeRequest;
      delete: (key: IDBValidKey) => FakeRequest;
    } {
      return {
        get: (key: IDBValidKey): FakeRequest => {
          const request = new FakeRequest();
          this.#pending += 1;
          queueMicrotask(() => {
            request.result = this.#store.get(key);
            request.onsuccess?.(new Event("success"));
            this.#pending -= 1;
            this.#maybeComplete();
          });
          return request;
        },
        put: (value: unknown, key: IDBValidKey): FakeRequest => {
          const request = new FakeRequest();
          if (this.#mode === "readonly") {
            request.fail("ReadonlyError");
            return request;
          }
          this.#pending += 1;
          queueMicrotask(() => {
            this.#store.set(key, value);
            request.onsuccess?.(new Event("success"));
            this.#pending -= 1;
            this.#maybeComplete();
          });
          return request;
        },
        delete: (key: IDBValidKey): FakeRequest => {
          const request = new FakeRequest();
          if (this.#mode === "readonly") {
            request.fail("ReadonlyError");
            return request;
          }
          this.#pending += 1;
          queueMicrotask(() => {
            this.#store.delete(key);
            request.onsuccess?.(new Event("success"));
            this.#pending -= 1;
            this.#maybeComplete();
          });
          return request;
        },
      };
    }

    #maybeComplete(): void {
      if (this.#pending === 0) {
        queueMicrotask(() => {
          this.oncomplete?.(new Event("complete"));
        });
      }
    }
  }

  class FakeDb {
    readonly objectStoreNames: { contains: (name: string) => boolean };
    readonly #dbName: string;
    readonly #stores: DbStores;

    constructor(dbName: string, stores: DbStores) {
      this.#dbName = dbName;
      this.#stores = stores;
      this.objectStoreNames = {
        contains: (name: string): boolean => this.#stores.has(name),
      };
    }

    createObjectStore(name: string): void {
      if (!this.#stores.has(name)) {
        this.#stores.set(name, new Map());
      }
    }

    transaction(storeName: string, mode: IDBTransactionMode): FakeTransaction {
      const store = getOrCreateStore(this.#dbName, storeName);
      return new FakeTransaction(store, mode);
    }

    close(): void {
      // no-op
    }
  }

  const indexedDB = {
    open(dbName: string, _version?: number): FakeRequest {
      const request = new FakeRequest();
      queueMicrotask(() => {
        let stores = fakeDatabases.get(dbName);
        const isNew = stores === undefined;
        if (stores === undefined) {
          stores = new Map();
          fakeDatabases.set(dbName, stores);
        }
        const db = new FakeDb(dbName, stores);
        if (isNew || !stores.has("background")) {
          request.result = db;
          request.onupgradeneeded?.(new Event("upgradeneeded"));
        }
        request.succeed(db);
      });
      return request;
    },
  };

  vi.stubGlobal("indexedDB", indexedDB);
}

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  clearFavsCache();
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

describe("backup export/import", () => {
  beforeEach(() => {
    installGmMocks();
    installFakeIndexedDb();
    save(createDefaultStorage());
    memory.set(FAVS_STORAGE_KEY, createDefaultFavs());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("roundtrips export then replace import", async () => {
    addArtist("nyx_x");
    addCollection("Cats", [{ tag: "cat", type: "include" }]);
    memory.set(FAVS_STORAGE_KEY, {
      version: 1,
      ids: [10, 20],
    });
    clearFavsCache();

    const file = await buildBackupFile({
      includeBackground: false,
      includeFavorites: true,
    });
    expect(file.format).toBe(BACKUP_FORMAT);
    expect(file.version).toBe(BACKUP_VERSION);
    expect(file.storage.artists.map((entry) => entry.tag)).toEqual(["nyx_x"]);
    expect(file.favs?.ids).toEqual([10, 20]);
    expect(file.background).toBeUndefined();

    save(createDefaultStorage());
    memory.set(FAVS_STORAGE_KEY, createDefaultFavs());
    clearStorageCache();
    clearFavsCache();

    const result = await importBackupJson(
      serializeBackupFile(file),
      IMPORT_MODE_REPLACE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.summary).toEqual({
      artistCount: 1,
      collectionCount: 1,
      favCount: 2,
    });
    expect(load().artists.map((entry) => entry.tag)).toEqual(["nyx_x"]);
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([10, 20]);
    expect(memory.has(STORAGE_BACKUP_KEY)).toBe(true);
  });

  it("omit favorites from export when includeFavorites is false", async () => {
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [10, 20] });
    clearFavsCache();
    const file = await buildBackupFile({
      includeBackground: false,
      includeFavorites: false,
    });
    expect(file.favs).toBeUndefined();
    const serialized = serializeBackupFile(file);
    expect(serialized).not.toContain('"favs"');
  });

  it("import without favs leaves local fav set untouched", async () => {
    addArtist("keep_artist");
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [99, 100] });
    clearFavsCache();

    const file = await buildBackupFile({
      includeBackground: false,
      includeFavorites: false,
    });
    file.storage = {
      ...createDefaultStorage(),
      artists: [{ tag: "from_file" }],
      marks: {
        "7": { fav: true, seen: true },
      },
    };

    const result = await importBackupJson(
      serializeBackupFile(file),
      IMPORT_MODE_REPLACE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([99, 100]);
    expect(result.summary.favCount).toBe(2);
    expect(load().artists.map((entry) => entry.tag)).toEqual(["from_file"]);
    expect(load().marks["7"]).toEqual({ seen: true });
    expect(memory.get(FAVS_STORAGE_KEY)).toEqual({
      version: 1,
      ids: [99, 100],
    });
  });

  it("merge keeps existing artists and unions favs; settings come from file", async () => {
    addArtist("alpha");
    addCollection("Local", [{ tag: "dog", type: "include" }]);
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [1] });
    clearFavsCache();

    const incoming = await buildBackupFile({
      includeBackground: false,
      includeFavorites: true,
    });
    incoming.storage = {
      ...incoming.storage,
      artists: [{ tag: "beta" }],
      collections: [
        {
          id: "from-file",
          name: "File search",
          tags: [{ tag: "bird", type: "include" }],
        },
      ],
      settings: {
        gridFavButtons: false,
        updatesGroupSize: 3,
      },
    };
    incoming.favs = { version: 1, ids: [2, 3] };

    const beforeArtists = load().artists.map((entry) => entry.tag);
    expect(beforeArtists).toEqual(["alpha"]);

    const result = await importBackupJson(
      serializeBackupFile(incoming),
      IMPORT_MODE_MERGE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const tags = load().artists.map((entry) => entry.tag).sort();
    expect(tags).toEqual(["alpha", "beta"]);
    expect(load().collections.map((entry) => entry.name).sort()).toEqual([
      "File search",
      "Local",
    ]);
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(load().settings?.gridFavButtons).toBe(false);
    expect(load().settings?.updatesGroupSize).toBe(3);
  });

  it("corrupt file changes nothing", async () => {
    addArtist("keep_me");
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [99] });
    clearFavsCache();
    const storageBefore = structuredClone(memory.get(STORAGE_KEY));
    const favsBefore = structuredClone(memory.get(FAVS_STORAGE_KEY));

    const result = await importBackupJson("{not-json", IMPORT_MODE_REPLACE);
    expect(result.ok).toBe(false);
    expect(memory.get(STORAGE_KEY)).toEqual(storageBefore);
    expect(memory.get(FAVS_STORAGE_KEY)).toEqual(favsBefore);
    expect(load().artists.map((entry) => entry.tag)).toEqual(["keep_me"]);
    expect(Array.from(loadFavSet())).toEqual([99]);

    const badShape = await importBackupJson(
      JSON.stringify({ format: "nope", version: 1 }),
      IMPORT_MODE_MERGE,
    );
    expect(badShape.ok).toBe(false);
    expect(load().artists.map((entry) => entry.tag)).toEqual(["keep_me"]);
  });

  it("includeBackground exports IDB background (migrating leftover GM)", async () => {
    await saveBackground("data:image/png;base64,abc");
    const withBg = await buildBackupFile({
      includeBackground: true,
      includeFavorites: false,
    });
    expect(withBg.background).toBe("data:image/png;base64,abc");
    const withoutBg = await buildBackupFile({
      includeBackground: false,
      includeFavorites: false,
    });
    expect(withoutBg.background).toBeUndefined();
  });

  it("includeBackground migrates GM APPEARANCE_BACKGROUND_KEY via loadBackground", async () => {
    memory.set(APPEARANCE_BACKGROUND_KEY, "data:image/png;base64,from-gm");
    const withBg = await buildBackupFile({
      includeBackground: true,
      includeFavorites: false,
    });
    expect(withBg.background).toBe("data:image/png;base64,from-gm");
    expect(memory.get(APPEARANCE_BACKGROUND_KEY)).toBe("");
  });

  it("replace import writes background into IDB and clears GM leftover", async () => {
    memory.set(APPEARANCE_BACKGROUND_KEY, "data:image/png;base64,old-gm");
    const file = await buildBackupFile({
      includeBackground: false,
      includeFavorites: false,
    });
    file.background = "data:image/png;base64,from-backup";

    const result = await importBackupJson(
      serializeBackupFile(file),
      IMPORT_MODE_REPLACE,
    );
    expect(result.ok).toBe(true);

    const reexported = await buildBackupFile({
      includeBackground: true,
      includeFavorites: false,
    });
    expect(reexported.background).toBe("data:image/png;base64,from-backup");
    expect(memory.get(APPEARANCE_BACKGROUND_KEY)).toBe("");
  });

  it("exports collection thumbs, shuffledOrder, and dynamic query", async () => {
    const posts = createPlaylist("Later");
    addPostToCollection(posts.id, 42, "https://wimg.rule34.xxx/thumbnails/1/thumbnail_ab.jpg?42");
    addCollection("Cats", [{ tag: "cat", type: "include" }]);

    const file = await buildBackupFile({
      includeBackground: false,
      includeFavorites: false,
    });
    const exportedPosts = file.storage.collections.find((entry) => entry.id === posts.id);
    expect(exportedPosts?.postIds).toEqual([42]);
    expect(exportedPosts?.thumbs).toEqual({
      "42": "https://wimg.rule34.xxx/thumbnails/1/thumbnail_ab.jpg?42",
    });
    expect(exportedPosts?.shuffledOrder).toBeNull();
    const serialized = serializeBackupFile(file);
    expect(serialized).toContain("\"thumbs\"");
    expect(serialized).toContain("\"shuffledOrder\"");
  });

  it("imports a backup written before thumbs, shuffledOrder, and query existed", async () => {
    const legacy = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: "2026-01-01T00:00:00.000Z",
      storage: {
        version: 1,
        collections: [
          {
            id: "legacy-search",
            name: "Cats",
            tags: [{ tag: "cat", type: "include" }],
          },
          {
            id: "legacy-posts",
            name: "Later",
            tags: [],
            kind: "posts",
            postIds: [4, 5],
          },
        ],
        artists: [],
        marks: {},
      },
    };

    const result = await importBackupJson(
      JSON.stringify(legacy),
      IMPORT_MODE_REPLACE,
    );
    expect(result.ok).toBe(true);
    const collections = load().collections;
    expect(collections.find((entry) => entry.id === "legacy-search")).toEqual({
      id: "legacy-search",
      name: "Cats",
      tags: [{ tag: "cat", type: "include" }],
    });
    expect(collections.find((entry) => entry.id === "legacy-posts")).toEqual({
      id: "legacy-posts",
      name: "Later",
      tags: [],
      kind: "posts",
      postIds: [4, 5],
      thumbs: {},
      shuffledOrder: null,
    });
  });
});
