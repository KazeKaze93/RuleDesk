import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import { UI_TEXT } from "../../src/config/constants";
import { hideRdwPage, showRdwPage } from "../../src/pages/host";
import { collectionPostHref } from "../../src/pages/collection-detail-page";
import {
  CURRENT_PAGE_CLASS,
  MENU_ITEM_ID,
  RDW_COLLECTION_DETAIL_KIND,
  RDW_HASH_COLLECTIONS,
  RDW_OWN_PAGE_CLASS,
  RDW_PAGE_ROOT_ID,
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_SETTINGS,
  collectionDetailHash,
  parseRdwHash,
} from "../../src/pages/constants";
import { navigateToRdwRoute, startRdwPages } from "../../src/pages/router";
import { createDefaultStorage } from "../../src/storage/schema";
import {
  addPostToCollection,
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  getCollectionOrder,
  listPlaylists,
  save,
} from "../../src/storage/store";

const memory = new Map<string, unknown>();
const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const THUMB_10 = "https://cdn.test/10.jpg";
const THUMB_30 = "https://cdn.test/30.jpg";
const POST_10 = 10;
const POST_20 = 20;
const POST_30 = 30;
const RENAMED = "Later";

function installGmMocks(): void {
  memory.clear();
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

function mountHeader(): HTMLElement {
  document.body.replaceChildren();
  document.documentElement.className = "";
  const header = document.createElement("div");
  header.id = "header";
  const navbar = document.createElement("ul");
  navbar.id = "navbar";
  const posts = document.createElement("li");
  const postsLink = document.createElement("a");
  postsLink.href = "index.php?page=post&s=list";
  postsLink.textContent = "Posts";
  posts.append(postsLink);
  navbar.append(posts);
  header.append(navbar);
  document.body.append(header);
  return header;
}

function shadowRoot(): ShadowRoot {
  const host = document.getElementById(RDW_PAGE_ROOT_ID);
  expect(host).not.toBeNull();
  const shadow = host?.shadowRoot;
  expect(shadow).not.toBeNull();
  if (shadow === null || shadow === undefined) {
    throw new Error("expected page shadow root");
  }
  return shadow;
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
    );
  });
}

function findButton(root: ParentNode, text: string): HTMLButtonElement | null {
  const match = [...root.querySelectorAll("button")].find(
    (button) => button.textContent === text,
  );
  return match instanceof HTMLButtonElement ? match : null;
}

