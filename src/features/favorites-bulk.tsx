import { SETTINGS_SECTION_FAVORITES, requestSettingsSection } from "../pages/settings-focus";
import { STICKY_TOP } from "../boot/sticky-header";
import { render } from "preact";
import type { ComponentChildren, JSX } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import { log } from "../log";
import { downloadsAvailable } from "./downloads/available";
import {
  FAVORITES_BROWSING_BODY_CLASS,
  FAVORITES_LAYOUT_CLASS,
  FAVORITES_SIDE_CLASS,
  FAVORITES_SIDE_ACTIONS_CLASS,
  FAVORITES_SIDE_BAR_CLASS,
  FAVORITES_SIDE_CARD_CLASS,
  FAVORITES_SIDE_ID,
  FAVORITES_SIDE_SLOT_CLASS,
  FavoritesBrowser,
  postsLabel,
  bindInPlaceRemoval,
  favoritesGridRoot,
  openRandomFavorite,
} from "./favorites-browser";
import { RDW_HASH_SETTINGS } from "../pages/constants";
import { readPreviewThumbUrl, refreshAddButtons } from "./playlist-menu";
import {
  BulkCollectionDialog,
  bulkCollectionSummary,
} from "../ui/bulk-collection-dialog";
import type { CollectionPostInput } from "../storage/store";
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
import { getSyncState, loadFavSet, removeFav } from "../storage/favs";
import {
  Button,
  Dialog,
  IconButton,
  IconDice,
  IconDots,
  IconDownload,
  IconRefresh,
  IconTrash,
  Popover,
  ProgressBar,
} from "../ui/kit";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

const FEATURE_ID = "favorites-bulk";
const FEATURE_LABEL = "Bulk remove favorites";
const FEATURE_PAGES = ["favorites"] as const;

const ROOT_ID = "rdw-favorites-bulk";
const ROOT_CLASS = "rdw-favorites-bulk";
/** The row under the title that stays at the top of the window. */
export const PIN_ID = "rdw-favorites-pin";
const PIN_CLASS = "rdw-favorites-pin";
const FILTERS_CLASS = "rdw-favorites-filters";
const SUMMARY_CLASS = "rdw-favorites-bulk-summary";
const MENU_CLASS = "rdw-favorites-menu";
const MENU_ITEM_CLASS = "rdw-favorites-menu-item";
const DOWNLOAD_CLASS = "rdw-favorites-download";
const DOWNLOAD_TITLE_CLASS = "rdw-favorites-download-title";
const DOWNLOAD_NOTE_CLASS = "rdw-favorites-download-note";
const DOWNLOAD_STALE_CLASS = "rdw-favorites-download-stale";
const LINK_BUTTON_CLASS = "rdw-favorites-link";
const MENU_WIDTH_PX = 200;
/** Above and below the controls of the pinned row. */
const PIN_PADDING_PX = 12;
const BAR_CLASS = "rdw-favorites-bulk-bar";
const STATUS_CLASS = "rdw-favorites-bulk-status";
const CONFIRM_CLASS = "rdw-favorites-bulk-confirm";
const CONFIRM_ROW_CLASS = "rdw-favorites-bulk-confirm-row";
const PROGRESS_WRAP_CLASS = "rdw-favorites-bulk-progress";
const TITLE_CLASS = "rdw-favorites-title";
const TITLE_TEXT = "Favorites";
const LOCALE = "en-US";
/** Above the thumbs and their corner buttons. */
const HEADER_Z_INDEX = 6;

/** Selection chrome on site thumbs — skin may restyle (HANDOFF G). */
export const CLASS_THUMB_SELECTED = "rdw-fav-bulk-selected";
export const CLASS_THUMB_CHECK = "rdw-fav-bulk-check";

