import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEBUG_KEY, STORAGE_KEY } from "../../src/config/constants";
import { clearFavsCache } from "../../src/storage/favs";
import {
  StorageSchema,
  createDefaultStorage,
  migrateCollectionMediaFields,
} from "../../src/storage/schema";
import {
  addPostToCollection,
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  deleteCollection,
  getCollectionOrder,
  load,
  reloadFromStorage,
  removePostsFromCollection,
  renameCollection,
  resetCollectionOrder,
  restorePosts,
  save,
  shuffleCollection,
  updateDynamicQuery,
} from "../../src/storage/store";

const memory = new Map<string, unknown>();

function isStorageWithCollections(
  value: unknown,
): value is { collections: unknown[] } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  if (!("collections" in value)) {
    return false;
  }
  return Array.isArray(value.collections);
}

const THUMB_A = "https://wimg.rule34.xxx/thumbnails/1/thumbnail_a.jpg?10";
const THUMB_B = "https://wimg.rule34.xxx/thumbnails/1/thumbnail_b.jpg?20";

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

describe("collection media migration", () => {
  it("parses 0.15 collections and fills posts defaults without touching searches", () => {
    const raw = {
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
    };
    const parsed = StorageSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    const migrated = migrateCollectionMediaFields(parsed.data);
    expect(migrated.changed).toBe(true);
    expect(migrated.data.collections[0]).toEqual({
      id: "legacy-search",
      name: "Cats",
      tags: [{ tag: "cat", type: "include" }],
    });
    expect(migrated.data.collections[1]).toEqual({
      id: "legacy-posts",
      name: "Later",
      tags: [],
      kind: "posts",
      postIds: [4, 5],
      thumbs: {},
      shuffledOrder: null,
    });
    const again = migrateCollectionMediaFields(migrated.data);
    expect(again.changed).toBe(false);
    expect(again.data).toEqual(migrated.data);
  });
});