function gridAnchors(root: ParentNode): HTMLAnchorElement[] {
  return [...root.querySelectorAll(".rdw-collection-grid a")].filter(
    (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement,
  );
}

function postIdFromHref(href: string): string {
  const url = new URL(href, "https://rule34.xxx");
  return url.searchParams.get("id") ?? "";
}

describe("collection route hash", () => {
  it("routes #rdw/collections/<id> and ignores the post queue hash", () => {
    expect(parseRdwHash("#rdw/collections")).toBe(RDW_ROUTE_COLLECTIONS);
    expect(parseRdwHash("#rdw/collections/")).toBe(RDW_ROUTE_COLLECTIONS);
    expect(parseRdwHash("#rdw/following")).toBe(RDW_ROUTE_FOLLOWING);
    expect(parseRdwHash("#rdw/settings")).toBe(RDW_ROUTE_SETTINGS);
    expect(parseRdwHash(collectionDetailHash("col 1"))).toEqual({
      kind: RDW_COLLECTION_DETAIL_KIND,
      collectionId: "col 1",
    });
    expect(parseRdwHash("#rdw-c=col%201")).toBeNull();
    expect(parseRdwHash("#rdw-c=collections/col")).toBeNull();
    expect(parseRdwHash("#rdw-c")).toBeNull();
    expect(collectionPostHref("col 1", 42)).toBe(
      "/index.php?page=post&s=view&id=42#rdw-c=col%201",
    );
  });

  it("keeps the detail module lazy until a collection route is opened", () => {
    const hostSource = readFileSync(
      path.join(ROOT_DIR, "src/pages/host.tsx"),
      "utf8",
    );
    const routerSource = readFileSync(
      path.join(ROOT_DIR, "src/pages/router.ts"),
      "utf8",
    );
    expect(hostSource).not.toMatch(/from\s+["']\.\/collection-detail-page["']/);
    expect(hostSource).toContain('import("./collection-detail-page")');
    expect(routerSource).not.toContain("collection-detail-page");
  });
});

describe("collection detail page", () => {
  beforeEach(() => {
    installGmMocks();
    save(createDefaultStorage());
    mountHeader();
    window.history.replaceState(null, "", "/index.php?page=post&s=list");
  });

  afterEach(() => {
    hideRdwPage();
    document.body.replaceChildren();
    document.documentElement.className = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function seedPosts(): string {
    const playlist = createPlaylist("Watch");
    addPostToCollection(playlist.id, POST_10, THUMB_10);
    addPostToCollection(playlist.id, POST_20);
    addPostToCollection(playlist.id, POST_30, THUMB_30);
    return playlist.id;
  }

  async function openDetail(collectionId: string): Promise<ShadowRoot> {
    const header = document.getElementById("header");
    if (!(header instanceof HTMLElement)) {
      throw new Error("header missing");
    }
    await showRdwPage(
      { kind: RDW_COLLECTION_DETAIL_KIND, collectionId },
      header,
    );
    return shadowRoot();
  }

  it("renders the grid from getCollectionOrder with post links and a #id fallback", async () => {
    const collectionId = seedPosts();
    const shadow = await openDetail(collectionId);
    const text = shadow.textContent ?? "";

    expect(shadow.querySelector(".rdw-page-title")).toBeNull();
    expect(shadow.querySelector(".rdw-collection-back")?.getAttribute("href")).toBe(
      RDW_HASH_COLLECTIONS,
    );
    expect(shadow.querySelector("h1")?.textContent).toBe("Watch");
    expect(text).toContain("← Collections");
    expect(text).toContain("3 posts");
    expect(findButton(shadow, "Original order")).toBeNull();
    expect(findButton(shadow, "Shuffle")).not.toBeNull();

    const anchors = gridAnchors(shadow);
    expect(anchors.map((anchor) => postIdFromHref(anchor.getAttribute("href") ?? ""))).toEqual([
      String(POST_10),
      String(POST_20),
      String(POST_30),
    ]);
    expect(anchors[0]?.getAttribute("href")).toBe(collectionPostHref(collectionId, POST_10));
    expect(anchors[1]?.textContent).toContain("#20");
    expect(anchors[1]?.querySelector("img")).toBeNull();

    const image = anchors[0]?.querySelector("img");
    expect(image).toBeInstanceOf(HTMLImageElement);
    expect(image?.getAttribute("src")).toBe(THUMB_10);
    expect(image?.getAttribute("loading")).toBe("lazy");
    const css = [...shadow.querySelectorAll("style")]
      .map((node) => node.textContent ?? "")
      .join("\n");
    expect(css).toContain("object-fit: contain");
    expect(css).toContain("width: 200px");
    expect(css).toContain("height: 200px");
    expect(css).toContain("gap: 4px");

    if (!(image instanceof HTMLImageElement)) {
      throw new Error("expected thumb image");
    }
    act(() => {
      image.dispatchEvent(new Event("error"));
    });
    const refreshed = gridAnchors(shadow);
    expect(refreshed[0]?.querySelector("img")).toBeNull();
    expect(refreshed[0]?.textContent).toContain("#10");
  });

  it("shuffles and restores the original order", async () => {
    const collectionId = seedPosts();
    const shadow = await openDetail(collectionId);
    vi.spyOn(Math, "random").mockReturnValue(0);

    const shuffle = findButton(shadow, "Shuffle");
    if (shuffle === null) {
      throw new Error("shuffle missing");
    }
    click(shuffle);

    expect(gridAnchors(shadow).map((anchor) => postIdFromHref(anchor.href))).toEqual(
      (getCollectionOrder(collectionId) ?? []).map((id) => String(id)),
    );
    expect(gridAnchors(shadow).map((anchor) => postIdFromHref(anchor.href))).toEqual([
      "20",
      "30",
      "10",
    ]);

    const original = findButton(shadow, "Original order");
    if (original === null) {
      throw new Error("original order missing");
    }
    click(original);
    expect(gridAnchors(shadow).map((anchor) => postIdFromHref(anchor.href))).toEqual([
      "10",
      "20",
      "30",
    ]);
    expect(findButton(shadow, "Original order")).toBeNull();
  });

  it("removes the selection locally and undoes from the toast", async () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("GM_xmlhttpRequest", xhrSpy);
    const collectionId = seedPosts();
    const shadow = await openDetail(collectionId);
    const select = findButton(shadow, "Select");
    if (select === null) {
      throw new Error("select missing");
    }
    click(select);

    const anchors = gridAnchors(shadow);
    const first = anchors[0];
    const second = anchors[1];
    if (first === undefined || second === undefined) {
      throw new Error("grid missing");
    }
    const selectClick = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    act(() => {
      first.dispatchEvent(selectClick);
    });
    expect(selectClick.defaultPrevented).toBe(true);
    expect(first.classList.contains("rdw-fav-bulk-selected")).toBe(true);
    expect(first.querySelector(".rdw-fav-bulk-check")?.textContent).toBe("✓");
    click(first);
    expect(first.classList.contains("rdw-fav-bulk-selected")).toBe(false);
    click(first);
    click(second);

    const remove = findButton(shadow, "Remove selected (2)");
    if (remove === null) {
      throw new Error("remove missing");
    }
    click(remove);

    expect(shadow.querySelector('[role="dialog"]')).toBeNull();
    expect(gridAnchors(shadow).map((anchor) => postIdFromHref(anchor.href))).toEqual(["30"]);
    expect(shadow.textContent).toContain("Removed 2 posts");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();

    const undo = findButton(shadow, "Undo");
    if (undo === null) {
      throw new Error("undo missing");
    }
    click(undo);
    expect(gridAnchors(shadow).map((anchor) => postIdFromHref(anchor.href))).toEqual([
      "10",
      "20",
      "30",
    ]);
    expect(gridAnchors(shadow)[0]?.querySelector("img")?.getAttribute("src")).toBe(THUMB_10);
    expect(findButton(shadow, "Undo")).toBeNull();
  });

  it("restarts the toast timer when a second removal has the same message", async () => {
    const collectionId = seedPosts();
    const shadow = await openDetail(collectionId);
    vi.useFakeTimers();
    try {
      const removeFirst = (): void => {
        const select = findButton(shadow, "Select");
        const first = gridAnchors(shadow)[0];
        if (select === null || first === undefined) {
          throw new Error("select or grid missing");
        }
        click(select);
        const cell = gridAnchors(shadow)[0];
        if (cell === undefined) {
          throw new Error("grid missing");
        }
        click(cell);
        const remove = findButton(shadow, "Remove selected (1)");
        if (remove === null) {
          throw new Error("remove missing");
        }
        click(remove);
      };
      const partMs = 4000;
      const restMs = 2500;

      removeFirst();
      expect(shadow.textContent).toContain("Removed 1 post");
      act(() => {
        vi.advanceTimersByTime(partMs);
      });
      removeFirst();
      act(() => {
        vi.advanceTimersByTime(partMs);
      });
      expect(findButton(shadow, "Undo")).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(restMs);
      });
      expect(findButton(shadow, "Undo")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("selects all, clears, and cancels without removing posts", async () => {
    const collectionId = seedPosts();
    const shadow = await openDetail(collectionId);
    const select = findButton(shadow, "Select");
    if (select === null) {
      throw new Error("select missing");
    }
    click(select);
    const selectAll = findButton(shadow, "Select all");
    if (selectAll === null) {
      throw new Error("select all missing");
    }
    click(selectAll);
    expect(shadow.querySelectorAll(".rdw-fav-bulk-selected")).toHaveLength(3);
    const clear = findButton(shadow, "Clear");
    if (clear === null) {
      throw new Error("clear missing");
    }
    click(clear);
    expect(shadow.querySelectorAll(".rdw-fav-bulk-selected")).toHaveLength(0);
    const cancel = findButton(shadow, "Cancel");
    if (cancel === null) {
      throw new Error("cancel missing");
    }
    click(cancel);
    expect(findButton(shadow, "Shuffle")).not.toBeNull();
    expect(getCollectionOrder(collectionId)).toEqual([POST_10, POST_20, POST_30]);
  });

  it("renames through a dialog field", async () => {
    const collectionId = seedPosts();
    const shadow = await openDetail(collectionId);
    const rename = findButton(shadow, UI_TEXT.rename);
    if (rename === null) {
      throw new Error("rename missing");
    }
    click(rename);
    const input = shadow.querySelector(`#rdw-collection-rename-name`);
    expect(input).toBeInstanceOf(HTMLInputElement);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("rename input missing");
    }
    expect(input.value).toBe("Watch");
    act(() => {
      input.value = RENAMED;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      input.form?.requestSubmit();
    });
    expect(shadow.querySelector("h1")?.textContent).toBe(RENAMED);
    expect(listPlaylists().find((item) => item.id === collectionId)?.name).toBe(RENAMED);
    expect(shadow.querySelector('[role="dialog"]')).toBeNull();
  });

  it("deletes through a confirm dialog and returns to the list", async () => {
    const collectionId = seedPosts();
    const shadow = await openDetail(collectionId);
    const remove = findButton(shadow, UI_TEXT.delete);
    if (remove === null) {
      throw new Error("delete missing");
    }
    click(remove);
    const dialog = shadow.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain(UI_TEXT.confirmDelete);
    const confirm = dialog === null ? null : findButton(dialog, UI_TEXT.delete);
    if (confirm === null) {
      throw new Error("confirm missing");
    }
    click(confirm);
    await vi.waitFor(() => {
      expect(window.location.hash).toBe(RDW_HASH_COLLECTIONS);
      expect(shadowRoot().querySelector(".rdw-collections-page")).not.toBeNull();
    });
    expect(shadowRoot().querySelector(".rdw-collection-detail")).toBeNull();
    expect(listPlaylists().some((item) => item.id === collectionId)).toBe(false);
  });

  it("explains how to fill an empty collection", async () => {
    const playlist = createPlaylist("Empty");
    const shadow = await openDetail(playlist.id);
    const text = shadow.textContent ?? "";
    expect(text).toContain("0 posts");
    expect(text).toContain("No posts yet");
    expect(text).toContain("+");
    expect(text).toContain("Collections");
    expect(text).toContain("post page");
    expect(shadow.querySelector(".rdw-collection-grid")).toBeNull();
  });

  it("shows a not-found message for an unknown or non-posts id", async () => {
    const saved = createDynamicCollection("Cats", "cat");
    expect(listPlaylists()).toHaveLength(0);
    const shadow = await openDetail(saved.id);
    expect(shadow.textContent).toContain("Collection not found.");
    expect(shadow.querySelector("a")?.getAttribute("href")).toBe(RDW_HASH_COLLECTIONS);
    expect(findButton(shadow, "Shuffle")).toBeNull();

    const header = document.getElementById("header");
    if (!(header instanceof HTMLElement)) {
      throw new Error("header missing");
    }
    await showRdwPage(
      { kind: RDW_COLLECTION_DETAIL_KIND, collectionId: "missing" },
      header,
    );
    expect(shadowRoot().textContent).toContain("Collection not found.");
  });
});

describe("collection detail history", () => {
  beforeEach(() => {
    installGmMocks();
    save(createDefaultStorage());
    mountHeader();
  });

  afterEach(() => {
    hideRdwPage();
    document.body.replaceChildren();
    document.documentElement.className = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not treat #rdw-c as a script page, so the next script page pushes history", async () => {
    window.history.replaceState(
      null,
      "",
      "/index.php?page=post&s=view&id=5#rdw-c=abc",
    );
    await startRdwPages();
    expect(document.documentElement.classList.contains(RDW_OWN_PAGE_CLASS)).toBe(
      false,
    );
    expect(document.getElementById(RDW_PAGE_ROOT_ID)).toBeNull();

    const pushSpy = vi.spyOn(window.history, "pushState");
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    await navigateToRdwRoute(RDW_ROUTE_COLLECTIONS);
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).not.toHaveBeenCalled();
    expect(window.location.hash).toBe(RDW_HASH_COLLECTIONS);

    await navigateToRdwRoute({
      kind: RDW_COLLECTION_DETAIL_KIND,
      collectionId: "abc",
    });
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe(collectionDetailHash("abc"));
    expect(document.documentElement.classList.contains(RDW_OWN_PAGE_CLASS)).toBe(
      true,
    );
    const collections = document.getElementById(MENU_ITEM_ID.collections);
    const settings = document.getElementById(MENU_ITEM_ID.settings);
    expect(collections?.classList.contains(CURRENT_PAGE_CLASS)).toBe(true);
    expect(settings?.classList.contains(CURRENT_PAGE_CLASS)).toBe(false);
  });
});
