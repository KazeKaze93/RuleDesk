import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLASS_NAV,
  CLASS_NAME,
  CLASS_POSITION,
  CLASS_STRIP,
  CollectionQueue,
  readCollectionQueueId,
} from "../../src/features/post-panel/collection-queue";
import {
  CLASS_ACTIONS,
  CLASS_ROOT,
  PostPanel,
} from "../../src/features/post-panel/post-panel";
import { clearFavsCache } from "../../src/storage/favs";
import {
  addPostToCollection,
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  getCollectionOrder,
  shuffleCollection,
} from "../../src/storage/store";
import { cleanupKit, renderKit } from "../kit/render";

const HASH_PREFIX = "#rdw-c=";
const COLLECTIONS_HASH_PREFIX = "#rdw/collections/";
const GLYPH_PREVIOUS = "‹";
const GLYPH_NEXT = "›";
const LABEL_PREVIOUS = "Previous post in collection";
const LABEL_NEXT = "Next post in collection";
const ARIA_QUEUE = "Collection queue";
const POSITION_MIDDLE = "2 / 3";
const POSITION_FIRST = "1 / 3";
const POSITION_LAST = "3 / 3";
const POSITION_ONLY = "1 / 1";
const POST_FIRST = 10;
const POST_MIDDLE = 20;
const POST_LAST = 30;
const POST_OUTSIDE = 99;
const COLLECTION_NAME = "Night queue";
const NATIVE_PREV_HREF = "index.php?page=post&s=view&id=1";
const NATIVE_NEXT_HREF = "index.php?page=post&s=view&id=99";
const KEY_PREVIOUS = "ArrowLeft";
const KEY_NEXT = "ArrowRight";

const memory = new Map<string, unknown>();
const hosts: HTMLElement[] = [];

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

function queueHash(collectionId: string): string {
  return `${HASH_PREFIX}${collectionId}`;
}

function openPost(postId: number, hash: string): void {
  window.history.pushState(
    null,
    "",
    `/index.php?page=post&s=view&id=${String(postId)}${hash}`,
  );
}

function postHref(postId: number, hash: string): string {
  return `/index.php?page=post&s=view&id=${String(postId)}${hash}`;
}

function seedOrder(postIds: readonly number[]): string {
  const playlist = createPlaylist(COLLECTION_NAME);
  for (const postId of postIds) {
    addPostToCollection(playlist.id, postId);
  }
  return playlist.id;
}

function mountQueue(postId: number | null): HTMLElement {
  const host = renderKit(<CollectionQueue postId={postId} />);
  hosts.push(host);
  return host;
}

function mountPanel(postId: string): HTMLElement {
  const host = renderKit(<PostPanel postId={postId} />);
  hosts.push(host);
  return host;
}

function strip(): HTMLElement | null {
  const node = document.querySelector(`.${CLASS_STRIP}`);
  return node instanceof HTMLElement ? node : null;
}

function step(label: string): HTMLElement | null {
  const node = strip()?.querySelector(`[aria-label="${label}"]`);
  return node instanceof HTMLElement ? node : null;
}

function installNativePostLinks(): void {
  const previous = document.createElement("a");
  previous.id = "site-prev";
  previous.setAttribute("href", NATIVE_PREV_HREF);
  previous.textContent = "«";
  const next = document.createElement("a");
  next.id = "site-next";
  next.setAttribute("href", NATIVE_NEXT_HREF);
  next.textContent = "»";
  document.body.append(previous, next);
}

