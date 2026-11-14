import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { playlistBarFeature } from "../../src/features/playlist-bar";
import {
  readSavableQuery,
  SAVE_SEARCH_DIALOG_TITLE,
  SAVE_SEARCH_LABEL,
  SAVE_SEARCH_TITLE,
  SaveSearchButton,
} from "../../src/features/save-search";
import { buildSearchUrl, parseTags } from "../../src/search/query";
import { clearFavsCache } from "../../src/storage/favs";
import {
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  load,
} from "../../src/storage/store";
import { cleanupKit, fireClick, renderKit } from "../kit/render";

const DYNAMIC_BAR_ID = "rdw-dynamic-collection-bar";
const BAR_BODY_CLASS = "rdw-f-playlist-bar";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : fallback,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function search(tags: string): string {
  return `?page=post&s=list&tags=${encodeURIComponent(tags)}`;
}

function openResults(tags: string): void {
  window.history.replaceState(null, "", `/index.php${search(tags)}`);
}

function buttonByText(text: string): HTMLButtonElement | null {
  for (const node of document.querySelectorAll("button")) {
    if (node.textContent?.trim() === text) {
      return node;
    }
  }
  return null;
}

function nameInput(): HTMLInputElement {
  const node = document.querySelector('[role="dialog"] input');
  if (!(node instanceof HTMLInputElement)) {
    throw new Error("name input missing");
  }
  return node;
}

function queryInput(): HTMLInputElement {
  const node = document.querySelectorAll('[role="dialog"] input')[1];
  if (!(node instanceof HTMLInputElement)) {
    throw new Error("query input missing");
  }
  return node;
}

function typeName(value: string): void {
  const node = nameInput();
  act(() => {
    node.value = value;
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function submitDialog(): void {
  const form = nameInput().form;
  if (form === null) {
    throw new Error("dialog form missing");
  }
  act(() => {
    form.requestSubmit();
  });
}

describe("readSavableQuery", () => {
  beforeEach(() => {
    installGmMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the search without sort:random", () => {
    expect(readSavableQuery("cat sort:random -dog")).toBe("cat -dog");
  });

  it("is null without real tags", () => {
    expect(readSavableQuery("")).toBeNull();
    expect(readSavableQuery("")).toBeNull();
    expect(readSavableQuery("sort:random")).toBeNull();
    expect(readSavableQuery("all")).toBeNull();
    expect(readSavableQuery("all sort:random")).toBeNull();
    expect(readSavableQuery("sort:score:desc score:>=10")).toBeNull();
  });

  it("is null for a custom collection id list and for a saved search", () => {
    expect(readSavableQuery("( id:1 ~ id:2 )")).toBeNull();
    createDynamicCollection("Cats", "cat -dog");
    expect(readSavableQuery("-dog cat")).toBeNull();
    expect(readSavableQuery("-dog cat sort:random")).toBeNull();
    expect(readSavableQuery("cat")).toBe("cat");
  });
});

describe("SaveSearchLink", () => {
  let host: HTMLElement | null = null;

  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.body.className = BAR_BODY_CLASS;
    const content = document.createElement("div");
    content.id = "content";
    const list = document.createElement("div");
    list.className = "image-list";
    content.append(list);
    document.body.append(content);
  });

  afterEach(() => {
    if (host !== null) {
      cleanupKit(host);
      host = null;
    }
    document.body.replaceChildren();
    document.body.className = "";
    window.history.replaceState(null, "", "/index.php?page=post&s=list");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is absent when the field has no tags to save", () => {
    openResults("cat");
    host = renderKit(<SaveSearchButton tags="" />);
    expect(buttonByText(SAVE_SEARCH_LABEL)).toBeNull();
  });

  it("saves the current search under a name and shows its bar without a request", () => {
    openResults("cat sort:random -dog");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    host = renderKit(<SaveSearchButton tags="cat sort:random -dog" />);
    const link = buttonByText(SAVE_SEARCH_LABEL);
    if (link === null) {
      throw new Error("save link missing");
    }
    expect(link.getAttribute("title")).toBe(SAVE_SEARCH_TITLE);

    fireClick(link);
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      SAVE_SEARCH_DIALOG_TITLE,
    );
    expect(queryInput().value).toBe("cat -dog");
    typeName("  Cats  ");
    submitDialog();

    const saved = load().collections.find((item) => item.name === "Cats");
    expect(saved?.query).toBe("cat -dog");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(buttonByText(SAVE_SEARCH_LABEL)).toBeNull();
    expect(document.getElementById(DYNAMIC_BAR_ID)?.textContent).toContain("Cats");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses an empty name and a name that already exists", () => {
    createPlaylist("Taken");
    openResults("cat");
    host = renderKit(<SaveSearchButton tags="cat" />);
    const link = buttonByText(SAVE_SEARCH_LABEL);
    if (link === null) {
      throw new Error("save link missing");
    }
    fireClick(link);

    submitDialog();
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      "Enter a name.",
    );
    typeName("taken");
    expect(document.querySelector('[role="alert"]')).toBeNull();
    submitDialog();
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      "A collection with this name already exists.",
    );
    expect(load().collections).toHaveLength(1);
    expect(document.getElementById(DYNAMIC_BAR_ID)).toBeNull();
  });

  it("saves what the field holds, not the page address, and opens that search", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: search("all"),
    });
    host = renderKit(<SaveSearchButton tags="triss_merigold blowjob" />);
    const link = buttonByText(SAVE_SEARCH_LABEL);
    if (link === null) {
      throw new Error("save button missing");
    }
    fireClick(link);
    typeName("Triss");
    submitDialog();

    const saved = load().collections.find((item) => item.name === "Triss");
    expect(saved?.query).toBe("triss_merigold blowjob");
    expect(assign).toHaveBeenCalledWith(
      buildSearchUrl(parseTags("triss_merigold blowjob")),
    );
    expect(document.getElementById(DYNAMIC_BAR_ID)).toBeNull();
  });

  it("refuses a query that narrows nothing", () => {
    openResults("cat");
    host = renderKit(<SaveSearchButton tags="cat" />);
    const link = buttonByText(SAVE_SEARCH_LABEL);
    if (link === null) {
      throw new Error("save button missing");
    }
    fireClick(link);
    typeName("Everything");
    const field = queryInput();
    act(() => {
      field.value = "all";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    submitDialog();

    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      "Enter a tag search that is not saved yet.",
    );
    expect(load().collections).toHaveLength(0);
  });

  it("does not draw the bar while the collection bar feature is off", () => {
    document.body.className = "";
    openResults("cat");
    host = renderKit(<SaveSearchButton tags="cat" />);
    const link = buttonByText(SAVE_SEARCH_LABEL);
    if (link === null) {
      throw new Error("save link missing");
    }
    fireClick(link);
    typeName("Cats");
    submitDialog();

    expect(load().collections).toHaveLength(1);
    expect(document.getElementById(DYNAMIC_BAR_ID)).toBeNull();
    expect(playlistBarFeature.id).toBe("playlist-bar");
  });
});
