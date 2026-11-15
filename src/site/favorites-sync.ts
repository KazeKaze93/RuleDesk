import {
  FAVORITES_PAGE,
  FAVORITES_SECTION_VIEW,
  FETCH_CREDENTIALS,
  FETCH_METHOD_GET,
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_PID,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
} from "../config/constants";
import { log } from "../log";
import {
  addFavs,
  getSyncState,
  loadFavSet,
  setSyncState,
} from "../storage/favs";
import {
  FAVS_SYNC_MODE_FULL,
  FAVS_SYNC_MODE_INCREMENTAL,
  type FavsSyncMode,
  type FavsSyncState,
} from "../storage/schema";
import { putFavoriteIndexEntriesQuietly } from "../storage/favorites-index";
import { readFavoriteIndexEntries } from "./favorites-index-read";
import { detectPageKind } from "./pages";
import { extractPostIdFromFavoritesDeleteOnclick } from "./selectors";

/** Minimum pause between sequential favorites page fetches. */
export const FAVORITES_SYNC_PAGE_PAUSE_MS = 1500;

/** Favorites list pagination step (site serves 50 thumbs per page). */
export const FAVORITES_SYNC_PID_STEP = 50;

/** Pauses before each of the three retries (HTTP error / missing paginator). */
export const FAVORITES_SYNC_RETRY_DELAYS_MS = [10_000, 30_000, 60_000] as const;

/** Max characters of document title included in pause/error messages. */
export const FAVORITES_SYNC_TITLE_SNIPPET_MAX = 80;

/** Re-export schema mode constants for site/UI callers. */
export type FavoritesSyncMode = FavsSyncMode;
export const FAVORITES_SYNC_MODE_INCREMENTAL = FAVS_SYNC_MODE_INCREMENTAL;
export const FAVORITES_SYNC_MODE_FULL = FAVS_SYNC_MODE_FULL;

const MY_FAVORITES_LINK_SELECTOR =
  'li#my-favorites-container a[href*="page=favorites"]';
const THUMB_SELECTOR = "span.thumb";
const THUMB_POST_LINK_SELECTOR = 'span.thumb a[id^="p"]';
const PAGINATOR_SELECTOR = "#paginator";
const LASTPAGE_SELECTOR = 'a[name="lastpage"]';
const NEXT_SELECTOR = 'a[name="next"]';
const REMOVE_LINK_SELECTOR = "a[onclick]";
const POST_LINK_ID_PATTERN = /^p(\d+)$/;
const ONCLICK_PID_PATTERN = /[?&]pid=(\d+)/;

const URL_PARSE_BASE = "https://rule34.xxx";
const TAB_ID_RANDOM_RADIX = 36;
const TAB_ID_RANDOM_SLICE_START = 2;
const TAB_ID_RANDOM_LENGTH = 10;

export const FAVORITES_SYNC_ERROR_NOT_LOGGED_IN =
  "not logged in or menu not found";
export const FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE = "unexpected page";

export type FavoritesSyncProgress = {
  page: number;
  pages: number;
  total: number;
};

export type FavoritesSyncResult =
  | { status: "completed"; total: number; pages: number }
  | { status: "aborted"; total: number; page: number; pages: number }
  | { status: "error"; message: string };

export type RunFavoritesSyncOptions = {
  onProgress: (progress: FavoritesSyncProgress) => void;
  signal: AbortSignal;
  /** Stable id for this tab's sync lock; generated when omitted. */
  tabId?: string;
  /**
   * New-run mode. Ignored while resuming an unfinished sync (stored mode wins).
   * Defaults to {@link FAVORITES_SYNC_MODE_INCREMENTAL} for a fresh run.
   */
  mode?: FavoritesSyncMode;
};

type PageFetchSuccess = {
  ok: true;
  doc: Document;
  status: number;
  titleSnippet: string;
};

type PageFetchFailure = {
  ok: false;
  status: number;
  titleSnippet: string;
  message: string;
};

