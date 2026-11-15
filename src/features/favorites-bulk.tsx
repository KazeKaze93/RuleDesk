import { STICKY_TOP } from "../boot/sticky-header";
import { render } from "preact";
import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import { log } from "../log";
import { downloadsAvailable } from "./downloads/available";
import {
  FavoritesBrowser,
  bindInPlaceRemoval,
  favoritesGridRoot,
} from "./favorites-browser";
import { isDownloadBusy, startDownload } from "./downloads/queue";
import { removeFavorite } from "../site/favorites";
import {
  listFavoriteThumbEntries,
  removeFavoriteCell,
  resolveFavoriteThumbPostId,
  type FavoriteThumbEntry,
} from "../site/favorites-page";
import { FAVORITES_SYNC_PAGE_PAUSE_MS } from "../site/favorites-sync";
import { SITE_SELECTORS } from "../site/selectors";
import { loadFavSet, removeFav } from "../storage/favs";
import { Button, Dialog, ProgressBar } from "../ui/kit";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

const FEATURE_ID = "favorites-bulk";
const FEATURE_LABEL = "Bulk remove favorites";
const FEATURE_PAGES = ["favorites"] as const;

const ROOT_ID = "rdw-favorites-bulk";
const ROOT_CLASS = "rdw-favorites-bulk";
const BAR_CLASS = "rdw-favorites-bulk-bar";
const STATUS_CLASS = "rdw-favorites-bulk-status";
const CONFIRM_CLASS = "rdw-favorites-bulk-confirm";
const CONFIRM_ROW_CLASS = "rdw-favorites-bulk-confirm-row";
const PROGRESS_WRAP_CLASS = "rdw-favorites-bulk-progress";
const TITLE_CLASS = "rdw-favorites-title";
const COUNT_CLASS = "rdw-favorites-count";
const TITLE_TEXT = "Favorites";
const LOCALE = "en-US";
/** Above the thumbs and their corner buttons. */
const HEADER_Z_INDEX = 6;

/** Selection chrome on site thumbs — skin may restyle (HANDOFF G). */
export const CLASS_THUMB_SELECTED = "rdw-fav-bulk-selected";
export const CLASS_THUMB_CHECK = "rdw-fav-bulk-check";

const TEXT_SELECT = "Select";
const TEXT_SELECT_PAGE = "Select page";
const TEXT_DOWNLOAD_ALL = "Download all";
const TEXT_DOWNLOAD_ALL_TITLE =
  "Saves the original file of every favorite in the local list; Sync favorites first if it is out of date";
/** Name of the download job and of its folder. */
const DOWNLOAD_JOB_NAME = "Favorites";
const TEXT_CLEAR = "Clear";
const TEXT_CANCEL = UI_TEXT.cancel;
const TEXT_CONFIRM = UI_TEXT.confirm;
const TEXT_STOP = "Stop";
const TEXT_DISMISS = "Dismiss";
const TEXT_REMOVE_SELECTED_PREFIX = "Remove selected (";
const TEXT_REMOVE_SELECTED_SUFFIX = ")";
const TEXT_SELECTED_SUFFIX = " selected";
const TEXT_CONFIRM_PREFIX = "Remove ";
const TEXT_CONFIRM_MID = " favorite";
const TEXT_CONFIRM_MID_PLURAL = " favorites";
const TEXT_CONFIRM_SUFFIX =
  "? This cannot be undone on the site.";
const TEXT_CONFIRM_ARIA = "Confirm bulk remove favorites";
const TEXT_PROGRESS_OF = " of ";
const TEXT_ERROR_DELETED_PREFIX = "Deleted ";
const TEXT_ERROR_DELETED_MID = " of ";
const TEXT_ERROR_FAILED_PREFIX = ". Failed on post ";
const TEXT_ERROR_FAILED_SUFFIX = ".";
const TEXT_STOPPED_PREFIX = "Stopped after ";
const TEXT_STOPPED_MID = " of ";
const TEXT_STOPPED_SUFFIX = ".";

const CHECK_GLYPH = "✓";

