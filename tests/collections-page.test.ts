import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import {
  COLLECTION_KIND_POSTS,
  COLLECTION_KIND_SEARCH,
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
  UI_TEXT,
} from "../src/config/constants";
import {
  COLLECTIONS_PAGE_CSS,
  createCollectionsPage,
} from "../src/pages/collections-page";
import { collectionDetailHash } from "../src/pages/constants";
import { buildSearchUrl } from "../src/search/query";
import { createDefaultStorage } from "../src/storage/schema";
import {
  addPostToCollection,
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  getCollectionOrder,
  load,
  save,
} from "../src/storage/store";

const memory = new Map<string, unknown>();
const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const THUMB_1 = "https://example.test/1.jpg";
const THUMB_2 = "https://example.test/2.jpg";
const THUMB_4 = "https://example.test/4.jpg";
const THUMB_5 = "https://example.test/5.jpg";

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

function mount(): HTMLElement {
  const root = createCollectionsPage();
  document.body.append(root);
  return root;
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function findButton(root: ParentNode, text: string): HTMLButtonElement | null {
  const buttons = Array.from(root.querySelectorAll("button"));
  const match = buttons.find((button) => button.textContent?.trim() === text);
  return match instanceof HTMLButtonElement ? match : null;
}

function pageButtons(root: ParentNode): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll("button")).filter(
    (button): button is HTMLButtonElement =>
      button instanceof HTMLButtonElement &&
      button.closest('[role="dialog"]') === null,
  );
}

function radioGroup(root: ParentNode, label: string): HTMLElement {
  const group = root.querySelector(`[aria-label="${label}"]`);
  if (!(group instanceof HTMLElement)) {
    throw new Error(`missing radio group ${label}`);
  }
  return group;
}

function clickRadio(scope: ParentNode, label: string): void {
  const match = Array.from(scope.querySelectorAll('[role="radio"]')).find(
    (element) => element.textContent?.trim() === label,
  );
  if (!(match instanceof HTMLElement)) {
    throw new Error(`missing radio ${label}`);
  }
  click(match);
}

function dialogElement(root: ParentNode): HTMLElement {
  const dialog = root.querySelector('[role="dialog"]');
  if (!(dialog instanceof HTMLElement)) {
    throw new Error("expected dialog");
  }
  return dialog;
}

function setInput(input: HTMLInputElement, value: string): void {
  act(() => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function inputById(root: ParentNode, id: string): HTMLInputElement {
  const input = root.querySelector(`#${id}`);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`expected input #${id}`);
  }
  return input;
}

function cardByName(root: ParentNode, name: string): HTMLAnchorElement {
  const match = Array.from(root.querySelectorAll("a.rdw-collection-card")).find(
    (element) => element.getAttribute("aria-label")?.startsWith(`${name},`),
  );
  if (!(match instanceof HTMLAnchorElement)) {
    throw new Error(`missing card ${name}`);
  }
  return match;
}

function source(relative: string): string {
  return readFileSync(path.join(ROOT_DIR, relative), "utf8");
}