function createAbortResult(
  total: number,
  page: number,
  pages: number,
): FavoritesSyncResult {
  return { status: "aborted", total, page, pages };
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (
    error instanceof Error && error.name === "AbortError"
  );
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function parsePositiveInt(raw: string | null): number | null {
  if (raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.trunc(value);
}

function parsePidFromOnclick(onclick: string): number | null {
  const match = ONCLICK_PID_PATTERN.exec(onclick);
  const raw = match?.[1];
  if (raw === undefined) {
    return null;
  }
  return parsePositiveInt(raw);
}

function titleSnippetFromHtml(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return titleSnippetFromDocument(doc);
  } catch {
    return "";
  }
}

function titleSnippetFromDocument(doc: Document): string {
  const raw = doc.title.trim();
  if (raw.length <= FAVORITES_SYNC_TITLE_SNIPPET_MAX) {
    return raw;
  }
  return raw.slice(0, FAVORITES_SYNC_TITLE_SNIPPET_MAX);
}

function formatPauseMessage(status: number, titleSnippet: string): string {
  if (titleSnippet.length === 0) {
    return `HTTP ${String(status)}`;
  }
  return `HTTP ${String(status)}: ${titleSnippet}`;
}

/** Stable tab id for sync lock (Package H / multi-tab). */
export function createFavoritesSyncTabId(): string {
  const random = Math.random()
    .toString(TAB_ID_RANDOM_RADIX)
    .slice(TAB_ID_RANDOM_SLICE_START, TAB_ID_RANDOM_SLICE_START + TAB_ID_RANDOM_LENGTH);
  return `tab-${String(Date.now())}-${random}`;
}

export function extractUserIdFromDocument(root: ParentNode): number | null {
  const link = root.querySelector(MY_FAVORITES_LINK_SELECTOR);
  if (!(link instanceof HTMLAnchorElement)) {
    return null;
  }
  const href = link.getAttribute("href");
  if (href === null || href.length === 0) {
    return null;
  }
  try {
    const url = new URL(href, URL_PARSE_BASE);
    return parsePositiveInt(url.searchParams.get(SEARCH_PARAM_ID));
  } catch {
    return null;
  }
}

/**
 * Reads `id` from a favorites view URL search string.
 * Returns null when the location is not a favorites page or id is missing.
 */
export function extractUserIdFromFavoritesSearch(
  search: string,
): number | null {
  if (detectPageKind(search) !== "favorites") {
    return null;
  }
  const params = new URLSearchParams(search);
  return parsePositiveInt(params.get(SEARCH_PARAM_ID));
}

/**
 * Resolve favorites owner id: menu link → favorites URL id → saved sync value.
 */
export function resolveFavoritesUserId(
  root: ParentNode,
  search: string,
  savedUserId: number | undefined,
): number | null {
  const fromMenu = extractUserIdFromDocument(root);
  if (fromMenu !== null) {
    return fromMenu;
  }
  const fromUrl = extractUserIdFromFavoritesSearch(search);
  if (fromUrl !== null) {
    return fromUrl;
  }
  if (savedUserId !== undefined && Number.isFinite(savedUserId)) {
    return Math.trunc(savedUserId);
  }
  return null;
}

function buildFavoritesPageUrl(userId: number, pid: number): string {
  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
  params.set(SEARCH_PARAM_SECTION, FAVORITES_SECTION_VIEW);
  params.set(SEARCH_PARAM_ID, String(userId));
  params.set(SEARCH_PARAM_PID, String(pid));
  return `${SEARCH_PATH}?${params.toString()}`;
}

function pageIndexFromPid(pid: number): number {
  return Math.floor(pid / FAVORITES_SYNC_PID_STEP) + 1;
}

function pagesFromLastPid(lastPid: number): number {
  return Math.floor(lastPid / FAVORITES_SYNC_PID_STEP) + 1;
}

function collectFavoriteIdsFromDocument(doc: Document): number[] {
  const ids = new Set<number>();

  const postLinks = doc.querySelectorAll(THUMB_POST_LINK_SELECTOR);
  for (const link of postLinks) {
    const match = POST_LINK_ID_PATTERN.exec(link.id);
    const raw = match?.[1];
    if (raw === undefined) {
      continue;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      ids.add(Math.trunc(parsed));
    }
  }

  const removeLinks = doc.querySelectorAll(REMOVE_LINK_SELECTOR);
  for (const link of removeLinks) {
    const onclick = link.getAttribute("onclick");
    if (onclick === null) {
      continue;
    }
    const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
    if (postId === null) {
      continue;
    }
    const parsed = Number(postId);
    if (Number.isFinite(parsed)) {
      ids.add(Math.trunc(parsed));
    }
  }

  return Array.from(ids);
}

/**
 * Reads last-page pid from a[name="lastpage"] onclick only.
 * No lastpage and no next → current page is last (returns currentPid).
 * No lastpage but next exists, or lastpage onclick unparseable → null (unexpected).
 */
export function resolveLastPid(
  doc: Document,
  currentPid: number,
): number | null {
  const lastpage = doc.querySelector(LASTPAGE_SELECTOR);
  if (lastpage instanceof HTMLAnchorElement) {
    const onclick = lastpage.getAttribute("onclick");
    if (onclick === null || onclick.length === 0) {
      return null;
    }
    return parsePidFromOnclick(onclick);
  }

  const next = doc.querySelector(NEXT_SELECTOR);
  if (next !== null) {
    return null;
  }
  return currentPid;
}

function hasPaginator(doc: Document): boolean {
  return doc.querySelector(PAGINATOR_SELECTOR) !== null;
}

type SyncProgressFields = {
  nextPid: number;
  lastPid: number;
  startedAt: string;
  userId: number;
  tabId: string;
  running: boolean;
  mode: FavoritesSyncMode;
  finishedAt?: string;
};

/**
 * Reads sync mode from persisted FavsSyncState.mode.
 * Missing / unexpected → undefined.
 */
export function readFavoritesSyncMode(
  sync: FavsSyncState | undefined,
): FavoritesSyncMode | undefined {
  const mode = sync?.mode;
  if (
    mode === FAVORITES_SYNC_MODE_INCREMENTAL ||
    mode === FAVORITES_SYNC_MODE_FULL
  ) {
    return mode;
  }
  return undefined;
}

/**
 * True when the page has at least one id and every id is already local.
 * Empty pages are not early-stop (handled by trailing-empty completion).
 */
export function pageIdsAllInLocalSet(
  pageIds: readonly number[],
  local: ReadonlySet<number>,
): boolean {
  if (pageIds.length === 0) {
    return false;
  }
  for (const id of pageIds) {
    if (!local.has(id)) {
      return false;
    }
  }
  return true;
}

function resolveRunMode(
  unfinished: boolean,
  existing: FavsSyncState | undefined,
  requested: FavoritesSyncMode | undefined,
): FavoritesSyncMode {
  if (unfinished) {
    // Legacy mid-flight (no mode) keeps full-walk behavior.
    return readFavoritesSyncMode(existing) ?? FAVORITES_SYNC_MODE_FULL;
  }
  return requested ?? FAVORITES_SYNC_MODE_INCREMENTAL;
}

function persistSyncProgress(fields: SyncProgressFields): FavsSyncState {
  const state: FavsSyncState = {
    nextPid: fields.nextPid,
    lastPid: fields.lastPid,
    startedAt: fields.startedAt,
    running: fields.running,
    userId: fields.userId,
    mode: fields.mode,
    lock: {
      tabId: fields.tabId,
      beatAt: Date.now(),
    },
  };
  if (fields.finishedAt !== undefined) {
    state.finishedAt = fields.finishedAt;
  }
  setSyncState(state);
  return state;
}

async function fetchFavoritesPageOnce(
  url: string,
  signal: AbortSignal,
): Promise<PageFetchSuccess | PageFetchFailure> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: FETCH_METHOD_GET,
      credentials: FETCH_CREDENTIALS,
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "request failed";
    log.warn("favorites sync: fetch failed", url, error);
    return {
      ok: false,
      status: 0,
      titleSnippet: message.slice(0, FAVORITES_SYNC_TITLE_SNIPPET_MAX),
      message,
    };
  }

  const html = await response.text();
  const titleSnippet = titleSnippetFromHtml(html);
  if (!response.ok) {
    log.warn("favorites sync: HTTP error", response.status, url);
    return {
      ok: false,
      status: response.status,
      titleSnippet,
      message: formatPauseMessage(response.status, titleSnippet),
    };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!hasPaginator(doc)) {
    log.warn("favorites sync: missing paginator", url);
    return {
      ok: false,
      status: response.status,
      titleSnippet: titleSnippetFromDocument(doc),
      message: formatPauseMessage(
        response.status,
        titleSnippetFromDocument(doc),
      ),
    };
  }

  return {
    ok: true,
    doc,
    status: response.status,
    titleSnippet: titleSnippetFromDocument(doc),
  };
}

