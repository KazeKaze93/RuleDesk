import {
  CSS_CLASS,
  SEARCH_PARAM_PID,
  SEARCH_PARAM_TAGS,
  TAG_SEPARATOR,
  UI_TEXT,
  UPDATES_BAR_ID,
  UPDATES_ID_PREFIX,
} from "../config/constants";
import { log } from "../log";
import {
  buildUpdatesSearchUrl,
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
  stripUpdatesIdFilter,
} from "../search/query";
import { detectPageKind } from "../site/pages";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import {
  readArtistsMirror,
  writeArtistsMirror,
} from "../storage/artists-mirror";
import {
  getSeenPostId,
  listArtistTags,
  loadRecent,
  setSeenPostId,
} from "../storage/store";
import { ensureDocumentStyles } from "./cards";

/** Keep in sync with `FEED_NEW_CLASS` in features/feed.ts. */
const FEED_NEW_CLASS = "new";

const ID_FILTER_PATTERN = /^id:>(\d+)$/;

const TEXT_NEW_SUFFIX = " new";
const TEXT_MARKED_SEEN_PREFIX = "Marked as seen up to #";
const TEXT_ONLY_NEW = "Only new";
const TEXT_SHOW_ALL = "Show all";

/**
 * Followed artists for feed-bar recognition.
 * Mirror first — GM_getValue on bfcache pages can be a frozen snapshot.
 */
function resolveFollowedArtistTags(): string[] {
  const mirrored = readArtistsMirror();
  if (mirrored !== null && mirrored.length > 0) {
    return [...mirrored];
  }
  return listArtistTags();
}

/**
 * store load syncs the mirror from GM; restore a non-empty pre-read mirror so a
 * bfcache-stale GM snapshot cannot wipe tags followed on another page.
 */
function reloadStoragePreservingArtistsMirror(): void {
  const mirrored = readArtistsMirror();
  loadRecent();
  if (mirrored !== null && mirrored.length > 0) {
    writeArtistsMirror(mirrored);
  }
}

function readPid(search: string): number {
  const params = new URLSearchParams(search);
  const raw = params.get(SEARCH_PARAM_PID);
  if (raw === null || raw.trim().length === 0) {
    return 0;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function maxThumbPostId(root: ParentNode): number {
  let maxId = 0;
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    const numeric = Number(postId);
    if (Number.isFinite(numeric) && numeric > maxId) {
      maxId = numeric;
    }
  }
  return maxId;
}

function countNewThumbs(root: ParentNode, seenPostId: number): number {
  let count = 0;
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    const numeric = Number(postId);
    if (Number.isFinite(numeric) && numeric > seenPostId) {
      count += 1;
    }
  }
  return count;
}

function tagsHaveIdFilter(tagsParam: string): boolean {
  const tokens = tagsParam
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  const last = tokens[tokens.length - 1];
  return last !== undefined && ID_FILTER_PATTERN.test(last);
}

function removeExistingBar(root: ParentNode): void {
  const existing =
    root instanceof Document
      ? root.getElementById(UPDATES_BAR_ID)
      : root.querySelector(`#${UPDATES_BAR_ID}`);
  if (existing !== null) {
    existing.remove();
  }
}

function createBarShell(): HTMLDivElement {
  const bar = document.createElement("div");
  bar.id = UPDATES_BAR_ID;
  bar.className = CSS_CLASS.updatesBar;
  return bar;
}

function insertBeforeImageList(imageList: Element, bar: HTMLElement): void {
  imageList.parentElement?.insertBefore(bar, imageList);
}

function findEmptyUpdatesHost(root: ParentNode): Element | null {
  return (
    root.querySelector(SITE_SELECTORS.postListContent) ??
    root.querySelector(SITE_SELECTORS.contentRoot)
  );
}

function clearNewHighlights(root: ParentNode): void {
  const thumbs = root.querySelectorAll(
    `${SITE_SELECTORS.thumb}.${FEED_NEW_CLASS}`,
  );
  for (const thumb of thumbs) {
    thumb.classList.remove(FEED_NEW_CLASS);
  }
}

function createToggleLink(
  tagsParam: string,
  seenPostId: number,
): HTMLAnchorElement | null {
  if (tagsHaveIdFilter(tagsParam)) {
    const link = document.createElement("a");
    link.className = CSS_CLASS.secondaryButton;
    link.href = buildUpdatesSearchUrl(stripUpdatesIdFilter(tagsParam));
    link.textContent = TEXT_SHOW_ALL;
    return link;
  }
  if (seenPostId === 0) {
    return null;
  }
  const base = stripUpdatesIdFilter(tagsParam);
  const onlyNewQuery = `${base}${TAG_SEPARATOR}${UPDATES_ID_PREFIX}${String(seenPostId)}`;
  const link = document.createElement("a");
  link.className = CSS_CLASS.secondaryButton;
  link.href = buildUpdatesSearchUrl(onlyNewQuery);
  link.textContent = TEXT_ONLY_NEW;
  return link;
}

