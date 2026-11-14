import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADDFAV_RESPONSE_ADDED,
  CSS_CLASS,
} from "../../src/config/constants";
import {
  POST_PANEL_MOUNTED_CLASS,
  postActionsFeature,
} from "../../src/features/post-actions";
import { CLASS_COLLECTIONS_BTN } from "../../src/features/post-panel/collections-menu";
import {
  CLASS_POST_ACTION_BTN,
  DISPLAY_ADD_NOTE,
  DISPLAY_EDIT,
  DISPLAY_RESIZE,
  LABEL_REPORT,
} from "../../src/features/post-panel/post-actions-list";
import {
  CLASS_ACTIONS,
  CLASS_CARD,
  CLASS_COMMENTS_HOST,
  CLASS_FAV,
  CLASS_ICAME,
  CLASS_ORIGINAL,
  CLASS_SOURCE,
  CLASS_STATS,
  CLASS_TAB_PANEL,
  CLASS_TABS,
  CLASS_VOTE,
  POST_PANEL_TAB_CHOICE_ID,
  POST_PANEL_TAB_COMMENTS,
  POST_PANEL_TAB_INFO,
  TEXT_COMMENTS,
  TEXT_FAVORITE,
  TEXT_ICAME,
  TEXT_INFO,
  TEXT_IN_FAVORITES,
  TEXT_ORIGINAL,
  TEXT_POST,
  TEXT_SCORE_UNKNOWN,
  TEXT_VOTE_PREFIX,
} from "../../src/features/post-panel/post-panel";
import { POST_COMMENTS_ID } from "../../src/features/post-panel/site-reads";
import {
  POST_ACTIONS_ID,
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { addFav, clearFavsCache, isFav } from "../../src/storage/favs";
import {
  clearStorageCache,
  createPlaylist,
  getFeatureChoiceValue,
} from "../../src/storage/store";
import { kitTabId, kitTabPanelId } from "../../src/ui/kit";

const CLASS_PANEL = "rdw-post-actions";
const CLASS_MODE_WIDE = "rdw-post-actions--wide";
const CLASS_MODE_NARROW = "rdw-post-actions--narrow";
const CLASS_FOLLOW = "rdw-post-actions-follow";
const CLASS_MORE_BTN = "rdw-post-panel-more-btn";

const POST_ID = "42";
const POST_SEARCH = `?page=post&s=view&id=${POST_ID}`;
const NARROW_MEDIA_QUERY = "(max-width: 1099px)";
const ORIGINAL_HREF = "https://example.com/original.jpg";
const SOURCE_HREF = "https://x.com/Nyx_x__/status/1";
const PANEL_WIDTH_TOKEN = "360px";
const PANEL_MIN_WIDTH_TOKEN = "320px";
const PANEL_MAX_WIDTH_TOKEN = "420px";
const PANEL_FONT_TOKEN = "13px";
const PANEL_BUTTON_HEIGHT_TOKEN = "34px";
const PANEL_BUTTON_GAP_TOKEN = "8px";
const PANEL_BLOCK_GAP_TOKEN = "10px";
const ORIGINAL_SIZE_TOKEN = "34px";

const memory = new Map<string, unknown>();

type MediaListener = () => void;

type MatchMediaStub = {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  onchange: null;
  listeners: Set<MediaListener>;
  setMatches: (next: boolean) => void;
};

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

function stubMatchMedia(matches: boolean): MatchMediaStub {
  const listeners = new Set<MediaListener>();
  const stub: MatchMediaStub = {
    matches,
    media: NARROW_MEDIA_QUERY,
    listeners,
    addEventListener: vi.fn((_type: string, listener: MediaListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: MediaListener) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    setMatches(next: boolean): void {
      stub.matches = next;
      for (const listener of listeners) {
        listener();
      }
    },
  };
  vi.stubGlobal("matchMedia", (query: string): MatchMediaStub => {
    stub.media = query;
    return stub;
  });
  return stub;
}

function makeCtx(search: string = POST_SEARCH): FeatureContext {
  return {
    pageKind: "post",
    search,
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
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

function buildStats(options?: {
  postId?: string | undefined;
  score?: string | undefined;
  includeSource?: boolean | undefined;
  includeICame?: boolean | undefined;
  iCameCount?: string | null | undefined;
}): HTMLDivElement {
  const postId = options?.postId ?? POST_ID;
  const stats = document.createElement("div");
  stats.id = "stats";
  const heading = document.createElement("h5");
  heading.textContent = "Statistics";
  const ul = document.createElement("ul");

  const idLi = document.createElement("li");
  idLi.append(`Id: ${postId}`);
  ul.append(idLi);

  const postedLi = document.createElement("li");
  postedLi.append("Posted: 2026-11-12 19:22");
  postedLi.append(document.createElement("br"));
  postedLi.append(" by ");
  const author = document.createElement("a");
  author.href = "index.php?page=account&s=profile&id=1";
  author.textContent = "kaxaqq";
  postedLi.append(author);
  ul.append(postedLi);

  const sizeLi = document.createElement("li");
  sizeLi.append("Size: 1344x1728");
  ul.append(sizeLi);

  if (options?.includeSource !== false) {
    const sourceLi = document.createElement("li");
    sourceLi.append("Source: ");
    const source = document.createElement("a");
    source.href = SOURCE_HREF;
    source.rel = "nofollow";
    source.textContent = SOURCE_HREF;
    sourceLi.append(source);
    ul.append(sourceLi);
  }

  const ratingLi = document.createElement("li");
  ratingLi.append("Rating: Explicit");
  ul.append(ratingLi);

  const scoreLi = document.createElement("li");
  scoreLi.append("Score: ");
  const span = document.createElement("span");
  span.id = `psc${postId}`;
  span.textContent = options?.score ?? "14";
  scoreLi.append(span);
  scoreLi.append(" (vote ");
  const voteUp = document.createElement("a");
  voteUp.href = "#";
  voteUp.setAttribute("onclick", `post_vote('${postId}','up')`);
  voteUp.textContent = "up";
  scoreLi.append(voteUp);
  scoreLi.append(")");
  ul.append(scoreLi);

  if (options?.includeICame === true) {
    const cameLi = document.createElement("li");
    const came = document.createElement("a");
    came.href = "#";
    came.setAttribute("onclick", `iCame('${postId}'); return false;`);
    const img = document.createElement("img");
    img.alt = "I came!";
    img.src = "came.png";
    came.append(img);
    cameLi.append(came);
    if (options.iCameCount !== null && options.iCameCount !== undefined) {
      const count = document.createElement("span");
      count.textContent = options.iCameCount;
      cameLi.append(count);
    }
    ul.append(cameLi);
  }

  stats.append(heading, ul);
  return stats;
}

function buildLinkList(options: {
  originalHref?: string | null | undefined;
  omitLinkTexts?: readonly string[] | undefined;
  extraLinks?: Array<{ text: string; href: string }> | undefined;
}): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "link-list";
  const ul = document.createElement("ul");
  const omit = new Set(options.omitLinkTexts ?? []);

  const defaults: Array<{ text: string; href: string }> = [
    { text: "Edit", href: "index.php?page=post&s=edit&id=42" },
    { text: "Resize image", href: "#" },
  ];
  if (options.originalHref !== null && options.originalHref !== undefined) {
    defaults.push({ text: "Original image", href: options.originalHref });
  } else if (options.originalHref === undefined) {
    defaults.push({ text: "Original image", href: ORIGINAL_HREF });
  }
  defaults.push(
    { text: "Report to moderation", href: "#" },
    { text: "Add Note", href: "#" },
    { text: "Add to favorites", href: "#" },
  );
  for (const extra of options.extraLinks ?? []) {
    defaults.push(extra);
  }

  for (const entry of defaults) {
    if (
      options.originalHref === null &&
      entry.text === "Original image"
    ) {
      continue;
    }
    if (omit.has(entry.text)) {
      continue;
    }
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = entry.href;
    link.textContent = entry.text;
    li.append(link);
    ul.append(li);
  }

  wrap.append(ul);
  return wrap;
}

function buildPostComments(): HTMLDivElement {
  const comments = document.createElement("div");
  comments.id = POST_COMMENTS_ID;
  const list = document.createElement("div");
  list.id = "comment-list";
  const countText = document.createTextNode("1 comment");
  const ci = document.createElement("a");
  ci.id = "ci";
  ci.href = "#";
  const sort = document.createElement("div");
  sort.append("Sorting ");
  const change = document.createElement("a");
  change.href = "#";
  change.textContent = "Change";
  sort.append(change);
  const row = document.createElement("div");
  row.id = "c99";
  const col1 = document.createElement("div");
  col1.className = "col1";
  col1.append("author · date ");
  const score = document.createElement("a");
  score.id = "sc99";
  score.href = "#";
  score.setAttribute("onclick", "vote('99','up')");
  score.textContent = "0";
  const reply = document.createElement("a");
  reply.id = "rcl99";
  reply.href = "#";
  reply.textContent = "Reply";
  col1.append(score, reply);
  row.append(col1);
  list.append(countText, ci, sort, row);
  comments.append(list);
  return comments;
}

function buildPostDom(options?: {
  score?: string;
  originalHref?: string | null;
  includeSource?: boolean;
  includeICame?: boolean;
  iCameCount?: string | null;
  media?: "image" | "video";
  includeFlexi?: boolean;
  includeHeader?: boolean;
  includeComments?: boolean;
  omitLinkTexts?: readonly string[];
}): {
  flexi: HTMLElement | null;
  mediaWrap: HTMLElement | null;
  comments: HTMLElement | null;
} {
  if (options?.includeHeader !== false) {
    const header = document.createElement("div");
    header.id = "header";
    header.style.height = "40px";
    document.body.append(header);
  }

  const postView = document.createElement("div");
  postView.id = "post-view";

  const sidebar = document.createElement("div");
  sidebar.className = "sidebar";
  sidebar.append(
    buildStats({
      score: options?.score,
      includeSource: options?.includeSource,
      includeICame: options?.includeICame,
      iCameCount: options?.iCameCount,
    }),
  );
  sidebar.append(
    buildLinkList({
      originalHref: options?.originalHref,
      omitLinkTexts: options?.omitLinkTexts,
    }),
  );
  postView.append(sidebar);

  let flexi: HTMLElement | null = null;
  let mediaWrap: HTMLElement | null = null;
  if (options?.includeFlexi !== false) {
    const rightCol = document.createElement("div");
    rightCol.id = "right-col";
    const fit = document.createElement("div");
    fit.id = "fit-to-screen";
    flexi = document.createElement("div");
    flexi.className = "flexi";
    mediaWrap = document.createElement("div");
    if (options?.media === "video") {
      const video = document.createElement("video");
      video.src = "clip.mp4";
      mediaWrap.append(video);
    } else {
      const img = document.createElement("img");
      img.id = "image";
      img.src = "preview.jpg";
      mediaWrap.append(img);
    }
    flexi.append(mediaWrap);
    fit.append(flexi);
    rightCol.append(fit);
    postView.append(rightCol);
  }

  let comments: HTMLElement | null = null;
  if (options?.includeComments === true) {
    comments = buildPostComments();
    postView.append(comments);
  }

  document.body.append(postView);
  return { flexi, mediaWrap, comments };
}

function actionsPanel(): HTMLElement | null {
  return document.getElementById(POST_ACTIONS_ID);
}

describe("postActionsFeature", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.body.className = "";
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for post page", () => {
    expect(postActionsFeature.id).toBe("post-actions");
    expect(postActionsFeature.pages).toEqual(["post"]);
    expect(postActionsFeature.defaultEnabled).toBe(true);
    expect(postActionsFeature.label).toBe("Post side panel");
  });

  it("scopes every css rule under body.rdw-f-post-actions", () => {
    const bodyClass = featureBodyClass("post-actions");
    expect(bodyClass).toBe("rdw-f-post-actions");
    const rules = postActionsFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(
        selector.startsWith(`body.${bodyClass}`) ||
          selector.startsWith("@media"),
      ).toBe(true);
    }
  });

  it("inserts 360px panel into div.flexi next to media wrapper", () => {
    const { flexi, mediaWrap } = buildPostDom();
    postActionsFeature.mount(makeCtx());
    const panel = actionsPanel();
    expect(panel).not.toBeNull();
    expect(panel?.parentElement).toBe(flexi);
    expect(mediaWrap?.nextElementSibling).toBe(panel);
    expect(panel?.classList.contains(CLASS_PANEL)).toBe(true);
    expect(panel?.classList.contains(CLASS_MODE_WIDE)).toBe(true);
    expect(document.body.classList.contains(POST_PANEL_MOUNTED_CLASS)).toBe(
      true,
    );
    expect(postActionsFeature.css).toContain(PANEL_WIDTH_TOKEN);
    expect(postActionsFeature.css).toContain(PANEL_MIN_WIDTH_TOKEN);
    expect(postActionsFeature.css).toContain(PANEL_MAX_WIDTH_TOKEN);
    expect(postActionsFeature.css).toContain(PANEL_FONT_TOKEN);
    expect(postActionsFeature.css).toContain(PANEL_BUTTON_HEIGHT_TOKEN);
    expect(postActionsFeature.css).toContain(PANEL_BUTTON_GAP_TOKEN);
    expect(postActionsFeature.css).toContain(PANEL_BLOCK_GAP_TOKEN);
    expect(postActionsFeature.css).toContain(ORIGINAL_SIZE_TOKEN);
    expect(postActionsFeature.css).not.toContain("220px");
    expect(postActionsFeature.css).not.toContain("36px");
  });

  it("uses sticky max-height and overflow only in wide mode", () => {
    expect(postActionsFeature.css).toMatch(
      /\.rdw-post-actions--wide\s*\{[^}]*max-height:\s*calc\(100vh/,
    );
    expect(postActionsFeature.css).toMatch(
      /\.rdw-post-actions--wide\s*\{[^}]*overflow-y:\s*auto/,
    );
    expect(postActionsFeature.css).toMatch(
      /\.rdw-post-actions--narrow\s*\{[^}]*overflow-y:\s*visible/,
    );
    expect(postActionsFeature.css).toMatch(
      /\.rdw-post-actions--narrow\s*\{[^}]*max-height:\s*none/,
    );
  });

  it("anchors video posts on the player wrapper inside flexi", () => {
    const { flexi, mediaWrap } = buildPostDom({ media: "video" });
    expect(mediaWrap?.querySelector("video")).not.toBeNull();
    expect(mediaWrap?.querySelector("#image")).toBeNull();
    postActionsFeature.mount(makeCtx());
    const panel = actionsPanel();
    expect(panel?.parentElement).toBe(flexi);
    expect(mediaWrap?.nextElementSibling).toBe(panel);
  });

  it("uses narrow full-width flow under media below 1100px", () => {
    stubMatchMedia(true);
    const { flexi, mediaWrap } = buildPostDom();
    postActionsFeature.mount(makeCtx());
    const panel = actionsPanel();
    expect(panel?.parentElement).toBe(flexi);
    expect(mediaWrap?.nextElementSibling).toBe(panel);
    expect(panel?.classList.contains(CLASS_MODE_NARROW)).toBe(true);
    expect(panel?.classList.contains(CLASS_MODE_WIDE)).toBe(false);
  });

  it("toggles wide/narrow classes when viewport mode changes", () => {
    const media = stubMatchMedia(false);
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    const panel = actionsPanel();
    expect(panel?.classList.contains(CLASS_MODE_WIDE)).toBe(true);

    media.setMatches(true);
    expect(panel?.classList.contains(CLASS_MODE_NARROW)).toBe(true);

    media.setMatches(false);
    expect(panel?.classList.contains(CLASS_MODE_WIDE)).toBe(true);
  });

  it("does not mount when div.flexi is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildPostDom({ includeFlexi: false });
    postActionsFeature.mount(makeCtx());
    expect(actionsPanel()).toBeNull();
    expect(document.body.classList.contains(POST_PANEL_MOUNTED_CLASS)).toBe(
      false,
    );
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("shows Favorite label and reflects isFav initial state", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    const button = document.querySelector(`.${CLASS_FAV}`);
    expect(button?.textContent).toContain(TEXT_FAVORITE);

    document.body.replaceChildren();
    addFav(POST_ID);
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    expect(document.querySelector(`.${CLASS_FAV}`)?.textContent).toContain(
      TEXT_IN_FAVORITES,
    );
  });

  it("does not render Follow buttons or inline playlist new field", () => {
    buildPostDom();
    createPlaylist("Wallpapers");
    postActionsFeature.mount(makeCtx());
    expect(document.querySelectorAll(`button.${CLASS_FOLLOW}`)).toHaveLength(0);
    expect(
      document.querySelector(`button.${CSS_CLASS.artistFollow}`),
    ).toBeNull();
    expect(
      document.querySelector(".rdw-playlist-menu, .rdw-playlist-menu-new"),
    ).toBeNull();
    expect(document.querySelector(`.${CLASS_COLLECTIONS_BTN}`)).not.toBeNull();
  });

  it("opens Collections popover with checkmarks, counts, and the new-name row", async () => {
    buildPostDom();
    const existing = createPlaylist("Best of nyx");
    createPlaylist("Wallpapers");
    postActionsFeature.mount(makeCtx());

    document.querySelector(`.${CLASS_COLLECTIONS_BTN}`)?.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    await vi.waitFor(() => {
      expect(
        document.querySelector('[role="dialog"][aria-label="Custom collections"]'),
      ).not.toBeNull();
    });

    const items = [
      ...document.querySelectorAll(
        '[role="menuitemcheckbox"]',
      ),
    ];
    expect(items.map((node) => node.textContent)).toEqual(
      expect.arrayContaining(["Best of nyx0", "Wallpapers0"]),
    );
    expect(
      items.find((node) => node.textContent?.includes("Best of nyx"))
        ?.getAttribute("aria-checked"),
    ).toBe("false");

    items
      .find((node) => node.textContent?.includes(existing.name))
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    await vi.waitFor(() => {
      const refreshed = [
        ...document.querySelectorAll('[role="menuitemcheckbox"]'),
      ].find((node) => node.textContent?.includes(existing.name));
      expect(refreshed?.getAttribute("aria-checked")).toBe("true");
    });

    expect(
      document.querySelector('input[aria-label="New collection name"]'),
    ).toBeInstanceOf(HTMLInputElement);
    expect(
      [...document.querySelectorAll('[role="menuitemcheckbox"]')]
        .find((node) => node.textContent?.includes(existing.name))
        ?.textContent,
    ).toBe("Best of nyx1");
  });

  it("renders icon-only Original with aria-label and title", () => {
    buildPostDom({ originalHref: "https://example.com/full.png" });
    postActionsFeature.mount(makeCtx());
    const link = document.querySelector(`a.${CLASS_ORIGINAL}`);
    expect(link).not.toBeNull();
    expect(link?.getAttribute("aria-label")).toBe(TEXT_ORIGINAL);
    expect(link?.getAttribute("title")).toBe(TEXT_ORIGINAL);
    expect(link?.textContent?.trim().length ?? 0).toBe(0);
    expect(link?.querySelector("svg")).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("https://example.com/full.png");
  });

  it("omits Original when Original image link is absent", () => {
    buildPostDom({ originalHref: null });
    postActionsFeature.mount(makeCtx());
    expect(document.querySelector(`a.${CLASS_ORIGINAL}`)).toBeNull();
  });

  it("shows Vote N from span#psc{ID} and syncs via MutationObserver", async () => {
    buildPostDom({ score: "14" });
    act(() => {
      postActionsFeature.mount(makeCtx());
    });
    expect(document.querySelector(`.${CLASS_VOTE}`)?.textContent).toContain(
      `${TEXT_VOTE_PREFIX} 14`,
    );

    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    const span = document.getElementById(`psc${POST_ID}`);
    expect(span).not.toBeNull();
    await act(async () => {
      if (span !== null) {
        span.textContent = "99";
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });
    expect(document.querySelector(`.${CLASS_VOTE}`)?.textContent).toContain(
      `${TEXT_VOTE_PREFIX} 99`,
    );
  });

  it("vote up updates Vote N label and #psc{ID}", async () => {
    buildPostDom({ score: "14" });
    let resolveVote:
      | ((value: {
          ok: boolean;
          status: number;
          text: () => Promise<string>;
        }) => void)
      | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<{
          ok: boolean;
          status: number;
          text: () => Promise<string>;
        }>((resolve) => {
          resolveVote = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    postActionsFeature.mount(makeCtx());

    const vote = document.querySelector(`.${CLASS_VOTE}`);
    expect(vote).toBeInstanceOf(HTMLButtonElement);
    if (!(vote instanceof HTMLButtonElement)) {
      return;
    }
    vote.click();
    resolveVote?.({
      ok: true,
      status: 200,
      text: async () => "21",
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`.${CLASS_VOTE}`)?.textContent).toContain(
        `${TEXT_VOTE_PREFIX} 21`,
      );
    });
    expect(document.getElementById(`psc${POST_ID}`)?.textContent).toBe("21");
  });

  it("updates Vote N after successful favorite add with score", async () => {
    buildPostDom({ score: "14" });
    mockFetchSequence([{ body: ADDFAV_RESPONSE_ADDED }, { body: "21" }]);
    postActionsFeature.mount(makeCtx());

    const button = document.querySelector(`.${CLASS_FAV}`);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    button.click();
    await vi.waitFor(() => {
      expect(isFav(POST_ID)).toBe(true);
    });
    expect(document.querySelector(`.${CLASS_FAV}`)?.textContent).toContain(
      TEXT_IN_FAVORITES,
    );
    expect(document.querySelector(`.${CLASS_VOTE}`)?.textContent).toContain(
      `${TEXT_VOTE_PREFIX} 21`,
    );
  });

  it("parses stats into Id/Posted/By/Size/Source/Rating rows", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    const stats = document.querySelector(`.${CLASS_STATS}`);
    expect(stats?.textContent).toContain("Id");
    expect(stats?.textContent).toContain(POST_ID);
    expect(stats?.textContent).toContain("Posted");
    expect(stats?.textContent).toContain("2026-11-12 19:22");
    expect(stats?.textContent).toContain("By");
    expect(stats?.textContent).toContain("kaxaqq");
    expect(stats?.textContent).toContain("Size");
    expect(stats?.textContent).toContain("1344x1728");
    expect(stats?.textContent).toContain("Rating");
    expect(stats?.textContent).toContain("Explicit");
    const source = document.querySelector(`a.${CLASS_SOURCE}`);
    expect(source?.getAttribute("href")).toBe(SOURCE_HREF);
    expect(source?.getAttribute("title")).toBe(SOURCE_HREF);
    expect(source?.getAttribute("rel")).toBe("nofollow noreferrer");
    expect(source?.hasAttribute("target")).toBe(false);
  });

  it("omits Source row when site Source li is absent", () => {
    buildPostDom({ includeSource: false });
    postActionsFeature.mount(makeCtx());
    expect(document.querySelector(`a.${CLASS_SOURCE}`)).toBeNull();
    expect(
      document.querySelector(`.${CLASS_STATS}`)?.textContent,
    ).not.toContain("Source");
  });

  it("uses frameless actions plus one Info card with left-aligned site actions", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    const panel = actionsPanel();
    expect(panel?.querySelector(`.${CLASS_ACTIONS}`)).not.toBeNull();
    expect(panel?.querySelector(`.${CLASS_ACTIONS}`)?.closest(`.${CLASS_CARD}`)).toBeNull();
    expect(panel?.querySelectorAll(`.${CLASS_CARD}`)).toHaveLength(1);
    expect(panel?.textContent).toContain(TEXT_POST);
    expect(document.querySelector(`.${CLASS_MORE_BTN}`)).toBeNull();
    expect(
      document.querySelector('[role="dialog"][aria-label="More post actions"]'),
    ).toBeNull();

    const labels = [
      ...document.querySelectorAll(`button.${CLASS_POST_ACTION_BTN}`),
    ].map((node) => node.textContent?.replace(/\s+/g, " ").trim());
    expect(labels).toEqual([
      DISPLAY_EDIT,
      DISPLAY_RESIZE,
      LABEL_REPORT,
      DISPLAY_ADD_NOTE,
    ]);
    for (const btn of document.querySelectorAll(
      `button.${CLASS_POST_ACTION_BTN}`,
    )) {
      expect(btn.querySelector("svg")).not.toBeNull();
    }
  });

  it("proxies open post-action buttons via native click", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());

    const editNative = [...document.querySelectorAll("div.link-list a")].find(
      (node) => node.textContent?.trim() === "Edit",
    );
    expect(editNative).toBeInstanceOf(HTMLAnchorElement);
    if (!(editNative instanceof HTMLAnchorElement)) {
      return;
    }
    const clickSpy = vi.spyOn(editNative, "click");
    const editButton = [
      ...document.querySelectorAll(`button.${CLASS_POST_ACTION_BTN}`),
    ].find((node) => node.textContent?.includes(DISPLAY_EDIT));
    editButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("omits Resize image button when the native link is absent", () => {
    buildPostDom({
      media: "video",
      omitLinkTexts: ["Resize image"],
    });
    postActionsFeature.mount(makeCtx());
    const labels = [
      ...document.querySelectorAll(`button.${CLASS_POST_ACTION_BTN}`),
    ].map((node) => node.textContent?.replace(/\s+/g, " ").trim());
    expect(labels).toEqual([DISPLAY_EDIT, LABEL_REPORT, DISPLAY_ADD_NOTE]);
    expect(labels).not.toContain(DISPLAY_RESIZE);
  });

  it("places Vote and I came in the frameless actions block", () => {
    buildPostDom({ includeICame: true, iCameCount: "7" });
    postActionsFeature.mount(makeCtx());
    const vote = document.querySelector(`.${CLASS_VOTE}`);
    const icame = document.querySelector(`.${CLASS_ICAME}`);
    const actions = document.querySelector(`.${CLASS_ACTIONS}`);
    expect(vote).not.toBeNull();
    expect(icame).not.toBeNull();
    expect(actions?.contains(vote)).toBe(true);
    expect(actions?.contains(icame)).toBe(true);
    expect(vote?.closest(`.${CLASS_CARD}`)).toBeNull();
  });

  it("renders I came without a count badge and warns when counter markup is missing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildPostDom({ includeICame: true });
    postActionsFeature.mount(makeCtx());
    const button = document.querySelector(`.${CLASS_ICAME}`);
    expect(button?.textContent).toContain(TEXT_ICAME);
    expect(button?.querySelector("svg")).not.toBeNull();
    await vi.waitFor(() => {
      expect(
        warnSpy.mock.calls.some((call) =>
          String(call[0]).includes("нужна разметка"),
        ),
      ).toBe(true);
    });
    warnSpy.mockRestore();
  });

  it("proxies I came click to native a[onclick^=iCame(]", () => {
    buildPostDom({ includeICame: true });
    postActionsFeature.mount(makeCtx());
    const native = document.querySelector('a[onclick^="iCame("]');
    expect(native).toBeInstanceOf(HTMLAnchorElement);
    if (!(native instanceof HTMLAnchorElement)) {
      return;
    }
    // Avoid invoking the site inline handler (iCame is not defined in jsdom).
    const spy = vi.spyOn(native, "click").mockImplementation(() => {});
    document
      .querySelector(`.${CLASS_ICAME}`)
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("moves native #post-comments into Comments tabpanel without cloning", () => {
    const { comments } = buildPostDom({ includeComments: true });
    expect(comments).not.toBeNull();
    if (comments === null) {
      return;
    }
    const list = comments.querySelector("#comment-list");
    postActionsFeature.mount(makeCtx());

    const host = document.querySelector(`.${CLASS_COMMENTS_HOST}`);
    const commentsTab = document.getElementById(
      kitTabId(POST_PANEL_TAB_COMMENTS),
    );
    expect(commentsTab?.textContent).toBe(`${TEXT_COMMENTS} · 1`);
    expect(document.querySelector(`.${CLASS_TABS}`)).not.toBeNull();
    expect(host?.contains(comments)).toBe(true);
    expect(document.querySelectorAll(`#${POST_COMMENTS_ID}`)).toHaveLength(1);
    expect(comments.querySelector("#comment-list")).toBe(list);
    expect(document.getElementById("post-view")?.contains(comments)).toBe(
      true,
    );
  });

  it("restores #post-comments to the page on remount cleanup", () => {
    const { comments } = buildPostDom({ includeComments: true });
    expect(comments).not.toBeNull();
    if (comments === null) {
      return;
    }
    const postView = document.getElementById("post-view");
    postActionsFeature.mount(makeCtx());
    expect(
      document.querySelector(`.${CLASS_COMMENTS_HOST}`)?.contains(comments),
    ).toBe(true);

    postActionsFeature.mount(makeCtx());
    expect(document.querySelectorAll(`#${POST_COMMENTS_ID}`)).toHaveLength(1);
    expect(
      document.querySelector(`.${CLASS_COMMENTS_HOST}`)?.contains(comments),
    ).toBe(true);
    expect(postView?.contains(document.getElementById(POST_ACTIONS_ID))).toBe(
      true,
    );
  });

  it("survives missing stats and links without throwing", () => {
    const header = document.createElement("div");
    header.id = "header";
    const postView = document.createElement("div");
    postView.id = "post-view";
    const rightCol = document.createElement("div");
    rightCol.id = "right-col";
    const fit = document.createElement("div");
    fit.id = "fit-to-screen";
    const flexi = document.createElement("div");
    flexi.className = "flexi";
    const media = document.createElement("div");
    const img = document.createElement("img");
    img.id = "image";
    media.append(img);
    flexi.append(media);
    fit.append(flexi);
    rightCol.append(fit);
    postView.append(rightCol);
    document.body.append(header, postView);

    expect(() => {
      postActionsFeature.mount(makeCtx());
    }).not.toThrow();
    const panel = actionsPanel();
    expect(panel).not.toBeNull();
    expect(panel?.querySelector(`.${CLASS_FAV}`)).not.toBeNull();
    expect(panel?.querySelector(`.${CLASS_VOTE}`)?.textContent).toContain(
      `${TEXT_VOTE_PREFIX} ${TEXT_SCORE_UNKNOWN}`,
    );
    expect(panel?.querySelector(`a.${CLASS_ORIGINAL}`)).toBeNull();
    expect(panel?.querySelector(`.${CLASS_CARD}`)).toBeNull();
  });

  it("Favorite stays primary with accent fill in both states", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    expect(
      document.querySelector(`.${CLASS_FAV}`)?.classList.contains("rdw-btn--primary"),
    ).toBe(true);

    document.body.replaceChildren();
    addFav(POST_ID);
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    expect(
      document.querySelector(`.${CLASS_FAV}`)?.classList.contains("rdw-btn--primary"),
    ).toBe(true);
    expect(document.querySelector(`.${CLASS_FAV}`)?.textContent).toContain(
      TEXT_IN_FAVORITES,
    );
  });

  it("labels Comments tab with count from #comment-list and falls back without it", () => {
    buildPostDom({ includeComments: true });
    postActionsFeature.mount(makeCtx());
    expect(
      document.getElementById(kitTabId(POST_PANEL_TAB_COMMENTS))?.textContent,
    ).toBe(`${TEXT_COMMENTS} · 1`);

    document.body.replaceChildren();
    const { comments } = buildPostDom({ includeComments: true });
    const list = comments?.querySelector("#comment-list");
    if (list !== null && list !== undefined) {
      list.replaceChildren();
      list.append("No count here");
    }
    postActionsFeature.mount(makeCtx());
    expect(
      document.getElementById(kitTabId(POST_PANEL_TAB_COMMENTS))?.textContent,
    ).toBe(TEXT_COMMENTS);
  });

  it("opens Info on every post and does not persist the tab", async () => {
    buildPostDom({ includeComments: true });
    postActionsFeature.mount(makeCtx());

    const infoPanel = document.getElementById(
      kitTabPanelId(POST_PANEL_TAB_INFO),
    );
    const commentsPanel = document.getElementById(
      kitTabPanelId(POST_PANEL_TAB_COMMENTS),
    );
    expect(infoPanel?.hasAttribute("hidden")).toBe(false);
    expect(commentsPanel?.hasAttribute("hidden")).toBe(true);
    expect(document.querySelector(`.${CLASS_TAB_PANEL}`)).not.toBeNull();
    expect(document.querySelector(`[role="tablist"].${CLASS_TABS}`)).not.toBeNull();
    expect(
      document.getElementById(kitTabId(POST_PANEL_TAB_INFO))?.textContent,
    ).toBe(TEXT_INFO);

    document
      .getElementById(kitTabId(POST_PANEL_TAB_COMMENTS))
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    await vi.waitFor(() => {
      expect(commentsPanel?.hasAttribute("hidden")).toBe(false);
    });
    expect(infoPanel?.hasAttribute("hidden")).toBe(true);
    expect(getFeatureChoiceValue(POST_PANEL_TAB_CHOICE_ID)).toBeUndefined();

    document.body.replaceChildren();
    buildPostDom({ includeComments: true });
    postActionsFeature.mount(makeCtx());
    expect(
      document
        .getElementById(kitTabPanelId(POST_PANEL_TAB_INFO))
        ?.hasAttribute("hidden"),
    ).toBe(false);
    expect(
      document
        .getElementById(kitTabPanelId(POST_PANEL_TAB_COMMENTS))
        ?.hasAttribute("hidden"),
    ).toBe(true);
    expect(getFeatureChoiceValue(POST_PANEL_TAB_CHOICE_ID)).toBeUndefined();
  });

  it("replaces an existing panel on remount", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    postActionsFeature.mount(makeCtx());
    expect(document.querySelectorAll(`#${POST_ACTIONS_ID}`)).toHaveLength(1);
  });
});