/**
 * Fetch one favorites page; retry up to 3 times after 10s / 30s / 60s on
 * HTTP errors or missing paginator.
 */
async function fetchFavoritesPageWithRetries(
  url: string,
  signal: AbortSignal,
): Promise<PageFetchSuccess | PageFetchFailure> {
  let lastFailure: PageFetchFailure | null = null;

  for (
    let attempt = 0;
    attempt <= FAVORITES_SYNC_RETRY_DELAYS_MS.length;
    attempt += 1
  ) {
    throwIfAborted(signal);
    if (attempt > 0) {
      const delayMs = FAVORITES_SYNC_RETRY_DELAYS_MS[attempt - 1];
      if (delayMs === undefined) {
        break;
      }
      log.warn("favorites sync: retrying after delay", {
        attempt,
        delayMs,
        url,
      });
      await delay(delayMs, signal);
      throwIfAborted(signal);
    }

    const result = await fetchFavoritesPageOnce(url, signal);
    if (result.ok) {
      return result;
    }
    lastFailure = result;
  }

  if (lastFailure === null) {
    return {
      ok: false,
      status: 0,
      titleSnippet: "",
      message: formatPauseMessage(0, ""),
    };
  }
  return lastFailure;
}

/**
 * Walks the site favorites list page-by-page and merges ids into local favs.
 * Only adds; never removes. Network I/O lives here only (explicit user click).
 */