const TEXT_SELECT = "Select";
const TEXT_SELECT_PAGE = "Select page";
/** The results grid has no pages: what is selected is what has been loaded so far. */
const TEXT_SELECT_LOADED = "Select loaded";
const TEXT_ADD_TO_COLLECTION = "Add to collection";
const TEXT_RANDOM = "Random post";
const TEXT_RANDOM_TITLE = "Open a random favorite";
const TEXT_MORE_ACTIONS = "More actions";
const TEXT_DOWNLOAD_ALL = "Download all…";
const TEXT_SYNC = "Sync favorites…";
const TEXT_SYNC_FIRST = "Sync first";
const TEXT_DOWNLOAD_TITLE = "Download all favorites?";
const TEXT_DOWNLOAD_BUTTON = "Download";
const TEXT_DOWNLOAD_ARIA = "Download all favorites";
const TEXT_SELECTED_MARK = "Selected";
const MS_PER_DAY = 86_400_000;
/** A sync older than this is called out before a download of everything. */
export const STALE_SYNC_DAYS = 7;
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
body.${BODY_CLASS} .${ROOT_CLASS},
body.${BODY_CLASS} .${PIN_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0;
  flex: 0 0 100%;
  grid-column: 1 / -1;
}
/* Beside the column of filters both stand in the second column of the block. */
body.${BODY_CLASS} .${FAVORITES_LAYOUT_CLASS} > .${ROOT_CLASS},
body.${BODY_CLASS} .${FAVORITES_LAYOUT_CLASS} > .${PIN_CLASS} {
  grid-column: 2;
  width: auto;
}
/* The selection bar in the column, over the card of filters. */
body.${BODY_CLASS} .${FAVORITES_SIDE_BAR_CLASS} .${BAR_CLASS} {
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
body.${BODY_CLASS} .${FAVORITES_SIDE_BAR_CLASS} .${BAR_CLASS} > .rdw-btn {
  flex: 1 1 auto;
  white-space: nowrap;
}
/* Holds only the page's heading, which is for screen readers: the menu
   already shows where you are. */
body.${BODY_CLASS} .${ROOT_CLASS} {
  position: relative;
  height: 0;
}
/* The space under the header is the row's own padding, so that the row has
   the same space above it as below it, held or not. */
body.${BODY_CLASS} div#header {
  margin-bottom: 0 !important;
}
/* The row of search, filters and buttons (or of the selection) stays at the top. */
body.${BODY_CLASS} .${PIN_CLASS} {
  gap: 0.35rem 0.5rem;
  padding: ${String(PIN_PADDING_PX)}px 0;
  position: sticky;
  top: ${STICKY_TOP};
  z-index: ${String(HEADER_Z_INDEX)};
  background: var(--rdw-bg);
}
body.${BODY_CLASS} .${FILTERS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  flex: 1 1 auto;
  min-width: 0;
}
body.${BODY_CLASS} .${FILTERS_CLASS}[hidden] {
  display: none;
}
body.${BODY_CLASS} .${TITLE_CLASS} {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
body.${BODY_CLASS} .${ROOT_CLASS} .rdw-btn,
body.${BODY_CLASS} .${PIN_CLASS} .rdw-btn {
  font-weight: 500;
}
/* The strip turned into the selection: filled, so that it is seen without
   reading it that a click on a thumbnail now selects (the designer, 17.11.2026). */
body.${BODY_CLASS} .${PIN_CLASS} .${BAR_CLASS} {
  flex: 1 1 auto;
  padding: 4px 8px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
body.${BODY_CLASS} .${SUMMARY_CLASS} {
  flex: 1 1 8rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
.${MENU_CLASS} {
  padding: 6px;
  gap: 2px;
}
.${MENU_ITEM_CLASS} {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 30px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: 13px var(--rdw-font);
  text-align: left;
  cursor: pointer;
}
.${MENU_ITEM_CLASS}:hover,
.${MENU_ITEM_CLASS}:focus-visible {
  background: var(--rdw-surface-2);
}
.${DOWNLOAD_CLASS} {
  display: grid;
  gap: 0.5rem;
}
.${DOWNLOAD_TITLE_CLASS} {
  margin: 0;
  font: 700 15px var(--rdw-font);
  color: var(--rdw-text);
}
.${DOWNLOAD_NOTE_CLASS},
.${DOWNLOAD_STALE_CLASS} {
  margin: 0;
  font: 13px/1.4 var(--rdw-font);
  color: var(--rdw-muted);
}
.${DOWNLOAD_STALE_CLASS} {
  color: var(--rdw-text);
}
.${LINK_BUTTON_CLASS} {
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.${DOWNLOAD_CLASS} .${CONFIRM_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem 0.5rem;
  margin-top: 0.25rem;
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
  flex: 0 1 auto;
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
  // The tick is the sign of a selected cell that does not rely on colour;
  // it is also what a screen reader is told.
  check.setAttribute("role", "img");
  check.setAttribute("aria-label", TEXT_SELECTED_MARK);
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

/** How long ago the favorites were synced, and whether that is long enough to say so. */
export function syncAge(
  finishedAt: string | undefined,
  now: number,
): { readonly text: string; readonly stale: boolean } {
  const parsed = finishedAt === undefined ? Number.NaN : Date.parse(finishedAt);
  if (!Number.isFinite(parsed)) {
    return { text: "Never synced.", stale: true };
  }
  const days = Math.max(0, Math.floor((now - parsed) / MS_PER_DAY));
  const stale = days > STALE_SYNC_DAYS;
  if (days === 0) {
    return { text: "Synced today.", stale };
  }
  return { text: `Synced ${String(days)} ${days === 1 ? "day" : "days"} ago.`, stale };
}

function downloadNote(count: number): string {
  const files = count === 1 ? "original file" : "original files";
  return `${count.toLocaleString(LOCALE)} ${files}: every favorite in the local list, not only this page.`;
}

/** Opens the settings page at its Favorites block, where the sync buttons are. */
function openSyncSettings(): void {
  requestSettingsSection(SETTINGS_SECTION_FAVORITES);
  window.location.hash = RDW_HASH_SETTINGS;
}

type IdleActionsProps = {
  readonly onSelect: () => void;
  /** In the column every action is a button of its own; in the row the rare ones are in a menu. */
  readonly stacked: boolean;
};

/** The buttons at the right end of the row: a random post, selecting, and the menu of rare actions. */
function IdleActions(props: IdleActionsProps): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const count = loadFavSet().size;
  const age = syncAge(getSyncState()?.finishedAt, Date.now());

  const closeMenu = (): void => {
    setMenuOpen(false);
  };
  const closeDownload = (): void => {
    setDownloadOpen(false);
  };

  return (
    <>
      <Button variant="secondary" size="s" title={TEXT_RANDOM_TITLE} onClick={openRandomFavorite}>
        <IconDice size={14} />
        {TEXT_RANDOM}
      </Button>
      <Button variant="secondary" size="s" onClick={props.onSelect}>
        {TEXT_SELECT}
      </Button>
      {props.stacked ? (
        <>
          {downloadsAvailable() ? (
            <Button
              variant="ghost"
              size="s"
              disabled={count === 0}
              onClick={() => {
                setDownloadOpen(true);
              }}
            >
              <IconDownload size={14} />
              {TEXT_DOWNLOAD_ALL}
            </Button>
          ) : null}
          <Button variant="ghost" size="s" onClick={openSyncSettings}>
            <IconRefresh size={14} />
            {TEXT_SYNC}
          </Button>
        </>
      ) : (
        <IconButton
          label={TEXT_MORE_ACTIONS}
          menuOpen={menuOpen}
          buttonRef={menuButtonRef}
          onClick={() => {
            setMenuOpen(!menuOpen);
          }}
        >
          <IconDots size={16} />
        </IconButton>
      )}
      <Popover
        open={menuOpen && !props.stacked}
        onClose={closeMenu}
        anchorRef={menuButtonRef}
        widthPx={MENU_WIDTH_PX}
        alignEnd
        role="menu"
        aria-label={TEXT_MORE_ACTIONS}
        className={MENU_CLASS}
      >
        {downloadsAvailable() ? (
          <button
            type="button"
            role="menuitem"
            className={`${MENU_ITEM_CLASS} rdw-kit-focusable`}
            disabled={count === 0}
            onClick={() => {
              closeMenu();
              setDownloadOpen(true);
            }}
          >
            <IconDownload size={16} />
            {TEXT_DOWNLOAD_ALL}
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className={`${MENU_ITEM_CLASS} rdw-kit-focusable`}
          onClick={() => {
            closeMenu();
            openSyncSettings();
          }}
        >
          <IconRefresh size={16} />
          {TEXT_SYNC}
        </button>
      </Popover>
      <Dialog
        open={downloadOpen}
        onClose={closeDownload}
        aria-label={TEXT_DOWNLOAD_ARIA}
        className={DOWNLOAD_CLASS}
      >
        <h3 className={DOWNLOAD_TITLE_CLASS}>{TEXT_DOWNLOAD_TITLE}</h3>
        <p className={DOWNLOAD_NOTE_CLASS}>
          {downloadNote(count)}
          {age.stale ? null : ` ${age.text}`}
        </p>
        {age.stale ? (
          <p className={DOWNLOAD_STALE_CLASS}>
            {age.text}{" "}
            <button
              type="button"
              className={`${LINK_BUTTON_CLASS} rdw-kit-focusable`}
              onClick={() => {
                closeDownload();
                openSyncSettings();
              }}
            >
              {TEXT_SYNC_FIRST}
            </button>
          </p>
        ) : null}
        <div className={CONFIRM_ROW_CLASS}>
          <Button variant="secondary" size="s" onClick={closeDownload}>
            {TEXT_CANCEL}
          </Button>
          <Button
            variant="primary"
            size="s"
            onClick={() => {
              closeDownload();
              downloadAllFavorites();
            }}
          >
            {`${TEXT_DOWNLOAD_BUTTON} ${count.toLocaleString(LOCALE)}`}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/** The selected posts that are on the page, with their previews, in page order. */
function selectedPostsOnPage(selected: ReadonlySet<string>): CollectionPostInput[] {
  const posts: CollectionPostInput[] = [];
  for (const entry of listFavoriteThumbEntries(favoritesGridRoot())) {
    if (!selected.has(entry.postId)) {
      continue;
    }
    const id = Number(entry.postId);
    if (Number.isInteger(id) && id > 0) {
      posts.push({ id, thumbUrl: readPreviewThumbUrl(entry.thumb, entry.postId) });
    }
  }
  return posts;
}

type FavoritesBulkBarProps = {
  readonly onSelectionModeChange: (active: boolean) => void;
  /** Where those buttons go while nothing is being selected: the right end of the row of filters. */
  readonly headSlot: HTMLElement | null;
  /** What the list is narrowed to, shown beside the count of selected posts. */
  readonly summary: string;
  /** True while the bar has the pinned row to itself: selecting, removing, a message. */
  readonly onBusyChange: (busy: boolean) => void;
};

function FavoritesBulkBar(props: FavoritesBulkBarProps): JSX.Element | null {
  const [phase, setPhase] = useState<BulkPhase>({ kind: "idle" });
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const abortRef = useRef<AbortController | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  // The posts the collection dialog is open for; null while it is closed.
  const [collectionPosts, setCollectionPosts] = useState<readonly CollectionPostInput[] | null>(
    null,
  );
  // What the last "Add to collection" did; shown until the selection changes.
  const [note, setNote] = useState("");

  const selectionActive =
    phase.kind === "selecting" ||
    phase.kind === "confirm" ||
    phase.kind === "removing";

  const { onSelectionModeChange, onBusyChange } = props;
  useEffect(() => {
    onSelectionModeChange(selectionActive);
  }, [onSelectionModeChange, selectionActive]);

  const busy = phase.kind !== "idle";
  useEffect(() => {
    onBusyChange(busy);
  }, [onBusyChange, busy]);

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

      setNote("");
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
    setNote("");
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
    return props.headSlot === null
      ? null
      : createPortal(
          <IdleActions
            onSelect={enterSelecting}
            stacked={props.headSlot.classList.contains(FAVORITES_SIDE_ACTIONS_CLASS)}
          />,
          props.headSlot,
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
  const browsing = document.body.classList.contains(FAVORITES_BROWSING_BODY_CLASS);
  return (
    <>
      <div className={BAR_CLASS}>
        <span className={STATUS_CLASS}>{selectedCountLabel(count)}</span>
        <span className={SUMMARY_CLASS} role={note.length > 0 ? "status" : undefined}>
          {note.length > 0 ? note : props.summary}
        </span>
        <Button variant="secondary" size="s" onClick={selectPage}>
          {browsing ? TEXT_SELECT_LOADED : TEXT_SELECT_PAGE}
        </Button>
        <Button variant="secondary" size="s" onClick={clearSelection}>
          {TEXT_CLEAR}
        </Button>
        <Button
          variant="secondary"
          size="s"
          disabled={count === 0 || confirmOpen}
          onClick={() => {
            setCollectionPosts(selectedPostsOnPage(selectedRef.current));
          }}
        >
          {TEXT_ADD_TO_COLLECTION}
        </Button>
        <Button
          variant="danger"
          size="s"
          disabled={count === 0 || confirmOpen}
          onClick={beginConfirm}
        >
          <IconTrash size={14} />
          {removeSelectedLabel(count)}
        </Button>
        <Button variant="ghost" size="s" onClick={resetToIdle}>
          {TEXT_CANCEL}
        </Button>
      </div>
      <BulkCollectionDialog
        open={collectionPosts !== null}
        posts={collectionPosts ?? []}
        onClose={() => {
          setCollectionPosts(null);
        }}
        onDone={(result) => {
          refreshAddButtons();
          setNote(bulkCollectionSummary(result));
        }}
      />
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
  return postsLabel(count);
}

type FavoritesPanelProps = {
  /** The pinned row, a sibling of the heading in the page. */
  readonly pin: HTMLElement;
  /** The column of filters beside the grid, or null where the page could not be laid out. */
  readonly side: HTMLElement | null;
  readonly onSelectionModeChange: (active: boolean) => void;
};

/**
 * The page's heading, kept for screen readers only, and, through a portal, the
 * pinned row: search, filters, the count and the buttons. The row is its own
 * element of the page: a sticky element cannot leave its parent, so it has to
 * be a child of the same block the grid is in.
 */
function FavoritesPanel(props: FavoritesPanelProps): JSX.Element {
  const [headActions, setHeadActions] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");

  return (
    <>
      <h1 className={TITLE_CLASS}>{TITLE_TEXT}</h1>
      {createPortal(
        <>
          {/* Hidden, not removed, while posts are being selected: what was typed stays. */}
          {/* In the column the filters stay in view, locked, under the bar. */}
          <div className={FILTERS_CLASS} hidden={busy && props.side === null}>
            <FavoritesBrowser
              actionsRef={setHeadActions}
              onSummary={setSummary}
              sideHost={props.side}
              locked={busy}
            />
          </div>
          <FavoritesBulkBar
            onSelectionModeChange={props.onSelectionModeChange}
            headSlot={headActions}
            summary={summary}
            onBusyChange={setBusy}
          />
        </>,
        props.pin,
      )}
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
  const pin = document.createElement("div");
  pin.id = PIN_ID;
  pin.className = PIN_CLASS;
  host.parent.insertBefore(root, host.before);
  host.parent.insertBefore(pin, host.before);
  // The column of filters stands beside the grid: the block the grid is in is
  // laid out in two columns by a class on it, and the column is one more
  // child of that block. Nothing of the site's is wrapped or moved. Where the
  // block is the page itself there is no such layout, and the filters are
  // drawn in the row.
  const siteGrid = document.querySelector(SITE_SELECTORS.imageList);
  if (siteGrid !== null) {
    bindInPlaceRemoval(siteGrid);
  }

  const onSelectionModeChange = (active: boolean): void => {
    document.body.classList.toggle(BODY_SELECTING_CLASS, active);
  };

  let side: HTMLElement | null = null;
  if (host.parent instanceof HTMLElement && host.parent !== document.body) {
    // The slot is the child of the block and has the column's place; the
    // column itself is held inside it while the page scrolls.
    const slot = document.createElement("div");
    slot.className = FAVORITES_SIDE_SLOT_CLASS;
    const column = document.createElement("div");
    column.id = FAVORITES_SIDE_ID;
    column.className = FAVORITES_SIDE_CLASS;
    // In the column: the selection bar while posts are being selected, and
    // under it the card of filters, which holds the count and the buttons too.
    // There is no strip over the grid then, and no pinned row.
    const barHost = document.createElement("div");
    barHost.className = FAVORITES_SIDE_BAR_CLASS;
    side = document.createElement("div");
    side.className = FAVORITES_SIDE_CARD_CLASS;
    column.append(barHost, side);
    slot.append(column);
    host.parent.insertBefore(slot, root);
    host.parent.classList.add(FAVORITES_LAYOUT_CLASS);
    pin.remove();
    render(
      <FavoritesPanel pin={barHost} side={side} onSelectionModeChange={onSelectionModeChange} />,
      root,
    );
    return;
  }


  render(
    <FavoritesPanel pin={pin} side={side} onSelectionModeChange={onSelectionModeChange} />,
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
