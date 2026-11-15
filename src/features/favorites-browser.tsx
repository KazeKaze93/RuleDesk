import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { log } from "../log";
import { removeFavorite } from "../site/favorites";
import { SITE_SELECTORS, extractPostIdFromFavoritesDeleteOnclick } from "../site/selectors";
import { loadFavSet } from "../storage/favs";
import {
  readFavoriteIndex,
  type FavoriteIndexEntry,
} from "../storage/favorites-index";
import { getFeatureState, setFeatureState } from "../storage/store";
import { Segmented, TextField, type SegmentedOption } from "../ui/kit";
import {
  MEDIA_ALL,
  MEDIA_IMAGES,
  MEDIA_VIDEOS,
  filterFavoriteIndex,
  isEmptyFavoritesQuery,
  isFavoritesMedia,
  parseFavoritesQuery,
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

const VIEW_STATE_ID = "favorites-view";
export const VIEW_PAGES = "pages";
export const VIEW_SCROLL = "scroll";
type FavoritesView = typeof VIEW_PAGES | typeof VIEW_SCROLL;

/** How many tiles are added at a time. */
export const RESULTS_CHUNK = 100;
const TYPING_PAUSE_MS = 250;
const MORE_ROOT_MARGIN = "600px";

const SEARCH_FIELD_ID = "rdw-fav-search";
const SEARCH_PLACEHOLDER = "Search favorites: tag -tag tag*";
const MEDIA_LABEL = "Media";
const VIEW_LABEL = "Paging";
const MORE_LABEL = "Show more";
const LOCALE = "en-US";
const NO_INDEX_STATUS =
  "No index yet: run Full resync in RuleDesk → Favorites to search and scroll here.";
const REMOVE_FAILED_STATUS = "Could not remove the favorite. Try again.";

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
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
}
.${CONTROLS_CLASS} .${SEARCH_FIELD_CLASS} {
  flex: 0 1 260px;
  min-width: 0;
  margin: 0;
}
.${STATUS_CLASS} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
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
 * The bin of a result cell removes the favorite in place. The site's own link
 * would leave for the delete address and come back to its first page.
 */
function onResultsClick(event: Event): void {
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
  container.addEventListener("click", onResultsClick, true);
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

function statusText(shown: number, indexed: number, favorites: number): string {
  const found = `${shown.toLocaleString(LOCALE)} found`;
  if (indexed >= favorites) {
    return found;
  }
  return `${found} · the index holds ${indexed.toLocaleString(LOCALE)} of ${favorites.toLocaleString(LOCALE)} favorites; Full resync in RuleDesk → Favorites adds the rest`;
}

export function FavoritesBrowser(): JSX.Element {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<FavoritesMedia>(MEDIA_ALL);
  const [view, setView] = useState<FavoritesView>(() => readView());
  const [index, setIndex] = useState<readonly FavoriteIndexEntry[] | null>(null);
  const [status, setStatus] = useState("");
  const loadingRef = useRef(false);

  const query = parseFavoritesQuery(text);
  const active = view === VIEW_SCROLL || media !== MEDIA_ALL || !isEmptyFavoritesQuery(query);

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
        return;
      }
      const results = filterFavoriteIndex(index, favorites, parseFavoritesQuery(text), media);
      showFavoriteResults(results);
      const indexed = index.filter((entry) => favorites.has(entry.id)).length;
      setStatus(statusText(results.length, indexed, favorites.size));
    }, TYPING_PAUSE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [active, index, text, media]);

  return (
    <div className={CONTROLS_CLASS}>
      <style>{FAVORITES_BROWSER_CSS}</style>
      <TextField
        id={SEARCH_FIELD_ID}
        className={SEARCH_FIELD_CLASS}
        value={text}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label={SEARCH_PLACEHOLDER}
        onChange={setText}
      />
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
      {status.length > 0 ? (
        <span className={STATUS_CLASS} role="status">
          {status}
        </span>
      ) : null}
    </div>
  );
}
