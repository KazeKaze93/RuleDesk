import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPlaylistMenu,
  playlistMenuFeature,
  resetPlaylistMenuRuntimeState,
} from "../../src/features/playlist-menu";
import { THUMB_IMAGE_HOST } from "../../src/site/thumb";
import {
  notifyThumbsAdded,
  resetFeatureRuntimeState,
} from "../../src/features/runtime";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { clearFavsCache } from "../../src/storage/favs";
import {
  addPostToPlaylist,
  clearStorageCache,
  createDynamicCollection,
  createPlaylist,
  listPlaylists,
  playlistsContaining,
} from "../../src/storage/store";

const CLASS_ADD = "rdw-playlist-add";
const CLASS_ADD_IN = "rdw-playlist-add--in";
const CLASS_MENU = "rdw-playlist-menu";
const CLASS_ITEM = "rdw-collection-picker-item";
const CLASS_COUNT = "rdw-collection-picker-count";
const LABEL_NEW_NAME = "New collection name";
const TEXT_CREATE = "Create";
const ATTR_POST_ID = "data-rdw-post-id";
const PREVIEW_CLASS = "preview";
const THUMB_DIR = "12";

function gridThumbUrl(hash: string, postId: string): string {
  return `https://${THUMB_IMAGE_HOST}/thumbnails/${THUMB_DIR}/thumbnail_${hash}.jpg?${postId}`;
}

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