const ACCENT_FALLBACK = "#4c8bf5";
const SURFACE_FALLBACK = "#ffffff";
const SELECT_OUTLINE_WIDTH = "2px";
const SELECT_OUTLINE_OFFSET = "2px";
const CHECK_SIZE = "1.25rem";
const CHECK_INSET = "0.25rem";
const CHECK_Z_INDEX = 2;
const CHECK_FONT_SIZE = "0.75rem";

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTING_CLASS = `${BODY_CLASS}-selecting`;

const FEATURE_CSS = `
/* The page header: title, count and the buttons; stays at the top of the window. */
body.${BODY_CLASS} .${ROOT_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 1rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0.5rem 0;
  flex: 0 0 100%;
  grid-column: 1 / -1;
  position: sticky;
  top: ${STICKY_TOP};
  z-index: ${String(HEADER_Z_INDEX)};
  background: var(--rdw-bg);
}
body.${BODY_CLASS} .${TITLE_CLASS} {
  margin: 0;
  font: 700 18px var(--rdw-font);
  color: var(--rdw-text);
}
body.${BODY_CLASS} .${COUNT_CLASS} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
body.${BODY_CLASS} .${BAR_CLASS} {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  box-sizing: border-box;
}
body.${BODY_CLASS} .${STATUS_CLASS} {
  flex: 1 1 12rem;
  min-width: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.3;
}
body.${BODY_CLASS} .${CONFIRM_CLASS} {
  display: grid;
  gap: 0.75rem;
}
body.${BODY_CLASS} .${CONFIRM_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
}
body.${BODY_CLASS} .${PROGRESS_WRAP_CLASS} {
  flex: 1 1 12rem;
  min-width: 8rem;
  max-width: 24rem;
}
body.${BODY_CLASS} span.thumb {
  position: relative;
}
body.${BODY_CLASS} span.thumb.${CLASS_THUMB_SELECTED} {
  outline: ${SELECT_OUTLINE_WIDTH} solid var(--rdw-accent, ${ACCENT_FALLBACK});
  outline-offset: ${SELECT_OUTLINE_OFFSET};
}
body.${BODY_CLASS} span.thumb > .${CLASS_THUMB_CHECK} {
  position: absolute;
  top: ${CHECK_INSET};
  left: ${CHECK_INSET};
  z-index: ${String(CHECK_Z_INDEX)};
  display: none;
  align-items: center;
  justify-content: center;
  width: ${CHECK_SIZE};
  height: ${CHECK_SIZE};
  border-radius: 999px;
  background: var(--rdw-accent, ${ACCENT_FALLBACK});
  color: var(--rdw-surface, ${SURFACE_FALLBACK});
  font-size: ${CHECK_FONT_SIZE};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
body.${BODY_CLASS} span.thumb.${CLASS_THUMB_SELECTED} > .${CLASS_THUMB_CHECK} {
  display: inline-flex;
}
`.trim();

type BulkPhase =
  | { kind: "idle" }
  | { kind: "selecting" }
  | { kind: "confirm"; count: number }
  | { kind: "removing"; done: number; total: number }
  | { kind: "error"; message: string }
  | { kind: "stopped"; message: string };

function removeSelectedLabel(count: number): string {
  return `${TEXT_REMOVE_SELECTED_PREFIX}${String(count)}${TEXT_REMOVE_SELECTED_SUFFIX}`;
}

function selectedCountLabel(count: number): string {
  return `${String(count)}${TEXT_SELECTED_SUFFIX}`;
}

function confirmMessage(count: number): string {
  const mid = count === 1 ? TEXT_CONFIRM_MID : TEXT_CONFIRM_MID_PLURAL;
  return `${TEXT_CONFIRM_PREFIX}${String(count)}${mid}${TEXT_CONFIRM_SUFFIX}`;
}

function progressLabel(done: number, total: number): string {
  return `${String(done)}${TEXT_PROGRESS_OF}${String(total)}`;
}

function errorMessage(deleted: number, total: number, failedPostId: string): string {
  return `${TEXT_ERROR_DELETED_PREFIX}${String(deleted)}${TEXT_ERROR_DELETED_MID}${String(total)}${TEXT_ERROR_FAILED_PREFIX}${failedPostId}${TEXT_ERROR_FAILED_SUFFIX}`;
}

