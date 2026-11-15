import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  artistHasNew,
  createFollowingPage,
  quietSince,
  sortArtists,
} from "../../src/pages/following-page";
import { fetchArtistSnapshot } from "../../src/site/artist-snapshot";
import type { ArtistEntry } from "../../src/storage/schema";
import {
  addArtist,
  clearStorageCache,
  load,
  rememberArtistLastPosts,
  rememberArtistSnapshot,
  setSeenPostId,
} from "../../src/storage/store";

vi.mock("../../src/site/artist-snapshot", async (original) => ({
  ...(await original<typeof import("../../src/site/artist-snapshot")>()),
  fetchArtistSnapshot: vi.fn(),
}));

const memory = new Map<string, unknown>();
const THUMB = "https://example.test/t1.jpg";
const DAY_MS = 86_400_000;

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

function mount(): HTMLElement {
  let root: HTMLElement | undefined;
  act(() => {
    root = createFollowingPage();
    document.body.append(root);
  });
  if (root === undefined) {
    throw new Error("page missing");
  }
  return root;
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function button(root: ParentNode, text: string): HTMLButtonElement {
  for (const node of root.querySelectorAll("button")) {
    if (node.textContent?.trim() === text) {
      return node;
    }
  }
  throw new Error(`button "${text}" missing`);
}

function hasButton(root: ParentNode, text: string): boolean {
  return Array.from(root.querySelectorAll("button")).some(
    (node) => node.textContent?.trim() === text,
  );
}

function card(root: ParentNode, tag: string): HTMLElement {
  const node = root.querySelector(`.rdw-artist-card[data-tag="${tag}"]`);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`card ${tag} missing`);
  }
  return node;
}

function cardTags(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll(".rdw-artist-card")).map(
    (node) => node.getAttribute("data-tag") ?? "",
  );
}

function dialog(root: ParentNode): HTMLElement {
  const node = root.querySelector('[role="dialog"]');
  if (!(node instanceof HTMLElement)) {
    throw new Error("dialog missing");
  }
  return node;
}

