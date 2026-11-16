import type { JSX } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

import { log } from "../log";
import { removeFavorite } from "../site/favorites";
import { SITE_SELECTORS, extractPostIdFromFavoritesDeleteOnclick } from "../site/selectors";
import { loadFavSet } from "../storage/favs";
import {
  readFavoriteIndex,
  type FavoriteIndexEntry,
} from "../storage/favorites-index";
import { getFeatureState, setFeatureState } from "../storage/store";
import {
  Button,
  IconHelp,
  IconSearch,
  IconShuffle,
  IconX,
  Popover,
  Segmented,
  TextField,
  type SegmentedOption,
} from "../ui/kit";
import {
  MEDIA_ALL,
  MEDIA_IMAGES,
  MEDIA_VIDEOS,
  filterFavoriteIndex,
  isEmptyFavoritesQuery,
  isFavoritesMedia,
  parseFavoritesQuery,
  shuffleBySeed,
  type FavoritesMedia,
} from "./favorites-search";
import { notifyThumbsAdded } from "./runtime";

/**
 * Search, the Images / Videos switch and endless scrolling on the Favorites
 * page, all from the local index (`src/storage/favorites-index.ts`), without
 * requests.
 *
 * While any of them is on, the site's own grid and pager are hidden and the
 * matching favorites are drawn in a grid of the same markup the site uses for
 * a favorites cell. Everything that works on the site's cells (the video
 * outline and preview, the collections button, the bin, selecting) therefore
 * works on these too.
 */

export const FAVORITES_BROWSING_BODY_CLASS = "rdw-fav-browsing";
export const FAVORITES_RESULTS_CLASS = "rdw-fav-results";
const MORE_CLASS = "rdw-fav-more";
const CONTROLS_CLASS = "rdw-fav-controls";
const STATUS_CLASS = "rdw-fav-status";
const SEARCH_FIELD_CLASS = "rdw-fav-search";
const SEARCH_BOX_CLASS = "rdw-fav-search-box";
const SEARCH_ICON_CLASS = "rdw-fav-search-icon";
const SEARCH_TOOLS_CLASS = "rdw-fav-search-tools";
const SEARCH_TOOL_CLASS = "rdw-fav-search-tool";
const GROUP_LABEL_CLASS = "rdw-fav-group-label";
const SYNTAX_CLASS = "rdw-fav-syntax";
const SYNTAX_NOTE_CLASS = "rdw-fav-syntax-note";
const COUNT_CLASS = "rdw-favorites-count";
/** The right end of the row: the buttons the bulk bar puts there. */
export const ACTIONS_CLASS = "rdw-favorites-head-actions";
/**
 * How far the row of controls has been squeezed to fit, on the row itself:
 * 0 all of it, 1 without the group labels, 2 with the search field at its
 * least width, 3 on two lines.
 */
export const FIT_ATTRIBUTE = "data-fit";
export const FIT_STEPS = [0, 1, 2, 3] as const;
const SEARCH_WIDTH_PX = 320;
const SEARCH_MIN_WIDTH_PX = 200;
const SEARCH_MAX_WIDTH_PX = 560;
const SYNTAX_POPOVER_WIDTH_PX = 340;
const SYNTAX_FONT = 'ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace';

const VIEW_STATE_ID = "favorites-view";
export const VIEW_PAGES = "pages";
export const VIEW_SCROLL = "scroll";
type FavoritesView = typeof VIEW_PAGES | typeof VIEW_SCROLL;

/** How many tiles are added at a time. */
export const RESULTS_CHUNK = 100;
const TYPING_PAUSE_MS = 250;
const MORE_ROOT_MARGIN = "600px";

const SEARCH_FIELD_ID = "rdw-fav-search";
const SEARCH_PLACEHOLDER = "Search your favorites";
const SEARCH_ARIA_LABEL = "Search favorites";
const CLEAR_LABEL = "Clear search";
const SYNTAX_LABEL = "Search syntax";
/** What the search understands: an example and what it finds. */
const SYNTAX_ROWS: readonly (readonly [string, string])[] = [
  ["cat dog", "posts with both tags"],
  ["( cat ~ dog )", "posts with either tag; keep the spaces"],
  ["-sketch", "posts without the tag"],
  ["ca*t", "any tag that starts with ca and ends with t"],
  ["sort:id:asc", "by post id, the oldest post first"],
  ["sort:id:desc", "by post id, the newest post first"],
];
const SYNTAX_NOTE =
  "Favorites search uses tags and post id only. Other metatags (rating:, score:, user:, width:, md5:, parent:) and fuzzy tag~ work in Posts search. For a random order use Shuffle.";
