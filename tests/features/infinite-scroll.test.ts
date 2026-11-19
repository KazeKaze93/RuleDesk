import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SITE_BLACKLIST_COOKIE_NAME } from "../../src/config/constants";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";

const { notifyThumbsAddedMock } = vi.hoisted(() => ({
  notifyThumbsAddedMock: vi.fn(),
}));

vi.mock("../../src/site/thumbs-bus", () => ({
  notifyThumbsAdded: notifyThumbsAddedMock,
}));

import { infiniteScrollFeature } from "../../src/features/infinite-scroll";

const CLASS_SENTINEL = "rdw-infinite-sentinel";
const CLASS_STATUS = "rdw-infinite-status";
const CLASS_SEPARATOR = "rdw-infinite-page";
const CLASS_RETRY = "rdw-infinite-retry";
const CLASS_BLACKLISTED = "rdw-blacklisted";

/** Must match PREFETCH_REMAINING_VIEWPORT_HEIGHTS in infinite-scroll.ts. */
const PREFETCH_REMAINING_VIEWPORT_HEIGHTS = 2;
/** Pre-0.14 fixed rootMargin; tests assert the new threshold is not this. */
const LEGACY_ROOT_MARGIN_PX = 800;
const TEST_VIEWPORT_HEIGHT_PX = 600;

type IoCallback = IntersectionObserverCallback;

let ioInstances: MockIntersectionObserver[] = [];

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly scrollMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number>;
  private readonly callback: IoCallback;

  constructor(
    callback: IoCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "0px";
    const threshold = options?.threshold;
    this.thresholds = Array.isArray(threshold)
      ? threshold
      : [threshold ?? 0];
    ioInstances.push(this);
  }

  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(isIntersecting: boolean): void {
    const entry = {
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      target: document.querySelector(`.${CLASS_SENTINEL}`) ?? document.body,
      time: 0,
      boundingClientRect: DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 }),
      intersectionRect: DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 }),
      rootBounds: null,
    } satisfies IntersectionObserverEntry;
    this.callback([entry], this);
  }
}

