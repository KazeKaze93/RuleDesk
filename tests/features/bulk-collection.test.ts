import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addPostsToCollection,
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  getCollectionOrder,
  listPlaylists,
  shuffleCollection,
} from "../../src/storage/store";
import {
  GRID_SELECTED_CLASS,
  readSelectedPosts,
  startGridSelect,
  stopGridSelect,
} from "../../src/features/downloads/grid-select";
import { videoPreviewFeature } from "../../src/features/video-preview";
import { bulkCollectionSummary, bulkCollectionTitle } from "../../src/ui/bulk-collection-dialog";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : defaultValue,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

const THUMB_A = "https://wimg.rule34.xxx/thumbnails/1/thumbnail_a.jpg";
const THUMB_B = "https://wimg.rule34.xxx/thumbnails/1/thumbnail_b.jpg";

describe("adding several posts to a collection at once", () => {
  beforeEach(() => {
    installGmMocks();
  });

  it("appends the posts in order and keeps their previews", () => {
    const collection = createPlaylist("Set");
    const result = addPostsToCollection(collection.id, [
      { id: 11, thumbUrl: THUMB_A },
      { id: 22, thumbUrl: THUMB_B },
      { id: 33 },
    ]);
    expect(result?.added).toBe(3);
    const stored = listPlaylists()[0];
    expect(stored?.postIds).toEqual([11, 22, 33]);
    expect(stored?.thumbs).toEqual({ "11": THUMB_A, "22": THUMB_B });
  });

  it("counts only the posts that were not there, and adds none twice", () => {
    const collection = createPlaylist("Set");
    addPostsToCollection(collection.id, [{ id: 11, thumbUrl: THUMB_A }]);
    const result = addPostsToCollection(collection.id, [{ id: 11 }, { id: 22 }, { id: 22 }]);
    expect(result?.added).toBe(1);
    expect(listPlaylists()[0]?.postIds).toEqual([11, 22]);
    // A post added again without a preview keeps the one it had.
    expect(listPlaylists()[0]?.thumbs).toEqual({ "11": THUMB_A });
  });

  it("writes once for the whole batch", () => {
    const collection = createPlaylist("Set");
    const write = vi.fn((key: string, value: unknown): void => {
      memory.set(key, value);
    });
    vi.stubGlobal("GM_setValue", write);
    addPostsToCollection(
      collection.id,
      Array.from({ length: 40 }, (_unused, index) => ({ id: index + 1 })),
    );
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("puts new posts after a shuffled order, as a single add does", () => {
    const collection = createPlaylist("Set");
    addPostsToCollection(collection.id, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    shuffleCollection(collection.id);
    addPostsToCollection(collection.id, [{ id: 9 }, { id: 8 }]);
    const order = getCollectionOrder(collection.id) ?? [];
    expect(order.slice(-2)).toEqual([9, 8]);
    expect([...order].sort((a, b) => a - b)).toEqual([1, 2, 3, 8, 9]);
  });

  it("skips ids that are not post ids and refuses a collection that is not custom", () => {
    const collection = createPlaylist("Set");
    expect(addPostsToCollection(collection.id, [{ id: Number.NaN }, { id: -4 }, { id: 5 }])?.added).toBe(
      1,
    );
    const dynamic = createDynamicCollection("Saved", "cat");
    expect(addPostsToCollection(dynamic.id, [{ id: 5 }])).toBeNull();
    expect(addPostsToCollection("no-such-id", [{ id: 5 }])).toBeNull();
  });
});

describe("what the selection bar says after adding", () => {
  it("titles the dialog with the number of posts", () => {
    expect(bulkCollectionTitle(1)).toBe("Add 1 post to a collection");
    expect(bulkCollectionTitle(12)).toBe("Add 12 posts to a collection");
  });

  it("says all, some or none were new", () => {
    expect(bulkCollectionSummary({ name: "Set", added: 12, total: 12 })).toBe(
      "Added 12 posts to “Set”.",
    );
    expect(bulkCollectionSummary({ name: "Set", added: 3, total: 12 })).toBe(
      "Added 3 of 12 posts to “Set”; the rest were already there.",
    );
    expect(bulkCollectionSummary({ name: "Set", added: 0, total: 2 })).toBe(
      "All 2 posts were already in “Set”.",
    );
  });
});

describe("selecting posts on a results page", () => {
  beforeEach(() => {
    stopGridSelect();
    document.head.replaceChildren();
    document.body.innerHTML = `
<div class="image-list">
  <span class="thumb" id="s11"><a id="p11" href="index.php?page=post&s=view&id=11"><img class="preview" src="${THUMB_A}"></a></span>
  <span class="thumb" id="s22"><a id="p22" href="index.php?page=post&s=view&id=22"><img class="preview" src="${THUMB_B}"></a></span>
</div>`;
  });

  it("reads the marked posts with their previews, in page order", () => {
    const counts: number[] = [];
    startGridSelect((count) => {
      counts.push(count);
    });
    document.getElementById("p22")?.querySelector("img")?.click();
    document.getElementById("p11")?.querySelector("img")?.click();
    expect(counts).toEqual([1, 2]);

    const posts = readSelectedPosts(
      (thumb) => thumb.querySelector("img")?.getAttribute("src") ?? null,
    );
    expect(posts).toEqual([
      { id: 11, thumbUrl: THUMB_A },
      { id: 22, thumbUrl: THUMB_B },
    ]);
  });

  it("brings its own styles, with a tick on a marked post, and clears the marks on leaving", () => {
    startGridSelect(() => {});
    const style = document.getElementById("rdw-grid-select-style");
    expect(style?.textContent).toContain(`.${GRID_SELECTED_CLASS}::after`);
    // The frame of a marked post is a layer over the whole cell, not an
    // outline inside it: a picture as tall as the cell stood over the outline.
    expect(style?.textContent).toMatch(
      /rdw-dl-selected::after \{[^}]*inset: 0;\s*z-index: 4;[^}]*border: 3px solid var\(--rdw-accent\);/,
    );
    expect(style?.textContent).not.toContain("outline:");
    // Over the video that plays on a thumbnail under the pointer, which is at 3.
    expect(videoPreviewFeature.css).toMatch(/z-index: 3;/);
    document.getElementById("p11")?.querySelector("img")?.click();
    expect(document.querySelectorAll(`.${GRID_SELECTED_CLASS}`)).toHaveLength(1);
    stopGridSelect();
    expect(document.querySelectorAll(`.${GRID_SELECTED_CLASS}`)).toHaveLength(0);
  });
});