describe("createCollectionsPage", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    save(createDefaultStorage());
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports the grid and card hover rules", () => {
    expect(COLLECTIONS_PAGE_CSS).toContain(".rdw-collections-page");
    expect(COLLECTIONS_PAGE_CSS).toContain(
      "grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))",
    );
    expect(COLLECTIONS_PAGE_CSS).toContain("gap: 12px");
    expect(COLLECTIONS_PAGE_CSS).toContain(".rdw-collection-card:hover");
    expect(COLLECTIONS_PAGE_CSS).toContain(".rdw-collection-card:focus");
    expect(COLLECTIONS_PAGE_CSS).toContain("border-color: var(--rdw-accent)");
    expect(COLLECTIONS_PAGE_CSS).toContain("background: var(--rdw-surface-2)");
    expect(COLLECTIONS_PAGE_CSS).not.toContain("rdw-playlist");
  });

  it("explains both kinds when the library is empty and has no save-current control", () => {
    const root = mount();
    // The page shell draws the title; the page itself has none.
    expect(root.querySelector("h1")).toBeNull();
    expect(root.textContent).toContain(
      "Custom collections are posts you pick. Dynamic collections are saved searches.",
    );
    expect(root.textContent).not.toContain(UI_TEXT.saveCurrent);
    expect(root.textContent).not.toContain("Playlists");
    expect(root.textContent).not.toContain("Saved searches");
    expect(root.textContent).not.toContain("New Custom Collection");
    expect(root.querySelector(".rdw-list")).toBeNull();
    expect(pageButtons(root).map((button) => button.textContent?.trim())).toEqual([
      "All",
      "Custom",
      "Dynamic",
      "New",
    ]);
    expect(root.querySelector("#rdw-collections-filter")).toBeInstanceOf(
      HTMLInputElement,
    );
  });

  it("stays out of document-start imports", () => {
    expect(source("src/main.ts")).not.toContain("collections-page");
    expect(source("src/boot/app.ts")).not.toContain("collections-page");
    expect(source("src/pages/router.ts")).not.toContain("collections-page");
    const host = source("src/pages/host.tsx");
    expect(host).toContain('import("./collections-page")');
    expect(host).not.toContain('from "./collections-page"');
    expect(source("src/pages/collections-page.tsx")).not.toContain(
      "collection-detail-page",
    );
  });

  it("builds a custom cover from insertion order, ignoring shuffled order", () => {
    const playlist = createPlaylist("Covers");
    addPostToCollection(playlist.id, 1, THUMB_1);
    addPostToCollection(playlist.id, 2, THUMB_2);
    addPostToCollection(playlist.id, 3);
    addPostToCollection(playlist.id, 4, THUMB_4);
    addPostToCollection(playlist.id, 5, THUMB_5);
    const data = load();
    const target = data.collections.find((item) => item.id === playlist.id);
    if (target === undefined) {
      throw new Error("expected playlist");
    }
    target.shuffledOrder = [5, 4, 3, 2, 1];
    save(data);

    expect(getCollectionOrder(playlist.id)).toEqual([5, 4, 3, 2, 1]);

    const root = mount();
    const card = cardByName(root, "Covers");
    expect(card.tagName).toBe("A");
    expect(card.getAttribute("href")).toBe(collectionDetailHash(playlist.id));
    expect(card.getAttribute("data-collection-kind")).toBe(COLLECTION_KIND_POSTS);
    expect(card.querySelector("button")).toBeNull();
    expect(card.textContent).toContain("Custom");
    expect(card.textContent).toContain("5 posts");

    const cells = card.querySelectorAll("[data-cover-index]");
    expect(cells).toHaveLength(4);
    expect(
      Array.from(cells).map((cell) => cell.getAttribute("data-post-id")),
    ).toEqual(["1", "2", "3", "4"]);
    expect(cells[0]?.querySelector("img")?.getAttribute("src")).toBe(THUMB_1);
    expect(cells[1]?.querySelector("img")?.getAttribute("src")).toBe(THUMB_2);
    expect(cells[2]?.querySelector("img")).toBeNull();
    expect(cells[2]?.querySelector(".rdw-collection-cover-empty")).not.toBeNull();
    expect(cells[3]?.querySelector("img")?.getAttribute("src")).toBe(THUMB_4);
    expect(card.querySelector(`[data-post-id="5"]`)).toBeNull();

    const broken = cells[0]?.querySelector("img");
    if (!(broken instanceof HTMLImageElement)) {
      throw new Error("expected cover image");
    }
    act(() => {
      broken.dispatchEvent(new Event("error"));
    });
    const after = card.querySelectorAll("[data-cover-index]");
    expect(after[0]?.querySelector("img")).toBeNull();
    expect(after[0]?.querySelector(".rdw-collection-cover-empty")).not.toBeNull();
    expect(after[1]?.querySelector("img")?.getAttribute("src")).toBe(THUMB_2);
  });

  it("shows an empty 2x2 cover and a post count for a new custom collection", () => {
    createPlaylist("Later");
    const root = mount();
    const card = cardByName(root, "Later");
    expect(card.textContent).toContain("0 posts");
    expect(card.querySelectorAll(".rdw-collection-cover-empty")).toHaveLength(4);
    expect(card.querySelector("img")).toBeNull();
  });

  it("renders dynamic chips from the stored query and opens the saved search", () => {
    createDynamicCollection("Grouped", "( cat ~ dog ) bird");
    const root = mount();
    const card = cardByName(root, "Grouped");
    const stored = load().collections.find((item) => item.name === "Grouped");
    if (stored === undefined) {
      throw new Error("expected dynamic collection");
    }
    expect(card.getAttribute("href")).toBe(buildSearchUrl(stored.tags));
    expect(card.getAttribute("href")).not.toContain("#rdw/");
    expect(card.getAttribute("data-collection-kind")).toBe(COLLECTION_KIND_SEARCH);
    expect(card.querySelector("button")).toBeNull();
    expect(card.querySelector(".rdw-collection-cover")).toBeNull();
    expect(card.textContent).toContain("Dynamic");
    expect(card.textContent).toContain("saved search");
    const labels = Array.from(card.querySelectorAll(".rdw-chip")).map(
      (chip) => chip.textContent?.trim(),
    );
    expect(labels).toEqual(["Any of 2 tags", "bird"]);
    expect(card.querySelector(".rdw-chip--group")).not.toBeNull();
  });

  it("uses serialize(tags) when an older dynamic row has no query", () => {
    const data = load();
    data.collections.push({
      id: "legacy-search",
      name: "Legacy",
      tags: [
        { tag: "cat", type: TAG_TYPE_INCLUDE },
        { tag: "dog", type: TAG_TYPE_EXCLUDE },
      ],
    });
    save(data);

    const root = mount();
    const card = cardByName(root, "Legacy");
    const labels = Array.from(card.querySelectorAll(".rdw-chip")).map(
      (chip) => chip.textContent?.trim(),
    );
    expect(labels).toEqual(["cat", "-dog"]);
    expect(card.querySelector(".rdw-chip--exclude")).not.toBeNull();
    const stored = load().collections.find((item) => item.id === "legacy-search");
    if (stored === undefined) {
      throw new Error("expected legacy collection");
    }
    expect(card.getAttribute("href")).toBe(buildSearchUrl(stored.tags));
  });

  it("prefers a stored query over tags for chips and still opens tags", () => {
    const data = load();
    data.collections.push({
      id: "queried",
      name: "Queried",
      tags: [{ tag: "other", type: TAG_TYPE_INCLUDE }],
      kind: COLLECTION_KIND_SEARCH,
      query: "keep",
    });
    save(data);

    const root = mount();
    const card = cardByName(root, "Queried");
    expect(card.textContent).toContain("keep");
    expect(card.textContent).not.toContain("other");
    expect(card.getAttribute("href")).toBe(
      buildSearchUrl([{ tag: "other", type: TAG_TYPE_INCLUDE }]),
    );
  });

  it("filters by kind and by name", () => {
    createPlaylist("Alpha posts");
    createDynamicCollection("Alpha search", "bird");
    createDynamicCollection("Zebra", "zebra");

    const root = mount();
    expect(root.querySelectorAll("a.rdw-collection-card")).toHaveLength(3);

    clickRadio(radioGroup(root, "Show"), "Custom");
    expect(root.querySelectorAll("a.rdw-collection-card")).toHaveLength(1);
    expect(cardByName(root, "Alpha posts")).toBeInstanceOf(HTMLAnchorElement);

    clickRadio(radioGroup(root, "Show"), "Dynamic");
    expect(root.querySelectorAll("a.rdw-collection-card")).toHaveLength(2);

    setInput(inputById(root, "rdw-collections-filter"), "ZEB");
    expect(root.querySelectorAll("a.rdw-collection-card")).toHaveLength(1);
    expect(cardByName(root, "Zebra")).toBeInstanceOf(HTMLAnchorElement);

    setInput(inputById(root, "rdw-collections-filter"), "missing");
    expect(root.textContent).toContain("No matching collections");
    expect(root.textContent).toContain("Nothing matches this filter.");
    expect(root.textContent).not.toContain("No collections yet");
  });

  it("creates a custom collection from New and rejects an empty or duplicate name", () => {
    const root = mount();
    const open = findButton(root, "New");
    if (open === null) {
      throw new Error("expected New button");
    }
    click(open);

    const dialog = dialogElement(root);
    expect(dialog.querySelector("#rdw-collection-query")).toBeNull();
    const create = findButton(dialog, "Create");
    if (create === null) {
      throw new Error("expected Create button");
    }
    click(create);
    expect(dialog.textContent).toContain("Enter a name.");
    expect(load().collections).toHaveLength(0);

    setInput(inputById(dialog, "rdw-collection-name"), "   ");
    click(create);
    expect(load().collections).toHaveLength(0);

    setInput(inputById(dialog, "rdw-collection-name"), "Later");
    act(() => {
      inputById(dialog, "rdw-collection-name").form?.requestSubmit();
    });
    expect(load().collections.map((item) => item.name)).toEqual(["Later"]);
    expect(load().collections[0]?.kind).toBe(COLLECTION_KIND_POSTS);
    expect(root.textContent).toContain("Later");
    expect(root.textContent).toContain("0 posts");
    expect(root.querySelector('[role="dialog"]')).toBeNull();

    click(open);
    const again = dialogElement(root);
    setInput(inputById(again, "rdw-collection-name"), "later");
    const createAgain = findButton(again, "Create");
    if (createAgain === null) {
      throw new Error("expected Create button");
    }
    click(createAgain);
    expect(again.textContent).toContain(
      "A collection with this name already exists.",
    );
    expect(load().collections).toHaveLength(1);
    expect(root.querySelector('[role="dialog"]')).toBe(again);
  });

  it("creates a dynamic collection from the query field", () => {
    const root = mount();
    const open = findButton(root, "New");
    if (open === null) {
      throw new Error("expected New button");
    }
    click(open);
    const dialog = dialogElement(root);
    clickRadio(radioGroup(dialog, "Collection kind"), "Dynamic");
    expect(dialog.querySelector("#rdw-collection-query")).toBeInstanceOf(
      HTMLInputElement,
    );
    setInput(inputById(dialog, "rdw-collection-name"), "Birds");
    setInput(inputById(dialog, "rdw-collection-query"), "( cat ~ dog ) tail");
    const create = findButton(dialog, "Create");
    if (create === null) {
      throw new Error("expected Create button");
    }
    click(create);

    const stored = load().collections.find((item) => item.name === "Birds");
    if (stored === undefined) {
      throw new Error("expected Birds");
    }
    expect(stored.kind).toBe(COLLECTION_KIND_SEARCH);
    expect(stored.query).toBe("( cat ~ dog ) tail");
    const card = cardByName(root, "Birds");
    expect(card.textContent).toContain("Any of 2 tags");
    expect(card.textContent).toContain("tail");
    expect(card.getAttribute("href")).toBe(buildSearchUrl(stored.tags));
  });

  it("rejects a dynamic collection with an empty query", () => {
    const root = mount();
    const open = findButton(root, "New");
    if (open === null) {
      throw new Error("expected New button");
    }
    click(open);
    const dialog = dialogElement(root);
    clickRadio(radioGroup(dialog, "Collection kind"), "Dynamic");
    setInput(inputById(dialog, "rdw-collection-name"), "Blank");
    setInput(inputById(dialog, "rdw-collection-query"), "   ");
    const create = findButton(dialog, "Create");
    if (create === null) {
      throw new Error("expected Create button");
    }
    click(create);

    expect(dialog.textContent).toContain("Enter a query.");
    expect(load().collections).toHaveLength(0);
  });

  it("shows the new card when the current kind filter would hide it", () => {
    createPlaylist("Posts only");
    const root = mount();
    clickRadio(radioGroup(root, "Show"), "Custom");
    const open = findButton(root, "New");
    if (open === null) {
      throw new Error("expected New button");
    }
    click(open);
    const dialog = dialogElement(root);
    clickRadio(radioGroup(dialog, "Collection kind"), "Dynamic");
    setInput(inputById(dialog, "rdw-collection-name"), "Saved");
    setInput(inputById(dialog, "rdw-collection-query"), "bird");
    const create = findButton(dialog, "Create");
    if (create === null) {
      throw new Error("expected Create button");
    }
    click(create);
    expect(cardByName(root, "Saved")).toBeInstanceOf(HTMLAnchorElement);
    expect(root.querySelectorAll("a.rdw-collection-card")).toHaveLength(1);
  });
});
