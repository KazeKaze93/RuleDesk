import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import {
  CLASS_THUMB_CHECK,
  CLASS_THUMB_SELECTED,
  favoritesBulkFeature,
} from "../../src/features/favorites-bulk";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { FAVORITES_SYNC_PAGE_PAUSE_MS } from "../../src/site/favorites-sync";
import { addFav, clearFavsCache, isFav } from "../../src/storage/favs";
import { startDownload } from "../../src/features/downloads/queue";
import { clearStorageCache, createPlaylist, listPlaylists } from "../../src/storage/store";

vi.mock("../../src/features/downloads/available", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/features/downloads/available")>()),
  downloadsAvailable: (): boolean => true,
}));
vi.mock("../../src/features/downloads/queue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/features/downloads/queue")>()),
  isDownloadBusy: (): boolean => false,
  startDownload: vi.fn(async (): Promise<void> => {}),
}));

const ROOT_ID = "rdw-favorites-bulk";
const PIN_ID = "rdw-favorites-pin";

/** The text of both rows of the panel: the title row and the pinned one. */
function panelText(): string {
  return `${document.getElementById(ROOT_ID)?.textContent ?? ""} ${document.getElementById(PIN_ID)?.textContent ?? ""}`;
}
const BODY_CLASS = featureBodyClass("favorites-bulk");
const IMAGE_LIST_CLASS = "image-list";

const memory = new Map<string, unknown>();

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

