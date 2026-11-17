import type { JSX } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import { log } from "../log";
import { removeFavorite } from "../site/favorites";
import { SITE_SELECTORS, extractPostIdFromFavoritesDeleteOnclick } from "../site/selectors";
import { loadFavSet } from "../storage/favs";
import {
  readFavoriteIndex,
  type FavoriteIndexEntry,
} from "../storage/favorites-index";
import { getFeatureState, setFeatureState } from "../storage/store";
import { STICKY_TOP } from "../boot/sticky-header";
import {
  Button,
  Chip,
  SearchField,
  SectionLabel,
  Segmented,
  type SearchHelp,
  type SegmentedOption,
} from "../ui/kit";
import type { SearchSuggest, SearchSuggestList } from "../ui/kit/search-field";
import {
  MEDIA_ALL,
  MEDIA_IMAGES,
  MEDIA_VIDEOS,
  filterFavoriteIndex,
  isEmptyFavoritesQuery,
  isFavoritesMedia,
  parseFavoritesQuery,
  shuffleBySeed,
  topFavoriteTags,
  type FavoritesMedia,
  type TagCount,
} from "./favorites-search";
import {
  GROUP_INSIDE,
  closestTag,
  completeWord,
  queryChips,
  removeChip,
  suggestFor,
  toggleChip,
  unknownWords,
  wordAtCaret,
  type Suggestions,
} from "./favorites-suggest";
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
/** On the block the grid is in, once the column of filters is put beside it. */
export const FAVORITES_LAYOUT_CLASS = "rdw-fav-layout";
export const FAVORITES_SIDE_ID = "rdw-favorites-side";
export const FAVORITES_SIDE_CLASS = "rdw-fav-side";
/** The child of the laid-out block that holds the column and gives it its place. */
export const FAVORITES_SIDE_SLOT_CLASS = "rdw-fav-side-slot";
/** The width of the sidebar of Posts in the skin: the same column here. */
const FAVORITES_SIDE_WIDTH_PX = 228;
/** The column spans every row of the block: more than the block will ever have. */
const SIDE_ROW_SPAN = 60;
const STATUS_CLASS = "rdw-fav-status";
const SEARCH_BOX_CLASS = "rdw-fav-search-box";
const GROUP_LABEL_CLASS = "rdw-fav-group-label";
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

const VIEW_STATE_ID = "favorites-view";
export const VIEW_PAGES = "pages";
export const VIEW_SCROLL = "scroll";
type FavoritesView = typeof VIEW_PAGES | typeof VIEW_SCROLL;

/** How many tiles are added at a time. */
export const RESULTS_CHUNK = 100;
const TYPING_PAUSE_MS = 250;
const EMPTY_CLASS = "rdw-fav-empty";
const SUGGEST_LABEL = "Tags in your favorites";
const EMPTY_NO_MATCH = "No favorites match this search";
const EMPTY_NO_TAG_PREFIX = "No favorites tagged \u201c";
const EMPTY_NO_TAG_SUFFIX = "\u201d";
const EMPTY_NOTE_CLOSEST = "Tags match whole words. Closest tag in your favorites:";
const EMPTY_NOTE_NONE = "Tags match whole words, and no tag in your favorites has this in it.";
const EMPTY_SHOW_PREFIX = "Show ";
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
];
const SYNTAX_NOTE =
  "Favorites search uses tags only. Metatags (rating:, score:, user:, width:, md5:, parent:) and fuzzy tag~ work in Posts search. The order is set with Sort.";
const SEARCH_HELP: SearchHelp = {
  label: SYNTAX_LABEL,
  rows: SYNTAX_ROWS,
  note: SYNTAX_NOTE,
  widthPx: SYNTAX_POPOVER_WIDTH_PX,
};
/** Shown while Shuffle is on and the query asks for an order: one of them has to give way. */
export const SHUFFLE_OVER_SORT_NOTICE = "Shuffle is on: the order in the search is not applied.";
const UNSUPPORTED_PREFIX = "Not searched here: ";
const UNSUPPORTED_SUFFIX = ". See the ? in the search field.";
const MEDIA_LABEL = "Type";
const VIEW_LABEL = "View";
const SORT_LABEL = "Sort";
/**
 * The order of the list, by when a post was made a favorite. Newest first is
 * the site's own order and the page as it comes; oldest first is the same
 * list turned over. (A third option, by the age of the post itself, was
 * taken out: beside "Newest" it read as the same thing. Kaze, 17.11.2026.)
 */