/** Shown while Shuffle is on and the query asks for an order: one of them has to give way. */
export const SHUFFLE_OVER_SORT_NOTICE = "Shuffle is on: the order in the search is not applied.";
const UNSUPPORTED_PREFIX = "Not searched here: ";
const UNSUPPORTED_SUFFIX = ". See the ? in the search field.";
const MEDIA_LABEL = "Type";
const VIEW_LABEL = "View";
const MORE_LABEL = "Show more";
const LOCALE = "en-US";
const NO_INDEX_STATUS =
  "No index yet: run Full resync in RuleDesk → Favorites to search and scroll here.";
const REMOVE_FAILED_STATUS = "Could not remove the favorite. Try again.";
const SHUFFLE_LABEL = "Shuffle";
const SHUFFLE_TITLE = "Show the favorites in a random order";

const MEDIA_OPTIONS: readonly SegmentedOption[] = [
  { value: MEDIA_ALL, label: "All" },
  { value: MEDIA_IMAGES, label: "Images" },
  { value: MEDIA_VIDEOS, label: "Videos" },
];
const VIEW_OPTIONS: readonly SegmentedOption[] = [
  { value: VIEW_PAGES, label: "Pages" },
  { value: VIEW_SCROLL, label: "Scroll" },
];

/** The site's own inline style of a favorites cell. */
const CELL_STYLE = "align-self: flex-start; display: grid; grid-template-rows: auto 10px;";
const POST_HREF_PREFIX = "index.php?page=post&s=view&id=";
const IMAGE_ALT = "image_thumb";
const REMOVE_TEXT = "Remove";

export const FAVORITES_BROWSER_CSS = `
body.${FAVORITES_BROWSING_BODY_CLASS} ${SITE_SELECTORS.imageList}:not(.${FAVORITES_RESULTS_CLASS}),
body.${FAVORITES_BROWSING_BODY_CLASS} #paginator {
  display: none !important;
}
body:not(.${FAVORITES_BROWSING_BODY_CLASS}) .${FAVORITES_RESULTS_CLASS},
body:not(.${FAVORITES_BROWSING_BODY_CLASS}) .${MORE_CLASS} {
  display: none;
}
.${CONTROLS_CLASS} {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  min-width: 0;
  overflow: hidden;
  /* Room for the focus outline of the controls at the edges. */
  padding: 3px;
  margin: -3px;
}
.${CONTROLS_CLASS} > * {
  flex: none;
}
.${CONTROLS_CLASS} .rdw-btn {
  font-weight: 500;
}
.${CONTROLS_CLASS} .${SEARCH_BOX_CLASS} {
  position: relative;
  flex: 1 1 ${String(SEARCH_WIDTH_PX)}px;
  min-width: ${String(SEARCH_WIDTH_PX)}px;
  max-width: ${String(SEARCH_MAX_WIDTH_PX)}px;
}
.${CONTROLS_CLASS} .${SEARCH_FIELD_CLASS} {
  margin: 0;
}
.${CONTROLS_CLASS} .${SEARCH_FIELD_CLASS} .rdw-field__input {
  padding-left: 30px;
  padding-right: 56px;
}
.${SEARCH_ICON_CLASS} {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--rdw-muted);
  pointer-events: none;
}
.${SEARCH_TOOLS_CLASS} {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
}
.${SEARCH_TOOL_CLASS} {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-muted);
  cursor: pointer;
}
.${SEARCH_TOOL_CLASS}:hover,
.${SEARCH_TOOL_CLASS}[aria-expanded="true"] {
  color: var(--rdw-text);
}
.${GROUP_LABEL_CLASS} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
.${CONTROLS_CLASS}:not([${FIT_ATTRIBUTE}="0"]) .${GROUP_LABEL_CLASS} {
  display: none;
}
.${CONTROLS_CLASS}[${FIT_ATTRIBUTE}="2"] .${SEARCH_BOX_CLASS},
.${CONTROLS_CLASS}[${FIT_ATTRIBUTE}="3"] .${SEARCH_BOX_CLASS} {
  min-width: ${String(SEARCH_MIN_WIDTH_PX)}px;
}
.${CONTROLS_CLASS}[${FIT_ATTRIBUTE}="3"] {
  flex-wrap: wrap;
}
.${CONTROLS_CLASS}[${FIT_ATTRIBUTE}="3"] .${SEARCH_BOX_CLASS} {
  flex: 1 0 100%;
  max-width: none;
}
.${SYNTAX_CLASS} {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  margin: 0;
}
/* The site styles dt on its own (bold, its own font); a command has to be in
   a fixed-width font, or the spaces that matter in it cannot be seen. */
.rdw-popover .${SYNTAX_CLASS} dt {
  margin: 0;
  font: 400 12px/1.4 ${SYNTAX_FONT} !important;
  white-space: pre;
  color: var(--rdw-text);
}
.${SYNTAX_CLASS} dd {
  margin: 0;
  color: var(--rdw-muted);
}
.${STATUS_CLASS} {
  flex: 0 0 100%;
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
.${COUNT_CLASS} {
  margin-left: auto;
  padding-left: 0.5rem;
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
  white-space: nowrap;
}
.${CONTROLS_CLASS} .${ACTIONS_CLASS} {
  display: flex;
  align-items: center;
  gap: 0.35rem 0.5rem;
}
.${CONTROLS_CLASS} .${ACTIONS_CLASS}:empty {
  display: none;
}
.${SYNTAX_NOTE_CLASS} {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--rdw-border);
  color: var(--rdw-muted);
  line-height: 1.4;
}
.${MORE_CLASS} {
  display: block;
  margin: 12px auto 24px;
  padding: 6px 14px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 600 12px var(--rdw-font);
  cursor: pointer;
}
.${MORE_CLASS}[hidden] {
  display: none;
}
`.trim();

