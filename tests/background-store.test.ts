import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPEARANCE_BACKGROUND_KEY,
  APPEARANCE_BACKGROUND_TOO_LARGE,
} from "../src/config/constants";
import {
  clearBackground,
  loadBackground,
  saveBackground,
} from "../src/storage/background-store";

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

describe("background-store", () => {
  beforeEach(() => {
    installGmMocks();
    installFakeIndexedDb();
  });

  it("returns null when nothing is stored", async () => {
    await expect(loadBackground()).resolves.toBeNull();
  });

  it("round-trips saveBackground / loadBackground / clearBackground", async () => {
    const dataUrl = "data:image/png;base64,abcd";
    await saveBackground(dataUrl);
    await expect(loadBackground()).resolves.toBe(dataUrl);
    await clearBackground();
    await expect(loadBackground()).resolves.toBeNull();
  });

  it("rejects oversized payloads", async () => {
    const oversized = `data:image/png;base64,${"a".repeat(2_000_000)}`;
    await expect(saveBackground(oversized)).rejects.toThrow(
      APPEARANCE_BACKGROUND_TOO_LARGE,
    );
    await expect(loadBackground()).resolves.toBeNull();
  });

  it("migrates GM APPEARANCE_BACKGROUND_KEY into IndexedDB and clears GM", async () => {
    const dataUrl = "data:image/jpeg;base64,migrate-me";
    memory.set(APPEARANCE_BACKGROUND_KEY, dataUrl);

    await expect(loadBackground()).resolves.toBe(dataUrl);
    expect(memory.get(APPEARANCE_BACKGROUND_KEY)).toBe("");

    // Second load uses IDB only
    memory.delete(APPEARANCE_BACKGROUND_KEY);
    await expect(loadBackground()).resolves.toBe(dataUrl);
  });

  it("saveBackground clears any leftover GM value", async () => {
    memory.set(APPEARANCE_BACKGROUND_KEY, "data:image/png;base64,old");
    await saveBackground("data:image/png;base64,new");
    expect(memory.get(APPEARANCE_BACKGROUND_KEY)).toBe("");
    await expect(loadBackground()).resolves.toBe("data:image/png;base64,new");
  });
});