export const ORDER_NEWEST = "newest";
export const ORDER_OLDEST = "oldest";
export type FavoritesOrder = typeof ORDER_NEWEST | typeof ORDER_OLDEST;
/**
 * A random order is the third option of the same switch (the designer,
 * 17.11.2026): as a button of its own it could be on while the switch still
 * said "Newest". A click on it while it is chosen shuffles again.
 */
export const ORDER_SHUFFLE = "shuffle";
const SORT_OPTIONS: readonly SegmentedOption[] = [
  { value: ORDER_NEWEST, label: "Newest" },
  { value: ORDER_OLDEST, label: "Oldest" },
  { value: ORDER_SHUFFLE, label: "Shuffle" },
];
const SIDE_TITLE = "Search";
const RESHUFFLE_HINT = "Click Shuffle again for another order.";
const LOCKED_NOTICE = "Finish selecting to change filters.";
const CHIPS_LABEL = "Search terms";
const CHIP_EXCLUDE_TITLE = "Click to exclude, click again to include";
const SIDE_GAP_PX = 12;
const SIDE_FADE_PX = 28;
const SCROLL_END_SLACK_PX = 2;
export const SIDE_MORE_CLASS = "rdw-fav-side--more";
export const SIDE_LOCKED_CLASS = "rdw-fav-side--locked";
const SIDE_BODY_CLASS = "rdw-fav-side__body";
const SIDE_GROUP_CLASS = "rdw-fav-side__group";
const SIDE_LOCK_CLASS = "rdw-fav-side__lock";
const SIDE_HINT_CLASS = "rdw-fav-side__hint";
const CHIPS_CLASS = "rdw-fav-chips";
const CHIP_BUTTON_CLASS = "rdw-fav-chip";

export function isFavoritesOrder(value: string): value is FavoritesOrder {
  return value === ORDER_NEWEST || value === ORDER_OLDEST;
}
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
/* The strip over the grid: the count, how the list is paged, the buttons. */
.${CONTROLS_CLASS} {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  min-width: 0;
}
.${CONTROLS_CLASS} .rdw-btn {
  font-weight: 500;
}
.${GROUP_LABEL_CLASS} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
/* The page in two columns: the filters, and everything the site put there.
   Nothing of the site's is wrapped or moved; the block the grid is in becomes
   a grid of its own, and the column of filters is one more child of it. */
.${FAVORITES_LAYOUT_CLASS} {
  display: grid !important;
  grid-template-columns: ${String(FAVORITES_SIDE_WIDTH_PX)}px minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 0;
  align-items: start;
}
.${FAVORITES_LAYOUT_CLASS} > * {
  grid-column: 2;
  min-width: 0;
}
/* The place of the column: the first column, every row. It takes no part in
   the sizing of the rows (a child that spans rows makes them taller by its
   own height), so its size is its place and nothing else. */