function setInput(input: Element | null, value: string): void {
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("input missing");
  }
  act(() => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function artistTags(): string[] {
  return load().artists.map((entry) => entry.tag);
}

describe("following page helpers", () => {
  it("marks an artist as new only past the feed's seen mark", () => {
    const artist: ArtistEntry = { tag: "a", lastPostId: 50 };
    expect(artistHasNew(artist, 40)).toBe(true);
    expect(artistHasNew(artist, 50)).toBe(false);
    expect(artistHasNew(artist, 0)).toBe(false);
    expect(artistHasNew({ tag: "b" }, 40)).toBe(false);
  });

  it("calls an artist quiet after 60 days without a newer post", () => {
    const now = 100 * DAY_MS;
    expect(quietSince({ tag: "a", lastPostSince: 30 * DAY_MS }, now)).toBe(30 * DAY_MS);
    expect(quietSince({ tag: "a", lastPostSince: 50 * DAY_MS }, now)).toBeNull();
    expect(quietSince({ tag: "a" }, now)).toBeNull();
  });

  it("sorts by name, by post count with unknown last, and by follow date", () => {
    const artists: ArtistEntry[] = [
      { tag: "cc", addedAt: 3, postCount: { value: 5, exact: true } },
      { tag: "aa", addedAt: 1 },
      { tag: "bb", addedAt: 2, postCount: { value: 90, exact: true } },
    ];
    const tags = (mode: "name" | "posts" | "added"): string[] =>
      sortArtists(artists, mode).map((entry) => entry.tag);
    expect(tags("name")).toEqual(["aa", "bb", "cc"]);
    expect(tags("posts")).toEqual(["bb", "cc", "aa"]);
    expect(tags("added")).toEqual(["cc", "bb", "aa"]);
  });
});

describe("artist store", () => {
  beforeEach(() => {
    installGmMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stamps the follow date and keeps a snapshot without clearing known data", () => {
    const entry = addArtist("nyx_x");
    expect(typeof entry.addedAt).toBe("number");

    expect(
      rememberArtistSnapshot(
        "nyx_x",
        { cover: [THUMB], postCount: { value: 2711, exact: true }, lastPostId: 90 },
        1000,
      ),
    ).toBe(true);
    // An empty page later must not wipe the cover, the count or the newest post.
    expect(
      rememberArtistSnapshot("nyx_x", { cover: [], postCount: null, lastPostId: 0 }, 2000),
    ).toBe(false);
    const stored = load().artists[0];
    expect(stored?.cover).toEqual([THUMB]);
    expect(stored?.postCount).toEqual({ value: 2711, exact: true });
    expect(stored?.lastPostId).toBe(90);
    expect(stored?.lastPostSince).toBe(1000);
  });

  it("moves the newest post forward only, with the time it was noticed", () => {
    addArtist("nyx_x");
    addArtist("nero100");
    rememberArtistLastPosts(new Map([["nyx_x", 50]]), 1000);
    expect(rememberArtistLastPosts(new Map([["nyx_x", 40]]), 2000)).toBe(false);
    rememberArtistLastPosts(new Map([["nyx_x", 60], ["unknown", 99]]), 3000);
    const stored = load().artists;
    expect(stored[0]?.lastPostId).toBe(60);
    expect(stored[0]?.lastPostSince).toBe(3000);
    expect(stored[1]?.lastPostId).toBeUndefined();
  });
});

describe("FollowingPage", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    vi.mocked(fetchArtistSnapshot).mockReset();
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows a card per artist with cover, post count and the new mark, and no note button", () => {
    addArtist("nyx_x");
    addArtist("nero100");
    rememberArtistSnapshot("nyx_x", {
      cover: [THUMB],
      postCount: { value: 2711, exact: true },
      lastPostId: 90,
    });
    setSeenPostId(80);

    const root = mount();

    const nyx = card(root, "nyx_x");
    expect(nyx.querySelector("img")?.getAttribute("src")).toBe(THUMB);
    expect(nyx.textContent).toContain("nyx x");
    expect(nyx.textContent).toContain("2,711 posts");
    expect(root.querySelector('button[aria-label^="Note"]')).toBeNull();
    expect(nyx.querySelector(".rdw-artist-new")).not.toBeNull();
    const nero = card(root, "nero100");
    expect(nero.textContent).toContain("not opened yet");
    expect(nero.querySelector(".rdw-artist-new")).toBeNull();
    expect(nero.querySelector("img")).toBeNull();
  });

  it("filters to artists with new posts", () => {
    addArtist("nyx_x");
    addArtist("nero100");
    rememberArtistLastPosts(new Map([["nero100", 90]]));
    setSeenPostId(80);
    const root = mount();

    const newRadio = Array.from(root.querySelectorAll('[role="radio"]')).find(
      (node) => node.textContent?.trim() === "New",
    );
    if (newRadio === undefined) {
      throw new Error("New filter missing");
    }
    click(newRadio);

    expect(cardTags(root)).toEqual(["nero100"]);
  });

  it("unfollows the selected artists after one confirmation", () => {
    addArtist("keep_me");
    addArtist("drop_one");
    addArtist("drop_two");
    const root = mount();

    click(button(root, "Select"));
    const first = card(root, "drop_one").querySelector('[role="checkbox"]');
    const second = card(root, "drop_two").querySelector('[role="checkbox"]');
    if (first === null || second === null) {
      throw new Error("selectable cards missing");
    }
    click(first);
    click(second);
    expect(root.textContent).toContain("2 selected");
    expect(artistTags()).toHaveLength(3);

    click(button(root, "Unfollow"));
    expect(dialog(root).textContent).toContain(
      "Unfollow 2 artists? This cannot be undone.",
    );
    click(button(dialog(root), "Unfollow"));

    expect(artistTags()).toEqual(["keep_me"]);
    expect(hasButton(root, "Select")).toBe(true);
  });

  it("asks before unfollowing one artist and removes the card at once", () => {
    addArtist("nyx_x");
    addArtist("nero100");
    const root = mount();
    const unfollow = root.querySelector('button[aria-label="Unfollow nyx_x"]');
    if (unfollow === null) {
      throw new Error("unfollow button missing");
    }
    click(unfollow);

    expect(dialog(root).textContent).toContain("Unfollow nyx x? This cannot be undone.");
    expect(artistTags()).toEqual(["nyx_x", "nero100"]);
    click(button(dialog(root), "Unfollow"));

    expect(artistTags()).toEqual(["nero100"]);
    expect(cardTags(root)).toEqual(["nero100"]);
    expect(hasButton(root, "Undo")).toBe(false);
  });

  it("leaves the artist when the unfollow question is cancelled", () => {
    addArtist("nyx_x");
    const root = mount();
    const unfollow = root.querySelector('button[aria-label="Unfollow nyx_x"]');
    if (unfollow === null) {
      throw new Error("unfollow button missing");
    }
    click(unfollow);
    click(button(dialog(root), "Cancel"));

    expect(artistTags()).toEqual(["nyx_x"]);
  });

  it("adds several artists typed with spaces and reports the ones it skipped", () => {
    addArtist("nyx_x");
    const root = mount();
    expect(hasButton(root, "Import / export")).toBe(false);

    click(button(root, "Add artists"));
    setInput(root.querySelector("#rdw-following-add-tag"), "nyx_x nero100  Sultry_Kiyomi ( ");
    click(button(dialog(root), "Add"));

    expect(artistTags()).toEqual(["nyx_x", "nero100", "sultry_kiyomi"]);
    expect(root.textContent).toContain("Added 2, already followed 1, invalid 1.");
    expect(cardTags(root)).toEqual(["nero100", "nyx_x", "sultry_kiyomi"]);
  });

  it("adds one artist without a message and says when it is already followed", () => {
    const root = mount();
    // The field is not on the page: it is in the window behind the button.
    expect(root.querySelector("#rdw-following-add-tag")).toBeNull();
    click(button(root, "Add artists"));
    setInput(root.querySelector("#rdw-following-add-tag"), "nyx_x");
    click(button(dialog(root), "Add"));
    expect(artistTags()).toEqual(["nyx_x"]);
    // Everything was added: the window closes by itself.
    expect(root.querySelector('[role="dialog"]')).toBeNull();

    click(button(root, "Add artists"));
    setInput(root.querySelector("#rdw-following-add-tag"), "nyx_x");
    click(button(dialog(root), "Add"));
    expect(root.querySelector(".rdw-error")?.textContent).toBe(
      "Already following this artist.",
    );
  });

  it("refreshes artists one request at a time and stops at the first error", async () => {
    vi.useFakeTimers();
    addArtist("aa");
    addArtist("bb");
    addArtist("cc");
    vi.mocked(fetchArtistSnapshot)
      .mockResolvedValueOnce({
        cover: [THUMB],
        postCount: { value: 12, exact: true },
        lastPostId: 30,
      })
      .mockRejectedValueOnce(new Error("HTTP 429"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = mount();

    click(button(root, "Refresh"));
    expect(dialog(root).textContent).toContain("This makes 3 requests to the site");
    expect(fetchArtistSnapshot).not.toHaveBeenCalled();
    click(button(dialog(root), "Refresh"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchArtistSnapshot).toHaveBeenCalledTimes(1);
    expect(fetchArtistSnapshot).toHaveBeenCalledWith("aa");
    // The second request waits for the pause.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1400);
    });
    expect(fetchArtistSnapshot).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(fetchArtistSnapshot).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(fetchArtistSnapshot).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain("Stopped at bb: HTTP 429");
    expect(card(root, "aa").textContent).toContain("12 posts");
    expect(card(root, "cc").textContent).toContain("not opened yet");
  });
});