function stoppedMessage(deleted: number, total: number): string {
  return `${TEXT_STOPPED_PREFIX}${String(deleted)}${TEXT_STOPPED_MID}${String(total)}${TEXT_STOPPED_SUFFIX}`;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
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

function ensureCheckOverlay(thumb: HTMLElement): void {
  if (thumb.querySelector(`:scope > .${CLASS_THUMB_CHECK}`) !== null) {
    return;
  }
  const check = document.createElement("span");
  check.className = CLASS_THUMB_CHECK;
  check.setAttribute("aria-hidden", "true");
  check.textContent = CHECK_GLYPH;

  const postLink = thumb.querySelector(`a[id^="p"]`);
  if (postLink instanceof HTMLAnchorElement && postLink.parentElement === thumb) {
    // Sibling of a#p{ID} — never inject inside the post link.
    postLink.after(check);
    return;
  }
  thumb.prepend(check);
}

function clearThumbSelectionChrome(root: ParentNode = document): void {
  const selected = root.querySelectorAll(
    `${SITE_SELECTORS.thumb}.${CLASS_THUMB_SELECTED}`,
  );
  for (const node of selected) {
    node.classList.remove(CLASS_THUMB_SELECTED);
  }
  const checks = root.querySelectorAll(`${SITE_SELECTORS.thumb} > .${CLASS_THUMB_CHECK}`);
  for (const node of checks) {
    node.remove();
  }
}

function applySelectionChrome(
  entries: readonly FavoriteThumbEntry[],
  selected: ReadonlySet<string>,
): void {
  for (const entry of entries) {
    const isSelected = selected.has(entry.postId);
    entry.thumb.classList.toggle(CLASS_THUMB_SELECTED, isSelected);
    if (isSelected) {
      ensureCheckOverlay(entry.thumb);
    } else {
      const check = entry.thumb.querySelector(`:scope > .${CLASS_THUMB_CHECK}`);
      if (check !== null) {
        check.remove();
      }
    }
  }
}

/**
 * Place the bar as its own full-width row above the thumbs grid/list —
 * not as a sibling grid/flex item beside the first thumb.
 */
function findBarHost(): { parent: ParentNode; before: ChildNode | null } {
  const imageList = document.querySelector(SITE_SELECTORS.imageList);
  if (imageList !== null && imageList.parentNode !== null) {
    return { parent: imageList.parentNode, before: imageList };
  }

  const firstThumb = document.querySelector(SITE_SELECTORS.thumb);
  if (firstThumb !== null) {
    const grid = firstThumb.parentElement;
    if (grid !== null && grid.parentNode !== null) {
      if (grid !== document.body && grid !== document.documentElement) {
        return { parent: grid.parentNode, before: grid };
      }
      return { parent: grid, before: firstThumb };
    }
  }

  const paginator = document.querySelector("#paginator");
  if (paginator !== null && paginator.parentNode !== null) {
    return { parent: paginator.parentNode, before: paginator };
  }
  return { parent: document.body, before: document.body.firstChild };
}

/**
 * Starts a download of every favorite in the local list, newest first. The
 * manager finds the files through the API by post id and shows its own panel.
 */
export function downloadAllFavorites(): void {
  const ids = [...loadFavSet()].sort((a, b) => b - a);
  if (ids.length === 0 || isDownloadBusy()) {
    return;
  }
  void startDownload(DOWNLOAD_JOB_NAME, { kind: "ids", ids });
}

function removeDomCellForPost(postId: string): void {
  const entry = listFavoriteThumbEntries(favoritesGridRoot()).find((item) => item.postId === postId);
  if (entry !== undefined) {
    removeFavoriteCell(entry.thumb);
    return;
  }
  const fallback = document.getElementById(`s${postId}`);
  if (fallback instanceof HTMLElement) {
    removeFavoriteCell(fallback);
  }
}

type FavoritesBulkBarProps = {
  readonly onSelectionModeChange: (active: boolean) => void;
};

function FavoritesBulkBar(props: FavoritesBulkBarProps): JSX.Element {
  const [phase, setPhase] = useState<BulkPhase>({ kind: "idle" });
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const abortRef = useRef<AbortController | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const selectionActive =
    phase.kind === "selecting" ||
    phase.kind === "confirm" ||
    phase.kind === "removing";

  useEffect(() => {
    props.onSelectionModeChange(selectionActive);
  }, [props, selectionActive]);

  useEffect(() => {
    if (!selectionActive) {
      clearThumbSelectionChrome();
      return;
    }
    applySelectionChrome(listFavoriteThumbEntries(favoritesGridRoot()), selected);
  }, [selectionActive, selected]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearThumbSelectionChrome();
    };
  }, []);

  useEffect(() => {
    if (phase.kind !== "selecting" && phase.kind !== "confirm") {
      return;
    }

    const onClickCapture = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.closest(".rdw-dialog-backdrop") !== null) {
        return;
      }
      const thumb = target.closest(SITE_SELECTORS.thumb);
      if (!(thumb instanceof HTMLElement)) {
        return;
      }
      if (!document.body.contains(thumb)) {
        return;
      }
      const postId = resolveFavoriteThumbPostId(thumb);
      if (postId === null) {
        return;
      }

      // Block navigation / Remove while selecting; toggle is the only action.
      event.preventDefault();
      event.stopPropagation();

      if (phase.kind === "confirm") {
        return;
      }

      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });
    };

    document.addEventListener("click", onClickCapture, true);
    return () => {
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [phase.kind]);

  const resetToIdle = (): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearThumbSelectionChrome();
    setSelected(new Set());
    setPhase({ kind: "idle" });
  };

  const enterSelecting = (): void => {
    setSelected(new Set());
    setPhase({ kind: "selecting" });
  };

  const selectPage = (): void => {
    const ids = listFavoriteThumbEntries(favoritesGridRoot()).map((entry) => entry.postId);
    setSelected(new Set(ids));
  };

  const clearSelection = (): void => {
    setSelected(new Set());
  };

  const beginConfirm = (): void => {
    const count = selectedRef.current.size;
    if (count === 0) {
      return;
    }
    setPhase({ kind: "confirm", count });
  };

  const closeConfirm = (): void => {
    setPhase({ kind: "selecting" });
  };

  const runRemoval = async (): Promise<void> => {
    const ids = [...selectedRef.current];
    if (ids.length === 0) {
      setPhase({ kind: "selecting" });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    const total = ids.length;
    let done = 0;
    setPhase({ kind: "removing", done, total });

    try {
      for (let index = 0; index < ids.length; index += 1) {
        if (signal.aborted) {
          setPhase({ kind: "stopped", message: stoppedMessage(done, total) });
          return;
        }

        const postId = ids[index];
        if (postId === undefined) {
          continue;
        }

        const result = await removeFavorite(postId, { signal });
        if (signal.aborted) {
          setPhase({ kind: "stopped", message: stoppedMessage(done, total) });
          return;
        }
        if (result.status !== "removed") {
          setPhase({
            kind: "error",
            message: errorMessage(done, total, postId),
          });
          return;
        }

        removeFav(postId);
        removeDomCellForPost(postId);

        done += 1;
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setPhase({ kind: "removing", done, total });

        const hasMore = index < ids.length - 1;
        if (hasMore) {
          await delay(FAVORITES_SYNC_PAGE_PAUSE_MS, signal);
        }
      }

      clearThumbSelectionChrome();
      setSelected(new Set());
      setPhase({ kind: "idle" });
    } catch (error) {
      if (isAbortError(error) || signal.aborted) {
        setPhase({ kind: "stopped", message: stoppedMessage(done, total) });
        return;
      }
      log.warn("favorites-bulk: unexpected removal failure", error);
      const failedId = ids[done] ?? "?";
      setPhase({
        kind: "error",
        message: errorMessage(done, total, failedId),
      });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const stopRemoval = (): void => {
    abortRef.current?.abort();
  };

  if (phase.kind === "idle") {
    return (
      <div className={BAR_CLASS}>
        <Button variant="secondary" size="s" onClick={enterSelecting}>
          {TEXT_SELECT}
        </Button>
        {downloadsAvailable() ? (
          <Button
            variant="secondary"
            size="s"
            title={TEXT_DOWNLOAD_ALL_TITLE}
            onClick={downloadAllFavorites}
          >
            {TEXT_DOWNLOAD_ALL}
          </Button>
        ) : null}
      </div>
    );
  }

  if (phase.kind === "removing") {
    const ratio = phase.total === 0 ? 0 : phase.done / phase.total;
    return (
      <div className={BAR_CLASS}>
        <div className={PROGRESS_WRAP_CLASS}>
          <ProgressBar
            value={ratio}
            label={progressLabel(phase.done, phase.total)}
          />
        </div>
        <span className={STATUS_CLASS}>
          {progressLabel(phase.done, phase.total)}
        </span>
        <Button variant="secondary" size="s" onClick={stopRemoval}>
          {TEXT_STOP}
        </Button>
      </div>
    );
  }

  if (phase.kind === "error" || phase.kind === "stopped") {
    return (
      <div className={BAR_CLASS}>
        <span className={STATUS_CLASS}>{phase.message}</span>
        <Button variant="secondary" size="s" onClick={resetToIdle}>
          {TEXT_DISMISS}
        </Button>
      </div>
    );
  }

  // selecting | confirm — same control row; confirm uses kit Dialog overlay.
  const count = selected.size;
  const confirmOpen = phase.kind === "confirm";
  return (
    <>
      <div className={BAR_CLASS}>
        <span className={STATUS_CLASS}>{selectedCountLabel(count)}</span>
        <Button variant="secondary" size="s" onClick={selectPage}>
          {TEXT_SELECT_PAGE}
        </Button>
        <Button variant="secondary" size="s" onClick={clearSelection}>
          {TEXT_CLEAR}
        </Button>
        <Button
          variant="danger"
          size="s"
          disabled={count === 0 || confirmOpen}
          onClick={beginConfirm}
        >
          {removeSelectedLabel(count)}
        </Button>
        <Button variant="ghost" size="s" onClick={resetToIdle}>
          {TEXT_CANCEL}
        </Button>
      </div>
      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        aria-label={TEXT_CONFIRM_ARIA}
        className={CONFIRM_CLASS}
      >
        <p className={STATUS_CLASS}>{confirmMessage(count)}</p>
        <div className={CONFIRM_ROW_CLASS}>
          <Button
            variant="danger"
            size="s"
            onClick={() => {
              void runRemoval();
            }}
          >
            {TEXT_CONFIRM}
          </Button>
          <Button variant="secondary" size="s" onClick={closeConfirm}>
            {TEXT_CANCEL}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/** "11,962 posts", from the local list; nothing while that list is empty. */
export function favoritesCountLabel(count: number): string {
  if (count <= 0) {
    return "";
  }
  return `${count.toLocaleString(LOCALE)} ${count === 1 ? "post" : "posts"}`;
}

function FavoritesHeader(): JSX.Element {
  const count = favoritesCountLabel(loadFavSet().size);
  return (
    <>
      <h2 className={TITLE_CLASS}>{TITLE_TEXT}</h2>
      {count.length > 0 ? <span className={COUNT_CLASS}>{count}</span> : null}
    </>
  );
}

function mountFavoritesBulk(_ctx: FeatureContext): void {
  if (document.getElementById(ROOT_ID) !== null) {
    return;
  }

  const host = findBarHost();
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = ROOT_CLASS;
  host.parent.insertBefore(root, host.before);

  const siteGrid = document.querySelector(SITE_SELECTORS.imageList);
  if (siteGrid !== null) {
    bindInPlaceRemoval(siteGrid);
  }

  const onSelectionModeChange = (active: boolean): void => {
    document.body.classList.toggle(BODY_SELECTING_CLASS, active);
  };

  render(
    <>
      <FavoritesHeader />
      <FavoritesBulkBar onSelectionModeChange={onSelectionModeChange} />
      <FavoritesBrowser />
    </>,
    root,
  );
}

export const favoritesBulkFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountFavoritesBulk,
};