.${FAVORITES_LAYOUT_CLASS} > .${FAVORITES_SIDE_SLOT_CLASS} {
  grid-column: 1;
  grid-row: 1 / span ${String(SIDE_ROW_SPAN)};
  align-self: stretch;
  contain: size;
  /* The card starts level with the strip beside it. */
  padding-top: ${String(SIDE_GAP_PX)}px;
  box-sizing: border-box;
}
/* Held beside the grid; taller than the window, it scrolls inside itself. */
.${FAVORITES_SIDE_CLASS} {
  box-sizing: border-box;
  position: sticky;
  top: calc(${STICKY_TOP} + ${String(SIDE_GAP_PX)}px);
  max-height: calc(100vh - ${STICKY_TOP} - ${String(SIDE_GAP_PX * 2)}px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
  color: var(--rdw-text);
  font: 12px/1.4 var(--rdw-font);
}
.${FAVORITES_SIDE_CLASS} * {
  font-family: var(--rdw-font);
}
/* A strip that fades the last lines while there is more below. Not a mask:
   the suggestions and the "?" open from inside the column. */
.${FAVORITES_SIDE_CLASS}.${SIDE_MORE_CLASS}::after {
  content: "";
  position: sticky;
  bottom: 0;
  display: block;
  height: ${String(SIDE_FADE_PX)}px;
  margin-top: -${String(SIDE_FADE_PX)}px;
  background: linear-gradient(to bottom, transparent, var(--rdw-bg));
  pointer-events: none;
}
/* A card, as the search panel of Posts is: the filters read as one block
   and not as controls lying on the page. */
.${SIDE_BODY_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-1);
}
.${SIDE_GROUP_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.${SIDE_HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11.5px;
}
.${CHIPS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.${CHIP_BUTTON_CLASS} {
  display: inline-flex;
  max-width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
/* While posts are being selected the filters cannot be changed. */
.${SIDE_LOCK_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin: 0 0 8px;
  padding: 8px 10px;
  border: 1px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
.${FAVORITES_SIDE_CLASS}.${SIDE_LOCKED_CLASS} .${SIDE_BODY_CLASS} {
  opacity: 0.45;
  pointer-events: none;
}
/* In place of the grid when nothing matches. */
.${EMPTY_CLASS} {
  flex: 1 1 100%;
  box-sizing: border-box;
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 12px 0;
  padding: 28px 16px;
  border: 1px dashed var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  color: var(--rdw-muted);
  font: 13px/1.5 var(--rdw-font);
  text-align: center;
}
.${EMPTY_CLASS} strong {
  color: var(--rdw-text);
  font-weight: 700;
}
.${EMPTY_CLASS} button {
  margin-top: 6px;
}
.${STATUS_CLASS} {
  flex: 0 0 100%;
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
.${COUNT_CLASS} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
  white-space: nowrap;
}
/* The buttons stand at the right end of the strip. */
.${CONTROLS_CLASS} .${ACTIONS_CLASS} {
  display: flex;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-left: auto;
}
.${CONTROLS_CLASS} .${ACTIONS_CLASS}:empty {
  display: none;
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

/** Shows `node` where the results would be: nothing matched. */
export function showFavoriteEmpty(node: HTMLElement): void {
  const target = ensureGrid();
  if (target === null) {
    return;
  }
  target.container.replaceChildren(node);
  target.results = [];
  target.shown = 0;
  target.more.hidden = true;
  document.body.classList.add(FAVORITES_BROWSING_BODY_CLASS);
}

/** Every tag of the favorites with its count, for the suggestions. */
export function favoriteTagCounts(
  index: readonly FavoriteIndexEntry[],
  favorites: ReadonlySet<number>,
): TagCount[] {
  return topFavoriteTags(index, favorites, Number.MAX_SAFE_INTEGER);
}

/** The suggestions in the shape the field draws. */
export function toSuggestList(found: Suggestions | null): SearchSuggestList | null {
  if (found === null) {
    return null;
  }
  return {
    heading: found.heading,
    items: found.items.map((item, at) => ({
      key: `${item.group}:${item.insert}`,
      label: item.label,
      matchStart: item.matchStart,
      matchLength: item.matchLength,
      trailing: item.count === null ? item.caption : item.count.toLocaleString(LOCALE),
      announce:
        item.count === null
          ? `${item.label}, ${item.caption ?? ""}`
          : `${item.label}, ${postsLabel(item.count)}`,
      // A rule before the first tag that only holds the typed part inside.
      divider: at > 0 && item.group === GROUP_INSIDE && found.items[at - 1]?.group !== GROUP_INSIDE,
    })),
  };
}

export type EmptyResult = {
  readonly title: string;
  readonly note: string;
  /** A tag to show instead of the word that is no tag, or null. */
  readonly offer: { readonly word: string; readonly tag: string; readonly count: number } | null;
};

/** What to say when a search found nothing. */
export function describeEmptyResult(text: string, tags: readonly TagCount[]): EmptyResult {
  const word = unknownWords(text, tags)[0];
  if (word === undefined) {
    return { title: EMPTY_NO_MATCH, note: "", offer: null };
  }
  const closest = closestTag(tags, word);
  return {
    title: `${EMPTY_NO_TAG_PREFIX}${word}${EMPTY_NO_TAG_SUFFIX}`,
    note: closest === null ? EMPTY_NOTE_NONE : EMPTY_NOTE_CLOSEST,
    offer: closest === null ? null : { word, tag: closest.tag, count: closest.count },
  };
}

/** The query with one word put in place of another, the rest as typed. */
export function replaceWord(text: string, word: string, tag: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((part) => (part.toLowerCase() === word ? tag : part))
    .join(" ");
}

function buildEmptyNode(result: EmptyResult, onOffer: (word: string, tag: string) => void): HTMLElement {
  const node = document.createElement("div");
  node.className = EMPTY_CLASS;
  node.setAttribute("role", "status");
  const title = document.createElement("strong");
  title.textContent = result.title;
  node.append(title);
  if (result.note.length > 0) {
    const note = document.createElement("span");
    note.textContent = result.note;
    node.append(note);
  }
  const { offer } = result;
  if (offer !== null) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rdw-btn rdw-kit-focusable rdw-btn--secondary rdw-btn--m";
    button.textContent = `${EMPTY_SHOW_PREFIX}${offer.tag} (${offer.count.toLocaleString(LOCALE)})`;
    button.addEventListener("click", () => {
      onOffer(offer.word, offer.tag);
    });
    node.append(button);
  }
  return node;
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
  /**
   * The column the filters are drawn in, beside the grid. Without it they are
   * drawn in place, before the strip (a page whose block could not be laid out).
   */
  readonly sideHost?: HTMLElement | null;
  /** True while posts are being selected: the filters are shown but cannot be changed. */
  readonly locked?: boolean;
  /** Ends the selection; the button beside the notice of a locked column. */
  readonly onUnlock?: () => void;
};

export function FavoritesBrowser(props: FavoritesBrowserProps = {}): JSX.Element {
  // What is in the field, and what the list is narrowed to. They differ while
  // a word is being typed and the suggestions for it are open.
  const [text, setText] = useState("");
  const [applied, setApplied] = useState("");
  const [media, setMedia] = useState<FavoritesMedia>(MEDIA_ALL);
  const [view, setView] = useState<FavoritesView>(() => readView());
  const [index, setIndex] = useState<readonly FavoriteIndexEntry[] | null>(null);
  const [status, setStatus] = useState("");
  // How many favorites the list shows while it is narrowed; null on the site's own grid.
  const [found, setFound] = useState<number | null>(null);
  const loadingRef = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const actionsSlotRef = useRef<HTMLDivElement>(null);

  // A number while the list is shown in a random order, null otherwise.
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  // The order chosen with the Sort switch. Shuffle and it are one or the
  // other: choosing oldest first ends Shuffle, and Shuffle puts the switch back.
  const [order, setOrder] = useState<FavoritesOrder>(ORDER_NEWEST);

  const query = parseFavoritesQuery(applied);
  const active =
    view === VIEW_SCROLL ||
    media !== MEDIA_ALL ||
    shuffleSeed !== null ||
    order !== ORDER_NEWEST ||
    !isEmptyFavoritesQuery(query);

  const { onSummary } = props;
  useEffect(() => {
    onSummary?.(favoritesFilterSummary(applied, media));
  }, [onSummary, applied, media]);

  const loadIndex = (): void => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    readFavoriteIndex()
      .then((entries) => {
        setIndex(entries);
      })
      .catch((error: unknown) => {
        log.warn("favorites-browser: index read failed", error);
        setIndex([]);
      });
  };

  // The suggestions need the index as soon as something is typed.
  useEffect(() => {
    if (text.length > 0 && index === null) {
      loadIndex();
    }
  }, [text, index]);

  const tagCounts = useMemo(
    () => (index === null ? [] : favoriteTagCounts(index, loadFavSet())),
    [index],
  );
  const suggest = useMemo<SearchSuggest>(
    () => ({
      label: SUGGEST_LABEL,
      list: (value, caret) => toSuggestList(suggestFor(tagCounts, wordAtCaret(value, caret))),
      pick: (value, caret, at) => {
        const word = wordAtCaret(value, caret);
        const item = suggestFor(tagCounts, word)?.items[at];
        return word === null || item === undefined ? null : completeWord(value, word, item.insert);
      },
    }),
    [tagCounts],
  );

  // The fade at the bottom of the column says there is more to scroll to.
  const { sideHost } = props;
  useEffect(() => {
    if (sideHost === null || sideHost === undefined) {
      return undefined;
    }
    const sync = (): void => {
      const hidden = sideHost.scrollHeight - sideHost.scrollTop - sideHost.clientHeight;
      sideHost.classList.toggle(SIDE_MORE_CLASS, hidden > SCROLL_END_SLACK_PX);
    };
    sync();
    sideHost.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(sync) : null;
    observer?.observe(sideHost);
    return () => {
      sideHost.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      observer?.disconnect();
    };
  }, [sideHost]);

  const locked = props.locked === true;
  useEffect(() => {
    sideHost?.classList.toggle(SIDE_LOCKED_CLASS, locked);
  }, [sideHost, locked]);

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
      loadIndex();
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
      const typed = parseFavoritesQuery(applied);
      const inSiteOrder = filterFavoriteIndex(index, favorites, typed, media);
      // An order typed into the query (sort:id:asc still works) goes before the switch.
      const matched =
        typed.sort === null && order === ORDER_OLDEST ? [...inSiteOrder].reverse() : inSiteOrder;
      // Shuffle wins over an order typed into the query; the page says so.
      const results = shuffleSeed === null ? matched : shuffleBySeed(matched, shuffleSeed);
      if (results.length === 0 && !isEmptyFavoritesQuery(typed)) {
        // Nothing matched: say why, and offer the nearest tag for a word that is none.
        const empty = describeEmptyResult(applied, tagCounts);
        showFavoriteEmpty(
          buildEmptyNode(empty, (word, tag) => {
            const next = replaceWord(applied, word, tag);
            setText(next);
            setApplied(next);
          }),
        );
      } else {
        showFavoriteResults(results);
      }
      const indexed = index.filter((entry) => favorites.has(entry.id)).length;
      setStatus(indexNotice(indexed, favorites.size));
      setFound(results.length);
    }, TYPING_PAUSE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [active, index, applied, media, shuffleSeed, order, tagCounts]);

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

  const chips = queryChips(text);
  const setQuery = (next: string): void => {
    setText(next);
    setApplied(next);
  };
  const sortValue = shuffleSeed !== null ? ORDER_SHUFFLE : order;

  const filters = (
    <>
      {locked ? (
        <div className={SIDE_LOCK_CLASS} role="status">
          <span>{LOCKED_NOTICE}</span>
          <Button variant="ghost" size="s" onClick={() => props.onUnlock?.()}>
            {UI_TEXT.cancel}
          </Button>
        </div>
      ) : null}
      <div className={SIDE_BODY_CLASS} {...(locked ? { inert: true } : {})}>
        <SectionLabel>{SIDE_TITLE}</SectionLabel>
        <SearchField
          id={SEARCH_FIELD_ID}
          className={SEARCH_BOX_CLASS}
          value={text}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label={SEARCH_ARIA_LABEL}
          clearLabel={CLEAR_LABEL}
          help={SEARCH_HELP}
          suggest={suggest}
          // The index is read when the field is entered, so that the first letter has its list.
          onFocus={loadIndex}
          onChange={setText}
          onCommit={setApplied}
        />
        {notices.length > 0 ? (
          <span className={STATUS_CLASS} role="status">
            {notices.join(" ")}
          </span>
        ) : null}
        {chips.length > 0 ? (
          <div className={CHIPS_CLASS} role="group" aria-label={CHIPS_LABEL}>
            {chips.map((chip) => (
              <button
                key={`${String(chip.start)}:${chip.label}`}
                type="button"
                className={`${CHIP_BUTTON_CLASS} rdw-kit-focusable`}
                title={chip.group ? undefined : CHIP_EXCLUDE_TITLE}
                aria-pressed={chip.group ? undefined : chip.excluded}
                onClick={(event) => {
                  // The cross of the chip takes it out; anywhere else on it excludes the tag.
                  const target = event.target;
                  if (target instanceof Element && target.closest("button") !== event.currentTarget) {
                    return;
                  }
                  setQuery(toggleChip(text, chip));
                }}
              >
                <Chip
                  label={chip.label}
                  variant={chip.group ? "group" : chip.excluded ? "exclude" : "dot"}
                  onRemove={() => {
                    setQuery(removeChip(text, chip));
                  }}
                />
              </button>
            ))}
          </div>
        ) : null}
        <div className={SIDE_GROUP_CLASS}>
          <SectionLabel>{MEDIA_LABEL}</SectionLabel>
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
        </div>
        <div className={SIDE_GROUP_CLASS}>
          <SectionLabel>{SORT_LABEL}</SectionLabel>
          <Segmented
            label={SORT_LABEL}
            options={SORT_OPTIONS}
            value={sortValue}
            onChange={(value) => {
              if (value === ORDER_SHUFFLE) {
                // Chosen again, it shuffles again.
                setShuffleSeed(Date.now());
                setOrder(ORDER_NEWEST);
              } else if (isFavoritesOrder(value)) {
                setShuffleSeed(null);
                setOrder(value);
              }
            }}
          />
          {shuffleSeed !== null ? <p className={SIDE_HINT_CLASS}>{RESHUFFLE_HINT}</p> : null}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{FAVORITES_BROWSER_CSS}</style>
      {sideHost === null || sideHost === undefined ? filters : createPortal(filters, sideHost)}
      <div className={CONTROLS_CLASS} ref={rowRef}>
        {count.length > 0 ? (
          <span className={COUNT_CLASS} role="status">
            {count}
          </span>
        ) : null}
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
        <div className={ACTIONS_CLASS} ref={actionsSlotRef} />
      </div>
    </>
  );
}