function appendToggle(
  parent: Element,
  tagsParam: string,
  seenPostId: number,
): void {
  const toggle = createToggleLink(tagsParam, seenPostId);
  if (toggle !== null) {
    parent.append(toggle);
  }
}

function mountEmptyPageBar(root: ParentNode, tagsParam: string): void {
  const host = findEmptyUpdatesHost(root);
  if (host === null) {
    log.warn(UI_TEXT.updatesBarMissingHost);
    return;
  }

  const bar = createBarShell();
  const seen = getSeenPostId();

  const text = document.createElement("p");
  text.className = CSS_CLASS.hint;
  text.textContent = `${UI_TEXT.noNewPostsSince}${String(seen)}`;

  const showAll = document.createElement("a");
  showAll.className = CSS_CLASS.secondaryButton;
  showAll.href = buildUpdatesSearchUrl(stripUpdatesIdFilter(tagsParam));
  showAll.textContent = TEXT_SHOW_ALL;

  const wrap = document.createElement("div");
  wrap.className = CSS_CLASS.updatesBarActions;
  wrap.append(text, showAll);
  bar.append(wrap);

  host.insertBefore(bar, host.firstChild);
}

function mountPartialBar(imageList: Element): void {
  const bar = createBarShell();
  const hint = document.createElement("p");
  hint.className = CSS_CLASS.hint;
  hint.textContent = UI_TEXT.updatesPartialHint;
  bar.append(hint);
  insertBeforeImageList(imageList, bar);
}

function mountFullBar(
  imageList: Element,
  search: string,
  tagsParam: string,
  merged: boolean,
): void {
  const bar = createBarShell();
  const seen = getSeenPostId();
  const pid = readPid(search);

  if (pid > 0) {
    const hint = document.createElement("p");
    hint.className = CSS_CLASS.hint;
    hint.textContent = UI_TEXT.goToPageOneToMark;
    bar.append(hint);
    insertBeforeImageList(imageList, bar);
    return;
  }

  const newCount = countNewThumbs(imageList, seen);
  const actions = document.createElement("div");
  actions.className = CSS_CLASS.updatesBarActions;

  if (newCount === 0) {
    const hint = document.createElement("p");
    hint.className = CSS_CLASS.hint;
    hint.textContent = `${UI_TEXT.noNewPostsSince}${String(seen)}`;
    actions.append(hint);
    if (!merged) {
      appendToggle(actions, tagsParam, seen);
    }
    bar.append(actions);
    insertBeforeImageList(imageList, bar);
    return;
  }

  const summary = document.createElement("p");
  summary.className = CSS_CLASS.hint;
  summary.textContent = `${String(newCount)}${TEXT_NEW_SUFFIX}`;

  const markButton = document.createElement("button");
  markButton.type = "button";
  markButton.className = CSS_CLASS.primaryButton;
  markButton.textContent = UI_TEXT.markAllSeen;
  markButton.addEventListener("click", () => {
    const nextSeen = Math.max(getSeenPostId(), maxThumbPostId(imageList));
    setSeenPostId(nextSeen);
    clearNewHighlights(document);

    bar.replaceChildren();
    const confirm = document.createElement("p");
    confirm.className = CSS_CLASS.hint;
    confirm.textContent = `${TEXT_MARKED_SEEN_PREFIX}${String(nextSeen)}`;

    const wrap = document.createElement("div");
    wrap.className = CSS_CLASS.updatesBarActions;
    wrap.append(confirm);
    if (!merged) {
      appendToggle(wrap, tagsParam, nextSeen);
    }
    bar.append(wrap);
  });

  actions.append(summary, markButton);
  // "Only new" is one search with an id filter; a merged feed is several.
  if (!merged) {
    appendToggle(actions, tagsParam, seen);
  }
  bar.append(actions);
  insertBeforeImageList(imageList, bar);
}

export type UpdatesBarOptions = {
  /** The page is the merged feed of several artist groups: always the full bar. */
  readonly merged?: boolean;
};

export function mountUpdatesBar(
  root: ParentNode = document,
  search: string = window.location.search,
  options: UpdatesBarOptions = {},
): void {
  if (detectPageKind(search) !== "list") {
    return;
  }

  const params = new URLSearchParams(search);
  const tagsParam = params.get(SEARCH_PARAM_TAGS);
  if (tagsParam === null || tagsParam.trim().length === 0) {
    return;
  }

  const artistTags = resolveFollowedArtistTags();
  reloadStoragePreservingArtistsMirror();
  const merged = options.merged === true;
  const isFull = merged || isFullUpdatesQuery(tagsParam, artistTags);
  const isPartial = !merged && isPartialUpdatesQuery(tagsParam, artistTags);
  if (!isFull && !isPartial) {
    removeExistingBar(root);
    return;
  }

  removeExistingBar(root);
  ensureDocumentStyles();

  const imageList = root.querySelector(SITE_SELECTORS.imageList);
  if (imageList === null) {
    mountEmptyPageBar(root, tagsParam);
    return;
  }

  if (isPartial) {
    mountPartialBar(imageList);
    return;
  }

  mountFullBar(imageList, search, tagsParam, merged);
}