function makeCtx(
  pageKind: FeatureContext["pageKind"],
  search: string,
): FeatureContext {
  return {
    pageKind,
    search,
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildThumb(postId: string): HTMLSpanElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${postId}`;

  const link = document.createElement("a");
  link.id = `p${postId}`;
  link.href = `index.php?page=post&s=view&id=${postId}`;

  const img = document.createElement("img");
  img.className = "preview";
  img.alt = "tag_a";

  link.append(img);
  thumb.append(link);
  return thumb;
}

function addButton(thumb: HTMLElement): HTMLButtonElement {
  const button = thumb.querySelector(`button.${CLASS_ADD}`);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("playlist add button missing");
  }
  return button;
}

function previewInLink(thumb: HTMLElement): HTMLImageElement {
  const img = thumb.querySelector("a img.preview");
  if (!(img instanceof HTMLImageElement)) {
    throw new Error("nested preview missing");
  }
  return img;
}

function placeOutsidePreview(thumb: HTMLElement, src: string): HTMLImageElement {
  const img = document.createElement("img");
  img.className = PREVIEW_CLASS;
  img.setAttribute("src", src);
  const link = thumb.querySelector("a");
  if (link === null) {
    throw new Error("thumb link missing");
  }
  thumb.insertBefore(img, link);
  return img;
}

function clickEl(el: Element | null | undefined): void {
  if (el === null || el === undefined) {
    throw new Error("element to click is missing");
  }
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function firstItem(): Element | null {
  return openMenus()[0]?.querySelector(`button.${CLASS_ITEM}`) ?? null;
}

function clickFirstItem(): void {
  clickEl(firstItem());
}

/** Types a name into the menu's "new collection" field and presses Create. */
function createFromMenu(name: string): void {
  const menu = openMenus()[0];
  const input = menu?.querySelector(`input[aria-label="${LABEL_NEW_NAME}"]`);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("new collection input missing");
  }
  act(() => {
    input.value = name;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const create = Array.from(menu?.querySelectorAll("button") ?? []).find(
    (button) => button.textContent?.trim() === TEXT_CREATE,
  );
  clickEl(create);
}

function openMenus(): HTMLElement[] {
  return Array.from(document.querySelectorAll(`.${CLASS_MENU}`)).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
}

describe("playlistMenuFeature", () => {
  beforeEach(() => {
    installGmMocks();
    resetFeatureRuntimeState();
    resetPlaylistMenuRuntimeState();
    document.body.replaceChildren();
    document.body.className = featureBodyClass("playlist-menu");
  });

  afterEach(() => {
    resetPlaylistMenuRuntimeState();
    resetFeatureRuntimeState();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for list and post", () => {
    expect(playlistMenuFeature.id).toBe("playlist-menu");
    expect(playlistMenuFeature.label).toBe("Add to collection button");
    expect(playlistMenuFeature.pages).toEqual(["list", "post"]);
    expect(playlistMenuFeature.defaultEnabled).toBe(true);
  });

  it("scopes every css rule under body.rdw-f-playlist-menu", () => {
    const bodyClass = featureBodyClass("playlist-menu");
    expect(bodyClass).toBe("rdw-f-playlist-menu");
    const rules = playlistMenuFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("adds a + button on list thumbs outside a#p{ID}", () => {
    const thumb = buildThumb("111");
    document.body.append(thumb);

    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    const button = addButton(thumb);
    expect(button.textContent).toBe("+");
    expect(button.classList.contains("rdw-icon-btn")).toBe(true);
    expect(button.getAttribute(ATTR_POST_ID)).toBe("111");
    expect(thumb.querySelector("a#p111")?.contains(button)).toBe(false);
    expect(button.previousElementSibling?.id).toBe("p111");
  });

  it("hides playlist badges by default even when the post is in a playlist", () => {
    const playlist = createPlaylist("Later");
    addPostToPlaylist(playlist.id, 111);
    const thumb = buildThumb("111");
    document.body.append(thumb);

    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    const css = playlistMenuFeature.css;
    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(true);
    expect(css).toContain(`:hover .${CLASS_ADD}`);
    expect(css).toContain(`.${CLASS_ADD}:focus-visible`);
    expect(css).not.toContain(
      `.${CLASS_ADD}.${CLASS_ADD_IN} {\n  opacity:`,
    );
    expect(css).not.toMatch(
      new RegExp(
        `${CLASS_ADD}\\.${CLASS_ADD_IN}[^}]*opacity\\s*:`,
      ),
    );
  });

  it("does not render list UI on the post page", () => {
    const thumb = buildThumb("42");
    document.body.append(thumb);

    playlistMenuFeature.mount(
      makeCtx("post", "?page=post&s=view&id=42"),
    );

    expect(document.querySelector(`button.${CLASS_ADD}`)).toBeNull();
    expect(document.querySelector(`.${CLASS_MENU}`)).toBeNull();
  });

  it("does not duplicate buttons on remount", () => {
    const thumb = buildThumb("111");
    document.body.append(thumb);
    const ctx = makeCtx("list", "?page=post&s=list");

    playlistMenuFeature.mount(ctx);
    playlistMenuFeature.mount(ctx);

    expect(thumb.querySelectorAll(`button.${CLASS_ADD}`).length).toBe(1);
  });

  it("marks the button when the post is already in a playlist", () => {
    const playlist = createPlaylist("Later");
    addPostToPlaylist(playlist.id, 111);
    const thumb = buildThumb("111");
    document.body.append(thumb);

    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(true);
  });

  it("toggles playlist membership from the open menu and shows post counts", () => {
    const playlist = createPlaylist("A");
    addPostToPlaylist(playlist.id, 500);
    const thumb = buildThumb("10");
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    expect(openMenus()).toHaveLength(1);
    expect(firstItem()).toBeInstanceOf(HTMLButtonElement);
    expect(firstItem()?.getAttribute("aria-checked")).toBe("false");
    expect(firstItem()?.querySelector(`.${CLASS_COUNT}`)?.textContent).toBe("1");

    clickFirstItem();
    expect(playlistsContaining(10).map((entry) => entry.id)).toEqual([
      playlist.id,
    ]);
    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(true);
    expect(openMenus()).toHaveLength(1);
    expect(firstItem()?.getAttribute("aria-checked")).toBe("true");
    expect(firstItem()?.querySelector(`.${CLASS_COUNT}`)?.textContent).toBe("2");

    clickFirstItem();
    expect(playlistsContaining(10)).toEqual([]);
    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(false);
  });

  it("creates a collection from the name row and keeps the menu open", () => {
    const thumb = buildThumb("20");
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    expect(openMenus()[0]?.textContent).toContain("No collections yet");
    createFromMenu("  Watch later  ");

    expect(openMenus()).toHaveLength(1);
    const playlists = listPlaylists();
    expect(playlists).toHaveLength(1);
    expect(playlists[0]?.name).toBe("Watch later");
    expect(playlistsContaining(20).map((entry) => entry.id)).toEqual([
      playlists[0]?.id,
    ]);
    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(true);
    expect(firstItem()?.getAttribute("aria-checked")).toBe("true");
  });

  it("refuses a name that a custom or dynamic collection already has", () => {
    const custom = createPlaylist("Watch later");
    createDynamicCollection("Saved", "cat");
    const thumb = buildThumb("22");
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    const alertText = (): string | null =>
      openMenus()[0]?.querySelector('[role="alert"]')?.textContent ?? null;

    createFromMenu("watch LATER");
    expect(listPlaylists().map((item) => item.id)).toEqual([custom.id]);
    expect(playlistsContaining(22)).toEqual([]);
    expect(alertText()).toBe("A collection with this name already exists.");
    expect(openMenus()[0]?.querySelector("input")?.value).toBe("watch LATER");

    createFromMenu("saved");
    expect(listPlaylists()).toHaveLength(1);
    expect(playlistsContaining(22)).toEqual([]);
    expect(alertText()).toBe("A collection with this name already exists.");

    createFromMenu("saved 2");
    expect(listPlaylists().map((item) => item.name)).toEqual([
      "Watch later",
      "saved 2",
    ]);
    expect(alertText()).toBeNull();
  });

  it("takes its colours from theme tokens", () => {
    const css = playlistMenuFeature.css ?? "";
    const menuRules = css
      .split("}")
      .filter((rule) => (rule.split("{")[0] ?? "").includes(`.${CLASS_MENU}`));
    expect(menuRules.length).toBeGreaterThan(0);
    for (const rule of menuRules) {
      expect(rule).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
    expect(menuRules.join("\n")).toContain("background: var(--rdw-surface)");
  });

  it("keeps only one open menu at a time", () => {
    const first = buildThumb("1");
    const second = buildThumb("2");
    document.body.append(first, second);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(first).click();
    expect(openMenus()).toHaveLength(1);
    addButton(second).click();
    expect(openMenus()).toHaveLength(1);
    expect(openMenus()[0]?.getAttribute(ATTR_POST_ID)).toBe("2");
  });

  it("closes the menu on Escape and outside pointerdown", () => {
    const thumb = buildThumb("7");
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    expect(openMenus()).toHaveLength(1);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(openMenus()).toHaveLength(0);

    addButton(thumb).click();
    expect(openMenus()).toHaveLength(1);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(openMenus()).toHaveLength(0);
  });

  it("stamps buttons for thumbs delivered via onThumbsAdded", () => {
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    const batch = document.createElement("div");
    const thumb = buildThumb("99");
    batch.append(thumb);
    document.body.append(batch);
    notifyThumbsAdded(batch);

    expect(addButton(thumb).getAttribute(ATTR_POST_ID)).toBe("99");
  });

  it("exports createPlaylistMenu as a standalone menu", () => {
    const playlist = createPlaylist("Side");
    const menu = createPlaylistMenu(55);
    document.body.append(menu);

    expect(menu.classList.contains(CLASS_MENU)).toBe(true);
    expect(menu.getAttribute(ATTR_POST_ID)).toBe("55");
    expect(menu.querySelector(`button.${CLASS_ITEM}`)?.textContent).toContain(
      "Side",
    );

    clickEl(menu.querySelector(`button.${CLASS_ITEM}`));
    expect(playlistsContaining(55).map((entry) => entry.id)).toEqual([
      playlist.id,
    ]);
    expect(listPlaylists()[0]?.thumbs).toEqual({});
  });

  it("stores img.preview from outside the anchor when adding", () => {
    const playlist = createPlaylist("Later");
    const outside = gridThumbUrl("outside", "10");
    const inside = gridThumbUrl("inside", "10");
    const thumb = buildThumb("10");
    placeOutsidePreview(thumb, outside);
    previewInLink(thumb).setAttribute("src", inside);
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    clickFirstItem();

    expect(playlistsContaining(10).map((entry) => entry.id)).toEqual([
      playlist.id,
    ]);
    expect(listPlaylists()[0]?.thumbs).toEqual({ "10": outside });
  });

  it("stores the nested img.preview when that is the only preview", () => {
    const playlist = createPlaylist("Later");
    const nested = gridThumbUrl("nested", "10");
    const thumb = buildThumb("10");
    previewInLink(thumb).setAttribute("src", nested);
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    clickFirstItem();

    expect(listPlaylists()[0]?.id).toBe(playlist.id);
    expect(listPlaylists()[0]?.thumbs).toEqual({ "10": nested });
  });

  it("stores the preview when creating a collection from the grid menu", () => {
    const nested = gridThumbUrl("created", "20");
    const thumb = buildThumb("20");
    previewInLink(thumb).setAttribute("src", `  ${nested}  `);
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    createFromMenu("Watch later");

    expect(listPlaylists()[0]?.name).toBe("Watch later");
    expect(listPlaylists()[0]?.postIds).toEqual([20]);
    expect(listPlaylists()[0]?.thumbs).toEqual({ "20": nested });
  });

  it("keeps a known thumb when adding again without a preview URL", () => {
    createPlaylist("Later");
    const known = gridThumbUrl("kept", "10");
    const thumb = buildThumb("10");
    const img = previewInLink(thumb);
    img.setAttribute("src", known);
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    clickFirstItem();
    expect(listPlaylists()[0]?.thumbs).toEqual({ "10": known });

    img.removeAttribute("src");
    clickFirstItem();
    clickFirstItem();

    expect(listPlaylists()[0]?.postIds).toEqual([10]);
    expect(listPlaylists()[0]?.thumbs).toEqual({ "10": known });
  });

  it("fills an empty thumb when a later add can see the preview", () => {
    createPlaylist("Later");
    const known = gridThumbUrl("later", "10");
    const thumb = buildThumb("10");
    const img = previewInLink(thumb);
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    clickFirstItem();
    expect(listPlaylists()[0]?.postIds).toEqual([10]);
    expect(listPlaylists()[0]?.thumbs).toEqual({});

    clickFirstItem();
    img.setAttribute("src", known);
    clickFirstItem();

    expect(listPlaylists()[0]?.postIds).toEqual([10]);
    expect(listPlaylists()[0]?.thumbs).toEqual({ "10": known });
  });
});
