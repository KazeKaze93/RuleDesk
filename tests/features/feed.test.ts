import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY, UPDATES_BAR_ID } from "../../src/config/constants";
import {
  FEED_NEW_CLASS,
  feedFeature,
  refreshFeedHref,
  resetFeedRuntimeState,
} from "../../src/features/feed";
import {
  notifyThumbsAdded,
  resetFeatureRuntimeState,
} from "../../src/features/runtime";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { RDW_HASH_FOLLOWING } from "../../src/pages/constants";
import {
  clearArtistsMirror,
  writeArtistsMirror,
} from "../../src/storage/artists-mirror";
import { createDefaultStorage } from "../../src/storage/schema";
import { clearStorageCache, save } from "../../src/storage/store";

const FEED_MENU_ITEM_ID = "rdw-feed-menu";
const CURRENT_PAGE_CLASS = "current-page";
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

function seedArtists(tags: string[], seenPostId = 0): void {
  const data = createDefaultStorage();
  data.artists = tags.map((tag) => ({ tag }));
  data.updates = { seenPostId };
  save(data);
}

function makeContext(
  pageKind: FeatureContext["pageKind"] = "list",
  search = "",
): FeatureContext {
  return {
    pageKind,
    search,
    getState: <T>(_parse: (raw: unknown) => T): T => {
      throw new Error("getState unused in feed tests");
    },
    setState: (): void => {},
  };
}

function makeMenuItem(
  text: string,
  options?: { href?: string; current?: boolean },
): HTMLLIElement {
  const li = document.createElement("li");
  if (options?.current === true) {
    li.className = CURRENT_PAGE_CLASS;
  }
  const anchor = document.createElement("a");
  anchor.href = options?.href ?? "https://rule34.xxx/index.php?page=post&s=list&tags=";
  anchor.textContent = text;
  li.append(anchor);
  return li;
}

function buildHeaderMenu(): {
  header: HTMLUListElement;
  posts: HTMLLIElement;
} {
  const header = document.createElement("ul");
  const posts = makeMenuItem("Posts", { current: true });
  const about = makeMenuItem("About");
  header.append(posts, about);

  const content = document.createElement("div");
  content.id = "content";
  const contentList = document.createElement("ul");
  contentList.append(makeMenuItem("Posts"));
  content.append(contentList);

  document.body.append(header, content);
  return { header, posts };
}