function makeCtx(): FeatureContext {
  return {
    pageKind: "favorites",
    search: "?page=favorites&s=view",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function appendFavoriteThumb(
  parent: ParentNode,
  id: number,
  options: { readonly removeInsideThumb?: boolean } = {},
): void {
  const removeInsideThumb = options.removeInsideThumb !== false;
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${String(id)}`;

  const postLink = document.createElement("a");
  postLink.id = `p${String(id)}`;
  postLink.href = `index.php?page=post&s=view&id=${String(id)}`;
  const img = document.createElement("img");
  img.className = "preview";
  postLink.append(img);
  thumb.append(postLink);

  const remove = document.createElement("a");
  remove.href = "#";
  remove.setAttribute(
    "onclick",
    `document.location='index.php?page=favorites&s=delete&id=${String(id)}&return_pid=0'; return false;`,
  );
  remove.textContent = "Remove";

  if (removeInsideThumb) {
    thumb.append(remove);
    parent.append(thumb);
    return;
  }

  parent.append(thumb);
  parent.append(remove);
  parent.append(document.createTextNode(" | "));
  const br = document.createElement("br");
  parent.append(br);
}

/** The grid in a block of its own, as on the site: the column of filters is put beside it. */
function buildFavoritesBlock(ids: number[]): void {
  const content = document.createElement("div");
  content.id = "content";
  const list = document.createElement("div");
  list.className = IMAGE_LIST_CLASS;
  content.append(list);
  document.body.append(content);
  for (const id of ids) {
    appendFavoriteThumb(list, id);
  }
}

function buildFavoritesPage(
  ids: number[],
  options: {
    readonly inImageList?: boolean;
    readonly removeInsideThumb?: boolean;
  } = {},
): HTMLElement | null {
  const host =
    options.inImageList === true
      ? (() => {
          const list = document.createElement("div");
          list.className = IMAGE_LIST_CLASS;
          document.body.append(list);
          return list;
        })()
      : document.body;

  for (const id of ids) {
    if (options.removeInsideThumb === undefined) {
      appendFavoriteThumb(host, id);
    } else {
      appendFavoriteThumb(host, id, {
        removeInsideThumb: options.removeInsideThumb,
      });
    }
  }

  const paginator = document.createElement("div");
  paginator.id = "paginator";
  paginator.innerHTML = "<b>1</b>";
  document.body.append(paginator);
  return options.inImageList === true ? host : null;
}

function mountFeature(): void {
  document.body.classList.add(BODY_CLASS);
  act(() => {
    favoritesBulkFeature.mount(makeCtx());
  });
}

function clickButtonWithText(label: string): void {
  const buttons = document.querySelectorAll("button");
  for (const button of buttons) {
    if (button.textContent?.trim() === label) {
      act(() => {
        button.click();
      });
      return;
    }
  }
  throw new Error(`Button not found: ${label}`);
}

function mockFetchOk(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => "<html>ok</html>",
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mockFetchFailAt(failIndex: number): ReturnType<typeof vi.fn> {
  let call = 0;
  const fetchMock = vi.fn(async () => {
    const index = call;
    call += 1;
    if (index === failIndex) {
      return {
        ok: false,
        status: 500,
        text: async () => "err",
      };
    }
    return {
      ok: true,
      status: 200,
      text: async () => "<html>ok</html>",
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("favoritesBulkFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    installGmMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("mounts a Select control above the favorites thumbs", () => {
    buildFavoritesPage([11, 22]);
    mountFeature();

    const root = document.getElementById(ROOT_ID);
    expect(root).not.toBeNull();
    const firstThumb = document.querySelector("span.thumb");
    expect(firstThumb).not.toBeNull();
    const pin = document.getElementById(PIN_ID);
    expect(root?.nextElementSibling).toBe(pin);
    expect(pin?.nextElementSibling).toBe(firstThumb);
    expect(pin?.textContent).toContain("Select");
  });

  it("places the bar above the image-list grid, not inside it beside the first thumb", () => {
    const list = buildFavoritesPage([11, 22], { inImageList: true });
    expect(list).not.toBeNull();
    mountFeature();

    const root = document.getElementById(ROOT_ID);
    expect(root).not.toBeNull();
    expect(list?.contains(root)).toBe(false);
    const pin = document.getElementById(PIN_ID);
    expect(list?.contains(pin)).toBe(false);
    expect(root?.nextElementSibling).toBe(pin);
    expect(pin?.nextElementSibling).toBe(list);
    expect(favoritesBulkFeature.css).toContain("grid-column: 1 / -1");
    expect(favoritesBulkFeature.css).toContain("flex: 0 0 100%");
  });

  it("shows selection count with Select page / Clear / Remove selected / Cancel on one row", () => {
    buildFavoritesPage([11, 22]);
    mountFeature();
    clickButtonWithText("Select");

    const root = document.getElementById(PIN_ID);
    const text = root?.textContent ?? "";
    expect(text).toContain("0 selected");
    expect(text).toContain("Select page");
    expect(text).toContain("Clear");
    expect(text).toContain("Remove selected (0)");
    expect(text).toContain("Cancel");
    expect(root?.querySelector(".rdw-favorites-bulk-bar")).not.toBeNull();
  });

  it("toggles selection chrome as a sibling of a#p{ID}, not inside it", () => {
    buildFavoritesPage([11]);
    mountFeature();
    clickButtonWithText("Select");

    const postLink = document.getElementById("p11");
    expect(postLink).toBeInstanceOf(HTMLAnchorElement);
    act(() => {
      postLink?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    const thumb = document.getElementById("s11");
    expect(thumb?.classList.contains(CLASS_THUMB_SELECTED)).toBe(true);
    const check = thumb?.querySelector(`:scope > .${CLASS_THUMB_CHECK}`);
    expect(check).not.toBeNull();
    expect(check?.parentElement).toBe(thumb);
    if (check !== null && check !== undefined && postLink !== null) {
      expect(postLink.contains(check)).toBe(false);
      expect(postLink.nextElementSibling).toBe(check);
    }
    expect(panelText()).toContain("1 selected");
  });

  it("blocks navigation when toggling a thumb in selection mode", () => {
    buildFavoritesPage([11]);
    mountFeature();
    clickButtonWithText("Select");

    const postLink = document.getElementById("p11");
    expect(postLink).toBeInstanceOf(HTMLAnchorElement);
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      postLink?.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });

  it("opens kit Dialog confirm instead of window.confirm for Remove selected", () => {
    buildFavoritesPage([11, 22]);
    mountFeature();
    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (2)");

    expect(window.confirm).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("cannot be undone on the site");
    expect(document.body.textContent).toContain("Remove 2 favorites");
    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
    expect(dialog).not.toBeNull();
    expect(document.querySelector(".rdw-dialog-backdrop")).not.toBeNull();
    const confirmBtn = [...document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Confirm",
    );
    expect(confirmBtn).toBeTruthy();
    // Control bar stays; confirm is overlay, not an in-flow full-width Card.
    expect(document.querySelector(".rdw-favorites-bulk-bar")?.textContent).toContain(
      "2 selected",
    );
    expect(document.querySelector(".rdw-card.rdw-favorites-bulk-confirm")).toBeNull();
  });

  it("removes favorites one-by-one with the sync pause between requests", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([11, 22]);
    addFav(11);
    addFav(22);
    mountFeature();
    const fetchMock = mockFetchOk();

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (2)");
    clickButtonWithText("Confirm");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(isFav(11)).toBe(false);
    expect(document.getElementById("s11")).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS - 1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(isFav(22)).toBe(false);
    expect(document.getElementById("s22")).toBeNull();
    expect(document.getElementById(PIN_ID)?.textContent).toContain("Select");
  });

  it("removes adjacent Remove link and separators when Remove is outside the thumb", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([11, 22], { removeInsideThumb: false });
    addFav(11);
    addFav(22);
    mountFeature();
    mockFetchOk();

    expect(document.body.textContent).toContain("Remove");
    expect(document.body.textContent).toContain("|");

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (2)");
    clickButtonWithText("Confirm");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(document.getElementById("s11")).toBeNull();
    expect(document.getElementById("s22")).toBeNull();
    expect(document.body.textContent).not.toContain("Remove");
    expect(document.body.textContent).not.toContain("|");
  });

  it("stops on non-200 without retries and reports deleted count + failed id", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([11, 22, 33]);
    addFav(11);
    addFav(22);
    addFav(33);
    mountFeature();
    mockFetchFailAt(1);

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (3)");
    clickButtonWithText("Confirm");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
      await vi.advanceTimersByTimeAsync(0);
    });

    const text = panelText();
    expect(text).toContain("Deleted 1 of 3");
    expect(text).toContain("Failed on post 22");
    expect(document.getElementById("s11")).toBeNull();
    expect(document.getElementById("s22")).not.toBeNull();
    expect(document.getElementById("s33")).not.toBeNull();
    expect(isFav(11)).toBe(false);
    expect(isFav(22)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("Stop aborts the queue during the inter-request pause", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([11, 22]);
    addFav(11);
    addFav(22);
    mountFeature();
    const fetchMock = mockFetchOk();

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (2)");
    clickButtonWithText("Confirm");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clickButtonWithText("Stop");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const text = panelText();
    expect(text).toContain("Stopped after 1 of 2");
    expect(document.getElementById("s22")).not.toBeNull();
  });

  it("uses buildRemoveFavUrl request shape (favorites delete)", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([55]);
    addFav(55);
    mountFeature();
    const fetchMock = mockFetchOk();

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (1)");
    clickButtonWithText("Confirm");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("page=favorites");
    expect(url).toContain("s=delete");
    expect(url).toContain("id=55");
  });

  it("puts the filters in a column beside the grid and the count and buttons in the strip over it", () => {
    buildFavoritesBlock([11, 22]);
    addFav(11);
    addFav(22);
    mountFeature();

    const root = document.getElementById(ROOT_ID);
    const pin = document.getElementById(PIN_ID);
    const side = document.getElementById("rdw-favorites-side");
    // The column: search, Type, Sort with Shuffle in it. It is a child of the
    // block the grid is in, which is laid out by a class; the grid is not wrapped.
    expect(side?.querySelector('input[aria-label="Search favorites"]')).not.toBeNull();
    const sideText = side?.textContent ?? "";
    expect(sideText).toContain("Images");
    expect(sideText).toContain("Newest");
    expect(sideText).toContain("Shuffle");
    const grid = document.querySelector("div.image-list");
    const slot = side?.parentElement;
    expect(slot?.classList.contains("rdw-fav-side-slot")).toBe(true);
    expect(slot?.parentElement).toBe(grid?.parentElement);
    expect(slot?.parentElement?.classList.contains("rdw-fav-layout")).toBe(true);
    // The strip: the count first, then how the list is paged, the buttons at the right end.
    expect(pin?.querySelector('input[aria-label="Search favorites"]')).toBeNull();
    const row = pin?.querySelector(".rdw-fav-controls");
    const labels = [...(row?.children ?? [])].map((child) => child.textContent?.trim() ?? "");
    expect(labels[0]).toBe("2 posts");
    expect(labels.join(" ")).toContain("Pages");
    expect(labels[labels.length - 1]).toContain("Random post");
    expect(labels[labels.length - 1]).toContain("Select");
    // The heading is still there for screen readers, and is all the first element holds.
    expect(root?.querySelector("h1")?.textContent).toBe("Favorites");
    expect(root?.textContent).toBe("Favorites");
    expect(favoritesBulkFeature.css).toMatch(/\.rdw-favorites-title \{[^}]*clip: rect\(0, 0, 0, 0\)/);
    expect(favoritesBulkFeature.css).toMatch(/\.rdw-favorites-pin \{[^}]*position: sticky/);
    expect(favoritesBulkFeature.css).not.toMatch(/\.rdw-favorites-bulk \{[^}]*position: sticky/);
  });

  it("locks the column while posts are being selected, and its Cancel ends the selection", () => {
    buildFavoritesBlock([11, 22]);
    mountFeature();
    const side = document.getElementById("rdw-favorites-side");
    expect(side?.classList.contains("rdw-fav-side--locked")).toBe(false);
    clickButtonWithText("Select");
    expect(side?.classList.contains("rdw-fav-side--locked")).toBe(true);
    expect(side?.textContent).toContain("Finish selecting to change filters.");
    const cancel = [...(side?.querySelectorAll("button") ?? [])].find(
      (button) => button.textContent?.trim() === "Cancel",
    );
    act(() => {
      cancel?.click();
    });
    expect(side?.classList.contains("rdw-fav-side--locked")).toBe(false);
    expect(document.getElementById(PIN_ID)?.textContent).toContain("Random post");
  });

  it("draws the filters in the row where the grid has no block of its own", () => {
    // The thumbs straight in <body>: nothing to lay out in two columns.
    buildFavoritesPage([11, 22]);
    mountFeature();
    expect(document.getElementById("rdw-favorites-side")).toBeNull();
    expect(document.body.classList.contains("rdw-fav-layout")).toBe(false);
    expect(
      document.getElementById(PIN_ID)?.querySelector('input[aria-label="Search favorites"]'),
    ).not.toBeNull();
  });

  it("gives the pinned row to the selection and keeps the filters for later", () => {
    buildFavoritesPage([11, 22]);
    mountFeature();
    clickButtonWithText("Select");

    const pin = document.getElementById(PIN_ID);
    const filters = pin?.querySelector(".rdw-favorites-filters");
    expect(filters?.hasAttribute("hidden")).toBe(true);
    expect(pin?.textContent).toContain("0 selected");
    expect(pin?.textContent).not.toContain("Random post");

    clickButtonWithText("Cancel");
    expect(filters?.hasAttribute("hidden")).toBe(false);
    expect(pin?.textContent).toContain("Random post");
  });

  it("names the button Select loaded while the results grid is shown", () => {
    buildFavoritesPage([11, 22]);
    mountFeature();
    document.body.classList.add("rdw-fav-browsing");
    clickButtonWithText("Select");

    const text = document.getElementById(PIN_ID)?.textContent ?? "";
    expect(text).toContain("Select loaded");
    expect(text).not.toContain("Select page");
  });

  it("marks a selected cell with a tick that is read out, not by colour alone", () => {
    buildFavoritesPage([11]);
    mountFeature();
    clickButtonWithText("Select");
    clickButtonWithText("Select page");

    const check = document.querySelector(`#s11 > .${CLASS_THUMB_CHECK}`);
    expect(check?.getAttribute("role")).toBe("img");
    expect(check?.getAttribute("aria-label")).toBe("Selected");
  });

  it("adds the selected posts to a collection picked in a dialog, and says what it did", () => {
    buildFavoritesPage([11, 22, 33]);
    mountFeature();
    createPlaylist("Keep");
    clickButtonWithText("Select");
    act(() => {
      document.getElementById("p11")?.click();
    });
    act(() => {
      document.getElementById("p33")?.click();
    });
    clickButtonWithText("Add to collection");

    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
    expect(dialog?.textContent).toContain("Add 2 posts to a collection");
    const row = [...(dialog?.querySelectorAll("button") ?? [])].find((button) =>
      button.textContent?.startsWith("Keep"),
    );
    act(() => {
      row?.click();
    });

    expect(listPlaylists()[0]?.postIds).toEqual([11, 33]);
    expect(document.querySelector('[role="dialog"][aria-modal="true"]')).toBeNull();
    const pin = document.getElementById(PIN_ID);
    expect(pin?.textContent).toContain("Added 2 posts to “Keep”.");
    // The selection stays: the same posts can go on to be removed from favorites.
    expect(pin?.textContent).toContain("2 selected");
  });

  it("makes a new collection from the dialog and refuses a name that is taken", () => {
    buildFavoritesPage([11, 22]);
    mountFeature();
    createPlaylist("Keep");
    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Add to collection");

    const field = document.querySelector('input[aria-label="New collection name"]');
    const type = (value: string): void => {
      act(() => {
        if (field instanceof HTMLInputElement) {
          field.value = value;
          field.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    };
    type("keep");
    clickButtonWithText("Create and add");
    expect(document.body.textContent).toContain("A collection with this name already exists.");
    expect(listPlaylists()).toHaveLength(1);

    type("Fresh");
    clickButtonWithText("Create and add");
    const fresh = listPlaylists().find((item) => item.name === "Fresh");
    expect(fresh?.postIds).toEqual([11, 22]);
  });

  it("asks before downloading everything, with the count on the button", () => {
    vi.mocked(startDownload).mockClear();
    buildFavoritesPage([11, 22]);
    addFav(11);
    addFav(22);
    mountFeature();

    const more = document.querySelector('button[aria-label="More actions"]');
    act(() => {
      if (more instanceof HTMLButtonElement) {
        more.click();
      }
    });
    clickButtonWithText("Download all…");

    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
    expect(dialog?.textContent).toContain("Download all favorites?");
    expect(dialog?.textContent).toContain("2 original files");
    expect(dialog?.textContent).toContain("Never synced.");
    expect(dialog?.textContent).toContain("Sync first");
    expect(startDownload).not.toHaveBeenCalled();

    clickButtonWithText("Download 2");
    expect(startDownload).toHaveBeenCalledTimes(1);
    expect(startDownload).toHaveBeenCalledWith("Favorites", { kind: "ids", ids: [22, 11] });
    expect(document.querySelector('[role="dialog"][aria-modal="true"]')).toBeNull();
  });

  it("opens a menu from the More actions button; Shuffle is an option of Sort", () => {
    buildFavoritesPage([11]);
    mountFeature();

    const more = document.querySelector('button[aria-label="More actions"]');
    expect(more?.getAttribute("aria-haspopup")).toBe("menu");
    expect(more?.getAttribute("aria-expanded")).toBe("false");
    act(() => {
      if (more instanceof HTMLButtonElement) {
        more.click();
      }
    });
    expect(more?.getAttribute("aria-expanded")).toBe("true");
    const menu = document.querySelector('[role="menu"]');
    expect(menu?.textContent).toContain("Sync favorites…");

    // Shuffle is the third option of Sort: chosen, it is the checked one and Newest is not.
    const option = (name: string): Element | undefined =>
      [...document.querySelectorAll('[role="radio"]')].find(
        (button) => button.textContent?.trim() === name,
      );
    expect(option("Newest")?.getAttribute("aria-checked")).toBe("true");
    expect(option("Shuffle")?.getAttribute("aria-checked")).toBe("false");
    act(() => {
      const shuffle = option("Shuffle");
      if (shuffle instanceof HTMLElement) {
        shuffle.click();
      }
    });
    expect(option("Shuffle")?.getAttribute("aria-checked")).toBe("true");
    expect(option("Newest")?.getAttribute("aria-checked")).toBe("false");
    act(() => {
      const oldest = option("Oldest");
      if (oldest instanceof HTMLElement) {
        oldest.click();
      }
    });
    expect(option("Shuffle")?.getAttribute("aria-checked")).toBe("false");
    expect(option("Oldest")?.getAttribute("aria-checked")).toBe("true");
  });
});