describe("collection queue strip", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    window.history.pushState(null, "", "/index.php?page=post&s=view&id=1");
  });

  afterEach(() => {
    while (hosts.length > 0) {
      const host = hosts.pop();
      if (host !== undefined) {
        cleanupKit(host);
      }
    }
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads only the #rdw-c= collection id", () => {
    expect(readCollectionQueueId("#rdw-c=abc")).toBe("abc");
    expect(readCollectionQueueId("#rdw-c=a%20b")).toBe("a b");
    expect(readCollectionQueueId("#rdw-c=%E0%A4%A")).toBe("%E0%A4%A");
    expect(readCollectionQueueId("#rdw-c=")).toBeNull();
    expect(readCollectionQueueId("#rdw-c=   ")).toBeNull();
    expect(readCollectionQueueId("#rdw/collections/abc")).toBeNull();
    expect(readCollectionQueueId("")).toBeNull();
  });

  it("renders name, position, and neighbor links above the actions block", () => {
    const collectionId = seedOrder([POST_FIRST, POST_MIDDLE, POST_LAST]);
    const hash = queueHash(collectionId);
    openPost(POST_MIDDLE, hash);
    installNativePostLinks();
    const host = mountPanel(String(POST_MIDDLE));

    const queue = strip();
    const actions = host.querySelector(`.${CLASS_ACTIONS}`);
    const root = host.querySelector(`.${CLASS_ROOT}`);
    expect(queue).not.toBeNull();
    expect(root?.firstElementChild).toBe(queue);
    expect(queue?.nextElementSibling).toBe(actions);

    const name = queue?.querySelector(`.${CLASS_NAME}`);
    expect(name?.textContent).toBe(COLLECTION_NAME);
    expect(name?.getAttribute("href")).toBe(
      `${COLLECTIONS_HASH_PREFIX}${collectionId}`,
    );
    expect(queue?.querySelector(`.${CLASS_POSITION}`)?.textContent).toBe(
      POSITION_MIDDLE,
    );

    const previous = step(LABEL_PREVIOUS);
    const next = step(LABEL_NEXT);
    expect(previous?.tagName).toBe("A");
    expect(next?.tagName).toBe("A");
    expect(previous?.textContent).toBe(GLYPH_PREVIOUS);
    expect(next?.textContent).toBe(GLYPH_NEXT);
    expect(previous?.getAttribute("href")).toBe(postHref(POST_FIRST, hash));
    expect(next?.getAttribute("href")).toBe(postHref(POST_LAST, hash));
    expect(queue?.getAttribute("aria-label")).toBe(ARIA_QUEUE);

    expect(document.getElementById("site-prev")?.getAttribute("href")).toBe(
      NATIVE_PREV_HREF,
    );
    expect(document.getElementById("site-next")?.getAttribute("href")).toBe(
      NATIVE_NEXT_HREF,
    );
  });

  it("disables the previous control on the first post and the next control on the last", () => {
    const collectionId = seedOrder([POST_FIRST, POST_MIDDLE, POST_LAST]);
    const hash = queueHash(collectionId);

    openPost(POST_FIRST, hash);
    mountQueue(POST_FIRST);
    expect(strip()?.querySelector(`.${CLASS_POSITION}`)?.textContent).toBe(
      POSITION_FIRST,
    );
    const previous = step(LABEL_PREVIOUS);
    const next = step(LABEL_NEXT);
    expect(previous).toBeInstanceOf(HTMLButtonElement);
    expect(previous).toHaveProperty("disabled", true);
    expect(next?.tagName).toBe("A");
    expect(next?.getAttribute("href")).toBe(postHref(POST_MIDDLE, hash));

    while (hosts.length > 0) {
      const host = hosts.pop();
      if (host !== undefined) {
        cleanupKit(host);
      }
    }
    openPost(POST_LAST, hash);
    mountQueue(POST_LAST);
    expect(strip()?.querySelector(`.${CLASS_POSITION}`)?.textContent).toBe(
      POSITION_LAST,
    );
    expect(step(LABEL_PREVIOUS)?.getAttribute("href")).toBe(
      postHref(POST_MIDDLE, hash),
    );
    expect(step(LABEL_NEXT)).toBeInstanceOf(HTMLButtonElement);
    expect(step(LABEL_NEXT)).toHaveProperty("disabled", true);
  });

  it("disables both controls when the collection has one post", () => {
    const collectionId = seedOrder([POST_MIDDLE]);
    openPost(POST_MIDDLE, queueHash(collectionId));
    mountQueue(POST_MIDDLE);
    expect(strip()?.querySelector(`.${CLASS_POSITION}`)?.textContent).toBe(
      POSITION_ONLY,
    );
    expect(step(LABEL_PREVIOUS)).toHaveProperty("disabled", true);
    expect(step(LABEL_NEXT)).toHaveProperty("disabled", true);
    expect(step(LABEL_PREVIOUS)?.tagName).toBe("BUTTON");
    expect(step(LABEL_NEXT)?.tagName).toBe("BUTTON");
  });

  it("follows getCollectionOrder when the collection is shuffled", () => {
    const collectionId = seedOrder([POST_FIRST, POST_MIDDLE, POST_LAST]);
    shuffleCollection(collectionId);
    const order = getCollectionOrder(collectionId);
    expect(order).not.toBeNull();
    if (order === null) {
      return;
    }
    const current = order[1];
    const previousId = order[0];
    const nextId = order[2];
    expect(current).toBeDefined();
    expect(previousId).toBeDefined();
    expect(nextId).toBeDefined();
    if (
      current === undefined ||
      previousId === undefined ||
      nextId === undefined
    ) {
      return;
    }
    const hash = queueHash(collectionId);
    openPost(current, hash);
    mountQueue(current);
    expect(step(LABEL_PREVIOUS)?.getAttribute("href")).toBe(
      postHref(previousId, hash),
    );
    expect(step(LABEL_NEXT)?.getAttribute("href")).toBe(postHref(nextId, hash));
    expect(strip()?.querySelector(`.${CLASS_POSITION}`)?.textContent).toBe(
      POSITION_MIDDLE,
    );
  });

  it("omits the strip without a queue hash, for a missing post, or for a saved search", () => {
    const collectionId = seedOrder([POST_FIRST, POST_MIDDLE]);
    openPost(POST_MIDDLE, "");
    mountQueue(POST_MIDDLE);
    expect(strip()).toBeNull();

    openPost(POST_OUTSIDE, queueHash(collectionId));
    mountQueue(POST_OUTSIDE);
    expect(document.querySelectorAll(`.${CLASS_STRIP}`)).toHaveLength(0);

    openPost(POST_MIDDLE, "#rdw/collections/nope");
    mountQueue(POST_MIDDLE);
    expect(document.querySelectorAll(`.${CLASS_STRIP}`)).toHaveLength(0);

    const search = createDynamicCollection("Cats", "cat");
    openPost(POST_MIDDLE, queueHash(search.id));
    mountQueue(POST_MIDDLE);
    expect(document.querySelectorAll(`.${CLASS_STRIP}`)).toHaveLength(0);

    openPost(POST_MIDDLE, queueHash("missing-collection"));
    mountPanel(String(POST_MIDDLE));
    expect(document.querySelectorAll(`.${CLASS_STRIP}`)).toHaveLength(0);
    expect(document.querySelector(`.${CLASS_ACTIONS}`)).not.toBeNull();
    expect(
      document.querySelector(`.${CLASS_ROOT}`)?.firstElementChild?.classList.contains(
        CLASS_ACTIONS,
      ),
    ).toBe(true);
  });

  function installSiteSearchLinks(): { previous: HTMLElement; next: HTMLElement } {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div><a href="#" id="prev_search_link">&lt; previous</a></div>' +
      '<div><a href="#" id="next_search_link">next &gt;</a></div>';
    document.body.append(wrap);
    const previous = document.getElementById("prev_search_link");
    const next = document.getElementById("next_search_link");
    if (previous === null || next === null) {
      throw new Error("site links missing");
    }
    return { previous, next };
  }

  function stubReplace(): ReturnType<typeof vi.fn> {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      hash: window.location.hash,
      replace: assign,
    });
    return assign;
  }

  function clickLink(el: HTMLElement, init?: MouseEventInit): MouseEvent {
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
      ...init,
    });
    el.dispatchEvent(event);
    return event;
  }

  it("steps the site previous/next links through the shuffled collection order", () => {
    const collectionId = seedOrder([POST_FIRST, POST_MIDDLE, POST_LAST]);
    vi.spyOn(Math, "random").mockReturnValue(0);
    shuffleCollection(collectionId);
    const order = getCollectionOrder(collectionId) ?? [];
    const current = order[1];
    const before = order[0];
    const after = order[2];
    if (current === undefined || before === undefined || after === undefined) {
      throw new Error("order missing");
    }
    const hash = queueHash(collectionId);
    openPost(current, hash);
    const { previous, next } = installSiteSearchLinks();
    const siteHandler = vi.fn();
    previous.addEventListener("click", siteHandler);
    next.addEventListener("click", siteHandler);
    const assign = stubReplace();
    mountQueue(current);

    const nextEvent = clickLink(next);
    expect(nextEvent.defaultPrevented).toBe(true);
    expect(assign).toHaveBeenLastCalledWith(postHref(after, hash));
    clickLink(previous);
    expect(assign).toHaveBeenLastCalledWith(postHref(before, hash));
    expect(siteHandler).not.toHaveBeenCalled();
    expect(previous.getAttribute("href")).toBe("#");

    const modified = clickLink(next, { ctrlKey: true });
    expect(modified.defaultPrevented).toBe(false);
    expect(assign).toHaveBeenCalledTimes(2);
  });

  it("replaces the history entry from the strip arrows", () => {
    const collectionId = seedOrder([POST_FIRST, POST_MIDDLE, POST_LAST]);
    const hash = queueHash(collectionId);
    openPost(POST_MIDDLE, hash);
    const replace = stubReplace();
    mountQueue(POST_MIDDLE);
    const next = step(LABEL_NEXT);
    if (next === null) {
      throw new Error("next missing");
    }

    expect(clickLink(next).defaultPrevented).toBe(true);
    expect(replace).toHaveBeenCalledWith(postHref(POST_LAST, hash));
    expect(clickLink(next, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("blocks the site link at the end of the collection and leaves it alone outside one", () => {
    const collectionId = seedOrder([POST_FIRST, POST_MIDDLE]);
    openPost(POST_MIDDLE, queueHash(collectionId));
    const { next } = installSiteSearchLinks();
    const siteHandler = vi.fn();
    next.addEventListener("click", siteHandler);
    const assign = stubReplace();
    const host = mountQueue(POST_MIDDLE);

    expect(clickLink(next).defaultPrevented).toBe(true);
    expect(assign).not.toHaveBeenCalled();
    expect(siteHandler).not.toHaveBeenCalled();

    cleanupKit(host);
    hosts.pop();
    clickLink(next);
    expect(siteHandler).toHaveBeenCalledTimes(1);
  });

  it("appears after a hashchange and does not bind arrow keys", () => {
    const collectionId = seedOrder([POST_FIRST, POST_MIDDLE]);
    openPost(POST_MIDDLE, "");
    const addSpy = vi.spyOn(window, "addEventListener");
    mountQueue(POST_MIDDLE);
    const eventTypes = addSpy.mock.calls.map((call) => String(call[0]));
    expect(eventTypes).toContain("hashchange");
    expect(eventTypes).not.toContain("keydown");
    expect(eventTypes).not.toContain("keyup");
    expect(strip()).toBeNull();

    const before = window.location.href;
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: KEY_NEXT, bubbles: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: KEY_PREVIOUS, bubbles: true }),
    );
    expect(window.location.href).toBe(before);

    act(() => {
      window.history.pushState(
        null,
        "",
        `/index.php?page=post&s=view&id=${String(POST_MIDDLE)}${queueHash(collectionId)}`,
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(strip()?.querySelector(`.${CLASS_NAME}`)?.getAttribute("href")).toBe(
      `${COLLECTIONS_HASH_PREFIX}${collectionId}`,
    );
    expect(strip()?.querySelectorAll(`.${CLASS_NAV}`)).toHaveLength(2);
  });
});