describe("collection store API", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads a posts collection from storage and writes thumbs plus shuffledOrder", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [
        {
          id: "search-1",
          name: "Cats",
          tags: [{ tag: "cat", type: "include" }],
        },
        {
          id: "posts-1",
          name: "Later",
          tags: [],
          kind: "posts",
          postIds: [7],
        },
      ],
      artists: [],
      marks: {},
    });
    const data = load();
    expect(data.collections[0]).toEqual({
      id: "search-1",
      name: "Cats",
      tags: [{ tag: "cat", type: "include" }],
    });
    expect(data.collections[1]).toEqual({
      id: "posts-1",
      name: "Later",
      tags: [],
      kind: "posts",
      postIds: [7],
      thumbs: {},
      shuffledOrder: null,
    });
    expect(memory.get(STORAGE_KEY)).toEqual(
      expect.objectContaining({
        collections: expect.arrayContaining([
          expect.objectContaining({
            id: "posts-1",
            postIds: [7],
            thumbs: {},
            shuffledOrder: null,
          }),
        ]),
      }),
    );
  });

  it("adds a thumb on re-add when the post is already known, and keeps it when omitted", () => {
    const playlist = createPlaylist("Later");
    expect(addPostToCollection(playlist.id, 10)?.thumbs).toEqual({});
    expect(addPostToCollection(playlist.id, 10, THUMB_A)?.thumbs).toEqual({
      "10": THUMB_A,
    });
    expect(addPostToCollection(playlist.id, 10)?.postIds).toEqual([10]);
    expect(addPostToCollection(playlist.id, 10)?.thumbs).toEqual({
      "10": THUMB_A,
    });
    expect(addPostToCollection(playlist.id, 20, `  ${THUMB_B}  `)?.thumbs).toEqual({
      "10": THUMB_A,
      "20": THUMB_B,
    });
  });

  it("re-add after remove without a URL keeps the known thumb", () => {
    const playlist = createPlaylist("Later");
    addPostToCollection(playlist.id, 10, THUMB_A);
    const snapshot = removePostsFromCollection(playlist.id, [10]);
    expect(snapshot?.posts).toEqual([
      {
        postId: 10,
        thumbUrl: THUMB_A,
        insertionIndex: 0,
        displayIndex: 0,
      },
    ]);
    expect(load().collections.find((entry) => entry.id === playlist.id)?.postIds).toEqual(
      [],
    );
    const restored = addPostToCollection(playlist.id, 10);
    expect(restored?.postIds).toEqual([10]);
    expect(restored?.thumbs).toEqual({ "10": THUMB_A });
  });

  it("removes several posts and restorePosts puts back order and thumbs", () => {
    save({
      ...createDefaultStorage(),
      collections: [
        {
          id: "posts-1",
          name: "Later",
          tags: [],
          kind: "posts",
          postIds: [10, 20, 30],
          thumbs: { "10": THUMB_A, "30": THUMB_B },
          shuffledOrder: [30, 10, 20],
        },
      ],
    });
    const snapshot = removePostsFromCollection("posts-1", [30, 10, 10]);
    expect(snapshot?.posts.map((post) => post.postId)).toEqual([10, 30]);
    expect(getCollectionOrder("posts-1")).toEqual([20]);
    expect(snapshot).not.toBeNull();
    if (snapshot === null) {
      return;
    }
    const restored = restorePosts(snapshot);
    expect(restored?.postIds).toEqual([10, 20, 30]);
    expect(restored?.thumbs).toEqual({ "10": THUMB_A, "30": THUMB_B });
    expect(getCollectionOrder("posts-1")).toEqual([30, 10, 20]);
  });

  it("returns null for a missing collection and an empty snapshot when nothing matched", () => {
    const playlist = createPlaylist("Later");
    addPostToCollection(playlist.id, 10);
    expect(removePostsFromCollection("missing", [10])).toBeNull();
    expect(removePostsFromCollection(playlist.id, [99])).toEqual({
      collectionId: playlist.id,
      posts: [],
    });
    expect(addPostToCollection("missing", 10)).toBeNull();
    expect(addPostToCollection(playlist.id, -1)).toBeNull();
    expect(restorePosts({ collectionId: "missing", posts: [] })).toBeNull();
  });

  it("shuffles to a new permutation and reset returns insertion order", () => {
    const playlist = createPlaylist("Later");
    addPostToCollection(playlist.id, 10);
    addPostToCollection(playlist.id, 20);
    addPostToCollection(playlist.id, 30);
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    const first = shuffleCollection(playlist.id);
    expect(first?.shuffledOrder).toEqual([20, 10, 30]);
    expect(getCollectionOrder(playlist.id)).toEqual([20, 10, 30]);
    const second = shuffleCollection(playlist.id);
    expect(second?.shuffledOrder).toEqual([10, 20, 30]);
    expect(second?.shuffledOrder).not.toEqual(first?.shuffledOrder);
    expect(resetCollectionOrder(playlist.id)?.shuffledOrder).toBeNull();
    expect(getCollectionOrder(playlist.id)).toEqual([10, 20, 30]);
  });

  it("appends posts added after a shuffle and drops ids that are no longer members", () => {
    save({
      ...createDefaultStorage(),
      collections: [
        {
          id: "posts-1",
          name: "Later",
          tags: [],
          kind: "posts",
          postIds: [10, 20, 30],
          thumbs: {},
          shuffledOrder: [30, 99, 10],
        },
      ],
    });
    expect(getCollectionOrder("posts-1")).toEqual([30, 10, 20]);
    expect(getCollectionOrder("missing")).toBeNull();
  });

  it("reads storage before writing so a stale cache cannot drop a peer collection", () => {
    const playlist = createPlaylist("Later");
    expect(load().collections).toHaveLength(1);
    const stored = memory.get(STORAGE_KEY);
    if (!isStorageWithCollections(stored)) {
      throw new Error("storage missing collections");
    }
    stored.collections.push({
      id: "from-gm",
      name: "Peers",
      tags: [{ tag: "bird", type: "include" }],
    });
    addPostToCollection(playlist.id, 5, THUMB_A);
    expect(reloadFromStorage().collections.map((entry) => entry.id).sort()).toEqual(
      ["from-gm", playlist.id].sort(),
    );
  });

  it("creates, renames, updates, and deletes a dynamic collection", () => {
    const created = createDynamicCollection("  Birds  ", " cat -dog ");
    expect(created).toMatchObject({
      name: "Birds",
      kind: "search",
      query: "cat -dog",
      tags: [
        { tag: "cat", type: "include" },
        { tag: "dog", type: "exclude" },
      ],
    });
    expect(updateDynamicQuery(created.id, "( cat ~ dog )")).toMatchObject({
      query: "( cat ~ dog )",
      tags: [
        { tag: "(", type: "include" },
        { tag: "cat", type: "include" },
        { tag: "~", type: "include" },
        { tag: "dog", type: "include" },
        { tag: ")", type: "include" },
      ],
    });
    const posts = createPlaylist("Later");
    expect(updateDynamicQuery(posts.id, "cat")).toBeNull();
    expect(renameCollection(created.id, "  Renamed  ")?.name).toBe("Renamed");
    expect(deleteCollection(created.id)).toBe(true);
    expect(deleteCollection(created.id)).toBe(false);
    expect(load().collections.map((entry) => entry.id)).toEqual([posts.id]);
  });
});