function isFavoritesView(value: unknown): value is FavoritesView {
  return value === VIEW_PAGES || value === VIEW_SCROLL;
}

function readView(): FavoritesView {
  const stored = getFeatureState(VIEW_STATE_ID);
  return isFavoritesView(stored) ? stored : VIEW_PAGES;
}

/** Where the favorites cells on screen are: the results grid while it is shown. */
export function favoritesGridRoot(): ParentNode {
  if (document.body.classList.contains(FAVORITES_BROWSING_BODY_CLASS)) {
    const results = document.querySelector(`.${FAVORITES_RESULTS_CLASS}`);
    if (results !== null) {
      return results;
    }
  }
  return document;
}

/** A cell with the markup of the site's favorites grid. */
export function buildFavoriteCell(entry: FavoriteIndexEntry): HTMLElement {
  const id = String(entry.id);
  const cell = document.createElement("span");
  cell.setAttribute("style", CELL_STYLE);

  const thumb = document.createElement("span");
  thumb.className = "thumb";
  const link = document.createElement("a");
  link.id = `p${id}`;
  link.href = `${POST_HREF_PREFIX}${id}`;
  const img = document.createElement("img");
  img.src = entry.thumb;
  img.title = entry.tags;
  img.alt = IMAGE_ALT;
  img.loading = "lazy";
  link.append(img);
  thumb.append(link);

  const remove = document.createElement("a");
  remove.href = "#";
  remove.setAttribute(
    "onclick",
    `document.location='index.php?page=favorites&s=delete&id=${id}&return_pid=0'; return false;`,
  );
  const bold = document.createElement("b");
  bold.textContent = REMOVE_TEXT;
  remove.append(bold);

  cell.append(thumb, document.createElement("br"), remove);
  return cell;
}

type Grid = {
  readonly container: HTMLElement;
  readonly more: HTMLButtonElement;
  results: readonly FavoriteIndexEntry[];
  shown: number;
};

let grid: Grid | null = null;
let onRemoveFailed: (() => void) | null = null;

function appendChunk(target: Grid): void {
  const next = target.results.slice(target.shown, target.shown + RESULTS_CHUNK);
  for (const entry of next) {
    target.container.append(buildFavoriteCell(entry));
  }
  target.shown += next.length;
  target.more.hidden = target.shown >= target.results.length;
  if (next.length > 0) {
    notifyThumbsAdded(target.container);
  }
}

