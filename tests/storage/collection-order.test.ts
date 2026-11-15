import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addPostToCollection,
  clearStorageCache,
  createPlaylist,
  getCollectionOrder,
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

describe("collection order", () => {
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
});