export async function runFavoritesSync(
  options: RunFavoritesSyncOptions,
): Promise<FavoritesSyncResult> {
  const { onProgress, signal } = options;
  const tabId = options.tabId ?? createFavoritesSyncTabId();

  const existing = getSyncState();
  const userId = resolveFavoritesUserId(
    document,
    window.location.search,
    existing?.userId,
  );
  if (userId === null) {
    log.warn("favorites sync: user id not found");
    return { status: "error", message: FAVORITES_SYNC_ERROR_NOT_LOGGED_IN };
  }

  const unfinished =
    existing !== undefined && existing.finishedAt === undefined;
  const mode = resolveRunMode(unfinished, existing, options.mode);
  const startedAt = unfinished
    ? existing.startedAt
    : new Date().toISOString();
  const parsedStart = Date.parse(startedAt);
  const runStamp = Number.isNaN(parsedStart) ? Date.now() : parsedStart;
  let pid = unfinished ? existing.nextPid : 0;
  let lastPid = unfinished ? existing.lastPid : 0;
  let persistedNextPid = pid;
  let total = loadFavSet().size;
  let page = pageIndexFromPid(pid);
  let pages = pagesFromLastPid(lastPid);
  let sawNonEmptyPage = unfinished && existing.nextPid > 0;

  const writeProgress = (
    fields: Partial<SyncProgressFields> &
      Pick<SyncProgressFields, "running">,
  ): void => {
    const nextPid = fields.nextPid ?? persistedNextPid;
    persistedNextPid = nextPid;
    if (fields.lastPid !== undefined) {
      lastPid = fields.lastPid;
    }
    const payload: SyncProgressFields = {
      nextPid,
      lastPid,
      startedAt,
      userId,
      tabId,
      running: fields.running,
      mode,
    };
    if (fields.finishedAt !== undefined) {
      payload.finishedAt = fields.finishedAt;
    }
    persistSyncProgress(payload);
  };

  try {
    throwIfAborted(signal);
    writeProgress({ running: true });

    while (true) {
      throwIfAborted(signal);

      const url = buildFavoritesPageUrl(userId, pid);
      const fetched = await fetchFavoritesPageWithRetries(url, signal);
      if (!fetched.ok) {
        writeProgress({ running: true });
        return {
          status: "error",
          message: fetched.message,
        };
      }

      const { doc } = fetched;
      const cardCount = doc.querySelectorAll(THUMB_SELECTOR).length;
      page = pageIndexFromPid(pid);

      // Empty page with paginator after at least one non-empty → end of list.
      if (cardCount === 0 && sawNonEmptyPage) {
        pages = Math.max(pages, page);
        const finishedAt = new Date().toISOString();
        writeProgress({
          nextPid: pid + FAVORITES_SYNC_PID_STEP,
          running: false,
          finishedAt,
        });
        onProgress({ page, pages, total });
        log.info("favorites sync: completed on empty trailing page", {
          total,
          pages,
          pid,
          mode,
        });
        return { status: "completed", total, pages };
      }

      const resolvedLastPid = resolveLastPid(doc, pid);
      if (resolvedLastPid === null) {
        log.warn("favorites sync: unexpected page", { pid, cardCount });
        writeProgress({ running: true });
        return {
          status: "error",
          message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE,
        };
      }
      lastPid = resolvedLastPid;
      pages = pagesFromLastPid(lastPid);

      if (cardCount === 0) {
        // Empty first stretch (no prior non-empty page) is unexpected.
        log.warn("favorites sync: unexpected empty page", { pid, lastPid });
        writeProgress({ running: true });
        return {
          status: "error",
          message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE,
        };
      }

      sawNonEmptyPage = true;
      const ids = collectFavoriteIdsFromDocument(doc);
      // The same page gives the search index its tags and previews.
      putFavoriteIndexEntriesQuietly(readFavoriteIndexEntries(doc, runStamp, pid));
      const localBefore = loadFavSet();
      const allKnown = pageIdsAllInLocalSet(ids, localBefore);
      addFavs(ids);
      total = loadFavSet().size;

      const nextPid = pid + FAVORITES_SYNC_PID_STEP;
      writeProgress({
        nextPid,
        lastPid,
        running: true,
      });
      onProgress({ page, pages, total });

      // Incremental: site lists newest first — stop at first all-known page.
      if (mode === FAVORITES_SYNC_MODE_INCREMENTAL && allKnown) {
        const finishedAt = new Date().toISOString();
        writeProgress({
          nextPid,
          lastPid,
          running: false,
          finishedAt,
        });
        log.info("favorites sync: incremental early stop", {
          total,
          pages,
          page,
          pid,
        });
        return { status: "completed", total, pages };
      }

      if (pid >= lastPid) {
        const finishedAt = new Date().toISOString();
        writeProgress({
          nextPid,
          lastPid,
          running: false,
          finishedAt,
        });
        log.info("favorites sync: completed", { total, pages, mode });
        return { status: "completed", total, pages };
      }

      throwIfAborted(signal);
      await delay(FAVORITES_SYNC_PAGE_PAUSE_MS, signal);
      throwIfAborted(signal);

      pid = nextPid;
      page = pageIndexFromPid(pid);
    }
  } catch (error) {
    if (isAbortError(error)) {
      writeProgress({ running: false });
      log.info("favorites sync: aborted", { pid, total, mode });
      return createAbortResult(total, page, pages);
    }
    log.error("favorites sync: unexpected failure", error);
    writeProgress({ running: true });
    const message =
      error instanceof Error ? error.message : "unexpected error";
    return { status: "error", message };
  }
}