/**
 * The bin of a cell removes the favorite in place, on the site's own grid as
 * well as on the results. The site's own link would leave for the delete
 * address and come back to the top of the first page.
 */
function onGridClick(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const link = target.closest("a[onclick]");
  if (!(link instanceof HTMLAnchorElement)) {
    return;
  }
  const postId = extractPostIdFromFavoritesDeleteOnclick(link.getAttribute("onclick") ?? "");
  if (postId === null) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const cell = link.parentElement;
  removeFavorite(postId)
    .then((result) => {
      if (result.status === "removed") {
        cell?.remove();
        return;
      }
      onRemoveFailed?.();
    })
    .catch((error: unknown) => {
      log.warn("favorites-browser: remove failed", error);
      onRemoveFailed?.();
    });
}

const boundGrids = new WeakSet<Element>();

/** Makes the bins of the cells under `gridRoot` remove without leaving the page. */
export function bindInPlaceRemoval(gridRoot: Element): void {
  if (boundGrids.has(gridRoot)) {
    return;
  }
  boundGrids.add(gridRoot);
  gridRoot.addEventListener("click", onGridClick, true);
}

function ensureGrid(): Grid | null {
  if (grid !== null && grid.container.isConnected) {
    return grid;
  }
  const siteList = document.querySelector(
    `${SITE_SELECTORS.imageList}:not(.${FAVORITES_RESULTS_CLASS})`,
  );
  if (siteList === null) {
    return null;
  }
  const container = document.createElement("div");
  container.className = `image-list ${FAVORITES_RESULTS_CLASS}`;
  bindInPlaceRemoval(container);
  const more = document.createElement("button");
  more.type = "button";
  more.className = MORE_CLASS;
  more.textContent = MORE_LABEL;
  more.hidden = true;
  siteList.after(container, more);

  const created: Grid = { container, more, results: [], shown: 0 };
  more.addEventListener("click", () => {
    appendChunk(created);
  });
  if (typeof IntersectionObserver === "function") {
    new IntersectionObserver(
      (records) => {
        if (records.some((record) => record.isIntersecting)) {
          appendChunk(created);
        }
      },
      { rootMargin: MORE_ROOT_MARGIN },
    ).observe(more);
  }
  grid = created;
  return created;
}

/** Shows `results` instead of the site's grid. */
export function showFavoriteResults(results: readonly FavoriteIndexEntry[]): void {
  const target = ensureGrid();
  if (target === null) {
    return;
  }
  target.container.replaceChildren();
  target.results = results;
  target.shown = 0;
  document.body.classList.add(FAVORITES_BROWSING_BODY_CLASS);
  appendChunk(target);
}

/** Gives the page back to the site's grid and pager. */
export function hideFavoriteResults(): void {
  document.body.classList.remove(FAVORITES_BROWSING_BODY_CLASS);
  if (grid !== null) {
    grid.container.replaceChildren();
    grid.results = [];
    grid.shown = 0;
    grid.more.hidden = true;
  }
}

/** Forgets the grid (tests). */
export function resetFavoritesBrowserState(): void {
  hideFavoriteResults();
  grid?.container.remove();
  grid?.more.remove();
  grid = null;
  onRemoveFailed = null;
}

/** "11,962 posts"; a count of none is said too, unlike in the page's own total. */
export function postsLabel(count: number): string {
  return `${count.toLocaleString(LOCALE)} ${count === 1 ? "post" : "posts"}`;
}

/** Says so when the index does not hold every favorite; nothing otherwise. */
function indexNotice(indexed: number, favorites: number): string {
  if (indexed >= favorites) {
    return "";
  }
  return `The index holds ${indexed.toLocaleString(LOCALE)} of ${favorites.toLocaleString(LOCALE)} favorites; Full resync in RuleDesk → Favorites adds the rest.`;
}

/** Names the typed terms the index cannot answer; nothing when there are none. */
export function unsupportedNotice(terms: readonly string[]): string {
  if (terms.length === 0) {
    return "";
  }
  return `${UNSUPPORTED_PREFIX}${terms.join(", ")}${UNSUPPORTED_SUFFIX}`;
}

