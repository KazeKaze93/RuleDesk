import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  STORAGE_KEY,
  UPDATES_BAR_ID,
  UI_TEXT,
} from "../src/config/constants";
import {
  clearArtistsMirror,
  writeArtistsMirror,
} from "../src/storage/artists-mirror";
import { createDefaultStorage } from "../src/storage/schema";
import { clearStorageCache, getSeenPostId, save } from "../src/storage/store";
import { FEED_NEW_CLASS } from "../src/features/feed";
import { mountUpdatesBar } from "../src/ui/updates-bar";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
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

function seedArtists(seenPostId = 0): void {
  const data = createDefaultStorage();
  data.artists = [{ tag: "a" }, { tag: "b" }];
  data.updates = { seenPostId };
  save(data);
}

function buildThumb(id: string, markNew = false): HTMLSpanElement {
  const thumb = document.createElement("span");
  thumb.className = markNew ? `thumb ${FEED_NEW_CLASS}` : "thumb";
  thumb.id = `s${id}`;
  return thumb;
}

function buildListPage(postIds: string[], markNewIds: string[] = []): void {
  const list = document.createElement("div");
  list.className = "image-list";
  const newSet = new Set(markNewIds);
  for (const id of postIds) {
    list.append(buildThumb(id, newSet.has(id)));
  }
  document.body.append(list);
}