function buildThumb(id: string): HTMLSpanElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${id}`;
  const img = document.createElement("img");
  img.className = "preview";
  thumb.append(img);
  return thumb;
}

function buildListPage(postIds: string[]): HTMLDivElement {
  const list = document.createElement("div");
  list.className = "image-list";
  for (const id of postIds) {
    list.append(buildThumb(id));
  }
  document.body.append(list);
  return list;
}

describe("feedFeature", () => {
  beforeEach(() => {
    installGmMocks();
    resetFeedRuntimeState();
    resetFeatureRuntimeState();
    document.body.replaceChildren();
    document.body.className = "";
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    resetFeedRuntimeState();
    resetFeatureRuntimeState();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports feature contract fields", () => {
    expect(feedFeature.id).toBe("feed");
    expect(feedFeature.label).toBe("Feed in site menu");
    expect(feedFeature.defaultEnabled).toBe(true);
    expect(feedFeature.pages).toEqual([
      "list",
      "post",
      "favorites",
      "other",
    ]);
  });

  it("scopes css under body.rdw-f-feed and uses a NEW plaque on new thumbs", () => {
    const bodyClass = featureBodyClass("feed");
    expect(bodyClass).toBe("rdw-f-feed");
    expect(feedFeature.css).toContain(`body.${bodyClass}`);
    expect(feedFeature.css).toContain(`span.thumb.${FEED_NEW_CLASS}`);
    expect(feedFeature.css).toContain('content: "NEW"');
    expect(feedFeature.css).toContain("position-anchor:");
    expect(feedFeature.css).not.toContain("outline:");
  });

  it("inserts Feed immediately after Posts outside #content", () => {
    seedArtists(["a", "b"]);
    const { header, posts } = buildHeaderMenu();

    feedFeature.mount(makeContext("list", "?page=post&s=list&tags=score%3A%3E0"));

    const feedItem = document.getElementById(FEED_MENU_ITEM_ID);
    expect(feedItem).not.toBeNull();
    expect(posts.nextElementSibling).toBe(feedItem);
    expect(feedItem?.querySelector("a")?.textContent).toBe("Feed");
    expect(feedItem?.querySelector("a")?.getAttribute("href")).toContain(
      "tags=%28+a+~+b+%29",
    );
    expect(header.querySelectorAll(`#${FEED_MENU_ITEM_ID}`).length).toBe(1);
    expect(
      document.querySelector("#content a")?.textContent?.trim(),
    ).toBe("Posts");
  });

  it("does not duplicate Feed on remount", () => {
    seedArtists(["a"]);
    buildHeaderMenu();

    feedFeature.mount(makeContext());
    feedFeature.mount(makeContext());

    expect(document.querySelectorAll(`#${FEED_MENU_ITEM_ID}`).length).toBe(1);
  });

  it("points Feed at #rdw/following with title when no artists are followed", () => {
    buildHeaderMenu();

    feedFeature.mount(makeContext());

    const feedLink = document
      .getElementById(FEED_MENU_ITEM_ID)
      ?.querySelector("a");
    expect(feedLink?.getAttribute("href")).toBe(RDW_HASH_FOLLOWING);
    expect(feedLink?.title).toBe("Follow artists to build your feed");
  });

  it("moves current-page from Posts to Feed on a full feed query", () => {
    seedArtists(["a", "b"]);
    const { posts } = buildHeaderMenu();

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    const feedItem = document.getElementById(FEED_MENU_ITEM_ID);
    expect(posts.classList.contains(CURRENT_PAGE_CLASS)).toBe(false);
    expect(feedItem?.classList.contains(CURRENT_PAGE_CLASS)).toBe(true);
  });

  it("moves current-page on a partial feed query with id token", () => {
    seedArtists(["a", "b", "c"]);
    const { posts } = buildHeaderMenu();

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)+id%3A%3E5"),
    );

    expect(posts.classList.contains(CURRENT_PAGE_CLASS)).toBe(false);
    expect(
      document
        .getElementById(FEED_MENU_ITEM_ID)
        ?.classList.contains(CURRENT_PAGE_CLASS),
    ).toBe(true);
  });

  it("marks cards newer than seenPostId with the new class", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    buildListPage(["5", "10", "42"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    expect(document.getElementById("s5")?.classList.contains(FEED_NEW_CLASS)).toBe(
      false,
    );
    expect(
      document.getElementById("s10")?.classList.contains(FEED_NEW_CLASS),
    ).toBe(false);
    expect(
      document.getElementById("s42")?.classList.contains(FEED_NEW_CLASS),
    ).toBe(true);
  });

  it("does not highlight anyone when seenPostId is 0", () => {
    seedArtists(["a", "b"], 0);
    buildHeaderMenu();
    buildListPage(["5", "42"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    expect(document.querySelectorAll(`.${FEED_NEW_CLASS}`).length).toBe(0);
  });

  it("marks thumbs from onThumbsAdded", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    const list = buildListPage(["11"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    const late = buildThumb("99");
    list.append(late);
    notifyThumbsAdded(list);

    expect(late.classList.contains(FEED_NEW_CLASS)).toBe(true);
  });

  it("mounts the updates bar from the feed feature on a feed list page", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    buildListPage(["42"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    expect(document.getElementById(UPDATES_BAR_ID)).not.toBeNull();
  });

  it("does not mount the updates bar for a single-artist search with multiple followed artists", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    buildListPage(["42"]);

    feedFeature.mount(makeContext("list", "?page=post&s=list&tags=a"));

    expect(document.getElementById(UPDATES_BAR_ID)).toBeNull();
    expect(
      document
        .getElementById(FEED_MENU_ITEM_ID)
        ?.classList.contains(CURRENT_PAGE_CLASS),
    ).toBe(false);
  });

  it("refreshes Feed href on pageshow after artists are followed", () => {
    buildHeaderMenu();
    feedFeature.mount(makeContext());

    const feedLink = document
      .getElementById(FEED_MENU_ITEM_ID)
      ?.querySelector("a");
    expect(feedLink).toBeInstanceOf(HTMLAnchorElement);
    expect(feedLink?.getAttribute("href")).toBe(RDW_HASH_FOLLOWING);
    expect(feedLink?.title).toBe("Follow artists to build your feed");

    seedArtists(["nyx_x", "other"]);
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));

    expect(feedLink?.href).toContain("tags=%28+nyx_x+~+other+%29");
    expect(feedLink?.hasAttribute("title")).toBe(false);
  });

  it("refreshes Feed href after GM storage changed with a stale in-memory cache", () => {
    buildHeaderMenu();
    feedFeature.mount(makeContext());
    const feedLink = document
      .getElementById(FEED_MENU_ITEM_ID)
      ?.querySelector("a");
    expect(feedLink?.getAttribute("href")).toBe(RDW_HASH_FOLLOWING);

    const data = createDefaultStorage();
    data.artists = [{ tag: "stale_cache_artist" }, { tag: "also" }];
    memory.set(STORAGE_KEY, data);

    // The click or page return happens later than the shared-read window.
    const clock = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 2000);
    refreshFeedHref();
    clock.mockRestore();

    expect(feedLink?.href).toContain(
      "tags=%28+stale_cache_artist+~+also+%29",
    );
    expect(feedLink?.hasAttribute("title")).toBe(false);
  });

  it("re-reads artists after mount so feed recognition matches fresh storage", () => {
    seedArtists(["a", "b"]);
    const { posts } = buildHeaderMenu();
    const search = "?page=post&s=list&tags=(+a+~+b+)";
    feedFeature.mount(makeContext("list", search));
    expect(
      document
        .getElementById(FEED_MENU_ITEM_ID)
        ?.classList.contains(CURRENT_PAGE_CLASS),
    ).toBe(true);
    expect(posts.classList.contains(CURRENT_PAGE_CLASS)).toBe(false);

    const data = createDefaultStorage();
    data.artists = [{ tag: "a" }, { tag: "b" }, { tag: "new_follow" }];
    memory.set(STORAGE_KEY, data);
    writeArtistsMirror(["a", "b", "new_follow"]);

    feedFeature.mount(makeContext("list", search));

    expect(
      document
        .getElementById(FEED_MENU_ITEM_ID)
        ?.classList.contains(CURRENT_PAGE_CLASS),
    ).toBe(false);
    expect(posts.classList.contains(CURRENT_PAGE_CLASS)).toBe(true);
    expect(
      document.getElementById(FEED_MENU_ITEM_ID)?.querySelector("a")?.href,
    ).toContain("new_follow");
  });

  it("uses mirror artists absent from GM for Feed href and recognition", () => {
    seedArtists(["a"]);
    writeArtistsMirror(["a", "mirror_only"]);
    const { posts } = buildHeaderMenu();

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+mirror_only+)"),
    );

    const feedItem = document.getElementById(FEED_MENU_ITEM_ID);
    const feedLink = feedItem?.querySelector("a");
    expect(feedLink?.href).toContain("mirror_only");
    expect(feedLink?.href).toContain("tags=%28+a+~+mirror_only+%29");
    expect(feedItem?.classList.contains(CURRENT_PAGE_CLASS)).toBe(true);
    expect(posts.classList.contains(CURRENT_PAGE_CLASS)).toBe(false);
  });

  it("refreshes Feed href on pageshow when not persisted", () => {
    buildHeaderMenu();
    feedFeature.mount(makeContext());
    const feedLink = document
      .getElementById(FEED_MENU_ITEM_ID)
      ?.querySelector("a");
    seedArtists(["a", "b"]);
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: false }),
    );
    expect(feedLink?.href).toContain("tags=%28+a+~+b+%29");
  });

  it("refreshes Feed href in the click handler before navigation", () => {
    buildHeaderMenu();
    feedFeature.mount(makeContext());
    const feedLink = document
      .getElementById(FEED_MENU_ITEM_ID)
      ?.querySelector("a");
    expect(feedLink).toBeInstanceOf(HTMLAnchorElement);
    if (!(feedLink instanceof HTMLAnchorElement)) {
      return;
    }

    seedArtists(["solo", "duo"]);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    feedLink.addEventListener("click", (event) => {
      event.preventDefault();
    });
    feedLink.dispatchEvent(click);
    expect(feedLink.href).toContain("tags=%28+solo+~+duo+%29");
  });

  it("exports refreshFeedHref for direct recalculation", () => {
    buildHeaderMenu();
    feedFeature.mount(makeContext());
    seedArtists(["direct", "also"]);
    refreshFeedHref();
    const href = document
      .getElementById(FEED_MENU_ITEM_ID)
      ?.querySelector("a")
      ?.href;
    expect(href).toContain("tags=%28+direct+~+also+%29");
  });

  it("anchors NEW thumbs for the plaque overlay", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    buildListPage(["42"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    const thumb = document.getElementById("s42");
    expect(thumb?.classList.contains(FEED_NEW_CLASS)).toBe(true);
    expect(thumb?.classList.contains("rdw-thumb")).toBe(true);
  });
});