/** Opens a random post of the local list of favorites. */
export function openRandomFavorite(): void {
  const ids = [...loadFavSet()];
  const id = ids[Math.floor(Math.random() * ids.length)];
  if (id !== undefined) {
    window.location.assign(`${POST_HREF_PREFIX}${String(id)}`);
  }
}

/**
 * Squeezes the row of controls until it fits its width, a step at a time, and
 * stops at the first step that fits. Measured, not tied to window widths: how
 * wide the controls are depends on the theme's font and on the labels.
 */
export function fitControlsRow(row: HTMLElement): number {
  let applied: number = FIT_STEPS[0];
  for (const step of FIT_STEPS) {
    applied = step;
    row.setAttribute(FIT_ATTRIBUTE, String(step));
    if (row.scrollWidth <= row.clientWidth) {
      break;
    }
  }
  return applied;
}

/** "cat* -video · Images": what the list is narrowed to, for the selection bar. */
export function favoritesFilterSummary(text: string, media: FavoritesMedia): string {
  const parts: string[] = [];
  const query = text.trim();
  if (query.length > 0) {
    parts.push(query);
  }
  const option = MEDIA_OPTIONS.find((item) => item.value === media);
  if (media !== MEDIA_ALL && option !== undefined) {
    parts.push(option.label);
  }
  return parts.join(" · ");
}

export type FavoritesBrowserProps = {
  /** Given the element at the right end of the row, for the page's buttons. */
  readonly actionsRef?: (slot: HTMLElement | null) => void;
  /** Told what the list is narrowed to whenever that changes. */
  readonly onSummary?: (summary: string) => void;
};

