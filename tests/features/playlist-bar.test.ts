import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEBUG_KEY, STORAGE_KEY, UI_TEXT } from "../../src/config/constants";
import { playlistBarFeature } from "../../src/features/playlist-bar";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import {
  buildPlaylistQueries,
  buildSearchUrl,
  parseTags,
  withSortRandom,
  withoutSortRandom,
} from "../../src/search/query";
import { createDefaultStorage } from "../../src/storage/schema";
import {
  clearStorageCache,
  createDynamicCollection,
  load,
  save,
  updateDynamicQuery,
} from "../../src/storage/store";

const ROOT_ID = "rdw-playlist-bar";
const DYNAMIC_ROOT_ID = "rdw-dynamic-collection-bar";
const TEXT_SHUFFLE = "Shuffle";
const TEXT_ORIGINAL_ORDER = "Original order";
const TEXT_EDIT_QUERY = "Edit query";
const TEXT_QUERY_LABEL = "Query";
const NAME_CLASS = "rdw-playlist-bar-name";
const COUNT_CLASS = "rdw-playlist-bar-count";
const PART_LABEL_CLASS = "rdw-playlist-bar-part-label";
const PART_LINK_CLASS = "rdw-playlist-bar-part-link";
const CAPTION_CLASS = "rdw-playlist-bar-caption";

const memory = new Map<string, unknown>();

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
  memory.set(DEBUG_KEY, false);
}

