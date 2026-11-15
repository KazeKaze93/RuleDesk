import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  parseCollectionsFile,
  serializeCollections,
} from "../../src/storage/collection-transfer";
import {
  addPostToCollection,
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  getCollectionOrder,
  importCollections,
  load,
  movePostInCollection,
  shuffleCollection,
} from "../../src/storage/store";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : fallback,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function filled(name: string, ids: number[]): string {
  const collection = createPlaylist(name);
  for (const id of ids) {
    addPostToCollection(collection.id, id, `https://example.test/${String(id)}.jpg`);
  }
  return collection.id;
}

describe("collection order and transfer", () => {
  beforeEach(() => {
    installGmMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("moves a post to the place of another, forward and back", () => {
    const id = filled("Order", [1, 2, 3, 4]);
    expect(movePostInCollection(id, 1, 3)).toBe(true);
    expect(getCollectionOrder(id)).toEqual([2, 3, 1, 4]);
    expect(movePostInCollection(id, 4, 2)).toBe(true);
    expect(getCollectionOrder(id)).toEqual([4, 2, 3, 1]);
    expect(movePostInCollection(id, 2, 2)).toBe(false);
    expect(movePostInCollection(id, 99, 2)).toBe(false);
  });

  it("edits the shuffled order while shuffled and leaves the insertion order alone", () => {
    const id = filled("Shuffled", [1, 2, 3]);
    shuffleCollection(id);
    const shown = getCollectionOrder(id) ?? [];
    const first = shown[0];
    const last = shown[2];
    if (first === undefined || last === undefined) {
      throw new Error("order missing");
    }
    movePostInCollection(id, first, last);
    expect(getCollectionOrder(id)?.[2]).toBe(first);
    expect(load().collections[0]?.postIds).toEqual([1, 2, 3]);
  });

  it("round-trips collections through the export file as new collections", () => {
    filled("Pics", [5, 6]);
    createDynamicCollection("Cats", "cat -dog");
    const text = serializeCollections(load().collections);

    const parsed = parseCollectionsFile(text);
    expect(parsed).toHaveLength(2);
    expect(importCollections(parsed ?? [])).toBe(2);

    const all = load().collections;
    expect(all.map((item) => item.name)).toEqual(["Pics", "Cats", "Pics (2)", "Cats (2)"]);
    expect(new Set(all.map((item) => item.id)).size).toBe(4);
    expect(all[2]?.postIds).toEqual([5, 6]);
    expect(all[2]?.thumbs).toEqual({
      "5": "https://example.test/5.jpg",
      "6": "https://example.test/6.jpg",
    });
    expect(all[3]?.query).toBe("cat -dog");
  });

  it("rejects a file that is not a collections export", () => {
    expect(parseCollectionsFile("not json")).toBeNull();
    expect(parseCollectionsFile('{"format":"ruledesk-web-backup","version":1}')).toBeNull();
    expect(importCollections([])).toBe(0);
  });
});