export function FavoritesBrowser(props: FavoritesBrowserProps = {}): JSX.Element {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<FavoritesMedia>(MEDIA_ALL);
  const [view, setView] = useState<FavoritesView>(() => readView());
  const [index, setIndex] = useState<readonly FavoriteIndexEntry[] | null>(null);
  const [status, setStatus] = useState("");
  // How many favorites the list shows while it is narrowed; null on the site's own grid.
  const [found, setFound] = useState<number | null>(null);
  const [syntaxOpen, setSyntaxOpen] = useState(false);
  const loadingRef = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const actionsSlotRef = useRef<HTMLDivElement>(null);
  const syntaxButtonRef = useRef<HTMLButtonElement>(null);

  // A number while the list is shown in a random order, null otherwise.
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);

  const query = parseFavoritesQuery(text);
  const active =
    view === VIEW_SCROLL ||
    media !== MEDIA_ALL ||
    shuffleSeed !== null ||
    !isEmptyFavoritesQuery(query);

  const { onSummary } = props;
  useEffect(() => {
    onSummary?.(favoritesFilterSummary(text, media));
  }, [onSummary, text, media]);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (row === null) {
      return undefined;
    }
    fitControlsRow(row);
    if (typeof ResizeObserver !== "function") {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      fitControlsRow(row);
    });
    observer.observe(row);
    // The buttons at the right end arrive after the row is drawn.
    if (actionsSlotRef.current !== null) {
      observer.observe(actionsSlotRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    onRemoveFailed = (): void => {
      setStatus(REMOVE_FAILED_STATUS);
    };
    return () => {
      onRemoveFailed = null;
    };
  }, []);

  useEffect(() => {
    if (!active) {
      hideFavoriteResults();
      setStatus("");
      setFound(null);
      return undefined;
    }
    if (index === null) {
      if (!loadingRef.current) {
        loadingRef.current = true;
        readFavoriteIndex()
          .then((entries) => {
            setIndex(entries);
          })
          .catch((error: unknown) => {
            log.warn("favorites-browser: index read failed", error);
            setIndex([]);
          });
      }
      return undefined;
    }
    const timer = window.setTimeout(() => {
      const favorites = loadFavSet();
      if (index.length === 0) {
        hideFavoriteResults();
        setStatus(NO_INDEX_STATUS);
        setFound(null);
        return;
      }
      const parsed = parseFavoritesQuery(text);
      const matched = filterFavoriteIndex(index, favorites, parsed, media);
      // Shuffle wins over an order typed into the query; the page says so.
      const results = shuffleSeed === null ? matched : shuffleBySeed(matched, shuffleSeed);
      showFavoriteResults(results);
      const indexed = index.filter((entry) => favorites.has(entry.id)).length;
      setStatus(indexNotice(indexed, favorites.size));
      setFound(results.length);
    }, TYPING_PAUSE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [active, index, text, media, shuffleSeed]);

  const notices = [
    unsupportedNotice(query.unsupported),
    shuffleSeed !== null && query.sort !== null ? SHUFFLE_OVER_SORT_NOTICE : "",
    status,
  ].filter(
    (line) => line.length > 0,
  );
  const total = loadFavSet().size;
  const count = found !== null ? postsLabel(found) : total > 0 ? postsLabel(total) : "";
  const { actionsRef } = props;
  useEffect(() => {
    actionsRef?.(actionsSlotRef.current);
    return () => {
      actionsRef?.(null);
    };
  }, [actionsRef]);

  return (
    <>
    <div className={CONTROLS_CLASS} ref={rowRef}>
      <style>{FAVORITES_BROWSER_CSS}</style>
      <div className={SEARCH_BOX_CLASS}>
        <IconSearch className={SEARCH_ICON_CLASS} size={14} />
        <TextField
          id={SEARCH_FIELD_ID}
          className={SEARCH_FIELD_CLASS}
          value={text}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label={SEARCH_ARIA_LABEL}
          onChange={setText}
        />
        <span className={SEARCH_TOOLS_CLASS}>
          {text.length > 0 ? (
            <button
              type="button"
              className={`${SEARCH_TOOL_CLASS} rdw-kit-focusable`}
              aria-label={CLEAR_LABEL}
              title={CLEAR_LABEL}
              onClick={() => {
                setText("");
                document.getElementById(SEARCH_FIELD_ID)?.focus();
              }}
            >
              <IconX size={14} />
            </button>
          ) : null}
          <button
            type="button"
            ref={syntaxButtonRef}
            className={`${SEARCH_TOOL_CLASS} rdw-kit-focusable`}
            aria-label={SYNTAX_LABEL}
            title={SYNTAX_LABEL}
            aria-expanded={syntaxOpen}
            onClick={() => {
              setSyntaxOpen(!syntaxOpen);
            }}
          >
            <IconHelp size={14} />
          </button>
        </span>
        <Popover
          open={syntaxOpen}
          onClose={() => {
            setSyntaxOpen(false);
          }}
          anchorRef={syntaxButtonRef}
          widthPx={SYNTAX_POPOVER_WIDTH_PX}
          alignEnd
          aria-label={SYNTAX_LABEL}
        >
          <dl className={SYNTAX_CLASS}>
            {SYNTAX_ROWS.map(([example, meaning]) => (
              <>
                <dt>{example}</dt>
                <dd>{meaning}</dd>
              </>
            ))}
          </dl>
          <p className={SYNTAX_NOTE_CLASS}>{SYNTAX_NOTE}</p>
        </Popover>
      </div>
      <span className={GROUP_LABEL_CLASS} aria-hidden="true">
        {MEDIA_LABEL}
      </span>
      <Segmented
        label={MEDIA_LABEL}
        options={MEDIA_OPTIONS}
        value={media}
        onChange={(value) => {
          if (isFavoritesMedia(value)) {
            setMedia(value);
          }
        }}
      />
      <span className={GROUP_LABEL_CLASS} aria-hidden="true">
        {VIEW_LABEL}
      </span>
      <Segmented
        label={VIEW_LABEL}
        options={VIEW_OPTIONS}
        value={view}
        onChange={(value) => {
          if (isFavoritesView(value)) {
            setFeatureState(VIEW_STATE_ID, value);
            setView(value);
          }
        }}
      />
      <Button
        variant="secondary"
        size="s"
        title={SHUFFLE_TITLE}
        pressed={shuffleSeed !== null}
        onClick={() => {
          setShuffleSeed(shuffleSeed === null ? Date.now() : null);
        }}
      >
        <IconShuffle size={14} />
        {SHUFFLE_LABEL}
      </Button>
      {count.length > 0 ? (
        <span className={COUNT_CLASS} role="status">
          {count}
        </span>
      ) : null}
      <div className={ACTIONS_CLASS} ref={actionsSlotRef} />
    </div>
    {notices.length > 0 ? (
      <span className={STATUS_CLASS} role="status">
        {notices.join(" ")}
      </span>
    ) : null}
    </>
  );
}