describe("mountUpdatesBar", () => {
  beforeEach(() => {
    installGmMocks();
    seedArtists();
    document.body.replaceChildren();
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows N new and Mark all seen when page has newer ids", () => {
    seedArtists(10);
    buildListPage(["10", "42", "7"], ["42"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar).not.toBeNull();
    expect(bar?.textContent).toContain("1 new");
    expect(bar?.textContent).not.toContain("on this page");
    const button = bar?.querySelector("button");
    expect(button?.textContent).toBe("Mark all seen");
    expect(button?.className).toContain("rdw-primary-button");
    const toggle = bar?.querySelector("a");
    expect(toggle?.textContent).toBe("Only new");
    expect(toggle?.className).toContain("rdw-secondary-button");
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(getSeenPostId()).toBe(42);
    expect(bar?.textContent).toContain("Marked as seen up to #42");
    expect(document.querySelectorAll(`.${FEED_NEW_CLASS}`).length).toBe(0);
  });

  it("asks for the search again with the new mark when all is marked seen in Only new", () => {
    seedArtists(5);
    buildListPage(["10", "42"], ["10", "42"]);
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)+id%3A%3E5");

    const bar = document.getElementById(UPDATES_BAR_ID);
    bar?.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(getSeenPostId()).toBe(42);
    expect(assign).toHaveBeenCalledTimes(1);
    const url = String(assign.mock.calls[0]?.[0] ?? "");
    expect(decodeURIComponent(url)).toContain("id:>42");
    expect(decodeURIComponent(url)).not.toContain("id:>5");
  });

  it("shows No new posts since #N without a mark button when nothing is new", () => {
    seedArtists(42);
    buildListPage(["10", "42", "7"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.querySelector("button")).toBeNull();
    expect(bar?.textContent).toContain("No new posts since #42");
    expect(bar?.querySelector("a")?.textContent).toBe("Only new");
    expect(getSeenPostId()).toBe(42);
  });

  it("hides Only new when seenPostId is 0", () => {
    seedArtists(0);
    buildListPage(["10", "42"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain("2 new");
    expect(bar?.textContent).not.toContain("on this page");
    expect(
      Array.from(bar?.querySelectorAll("a") ?? []).map((a) => a.textContent),
    ).not.toContain("Only new");
  });

  it("shows Show all when the feed query already has an id token", () => {
    seedArtists(5);
    buildListPage(["10", "42"]);
    mountUpdatesBar(
      document,
      "?page=post&s=list&tags=(+a+~+b+)+id%3A%3E5",
    );

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.querySelector("a")?.textContent).toBe("Show all");
    expect(bar?.querySelector("a")?.getAttribute("href")).toContain(
      "tags=%28+a+~+b+%29",
    );
    expect(bar?.querySelector("a")?.getAttribute("href")).not.toContain(
      "id%3A%3E",
    );
  });

  it("shows page-1 hint when pid > 0 on a full query", () => {
    buildListPage(["10"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)&pid=42");
    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain("Go to page 1");
    expect(bar?.querySelector("button")).toBeNull();
  });

  it("shows No new posts since when the image-list has no cards", () => {
    seedArtists(7);
    buildListPage([]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");
    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain("No new posts since #7");
    expect(bar?.querySelector("button")).toBeNull();
  });

  it("shows partial hint without a mark button and does not write seenPostId", () => {
    buildListPage(["99"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=a+id%3A%3E5");
    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain(UI_TEXT.updatesPartialHint);
    expect(bar?.querySelector("button")).toBeNull();
    expect(getSeenPostId()).toBe(0);
  });

  it("does not mount a bar for a plain artist search without id", () => {
    buildListPage(["99"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=a");
    expect(document.getElementById(UPDATES_BAR_ID)).toBeNull();
    expect(getSeenPostId()).toBe(0);
  });

  it("mounts empty-page bar into #post-list div.content when image-list is missing", () => {
    seedArtists(19300000);
    const postList = document.createElement("div");
    postList.id = "post-list";
    const content = document.createElement("div");
    content.className = "content";
    const chickens = document.createElement("p");
    chickens.textContent = "Nobody here but us chickens!";
    content.append(chickens);
    postList.append(content);
    document.body.append(postList);

    mountUpdatesBar(
      document,
      "?page=post&s=list&tags=(+a+~+b+)+id%3A%3E19300000",
    );

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar).not.toBeNull();
    expect(content.firstElementChild).toBe(bar);
    expect(bar?.textContent).toContain("No new posts since #19300000");
    expect(bar?.querySelector("a")?.textContent).toBe("Show all");
    expect(bar?.querySelector("a")?.getAttribute("href")).toContain(
      "tags=%28+a+~+b+%29",
    );
    expect(bar?.querySelector("a")?.getAttribute("href")).not.toContain(
      "id%3A%3E",
    );
  });

  it("falls back to #content when post-list content is missing", () => {
    seedArtists(7);
    const content = document.createElement("div");
    content.id = "content";
    document.body.append(content);

    mountUpdatesBar(document, "?page=post&s=list&tags=a+id%3A%3E7");

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(content.firstElementChild).toBe(bar);
    expect(bar?.textContent).toContain("No new posts since #7");
    expect(bar?.querySelector("a")?.textContent).toBe("Show all");
  });

  it("does not mount when image-list and both hosts are missing", () => {
    mountUpdatesBar(
      document,
      "?page=post&s=list&tags=(+a+~+b+)+id%3A%3E1",
    );
    expect(document.getElementById(UPDATES_BAR_ID)).toBeNull();
  });

  it("skips the bar when GM artists grew after mount with a stale cache", () => {
    seedArtists(10);
    buildListPage(["42"], ["42"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");
    expect(document.getElementById(UPDATES_BAR_ID)).not.toBeNull();

    const data = createDefaultStorage();
    data.artists = [{ tag: "a" }, { tag: "b" }, { tag: "c" }];
    data.updates = { seenPostId: 10 };
    memory.set(STORAGE_KEY, data);
    writeArtistsMirror(["a", "b", "c"]);

    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");
    expect(document.getElementById(UPDATES_BAR_ID)).toBeNull();
  });

  it("recognizes the feed bar from mirror artists absent from GM", () => {
    seedArtists(10);
    writeArtistsMirror(["a", "b", "mirror_only"]);
    buildListPage(["42"], ["42"]);

    mountUpdatesBar(
      document,
      "?page=post&s=list&tags=(+a+~+b+~+mirror_only+)",
    );

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar).not.toBeNull();
    expect(bar?.textContent).toContain("1 new");
  });
});