function makeCtx(search: string): FeatureContext {
  return {
    pageKind: "list",
    search,
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function seedPlaylist(
  name: string,
  postIds: number[],
  playlistChunkSize = 2,
): void {
  const data = createDefaultStorage();
  data.collections = [
    {
      id: "playlist-1",
      name,
      tags: [],
      kind: "posts",
      postIds,
    },
  ];
  data.settings = {
    ...data.settings,
    gridFavButtons: data.settings?.gridFavButtons ?? true,
    playlistChunkSize,
  };
  save(data);
}

function buildListPage(): HTMLDivElement {
  const content = document.createElement("div");
  content.id = "content";
  const list = document.createElement("div");
  list.className = "image-list";
  content.append(list);
  document.body.append(content);
  return list;
}

function tagsSearch(query: string): string {
  return `?page=post&s=list&tags=${encodeURIComponent(query)}`;
}

function stubLocation(): { assign: ReturnType<typeof vi.fn>; reload: ReturnType<typeof vi.fn> } {
  const assign = vi.fn();
  const reload = vi.fn();
  vi.stubGlobal("location", {
    search: "",
    assign,
    reload,
  });
  return { assign, reload };
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function findButton(root: ParentNode, text: string): HTMLButtonElement | null {
  const buttons = Array.from(root.querySelectorAll("button"));
  const match = buttons.find((button) => button.textContent === text);
  return match instanceof HTMLButtonElement ? match : null;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  act(() => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("playlistBarFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    installGmMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for list", () => {
    expect(playlistBarFeature.id).toBe("playlist-bar");
    expect(playlistBarFeature.label).toBe("Collection header");
    expect(playlistBarFeature.pages).toEqual(["list"]);
    expect(playlistBarFeature.defaultEnabled).toBe(true);
  });

  it("scopes every css rule under body.rdw-f-playlist-bar", () => {
    const bodyClass = featureBodyClass("playlist-bar");
    expect(bodyClass).toBe("rdw-f-playlist-bar");
    const rules = playlistBarFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("shows the bar when the query matches a playlist chunk", () => {
    seedPlaylist("Fox pack", [5, 4, 3, 2, 1], 2);
    const list = buildListPage();
    const queries = buildPlaylistQueries([5, 4, 3, 2, 1], 2);
    expect(queries[0]).toBeDefined();
    const query = queries[0] ?? "";

    playlistBarFeature.mount(makeCtx(tagsSearch(query)));

    const bar = document.getElementById(ROOT_ID);
    expect(bar).not.toBeNull();
    expect(bar?.nextElementSibling).toBe(list);
    expect(bar?.querySelector(`.${NAME_CLASS}`)?.textContent).toBe("Fox pack");
    expect(bar?.querySelector(`.${COUNT_CLASS}`)?.textContent).toBe("5 posts");
    expect(bar?.querySelector(`.${PART_LABEL_CLASS}`)?.textContent).toBe(
      "Part 1 of 3",
    );
    expect(bar?.querySelector(`.${CAPTION_CLASS}`)?.textContent).toBe(
      "Posts are ordered by the site (newest first).",
    );
  });

  it("links neighbor parts from buildPlaylistQueries", () => {
    seedPlaylist("Parts", [5, 4, 3, 2, 1], 2);
    buildListPage();
    const queries = buildPlaylistQueries([5, 4, 3, 2, 1], 2);
    expect(queries).toHaveLength(3);
    const middle = queries[1];
    expect(middle).toBeDefined();

    playlistBarFeature.mount(makeCtx(tagsSearch(middle ?? "")));

    const bar = document.getElementById(ROOT_ID);
    expect(bar?.querySelector(`.${PART_LABEL_CLASS}`)?.textContent).toBe(
      "Part 2 of 3",
    );
    const links = Array.from(
      bar?.querySelectorAll(`a.${PART_LINK_CLASS}`) ?? [],
    );
    expect(links).toHaveLength(2);
    expect(links[0]?.textContent).toBe("Previous");
    expect(links[1]?.textContent).toBe("Next");
    expect(links[0]?.getAttribute("href")).toBe(
      buildSearchUrl(parseTags(queries[0] ?? "")),
    );
    expect(links[1]?.getAttribute("href")).toBe(
      buildSearchUrl(parseTags(queries[2] ?? "")),
    );
  });

  it("draws nothing for a non-playlist id query", () => {
    seedPlaylist("Mine", [10, 20], 40);
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("id:999")));

    expect(document.getElementById(ROOT_ID)).toBeNull();
  });

  it("draws nothing for a non-playlist tags query", () => {
    seedPlaylist("Mine", [10, 20], 40);
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("cat dog")));

    expect(document.getElementById(ROOT_ID)).toBeNull();
  });

  it("draws nothing on partial overlap with a playlist", () => {
    seedPlaylist("Mine", [10, 20, 30], 40);
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("( id:30 ~ id:20 ~ id:99 )")));

    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(memory.get(STORAGE_KEY)).toBeDefined();
  });

  it("warns and exits cleanly when image-list is missing", () => {
    seedPlaylist("Lone", [7], 40);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => {
      playlistBarFeature.mount(makeCtx(tagsSearch("id:7")));
    }).not.toThrow();

    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("mounts into a fallback host when image-list is missing but content exists", () => {
    seedPlaylist("Lone", [7], 40);
    const content = document.createElement("div");
    content.id = "content";
    document.body.append(content);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    playlistBarFeature.mount(makeCtx(tagsSearch("id:7")));

    const bar = document.getElementById(ROOT_ID);
    expect(bar).not.toBeNull();
    expect(bar?.parentElement).toBe(content);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("dynamic collection bar", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    installGmMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows the bar above the grid when token order differs from the saved query", () => {
    createDynamicCollection("Birds", "cat -dog");
    const list = buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("-dog cat")));

    const bar = document.getElementById(DYNAMIC_ROOT_ID);
    expect(bar).not.toBeNull();
    expect(bar?.nextElementSibling).toBe(list);
    expect(bar?.querySelector(`.${NAME_CLASS}`)?.textContent).toBe("Birds");
    expect(findButton(bar ?? document.body, TEXT_SHUFFLE)).not.toBeNull();
    expect(findButton(bar ?? document.body, TEXT_EDIT_QUERY)).not.toBeNull();
    expect(findButton(bar ?? document.body, UI_TEXT.rename)).not.toBeNull();
    expect(findButton(bar ?? document.body, UI_TEXT.delete)).not.toBeNull();
    expect(findButton(bar ?? document.body, TEXT_ORIGINAL_ORDER)).toBeNull();
    expect(document.getElementById(ROOT_ID)).toBeNull();
  });

  it("matches a legacy search that only has tags", () => {
    const data = createDefaultStorage();
    data.collections = [
      {
        id: "legacy-birds",
        name: "Legacy birds",
        tags: parseTags("bird -cat"),
      },
    ];
    save(data);
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("-cat bird")));

    const bar = document.getElementById(DYNAMIC_ROOT_ID);
    expect(bar?.querySelector(`.${NAME_CLASS}`)?.textContent).toBe(
      "Legacy birds",
    );
  });

  it("ignores sort:random and shows Original order only while shuffled", () => {
    createDynamicCollection("Birds", "cat dog");
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("dog sort:random cat")));

    const bar = document.getElementById(DYNAMIC_ROOT_ID);
    expect(bar?.querySelector(`.${NAME_CLASS}`)?.textContent).toBe("Birds");
    expect(findButton(bar ?? document.body, TEXT_ORIGINAL_ORDER)).not.toBeNull();
  });

  function addThumbs(list: HTMLElement, count: number): string[] {
    const urls: string[] = [];
    for (let index = 1; index <= count; index += 1) {
      const url = `https://wimg.rule34.xxx/thumbnails/1/thumbnail_h${String(index)}.jpg?${String(index)}`;
      urls.push(url);
      const thumb = document.createElement("span");
      thumb.className = "thumb";
      thumb.id = `s${String(index)}`;
      const link = document.createElement("a");
      link.id = `p${String(index)}`;
      const image = document.createElement("img");
      image.className = "preview";
      image.setAttribute("src", url);
      link.append(image);
      thumb.append(link);
      list.append(thumb);
    }
    return urls;
  }

  function coverOf(collectionId: string): readonly string[] | undefined {
    return load().collections.find((item) => item.id === collectionId)?.cover;
  }

  it("remembers the first four thumbs of the first results page as the cover", () => {
    const created = createDynamicCollection("Birds", "cat dog");
    const urls = addThumbs(buildListPage(), 6);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    playlistBarFeature.mount(makeCtx(tagsSearch("dog cat")));

    expect(coverOf(created.id)).toEqual(urls.slice(0, 4));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.querySelector("#p1 > img.preview")?.getAttribute("src")).toBe(
      urls[0],
    );
  });

  it("leaves the cover alone on later pages, shuffled pages, and empty grids", () => {
    const created = createDynamicCollection("Birds", "cat");
    addThumbs(buildListPage(), 4);

    playlistBarFeature.mount(makeCtx(`${tagsSearch("cat")}&pid=42`));
    expect(coverOf(created.id)).toBeUndefined();
    playlistBarFeature.mount(makeCtx(tagsSearch("cat sort:random")));
    expect(coverOf(created.id)).toBeUndefined();

    playlistBarFeature.mount(makeCtx(`${tagsSearch("cat")}&pid=0`));
    const stored = coverOf(created.id);
    expect(stored).toHaveLength(4);

    document.body.replaceChildren();
    buildListPage();
    playlistBarFeature.mount(makeCtx(tagsSearch("cat")));
    expect(coverOf(created.id)).toEqual(stored);
  });

  it("drops the cover when the query is edited", () => {
    const created = createDynamicCollection("Birds", "cat");
    addThumbs(buildListPage(), 4);
    playlistBarFeature.mount(makeCtx(tagsSearch("cat")));
    expect(coverOf(created.id)).toHaveLength(4);

    updateDynamicQuery(created.id, "dog");
    expect(coverOf(created.id)).toBeUndefined();
  });

  it("draws nothing when the query does not match a dynamic collection", () => {
    createDynamicCollection("Birds", "cat");
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("dog")));

    expect(document.getElementById(DYNAMIC_ROOT_ID)).toBeNull();
  });

  it("draws nothing on the plain post list for a saved search with no tags", () => {
    const data = createDefaultStorage();
    data.collections = [{ id: "blank", name: "Blank", tags: [] }];
    save(data);
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("")));
    expect(document.getElementById(DYNAMIC_ROOT_ID)).toBeNull();

    playlistBarFeature.mount(makeCtx(tagsSearch("sort:random")));
    expect(document.getElementById(DYNAMIC_ROOT_ID)).toBeNull();
  });

  it("keeps the saved query when Edit query is submitted empty", () => {
    const created = createDynamicCollection("Birds", "cat dog");
    buildListPage();
    const { assign } = stubLocation();

    playlistBarFeature.mount(makeCtx(tagsSearch("dog cat")));
    const edit = findButton(
      document.getElementById(DYNAMIC_ROOT_ID) ?? document.body,
      TEXT_EDIT_QUERY,
    );
    if (edit === null) {
      throw new Error("edit missing");
    }
    click(edit);
    const queryInput = document.querySelector(
      `input[aria-label="${TEXT_QUERY_LABEL}"]`,
    );
    if (!(queryInput instanceof HTMLInputElement)) {
      throw new Error("query input missing");
    }
    setInputValue(queryInput, "   ");
    const saveButton = findButton(document.body, UI_TEXT.save);
    if (saveButton === null) {
      throw new Error("save missing");
    }
    click(saveButton);

    expect(load().collections.find((item) => item.id === created.id)?.query).toBe(
      "cat dog",
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("adds sort:random, and reloads when the page is already shuffled", () => {
    createDynamicCollection("Birds", "cat dog");
    buildListPage();
    const { assign, reload } = stubLocation();

    playlistBarFeature.mount(makeCtx(tagsSearch("dog cat")));
    const shuffle = findButton(
      document.getElementById(DYNAMIC_ROOT_ID) ?? document.body,
      TEXT_SHUFFLE,
    );
    expect(shuffle).not.toBeNull();
    if (shuffle !== null) {
      click(shuffle);
    }

    expect(assign).toHaveBeenCalledWith(
      buildSearchUrl(parseTags(withSortRandom("dog cat"))),
    );
    expect(reload).not.toHaveBeenCalled();

    document.body.replaceChildren();
    buildListPage();
    playlistBarFeature.mount(makeCtx(tagsSearch("dog sort:random cat")));
    const reshuffle = findButton(
      document.getElementById(DYNAMIC_ROOT_ID) ?? document.body,
      TEXT_SHUFFLE,
    );
    expect(reshuffle).not.toBeNull();
    if (reshuffle !== null) {
      click(reshuffle);
    }
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("drops sort:random for Original order", () => {
    createDynamicCollection("Birds", "cat dog");
    buildListPage();
    const { assign } = stubLocation();
    const pageQuery = "dog sort:random cat";

    playlistBarFeature.mount(makeCtx(tagsSearch(pageQuery)));
    const original = findButton(
      document.getElementById(DYNAMIC_ROOT_ID) ?? document.body,
      TEXT_ORIGINAL_ORDER,
    );
    expect(original).not.toBeNull();
    if (original !== null) {
      click(original);
    }

    expect(assign).toHaveBeenCalledWith(
      buildSearchUrl(parseTags(withoutSortRandom(pageQuery))),
    );
  });

  it("saves an edited query and navigates to it", () => {
    const created = createDynamicCollection("Birds", "cat dog");
    buildListPage();
    const { assign } = stubLocation();

    playlistBarFeature.mount(makeCtx(tagsSearch("dog cat")));
    const edit = findButton(
      document.getElementById(DYNAMIC_ROOT_ID) ?? document.body,
      TEXT_EDIT_QUERY,
    );
    expect(edit).not.toBeNull();
    if (edit !== null) {
      click(edit);
    }

    const queryInput = document.querySelector(
      `input[aria-label="${TEXT_QUERY_LABEL}"]`,
    );
    expect(queryInput).toBeInstanceOf(HTMLInputElement);
    if (!(queryInput instanceof HTMLInputElement)) {
      return;
    }
    expect(
      document.querySelector(`input[aria-label="${UI_TEXT.nameLabel}"]`),
    ).toBeNull();
    setInputValue(queryInput, "  bird  ");
    const saveButton = findButton(document.body, UI_TEXT.save);
    expect(saveButton).not.toBeNull();
    if (saveButton !== null) {
      click(saveButton);
    }

    expect(load().collections.find((item) => item.id === created.id)?.query).toBe(
      "bird",
    );
    expect(assign).toHaveBeenCalledWith(buildSearchUrl(parseTags("bird")));
  });

  it("renames from the fields dialog without leaving the page", () => {
    const created = createDynamicCollection("Birds", "cat");
    buildListPage();
    const { assign } = stubLocation();

    playlistBarFeature.mount(makeCtx(tagsSearch("cat")));
    const rename = findButton(
      document.getElementById(DYNAMIC_ROOT_ID) ?? document.body,
      UI_TEXT.rename,
    );
    expect(rename).not.toBeNull();
    if (rename !== null) {
      click(rename);
    }

    const nameInput = document.querySelector(
      `input[aria-label="${UI_TEXT.nameLabel}"]`,
    );
    expect(nameInput).toBeInstanceOf(HTMLInputElement);
    if (!(nameInput instanceof HTMLInputElement)) {
      return;
    }
    expect(
      document.querySelector(`input[aria-label="${TEXT_QUERY_LABEL}"]`),
    ).toBeNull();
    setInputValue(nameInput, "  Owls  ");
    const saveButton = findButton(document.body, UI_TEXT.save);
    expect(saveButton).not.toBeNull();
    if (saveButton !== null) {
      click(saveButton);
    }

    expect(load().collections.find((item) => item.id === created.id)?.name).toBe(
      "Owls",
    );
    expect(
      document.getElementById(DYNAMIC_ROOT_ID)?.querySelector(`.${NAME_CLASS}`)
        ?.textContent,
    ).toBe("Owls");
    expect(assign).not.toHaveBeenCalled();
  });

  it("deletes the collection after confirm and removes the bar", () => {
    const created = createDynamicCollection("Birds", "cat");
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("cat")));
    const remove = findButton(
      document.getElementById(DYNAMIC_ROOT_ID) ?? document.body,
      UI_TEXT.delete,
    );
    expect(remove).not.toBeNull();
    if (remove !== null) {
      click(remove);
    }

    expect(document.body.textContent).toContain(
      `${UI_TEXT.confirmDelete} (Birds)`,
    );
    const confirm = findButton(document.body, UI_TEXT.confirm);
    expect(confirm).not.toBeNull();
    if (confirm !== null) {
      click(confirm);
    }

    expect(document.getElementById(DYNAMIC_ROOT_ID)).toBeNull();
    expect(load().collections.some((item) => item.id === created.id)).toBe(
      false,
    );
  });
});