function makeCtx(): FeatureContext {
  return {
    pageKind: "list",
    search: "?page=post&s=list&tags=test",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function setCookie(raw: string): void {
  document.cookie = `${SITE_BLACKLIST_COOKIE_NAME}=${raw}`;
}

function clearCookies(): void {
  const cookies = document.cookie.split(";");
  for (const pair of cookies) {
    const name = pair.split("=")[0]?.trim();
    if (name !== undefined && name.length > 0) {
      document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`;
    }
  }
}

function buildThumbHtml(
  id: string,
  tags: string,
  score: number,
  rating: string,
): string {
  const title = `${tags} score:${String(score)} rating:${rating}`;
  return `<span class="thumb" id="${id}"><a id="p${id.slice(1)}" href="index.php?page=post&s=view&id=${id.slice(1)}"><img class="preview" alt="${tags}" title="${title}"></a></span>`;
}

function pageHtml(
  thumbs: string[],
  nextHref: string | null,
): string {
  const list = `<div class="image-list">${thumbs.join("")}</div>`;
  const pagination =
    nextHref === null
      ? `<div class="pagination"><b>end</b></div>`
      : `<div class="pagination"><a href="${nextHref}" alt="next">&gt;</a></div>`;
  return `<!doctype html><html><body>${list}${pagination}</body></html>`;
}

function buildListPage(options?: {
  initialThumbIds?: string[];
  nextHref?: string | null;
}): {
  imageList: HTMLDivElement;
  pagination: HTMLDivElement;
} {
  const ids = options?.initialThumbIds ?? ["s100"];
  const nextHref =
    options?.nextHref === undefined
      ? "?page=post&s=list&tags=test&pid=42"
      : options.nextHref;

  const imageList = document.createElement("div");
  imageList.className = "image-list";
  for (const id of ids) {
    imageList.insertAdjacentHTML(
      "beforeend",
      buildThumbHtml(id, "safe_tag", 1, "s"),
    );
  }

  const pagination = document.createElement("div");
  pagination.className = "pagination";
  if (nextHref !== null) {
    const next = document.createElement("a");
    next.href = nextHref;
    next.setAttribute("alt", "next");
    next.textContent = ">";
    pagination.append(next);
  } else {
    pagination.innerHTML = "<b>1</b>";
  }

  document.body.append(imageList, pagination);
  return { imageList, pagination };
}

function mockFetchSequence(
  responses: Array<{ ok?: boolean; body: string } | Error>,
): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn();
  for (const item of responses) {
    if (item instanceof Error) {
      fetchMock.mockRejectedValueOnce(item);
    } else {
      fetchMock.mockResolvedValueOnce({
        ok: item.ok ?? true,
        status: item.ok === false ? 500 : 200,
        text: async () => item.body,
      });
    }
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function triggerIntersect(): Promise<void> {
  const instance = ioInstances[0];
  expect(instance).toBeDefined();
  instance?.trigger(true);
}

async function flushMicrotasks(times: number = 20): Promise<void> {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}

async function triggerAndSettle(
  predicate: () => boolean,
): Promise<void> {
  await triggerIntersect();
  await vi.waitFor(
    () => {
      expect(predicate()).toBe(true);
    },
    { timeout: 1000, interval: 1 },
  );
}

describe("infiniteScrollFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = featureBodyClass("infinite-scroll");
    clearCookies();
    notifyThumbsAddedMock.mockClear();
    ioInstances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal("GM_getValue", () => undefined);
    vi.stubGlobal("GM_setValue", () => undefined);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 0, width: 10, height: 1 }),
    );
  });

  afterEach(() => {
    clearCookies();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("exports feature contract fields", () => {
    expect(infiniteScrollFeature.id).toBe("infinite-scroll");
    expect(infiniteScrollFeature.label).toBe("Infinite scroll");
    expect(infiniteScrollFeature.pages).toEqual(["list"]);
    expect(infiniteScrollFeature.defaultEnabled).toBe(true);
    expect(infiniteScrollFeature.css).toContain(
      `body.${featureBodyClass("infinite-scroll")}`,
    );
    expect(infiniteScrollFeature.css).not.toContain("grid-column");
  });

  it("uses two viewport heights as IntersectionObserver rootMargin", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: TEST_VIEWPORT_HEIGHT_PX,
    });
    buildListPage();
    mockFetchSequence([
      {
        body: pageHtml([buildThumbHtml("s200", "tag", 1, "s")], null),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());

    const instance = ioInstances[0];
    expect(instance).toBeDefined();
    const expectedMarginPx =
      PREFETCH_REMAINING_VIEWPORT_HEIGHTS * TEST_VIEWPORT_HEIGHT_PX;
    expect(instance?.rootMargin).toBe(`${String(expectedMarginPx)}px`);
    expect(instance?.rootMargin).not.toBe(`${String(LEGACY_ROOT_MARGIN_PX)}px`);
  });

  it("loads when sentinel is beyond legacy 800px but within two viewport heights", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: TEST_VIEWPORT_HEIGHT_PX,
    });
    // Legacy viewBottom = IH+800; new = IH+2*IH. Pick a top between them.
    const sentinelTopBeyondLegacy =
      TEST_VIEWPORT_HEIGHT_PX + LEGACY_ROOT_MARGIN_PX + 100;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({
        x: 0,
        y: sentinelTopBeyondLegacy,
        width: 10,
        height: 1,
      }),
    );

    const { imageList } = buildListPage();
    mockFetchSequence([
      {
        body: pageHtml([buildThumbHtml("s200", "tag", 1, "s")], null),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    await triggerAndSettle(() => imageList.querySelector("#s200") !== null);

    expect(imageList.querySelector("#s200")).not.toBeNull();
  });

  it("does not load when sentinel is farther than two viewport heights", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: TEST_VIEWPORT_HEIGHT_PX,
    });
    const sentinelTopBeyondPrefetch =
      TEST_VIEWPORT_HEIGHT_PX +
      PREFETCH_REMAINING_VIEWPORT_HEIGHTS * TEST_VIEWPORT_HEIGHT_PX +
      50;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({
        x: 0,
        y: sentinelTopBeyondPrefetch,
        width: 10,
        height: 1,
      }),
    );

    buildListPage();
    const fetchMock = mockFetchSequence([
      {
        body: pageHtml([buildThumbHtml("s200", "tag", 1, "s")], null),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    await triggerIntersect();
    await flushMicrotasks();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.querySelector("#s200")).toBeNull();
  });

  it("does nothing when image-list is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const pagination = document.createElement("div");
    pagination.className = "pagination";
    const next = document.createElement("a");
    next.setAttribute("alt", "next");
    next.href = "?pid=42";
    pagination.append(next);
    document.body.append(pagination);

    infiniteScrollFeature.mount(makeCtx());

    expect(document.querySelector(`.${CLASS_SENTINEL}`)).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("does nothing when next link is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildListPage({ nextHref: null });

    infiniteScrollFeature.mount(makeCtx());

    expect(document.querySelector(`.${CLASS_SENTINEL}`)).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("appends next-page thumbs with a Page N separator and notifies", async () => {
    const { imageList, pagination } = buildListPage();

    mockFetchSequence([
      {
        body: pageHtml(
          [
            buildThumbHtml("s200", "tag_a", 2, "q"),
            buildThumbHtml("s201", "tag_b", 3, "e"),
          ],
          "?page=post&s=list&tags=test&pid=84",
        ),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    expect(document.querySelector(`.${CLASS_SENTINEL}`)).not.toBeNull();
    expect(pagination.querySelector('a[alt="next"]')).not.toBeNull();

    await triggerAndSettle(() => imageList.querySelector("#s201") !== null);

    const separators = imageList.querySelectorAll(`.${CLASS_SEPARATOR}`);
    expect(separators).toHaveLength(1);
    expect(separators[0]?.textContent).toBe("Page 2");
    expect(imageList.querySelector("#s200")).not.toBeNull();
    expect(imageList.querySelector("#s201")).not.toBeNull();
    expect(notifyThumbsAddedMock).toHaveBeenCalledWith(imageList, expect.any(Array));
  });

  it("pauses after two pages in a row that add nothing to the screen", async () => {
    const { imageList } = buildListPage();
    // A page with layout whose height never grows: every new thumb is hidden.
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    const next = (pid: number): string => `?page=post&s=list&tags=test&pid=${String(pid)}`;
    mockFetchSequence([
      { body: pageHtml([buildThumbHtml("s201", "a", 1, "s")], next(84)) },
      { body: pageHtml([buildThumbHtml("s202", "a", 1, "s")], next(126)) },
      { body: pageHtml([buildThumbHtml("s203", "a", 1, "s")], next(168)) },
      { body: pageHtml([buildThumbHtml("s204", "a", 1, "s")], next(210)) },
      { body: pageHtml([buildThumbHtml("s205", "a", 1, "s")], next(252)) },
      { body: pageHtml([buildThumbHtml("s206", "a", 1, "s")], next(294)) },
    ]);

    try {
      infiniteScrollFeature.mount(makeCtx());
      await triggerIntersect();
      await vi.waitFor(
        () => {
          expect(document.body.textContent).toContain("Paused");
        },
        { timeout: 4000, interval: 10 },
      );
      // Two pages went into this list, not the whole search. (The pages are
      // counted in the list: a loop left by an earlier test may take a reply.)
      expect(imageList.querySelectorAll(".rdw-infinite-page")).toHaveLength(2);

      const more = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent === "Load more",
      );
      if (more === undefined) {
        throw new Error("no Load more button");
      }
      more.click();
      await vi.waitFor(
        () => {
          expect(imageList.querySelectorAll(".rdw-infinite-page")).toHaveLength(3);
        },
        { timeout: 4000, interval: 10 },
      );
      // One page per click, and it waits again.
      await flushMicrotasks();
      expect(imageList.querySelectorAll(".rdw-infinite-page")).toHaveLength(3);
      expect(document.body.textContent).toContain("Paused");
    } finally {
      Reflect.deleteProperty(document.documentElement, "scrollHeight");
    }
  });

  it("skips thumbs whose id already exists on the page", async () => {
    const { imageList } = buildListPage({ initialThumbIds: ["s100", "s200"] });
    mockFetchSequence([
      {
        body: pageHtml(
          [
            buildThumbHtml("s200", "dup", 1, "s"),
            buildThumbHtml("s300", "new", 1, "s"),
          ],
          null,
        ),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    await triggerAndSettle(() => imageList.querySelector("#s300") !== null);

    expect(imageList.querySelectorAll("#s200")).toHaveLength(1);
    expect(imageList.querySelector("#s300")).not.toBeNull();
  });

  it("hides blacklisted thumbs via class using title meta", async () => {
    setCookie(encodeURI("blocked_tag"));
    const { imageList } = buildListPage();
    mockFetchSequence([
      {
        body: pageHtml(
          [
            buildThumbHtml("s200", "blocked_tag other", 1, "s"),
            buildThumbHtml("s201", "safe_tag", 1, "s"),
          ],
          null,
        ),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    await triggerAndSettle(() => imageList.querySelector("#s201") !== null);

    expect(imageList.querySelector("#s200")?.classList.contains(CLASS_BLACKLISTED)).toBe(
      true,
    );
    expect(
      imageList.querySelector("#s201")?.classList.contains(CLASS_BLACKLISTED),
    ).toBe(false);
  });

  it("shows End of results when nextUrl is absent", async () => {
    buildListPage();
    mockFetchSequence([
      {
        body: pageHtml([buildThumbHtml("s200", "tag", 1, "s")], null),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    await triggerAndSettle(() => {
      const status = document.querySelector(`.${CLASS_STATUS}`);
      return status?.textContent === "End of results";
    });

    const status = document.querySelector(`.${CLASS_STATUS}`);
    expect(status?.textContent).toBe("End of results");
  });

  it("shows error text and Retry on fetch failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildListPage();
    const fetchMock = mockFetchSequence([
      new Error("offline"),
      {
        body: pageHtml([buildThumbHtml("s200", "tag", 1, "s")], null),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    await triggerAndSettle(() => {
      const status = document.querySelector(`.${CLASS_STATUS}`);
      return (status?.textContent ?? "").includes("Failed to load more");
    });

    const status = document.querySelector(`.${CLASS_STATUS}`);
    expect(status?.textContent).toContain("Failed to load more");
    const retry = status?.querySelector(`.${CLASS_RETRY}`);
    expect(retry).not.toBeNull();
    expect(warn).toHaveBeenCalled();

    retry?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => {
      expect(document.querySelector("#s200")).not.toBeNull();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("allows only one in-flight request and rate-limits to 1000ms", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    buildListPage();

    let resolveFirst:
      | ((value: {
          ok: boolean;
          status: number;
          text: () => Promise<string>;
        }) => void)
      | undefined;
    const firstBody = pageHtml(
      [buildThumbHtml("s200", "a", 1, "s")],
      "?page=post&s=list&tags=test&pid=84",
    );
    const secondBody = pageHtml(
      [buildThumbHtml("s300", "b", 1, "s")],
      null,
    );

    const fetchMock = vi.fn();
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => secondBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    infiniteScrollFeature.mount(makeCtx());

    await triggerIntersect();
    await flushMicrotasks();
    await triggerIntersect();
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFirst?.({
      ok: true,
      status: 200,
      text: async () => firstBody,
    });
    await flushMicrotasks();

    expect(document.querySelector("#s200")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(999);
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(document.querySelector("#s300")).not.toBeNull();
  });

  it("does not modify native pagination markup", async () => {
    const { pagination } = buildListPage();
    const before = pagination.outerHTML;
    mockFetchSequence([
      {
        body: pageHtml([buildThumbHtml("s200", "tag", 1, "s")], null),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    await triggerAndSettle(() => document.querySelector("#s200") !== null);

    expect(pagination.outerHTML).toBe(before);
  });

  it("calls notifyThumbsAdded with the image-list root after a batch", async () => {
    const { imageList } = buildListPage();
    mockFetchSequence([
      {
        body: pageHtml([buildThumbHtml("s200", "tag", 1, "s")], null),
      },
    ]);

    infiniteScrollFeature.mount(makeCtx());
    await triggerAndSettle(() => notifyThumbsAddedMock.mock.calls.length > 0);

    expect(notifyThumbsAddedMock).toHaveBeenCalledTimes(1);
    expect(notifyThumbsAddedMock).toHaveBeenCalledWith(imageList, expect.any(Array));
  });
});
