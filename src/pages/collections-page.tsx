import { STICKY_TOP } from "../boot/sticky-header";
import type { ComponentChildren, JSX } from "preact";
import { render as preactRender } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import {
  COLLECTION_KIND_POSTS,
  COLLECTION_KIND_SEARCH,
  UI_TEXT,
} from "../config/constants";
import { buildSearchUrl, isUnfilteredQuery, serialize } from "../search/query";
import {
  resolveCollectionKind,
  type Collection,
} from "../storage/schema";
import { readCountMirror, readCoverMirror } from "../storage/cover-mirror";
import {
  createCollectionGroup,
  createDynamicCollection,
  createPlaylist,
  deleteCollection,
  deleteCollectionGroup,
  dynamicHasNew,
  getFeatureState,
  listCollectionGroups,
  load,
  reloadFromStorage,
  renameCollectionGroup,
  setCollectionGroup,
  setFeatureState,
} from "../storage/store";
import {
  GROUP_ALL,
  GroupDialogs,
  GroupTabs,
  MoveToGroupMenu,
  countGroups,
  inGroupTab,
  type GroupRequest,
} from "../ui/groups";
import {
  Button,
  SelectionBar,
  Dialog,
  IconButton,
  OverlayInPlace,
  EmptyState,
  Segmented,
  Select,
  TextField,
  type SegmentedOption,
  type SelectOption,
} from "../ui/kit";
import { SearchField } from "../ui/kit/search-field";
import { IconCheck, IconPlus, IconX } from "../ui/kit/icons";
import { QueryField } from "../ui/query-field";
import { collectionDetailHash, dynamicCollectionMarkHash } from "./constants";
import { checkableCollections, runCollectionsCheck } from "./collections-check";

const EVENT_PAGESHOW = "pageshow";

const PAGE_CLASS = "rdw-collections-page";
const HEADER_CLASS = "rdw-collections-header";
const TOOLBAR_CLASS = "rdw-collections-toolbar";
const FILTER_FIELD_CLASS = "rdw-collections-filter";
const GRID_CLASS = "rdw-collections-grid";
const GRID_LIST_CLASS = "rdw-collections-grid--list";
/** Around a card: the card is a link, and the button of its group cannot be inside one. */
const CELL_CLASS = "rdw-collections-cell";
const CELL_ACTIONS_CLASS = "rdw-collections-cell-actions";
const MOVE_ONE_PREFIX = "Move to a group: ";
/** What a card carries while it is dragged to a tab of a group. */
const DRAG_DATA_TYPE = "text/plain";
const LIST_COVER_PX = 44;
const CARD_CLASS = "rdw-collection-card";
const COVER_CLASS = "rdw-collection-cover";
const COVER_CELL_CLASS = "rdw-collection-cover-cell";
const COVER_IMAGE_CLASS = "rdw-collection-cover-image";
const COVER_EMPTY_CLASS = "rdw-collection-cover-empty";
const META_ROW_CLASS = "rdw-collection-meta-row";
const NAME_CLASS = "rdw-collection-name";
const CAPTION_CLASS = "rdw-collection-caption";
const FORM_ERROR_CLASS = "rdw-collection-form-error";
const FORM_HINT_CLASS = "rdw-collections-form-hint";
const FIELD_NAME = "name";
const FIELD_QUERY = "query";
type FormField = typeof FIELD_NAME | typeof FIELD_QUERY;
const KIND_HINT_CUSTOM = "Posts you add by hand.";
const KIND_HINT_DYNAMIC = "A saved search. Check for new shows when it grows.";
const QUERY_HINT = "Same syntax as the site search.";
const CARD_SELECTED_CLASS = "rdw-collection-card--selected";
const CARD_MARK_CLASS = "rdw-collection-card-mark";
const SELECTED_COUNT_CLASS = "rdw-collections-selected-count";

const FILTER_ALL = "all";
const FILTER_CUSTOM = "custom";
const FILTER_DYNAMIC = "dynamic";
const KIND_CUSTOM = "custom";
const KIND_DYNAMIC = "dynamic";

const FILTER_ALL_LABEL = "All";
const FILTER_CUSTOM_LABEL = "Custom";
const FILTER_DYNAMIC_LABEL = "Dynamic";
const NEW_BUTTON_LABEL = "New";
const SELECT_BUTTON_LABEL = "Select";
const SELECT_BUTTON_TITLE = "Select collections to delete";
/** In the bar of the selection: the dots say a confirmation follows. */
const DELETE_SELECTED_LABEL = `${UI_TEXT.delete}\u2026`;
const DELETE_DIALOG_TITLE = "Delete collections";
const DELETE_ONE_DIALOG_TITLE = "Delete collection";
/** The cross of a card: "Delete " and the name of the collection. */
export const DELETE_ONE_PREFIX = `${UI_TEXT.delete} `;
const DELETE_ONE_MESSAGE = "Delete 1 collection? This cannot be undone.";
const DELETE_MANY_PREFIX = "Delete ";
const DELETE_MANY_SUFFIX = " collections? This cannot be undone.";
const ROLE_CHECKBOX = "checkbox";
const SINGLE_SELECTION = 1;
/** How many names the confirmation of a delete lists before "and N more". */
const DELETE_NAMES_SHOWN = 3;
const CHECK_FAILED_CLASS = "rdw-collections-check--failed";
const CHECK_RETRY_LABEL = "Retry";
const NEW_DIALOG_TITLE = "New collection";
const CREATE_LABEL = "Create";
const QUERY_FIELD_LABEL = "Query";
const QUERY_PLACEHOLDER = "cat_ears -comic";
const TYPE_SEGMENTED_LABEL = "Show";
const KIND_SEGMENTED_LABEL = "Collection kind";
const FILTER_ARIA_LABEL = "Filter by name; several names separated by commas";
const FILTER_PLACEHOLDER = "Filter collections";
const GRID_LABEL = "Collections";
const BADGE_CUSTOM = "Custom";
const BADGE_DYNAMIC = "Dynamic";
/** A saved search in which "Check for new" found posts newer than the last ones you saw. */
/** The mark of a collection with new posts: the same pill as on a card of Following. */
const NEW_BADGE = "new";
const NEW_BADGE_CLASS = "rdw-collection-new";
const CAPTION_SEPARATOR = " \u00b7 ";

/** "Dynamic · 2,715 posts": what kind the collection is and how much it holds, in one grey line. */
export function cardCaption(kind: string, meta: string): string {
  return `${kind}${CAPTION_SEPARATOR}${meta}`;
}
const CHECK_LABEL = "Check for new";
const CHECK_TITLE =
  "Read the first page of every saved search: refresh its cover and post count and mark the ones with new posts. One request per search";
const CHECK_STATUS_CLASS = "rdw-collections-check-status";
const SAVED_SEARCH_CAPTION = "saved search";
const NO_QUERY_CAPTION = "no query";
const COUNT_LOCALE = "en-US";
const COUNT_AT_LEAST_MARK = "+";
const EMPTY_TITLE = "No collections yet";
const EMPTY_DESCRIPTION =
  "Custom collections are posts you pick. Dynamic collections are saved searches.";
const FILTER_EMPTY_TITLE = "No matching collections";
const FILTER_EMPTY_DESCRIPTION = "Nothing matches this filter.";
const EMPTY_NAME_MESSAGE = "Enter a name.";
const EMPTY_QUERY_MESSAGE = "Enter a query.";
const DUPLICATE_NAME_MESSAGE = "A collection with this name already exists.";
const POST_WORD_SINGULAR = "post";
const POST_WORD_PLURAL = "posts";

const POST_COUNT_SINGULAR = 1;
const COVER_AXIS_COUNT = 2;
const COVER_SLOT_COUNT = COVER_AXIS_COUNT * COVER_AXIS_COUNT;
const COVER_GAP_PX = 2;
const GRID_GAP_PX = 12;
const PAGE_STACK_GAP_PX = 12;
const HEADER_GAP_PX = 12;
const TOOLBAR_GAP_PX = 8;
const FILTER_FIELD_WIDTH_PX = 220;
/** Above the cards and their corner marks. */
const TOOLBAR_Z_INDEX = 5;
const TOOLBAR_SPACER_CLASS = "rdw-collections-toolbar-spacer";
const CARD_PADDING_PX = 8;
const CARD_GAP_PX = 8;
const META_GAP_PX = 8;
const BADGE_FONT_PX = 10;
const CAPTION_FONT_PX = 12;
const ICON_PX = 14;
const MARK_SIZE_PX = 22;
const MARK_OFFSET_PX = 14;
const MARK_ICON_PX = 14;
const MARK_BORDER_PX = 2;
const BADGE_TRACKING = "0.04em";

const NAME_FIELD_ID = "rdw-collection-name";
const QUERY_FIELD_ID = "rdw-collection-query";
const FILTER_FIELD_ID = "rdw-collections-filter";
const FORM_ERROR_ID = "rdw-collection-form-error";


const FILTER_OPTIONS: readonly SegmentedOption[] = [
  { value: FILTER_ALL, label: FILTER_ALL_LABEL },
  { value: FILTER_CUSTOM, label: FILTER_CUSTOM_LABEL },
  { value: FILTER_DYNAMIC, label: FILTER_DYNAMIC_LABEL },
];

const NEW_KIND_OPTIONS: readonly SegmentedOption[] = [
  { value: KIND_CUSTOM, label: FILTER_CUSTOM_LABEL },
  { value: KIND_DYNAMIC, label: FILTER_DYNAMIC_LABEL },
];

type ListFilter = typeof FILTER_ALL | typeof FILTER_CUSTOM | typeof FILTER_DYNAMIC;
type NewKind = typeof KIND_CUSTOM | typeof KIND_DYNAMIC;

import { COLLECTION_TERM_SEPARATOR, filterTerms, matchesAnyTerm } from "./filter-terms";
import { PAGE_CENTRE_PADDING, TILE_MIN_WIDTH_PX } from "./view-mode";
import {
  COLLECTIONS_VIEW_STATE_ID,
  VIEW_LABEL,
  VIEW_LIST,
  VIEW_OPTIONS,
  isViewMode,
  readViewMode,
  writeViewMode,
  type ViewMode,
} from "./view-mode";
import { AI_SCOPE_COLLECTIONS } from "../features/ai-scope";
import { AiPostsToggle } from "../ui/ai-posts-select";
import { APPEARANCE_THEME_CUSTOM, RDW_THEME_ATTR } from "../config/constants";
import { useEscape } from "../ui/use-escape";

export const COLLECTIONS_PAGE_CSS = `
.${PAGE_CLASS} {
  display: flex;
  flex-direction: column;
  gap: ${String(PAGE_STACK_GAP_PX)}px;
}
.${HEADER_CLASS} {
  display: flex;
  flex-direction: column;
  gap: ${String(HEADER_GAP_PX)}px;
}
.${TOOLBAR_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${String(TOOLBAR_GAP_PX)}px;
}
.${TOOLBAR_CLASS} .${FILTER_FIELD_CLASS} {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  margin: 0;
}
/* The caption over the sort list would make the row taller; the options say what they sort by. */
.${TOOLBAR_CLASS} .rdw-select__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Starts short and grows with what is typed, up to the row. */
.${FILTER_FIELD_CLASS} .rdw-field__input {
  field-sizing: content;
  width: ${String(FILTER_FIELD_WIDTH_PX)}px;
  min-width: ${String(FILTER_FIELD_WIDTH_PX)}px;
  max-width: 100%;
}
@supports (field-sizing: content) {
  .${FILTER_FIELD_CLASS} .rdw-field__input {
    width: auto;
  }
}
/* Stays at the top of the window while the list scrolls under it. */
.${HEADER_CLASS} {
  position: sticky;
  top: ${STICKY_TOP};
  z-index: ${String(TOOLBAR_Z_INDEX)};
  padding-block: 8px;
  margin: -8px 0;
  background: var(--rdw-bg);
}
/* Custom theme: over the user's picture a bar of the page's colour from edge
   to edge is a black slab. The toolbar is a card there, like the tiles. */
:host-context(html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_CUSTOM}"]) .${HEADER_CLASS} {
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: color-mix(in srgb, var(--rdw-surface) 88%, transparent);
  backdrop-filter: blur(10px);
}
.${GRID_CLASS} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${String(TILE_MIN_WIDTH_PX)}px, 1fr));
  gap: ${String(GRID_GAP_PX)}px;
}
.${CELL_CLASS} {
  position: relative;
  display: grid;
  min-width: 0;
}
/* The button of a card's group: there under the pointer and for the keyboard,
   and while its menu is open. Always there, it would cover every cover. */
.${CELL_ACTIONS_CLASS} {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  transition: opacity 120ms ease;
}
/* With its menu open the corner of a card is over the cards after it. */
.${CELL_ACTIONS_CLASS}:has([aria-expanded="true"]) {
  z-index: 4;
}
.${CELL_ACTIONS_CLASS} .rdw-icon-btn {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
}
@media (hover: hover) {
  .${CELL_CLASS}:not(:hover):not(:focus-within) .${CELL_ACTIONS_CLASS}:not(:has([aria-expanded="true"])) {
    opacity: 0;
  }
}
/* The card that is being carried to a tab stays in its place, faded. */
.${CELL_CLASS} {
  transition: opacity 160ms ease, transform 160ms ease;
}
.${CELL_CLASS}[data-dragged] {
  opacity: 0.4;
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .${CELL_CLASS},
  .${CELL_ACTIONS_CLASS} {
    transition: none;
  }
}
.${GRID_LIST_CLASS} .${CELL_ACTIONS_CLASS} {
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}
.${GRID_LIST_CLASS} .${CARD_CLASS} {
  padding-right: 76px;
}
.${CARD_CLASS} {
  display: flex;
  flex-direction: column;
  gap: ${String(CARD_GAP_PX)}px;
  min-width: 0;
  padding: ${String(CARD_PADDING_PX)}px;
  box-sizing: border-box;
  text-decoration: none;
  color: var(--rdw-text);
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
}
/*
 * The tiles take the whole window, and so does the toolbar over them: its
 * filters start where the first tile starts and its actions end where the
 * last one ends. Kept to a centred column, the toolbar broke into two rows
 * with half the window free beside it. The list view stays centred.
 */
.${PAGE_CLASS} > :not(.${GRID_CLASS}):not(.${HEADER_CLASS}),
.${GRID_LIST_CLASS} {
  padding-inline: ${PAGE_CENTRE_PADDING};
}
/* Between the filters and the actions: the actions stand at the right end. */
.${TOOLBAR_SPACER_CLASS} {
  flex: 1 1 auto;
}
/* List view: one collection per row, a small cover, the count on the right. */
.${GRID_LIST_CLASS} {
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
}
.${GRID_LIST_CLASS} .${CARD_CLASS} {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
}
.${GRID_LIST_CLASS} .${COVER_CLASS} {
  flex: none;
  width: ${String(LIST_COVER_PX)}px;
}
.${GRID_LIST_CLASS} .${META_ROW_CLASS} {
  flex: 1 1 auto;
  justify-content: flex-start;
}
.${GRID_LIST_CLASS} .${CAPTION_CLASS} {
  flex: none;
}
.${GRID_LIST_CLASS} .${CARD_MARK_CLASS} {
  top: 50%;
  left: 17px;
  transform: translateY(-50%);
}
/* Under the pointer a card is only lighter. The accent frame is for the card
   the keyboard is on, and for a selected one: hover used to look selected. */
.${CARD_CLASS}:hover {
  border-color: var(--rdw-muted);
  background: var(--rdw-surface-2);
}
.${CARD_CLASS}:focus {
  outline: none;
}
.${CARD_CLASS}:focus-visible {
  border-color: var(--rdw-accent);
  background: var(--rdw-surface-2);
  outline: none;
}
.${CARD_CLASS} {
  position: relative;
}
.${CARD_SELECTED_CLASS},
.${CARD_SELECTED_CLASS}:hover {
  border-color: var(--rdw-accent);
  box-shadow: 0 0 0 1px var(--rdw-accent);
  background: var(--rdw-accent-soft);
}
.${CARD_MARK_CLASS} {
  position: absolute;
  top: ${String(MARK_OFFSET_PX)}px;
  left: ${String(MARK_OFFSET_PX)}px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${String(MARK_SIZE_PX)}px;
  height: ${String(MARK_SIZE_PX)}px;
  border: ${String(MARK_BORDER_PX)}px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-surface);
}
.${CARD_SELECTED_CLASS} .${CARD_MARK_CLASS} {
  border-color: var(--rdw-accent);
  background: var(--rdw-accent);
}
.${SELECTED_COUNT_CLASS} {
  color: var(--rdw-muted);
  font-size: ${String(CAPTION_FONT_PX)}px;
  white-space: nowrap;
}
.${COVER_CLASS} {
  display: grid;
  grid-template-columns: repeat(${String(COVER_AXIS_COUNT)}, minmax(0, 1fr));
  grid-template-rows: repeat(${String(COVER_AXIS_COUNT)}, minmax(0, 1fr));
  aspect-ratio: 1;
  gap: ${String(COVER_GAP_PX)}px;
  border-radius: var(--rdw-radius-m);
  overflow: hidden;
  background: var(--rdw-surface-2);
}
.${COVER_CELL_CLASS},
.${COVER_EMPTY_CLASS} {
  min-width: 0;
  min-height: 0;
  background: var(--rdw-surface-2);
}
.${COVER_IMAGE_CLASS},
.${COVER_EMPTY_CLASS} {
  display: block;
  width: 100%;
  height: 100%;
}
.${COVER_IMAGE_CLASS} {
  object-fit: cover;
}
/* One picture fills the cover; two stand side by side; three are one tall
   and two small. Four are the grid as it is; none is one empty field. */
.${COVER_CLASS}:not([data-filled="0"]):not([data-filled="4"]) > .${COVER_CELL_CLASS}[data-empty] {
  display: none;
}
.${COVER_CLASS}[data-filled="1"] > .${COVER_CELL_CLASS}:not([data-empty]) {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
}
.${COVER_CLASS}[data-filled="2"] > .${COVER_CELL_CLASS}:not([data-empty]) {
  grid-row: 1 / -1;
}
.${COVER_CLASS}[data-filled="3"] > .${COVER_CELL_CLASS}:nth-child(1 of :not([data-empty])) {
  grid-row: 1 / -1;
}
.${COVER_CLASS}[data-filled="0"] {
  gap: 0;
}
.${META_ROW_CLASS} {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${String(META_GAP_PX)}px;
  min-width: 0;
}
.${NAME_CLASS} {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.${CHECK_STATUS_CLASS} {
  flex: 1 1 100%;
  color: var(--rdw-muted);
  font-size: 12px;
}
/* A check that stopped: not a grey line among others, and with a way on. */
.${CHECK_STATUS_CLASS}.${CHECK_FAILED_CLASS} {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-warn-soft);
  color: var(--rdw-warn);
}
/* "New" is news, the kind of a collection is not: the kind is in the grey line
   under the name, and the accent colour is kept for this one mark. */
.${NEW_BADGE_CLASS} {
  flex: none;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font-size: ${String(BADGE_FONT_PX)}px;
  font-weight: 700;
  letter-spacing: ${BADGE_TRACKING};
  text-transform: uppercase;
}
.${CAPTION_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: ${String(CAPTION_FONT_PX)}px;
}
.${FORM_HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${FORM_ERROR_CLASS} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: ${String(CAPTION_FONT_PX)}px;
}
`.trim();

function isListFilter(value: string): value is ListFilter {
  return (
    value === FILTER_ALL || value === FILTER_CUSTOM || value === FILTER_DYNAMIC
  );
}

function isNewKind(value: string): value is NewKind {
  return value === KIND_CUSTOM || value === KIND_DYNAMIC;
}

function foldedName(name: string): string {
  return name.trim().toLowerCase();
}

function postsLabel(count: number): string {
  const word =
    count === POST_COUNT_SINGULAR ? POST_WORD_SINGULAR : POST_WORD_PLURAL;
  return `${String(count)} ${word}`;
}

function nameError(
  name: string,
  collections: readonly Collection[],
): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return EMPTY_NAME_MESSAGE;
  }
  const key = foldedName(trimmed);
  for (const collection of collections) {
    if (foldedName(collection.name) === key) {
      return DUPLICATE_NAME_MESSAGE;
    }
  }
  return null;
}

function nameMatchesFilter(name: string, query: string): boolean {
  return matchesAnyTerm([name], filterTerms(query, COLLECTION_TERM_SEPARATOR));
}

function visibleCollections(
  collections: readonly Collection[],
  filter: ListFilter,
  nameQuery: string,
): Collection[] {
  const visible: Collection[] = [];
  for (const collection of collections) {
    if (!nameMatchesFilter(collection.name, nameQuery)) {
      continue;
    }
    const kind = resolveCollectionKind(collection);
    if (filter === FILTER_CUSTOM && kind !== COLLECTION_KIND_POSTS) {
      continue;
    }
    if (filter === FILTER_DYNAMIC && kind !== COLLECTION_KIND_SEARCH) {
      continue;
    }
    visible.push(collection);
  }
  return visible;
}

export const SORT_CREATED = "created";
export const SORT_NAME = "name";
export const SORT_SIZE = "size";
export type CollectionSort = typeof SORT_CREATED | typeof SORT_NAME | typeof SORT_SIZE;
const SORT_STATE_ID = "collections-sort";
const SORT_LABEL = "Sort";
const SORT_OPTIONS: readonly SelectOption[] = [
  { value: SORT_CREATED, label: "As created" },
  { value: SORT_NAME, label: "By name" },
  { value: SORT_SIZE, label: "By size" },
];

function isCollectionSort(value: unknown): value is CollectionSort {
  return value === SORT_CREATED || value === SORT_NAME || value === SORT_SIZE;
}

function readCollectionSort(): CollectionSort {
  const stored = getFeatureState(SORT_STATE_ID);
  return isCollectionSort(stored) ? stored : SORT_CREATED;
}

/** Posts in a collection; a dynamic one whose count is not known yet counts as none. */
function collectionSize(collection: Collection): number {
  return resolveCollectionKind(collection) === COLLECTION_KIND_POSTS
    ? (collection.postIds?.length ?? 0)
    : (collection.postCount?.value ?? 0);
}

/** "As created" keeps the stored order; the other two break ties by name. */
export function sortCollections(
  collections: readonly Collection[],
  sort: CollectionSort,
): Collection[] {
  const sorted = [...collections];
  if (sort === SORT_CREATED) {
    return sorted;
  }
  const byName = (a: Collection, b: Collection): number =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
  sorted.sort(byName);
  if (sort === SORT_SIZE) {
    sorted.sort((a, b) => collectionSize(b) - collectionSize(a));
  }
  return sorted;
}

function kindForFilter(filter: ListFilter): NewKind {
  if (filter === FILTER_DYNAMIC) {
    return KIND_DYNAMIC;
  }
  return KIND_CUSTOM;
}

function filterAfterCreate(kind: NewKind, filter: ListFilter): ListFilter {
  if (kind === KIND_DYNAMIC && filter === FILTER_CUSTOM) {
    return FILTER_DYNAMIC;
  }
  if (kind === KIND_CUSTOM && filter === FILTER_DYNAMIC) {
    return FILTER_CUSTOM;
  }
  return filter;
}

/** Cover uses insertion order (`postIds`), not shuffled display order. */
function coverPostIds(collection: Collection): readonly (number | null)[] {
  const ids = collection.postIds ?? [];
  const slots: (number | null)[] = [];
  for (let index = 0; index < COVER_SLOT_COUNT; index += 1) {
    const id = ids[index];
    slots.push(id === undefined ? null : id);
  }
  return slots;
}

function thumbUrl(collection: Collection, postId: number): string | null {
  const thumbs = collection.thumbs;
  if (thumbs === undefined) {
    return null;
  }
  const value = thumbs[String(postId)];
  if (value === undefined || value.trim().length === 0) {
    return null;
  }
  return value;
}

/** Present while the page is in selection mode. */
type CardSelect = {
  readonly selected: boolean;
  readonly onToggle: () => void;
};

type CardProps = {
  readonly collection: Collection;
  readonly select: CardSelect | null;
  /** The name of the card's group to show, empty under the tab of that group. */
  readonly group: string;
};

/** "Custom · 11 posts · Wallpapers": the caption of a card with its group. */
export function cardCaptionWithGroup(kind: string, meta: string, group: string): string {
  const caption = cardCaption(kind, meta);
  return group.length > 0 ? `${caption}${CAPTION_SEPARATOR}${group}` : caption;
}

/**
 * What the confirmation says: how many, and which. Up to three names are
 * given, so that a wrong pick is seen before it is deleted.
 */
export function deleteMessage(names: readonly string[]): string {
  const count = names.length;
  const head =
    count === SINGLE_SELECTION
      ? DELETE_ONE_MESSAGE
      : `${DELETE_MANY_PREFIX}${String(count)}${DELETE_MANY_SUFFIX}`;
  if (count === 0) {
    return head;
  }
  const shown = names.slice(0, DELETE_NAMES_SHOWN).map((name) => `\u201c${name}\u201d`);
  const rest = count - shown.length;
  const list = rest > 0 ? `${shown.join(", ")} and ${String(rest)} more` : shown.join(", ");
  return `${head} ${list}.`;
}

/** "1 collection", "12 collections": the count in the toolbar. */
export function collectionsCountLabel(count: number): string {
  return `${count.toLocaleString(COUNT_LOCALE)} ${count === SINGLE_SELECTION ? "collection" : "collections"}`;
}

/** "11 collections", or "3 of 11 collections" when the filters leave fewer. */
export function collectionsShownLabel(shown: number, total: number): string {
  return shown === total
    ? collectionsCountLabel(total)
    : `${shown.toLocaleString(COUNT_LOCALE)} of ${collectionsCountLabel(total)}`;
}

const HTTP_TOO_MANY = "HTTP 429";
const REASON_TOO_MANY = "the site is asked too often (429). Wait a minute, then retry.";
const REASON_NETWORK = "no answer from the site. Check the connection, then retry.";

/** Why a check stopped, in words: the browser's "Failed to fetch" says nothing to a user. */
export function checkFailureReason(reason: string): string {
  if (reason.includes(HTTP_TOO_MANY)) {
    return REASON_TOO_MANY;
  }
  if (/failed to fetch|networkerror|load failed/i.test(reason)) {
    return REASON_NETWORK;
  }
  return `${reason}. Retry later.`;
}

function cardAriaLabel(name: string, badge: string, meta: string): string {
  return `${name}, ${badge}, ${meta}`;
}

function CardLink(props: {
  readonly collection: Collection;
  readonly href: string;
  readonly kind: string;
  readonly badge: string;
  readonly meta: string;
  /** A check found posts newer than the ones seen at the last opening. */
  readonly hasNew?: boolean;
  readonly select: CardSelect | null;
  readonly group: string;
  readonly children: ComponentChildren;
}): JSX.Element {
  const select = props.select;
  const label = cardAriaLabel(props.collection.name, props.badge, props.meta);
  if (select !== null) {
    // While selecting, the card is a checkbox: a click marks it and opens nothing.
    return (
      <a
        className={
          select.selected ? `${CARD_CLASS} ${CARD_SELECTED_CLASS}` : CARD_CLASS
        }
        href={props.href}
        role={ROLE_CHECKBOX}
        aria-checked={select.selected}
        aria-label={label}
        data-collection-id={props.collection.id}
        data-collection-kind={props.kind}
        onClick={(event) => {
          event.preventDefault();
          select.onToggle();
        }}
      >
        <span className={CARD_MARK_CLASS} aria-hidden="true">
          {select.selected ? <IconCheck size={MARK_ICON_PX} /> : null}
        </span>
        {props.children}
        <span className={META_ROW_CLASS}>
          <span className={NAME_CLASS}>{props.collection.name}</span>
          {props.hasNew ? <span className={NEW_BADGE_CLASS}>{NEW_BADGE}</span> : null}
        </span>
        <span className={CAPTION_CLASS}>
          {cardCaptionWithGroup(props.badge, props.meta, props.group)}
        </span>
      </a>
    );
  }
  return (
    <a
      className={CARD_CLASS}
      href={props.href}
      draggable={false}
      aria-label={label}
      data-collection-id={props.collection.id}
      data-collection-kind={props.kind}
    >
      {props.children}
      <span className={META_ROW_CLASS}>
        <span className={NAME_CLASS}>{props.collection.name}</span>
        {props.hasNew ? <span className={NEW_BADGE_CLASS}>{NEW_BADGE}</span> : null}
      </span>
      <span className={CAPTION_CLASS}>
        {cardCaptionWithGroup(props.badge, props.meta, props.group)}
      </span>
    </a>
  );
}

/** Cover thumb. A thumb that fails to load leaves the empty cell. */
function CoverThumb(props: { readonly url: string }): JSX.Element {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (failedUrl === props.url) {
    return <span className={COVER_EMPTY_CLASS} />;
  }
  return (
    <img
      className={COVER_IMAGE_CLASS}
      src={props.url}
      alt=""
      onError={() => {
        setFailedUrl(props.url);
      }}
    />
  );
}

/** 2x2 card cover. A slot without a thumb stays an empty cell. */
function Cover(props: {
  readonly collectionId: string;
  readonly urls: readonly (string | null)[];
  readonly postIds?: readonly (number | null)[];
}): JSX.Element {
  // With fewer than four pictures the cover is laid out for as many as there
  // are: empty cells of a 2x2 grid looked like pictures that failed to load.
  const filled = props.urls.filter((url) => url !== null).length;
  return (
    <span className={COVER_CLASS} data-filled={String(filled)}>
      {props.urls.map((url, index) => {
        const postId = props.postIds?.[index] ?? null;
        return (
          <span
            key={`${props.collectionId}-${String(index)}`}
            className={COVER_CELL_CLASS}
            data-empty={url === null ? "true" : undefined}
            data-cover-index={String(index)}
            data-post-id={postId === null ? "" : String(postId)}
          >
            {url !== null ? (
              <CoverThumb url={url} />
            ) : (
              <span className={COVER_EMPTY_CLASS} />
            )}
          </span>
        );
      })}
    </span>
  );
}

function CustomCard(props: CardProps): JSX.Element {
  const count = props.collection.postIds?.length ?? 0;
  const meta = postsLabel(count);
  const slots = coverPostIds(props.collection);
  const urls = slots.map((postId) =>
    postId === null ? null : thumbUrl(props.collection, postId),
  );
  return (
    <CardLink
      collection={props.collection}
      href={collectionDetailHash(props.collection.id)}
      kind={COLLECTION_KIND_POSTS}
      badge={BADGE_CUSTOM}
      meta={meta}
      select={props.select}
      group={props.group}
    >
      <Cover collectionId={props.collection.id} urls={urls} postIds={slots} />
    </CardLink>
  );
}

/** "1,234 posts", "12,516+ posts" for a lower bound, or the plain caption. */
function dynamicQuery(collection: Collection): string {
  return collection.query ?? serialize(collection.tags);
}

/**
 * Results URL of a dynamic collection, with the collection's mark: the bar
 * (Shuffle, Edit query, Rename, Delete) shows only on a page opened from here.
 */
function dynamicHref(collection: Collection): string {
  return `${buildSearchUrl(collection.tags)}${dynamicCollectionMarkHash(collection.id)}`;
}

function dynamicMeta(collection: Collection): string {
  if (isUnfilteredQuery(dynamicQuery(collection))) {
    return NO_QUERY_CAPTION;
  }
  const count = readCountMirror(collection.id) ?? collection.postCount ?? null;
  if (count === null) {
    return SAVED_SEARCH_CAPTION;
  }
  const number = count.value.toLocaleString(COUNT_LOCALE);
  if (count.exact) {
    const word =
      count.value === POST_COUNT_SINGULAR ? POST_WORD_SINGULAR : POST_WORD_PLURAL;
    return `${number} ${word}`;
  }
  return `${number}${COUNT_AT_LEAST_MARK} ${POST_WORD_PLURAL}`;
}

function DynamicCard(props: CardProps): JSX.Element {
  const cover =
    readCoverMirror(props.collection.id) ?? props.collection.cover ?? [];
  const slots: (string | null)[] = [];
  for (let index = 0; index < COVER_SLOT_COUNT; index += 1) {
    slots.push(cover[index] ?? null);
  }
  return (
    <CardLink
      collection={props.collection}
      href={dynamicHref(props.collection)}
      kind={COLLECTION_KIND_SEARCH}
      badge={BADGE_DYNAMIC}
      hasNew={dynamicHasNew(props.collection)}
      meta={dynamicMeta(props.collection)}
      select={props.select}
      group={props.group}
    >
      <Cover collectionId={props.collection.id} urls={slots} />
    </CardLink>
  );
}

function CollectionCard(props: CardProps): JSX.Element {
  if (resolveCollectionKind(props.collection) === COLLECTION_KIND_POSTS) {
    return <CustomCard collection={props.collection} select={props.select} group={props.group} />;
  }
  return <DynamicCard collection={props.collection} select={props.select} group={props.group} />;
}

function NewCollectionDialog(props: {
  readonly open: boolean;
  readonly kind: NewKind;
  readonly name: string;
  readonly query: string;
  readonly error: string;
  /** Which field the error is about: it is shown under that field. */
  readonly errorField: FormField;
  readonly onClose: () => void;
  readonly onKindChange: (kind: NewKind) => void;
  readonly onNameChange: (name: string) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSubmit: () => void;
}): JSX.Element {
  const failed = props.error.length > 0;
  const nameFailed = failed && props.errorField === FIELD_NAME;
  const queryFailed = failed && props.errorField === FIELD_QUERY;
  const error = (
    <p id={FORM_ERROR_ID} className={FORM_ERROR_CLASS} role="alert">
      {props.error}
    </p>
  );
  return (
    <Dialog
      variant="content"
      open={props.open}
      onClose={props.onClose}
      title={NEW_DIALOG_TITLE}
    >
      <Segmented
        label={KIND_SEGMENTED_LABEL}
        options={NEW_KIND_OPTIONS}
        value={props.kind}
        onChange={(value) => {
          if (isNewKind(value)) {
            props.onKindChange(value);
          }
        }}
      />
      {/* What the two kinds are: the words "Custom" and "Dynamic" alone do not say. */}
      <p className={FORM_HINT_CLASS}>
        {props.kind === KIND_DYNAMIC ? KIND_HINT_DYNAMIC : KIND_HINT_CUSTOM}
      </p>
      <form
        className="rdw-dialog__fields"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
      >
        <TextField
          id={NAME_FIELD_ID}
          label={UI_TEXT.nameLabel}
          value={props.name}
          onChange={props.onNameChange}
        />
        {nameFailed ? error : null}
        {props.kind === KIND_DYNAMIC ? (
          <>
            <QueryField
              id={QUERY_FIELD_ID}
              label={QUERY_FIELD_LABEL}
              placeholder={QUERY_PLACEHOLDER}
              value={props.query}
              onChange={props.onQueryChange}
            />
            {queryFailed ? error : <p className={FORM_HINT_CLASS}>{QUERY_HINT}</p>}
          </>
        ) : null}
        <div className="rdw-dialog__actions">
          <Button
            type="button"
            variant="secondary"
            size="s"
            onClick={props.onClose}
          >
            {UI_TEXT.cancel}
          </Button>
          <Button type="submit" variant="primary" size="s" disabled={nameFailed}>
            {CREATE_LABEL}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function CollectionsPage(): JSX.Element {
  const [filter, setFilter] = useState<ListFilter>(FILTER_ALL);
  const [nameQuery, setNameQuery] = useState("");
  const [view, setView] = useState<ViewMode>(() => readViewMode(COLLECTIONS_VIEW_STATE_ID));
  const [sort, setSort] = useState<CollectionSort>(() => readCollectionSort());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKind, setNewKind] = useState<NewKind>(KIND_CUSTOM);
  const [nameDraft, setNameDraft] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [formErrorField, setFormErrorField] = useState<FormField>(FIELD_NAME);
  const [, setRevision] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // The open tab of the groups; what the dialogs of a group are asked for; the
  // id of the card being dragged to a tab.
  const [groupTab, setGroupTab] = useState(GROUP_ALL);
  const [groupRequest, setGroupRequest] = useState<GroupRequest | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  // The collection whose cross was pressed: it is deleted after a confirmation.
  const [deleteOne, setDeleteOne] = useState<Collection | null>(null);
  // The line of a "Check for new" run; empty before the first run.
  const [checkStatus, setCheckStatus] = useState("");
  // The last check stopped on an error: the line says why and offers to run it again.
  const [checkFailed, setCheckFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const checkCancelledRef = useRef(false);

  useEffect(
    () => (): void => {
      checkCancelledRef.current = true;
    },
    [],
  );

  const runCheck = (): void => {
    const targets = checkableCollections(load().collections);
    if (targets.length === 0 || checking) {
      return;
    }
    checkCancelledRef.current = false;
    setCheckFailed(false);
    setChecking(true);
    setCheckStatus(`Checking 0 of ${String(targets.length)}…`);
    void runCollectionsCheck(
      targets,
      (progress) => {
        setCheckStatus(`Checking ${String(progress.done)} of ${String(progress.total)}…`);
      },
      () => checkCancelledRef.current,
    ).then((result) => {
      if (checkCancelledRef.current) {
        return;
      }
      reloadFromStorage();
      setChecking(false);
      const withNew = load().collections.filter(dynamicHasNew).length;
      setCheckStatus(
        result.ok
          ? `Checked ${String(result.checked)}; ${String(withNew)} with new posts.`
          : `Stopped at “${result.name}” after ${String(result.checked)} checked: ${checkFailureReason(result.reason)}`,
      );
      setCheckFailed(!result.ok);
      setRevision((value) => value + 1);
    });
  };

  const closeDialog = useCallback((): void => {
    setDialogOpen(false);
    setFormError("");
    setNameDraft("");
    setQueryDraft("");
  }, []);

  useEffect(() => {
    // Back from a results page restores this page as it was: read the data again.
    const onPageShow = (): void => {
      reloadFromStorage();
      setRevision((value) => value + 1);
    };
    window.addEventListener(EVENT_PAGESHOW, onPageShow);
    return (): void => {
      window.removeEventListener(EVENT_PAGESHOW, onPageShow);
    };
  }, []);

  const collections = load().collections;
  const groups = listCollectionGroups();
  const visible = sortCollections(visibleCollections(collections, filter, nameQuery), sort).filter(
    (collection) => inGroupTab(collection.group, groupTab),
  );
  const moveToGroup = (ids: readonly string[], name: string | null): void => {
    setCollectionGroup(ids, name);
    setRevision((value) => value + 1);
  };
  const emptyCopy =
    collections.length === 0
      ? { title: EMPTY_TITLE, description: EMPTY_DESCRIPTION }
      : { title: FILTER_EMPTY_TITLE, description: FILTER_EMPTY_DESCRIPTION };

  // Only cards that are on screen count: a filter never hides a doomed card.
  const selectedVisible = visible.filter((collection) =>
    selectedIds.includes(collection.id),
  );

  const stopSelecting = (): void => {
    setSelecting(false);
    setSelectedIds([]);
    setConfirmOpen(false);
  };
  // Escape leaves the selection, as Cancel does.
  useEscape(selecting, stopSelecting);

  const toggleSelected = (id: string): void => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  const deleteSelected = (): void => {
    for (const collection of selectedVisible) {
      deleteCollection(collection.id);
    }
    stopSelecting();
    setRevision((value) => value + 1);
  };

  const openDialog = (): void => {
    setNewKind(kindForFilter(filter));
    setNameDraft("");
    setQueryDraft("");
    setFormError("");
    setDialogOpen(true);
  };

  const submitNew = (): void => {
    const message = nameError(nameDraft, load().collections);
    if (message !== null) {
      setFormErrorField(FIELD_NAME);
      setFormError(message);
      return;
    }
    if (newKind === KIND_DYNAMIC && isUnfilteredQuery(queryDraft)) {
      setFormErrorField(FIELD_QUERY);
      setFormError(EMPTY_QUERY_MESSAGE);
      return;
    }
    const name = nameDraft.trim();
    if (newKind === KIND_DYNAMIC) {
      createDynamicCollection(name, queryDraft);
    } else {
      createPlaylist(name);
    }
    setFilter((current) => filterAfterCreate(newKind, current));
    closeDialog();
    setRevision((value) => value + 1);
  };

  return (
    <div className={PAGE_CLASS}>
      <style>{COLLECTIONS_PAGE_CSS}</style>
      <header className={HEADER_CLASS}>
        {selecting ? (
          // The selection has the place of the toolbar: the filters are away
          // while it lasts, so what is selected cannot change under it.
          <SelectionBar
            count={selectedVisible.length}
            onSelectAll={() => {
              setSelectedIds(visible.map((collection) => collection.id));
            }}
            onClear={() => {
              setSelectedIds([]);
            }}
            onCancel={stopSelecting}
            danger={
              <Button
                type="button"
                variant="danger-quiet"
                disabled={selectedVisible.length === 0}
                onClick={() => {
                  setConfirmOpen(true);
                }}
              >
                {DELETE_SELECTED_LABEL}
              </Button>
            }
          >
            <MoveToGroupMenu
              groups={groups}
              disabled={selectedVisible.length === 0}
              onMove={(name) => {
                moveToGroup(
                  selectedVisible.map((collection) => collection.id),
                  name,
                );
              }}
              onNew={() => {
                setGroupRequest({
                  kind: "new",
                  targets: selectedVisible.map((collection) => collection.id),
                });
              }}
            />
          </SelectionBar>
        ) : (
        <div className={TOOLBAR_CLASS}>
          <Segmented
            label={TYPE_SEGMENTED_LABEL}
            options={FILTER_OPTIONS}
            value={filter}
            onChange={(value) => {
              if (isListFilter(value)) {
                setFilter(value);
              }
            }}
          />
          <SearchField
            id={FILTER_FIELD_ID}
            className={FILTER_FIELD_CLASS}
            value={nameQuery}
            placeholder={FILTER_PLACEHOLDER}
            aria-label={FILTER_ARIA_LABEL}
            onChange={setNameQuery}
          />
          <Select
            label={SORT_LABEL}
            options={SORT_OPTIONS}
            value={sort}
            onChange={(value) => {
              if (isCollectionSort(value)) {
                setFeatureState(SORT_STATE_ID, value);
                setSort(value);
              }
            }}
          />
          {/* What a saved search opens, and what "Check for new" reads, with AI posts shown or hidden. */}
          <AiPostsToggle scope={AI_SCOPE_COLLECTIONS} />
          <Segmented
            label={VIEW_LABEL}
            options={VIEW_OPTIONS}
            value={view}
            onChange={(value) => {
              if (isViewMode(value)) {
                writeViewMode(COLLECTIONS_VIEW_STATE_ID, value);
                setView(value);
              }
            }}
          />
          {/* How many collections the filters leave: in the toolbar, as on Following. */}
          <span className={SELECTED_COUNT_CLASS}>
            {collectionsShownLabel(visible.length, collections.length)}
          </span>
          <span className={TOOLBAR_SPACER_CLASS} aria-hidden="true" />
            <>
              {collections.length > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  title={SELECT_BUTTON_TITLE}
                  onClick={() => {
                    setSelecting(true);
                  }}
                >
                  {SELECT_BUTTON_LABEL}
                </Button>
              ) : null}
              {checkableCollections(collections).length > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  title={CHECK_TITLE}
                  disabled={checking}
                  onClick={runCheck}
                >
                  {CHECK_LABEL}
                </Button>
              ) : null}
              <Button type="button" variant="primary" onClick={openDialog}>
                <IconPlus size={ICON_PX} />
                {NEW_BUTTON_LABEL}
              </Button>
              {checkStatus.length > 0 ? (
                <span
                  className={
                    checkFailed ? `${CHECK_STATUS_CLASS} ${CHECK_FAILED_CLASS}` : CHECK_STATUS_CLASS
                  }
                  role="status"
                >
                  {checkStatus}
                  {checkFailed ? (
                    <>
                      {" "}
                      <Button type="button" variant="secondary" size="s" onClick={runCheck}>
                        {CHECK_RETRY_LABEL}
                      </Button>
                    </>
                  ) : null}
                </span>
              ) : null}
            </>
        </div>
        )}
        {/* Under the toolbar and kept with it: each card is under one tab.
            Locked while cards are selected, as the filters are away then. */}
        {collections.length > 0 ? (
          <GroupTabs
            total={collections.length}
            groups={countGroups(groups, collections.map((collection) => collection.group))}
            value={groupTab}
            onChange={setGroupTab}
            onNew={() => {
              setGroupRequest({ kind: "new", targets: [] });
            }}
            onRename={(name) => {
              setGroupRequest({ kind: "rename", name });
            }}
            onDelete={(name) => {
              setGroupRequest({
                kind: "delete",
                name,
                count: collections.filter((collection) => collection.group === name).length,
              });
            }}
            dragging={dragId !== null}
            onDropTo={(name) => {
              if (dragId !== null) {
                moveToGroup([dragId], name);
              }
              setDragId(null);
            }}
            locked={selecting}
          />
        ) : null}
      </header>
      {visible.length === 0 ? (
        <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
      ) : (
        <div
          className={view === VIEW_LIST ? `${GRID_CLASS} ${GRID_LIST_CLASS}` : GRID_CLASS}
          aria-label={GRID_LABEL}
        >
          {visible.map((collection) => (
            // Dragged, a card can be dropped on the tab of a group; the button
            // in its corner opens the same "Move to group" without dragging.
            <div
              key={collection.id}
              className={CELL_CLASS}
              {...(dragId === collection.id ? { "data-dragged": "" } : {})}
              draggable={!selecting}
              onDragStart={(event) => {
                event.dataTransfer?.setData(DRAG_DATA_TYPE, collection.name);
                setDragId(collection.id);
              }}
              onDragEnd={() => {
                setDragId(null);
              }}
            >
              <CollectionCard
                collection={collection}
                group={collection.group === groupTab ? "" : (collection.group ?? "")}
                select={
                  selecting
                    ? {
                        selected: selectedIds.includes(collection.id),
                        onToggle: () => {
                          toggleSelected(collection.id);
                        },
                      }
                    : null
                }
              />
              {selecting ? null : (
                <div className={CELL_ACTIONS_CLASS}>
                  <MoveToGroupMenu
                    groups={groups}
                    current={collection.group ?? ""}
                    iconLabel={`${MOVE_ONE_PREFIX}${collection.name}`}
                    onMove={(name) => {
                      moveToGroup([collection.id], name);
                    }}
                    onNew={() => {
                      setGroupRequest({ kind: "new", targets: [collection.id] });
                    }}
                  />
                  <IconButton
                    label={`${DELETE_ONE_PREFIX}${collection.name}`}
                    onClick={() => {
                      setDeleteOne(collection);
                    }}
                  >
                    <IconX size={ICON_PX} />
                  </IconButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Dialog
        variant="confirm"
        open={confirmOpen}
        title={DELETE_DIALOG_TITLE}
        message={deleteMessage(selectedVisible.map((collection) => collection.name))}
        confirmLabel={UI_TEXT.delete}
        cancelLabel={UI_TEXT.cancel}
        confirmTone="danger"
        onConfirm={deleteSelected}
        onClose={() => {
          setConfirmOpen(false);
        }}
      />
      <Dialog
        variant="confirm"
        open={deleteOne !== null}
        title={DELETE_ONE_DIALOG_TITLE}
        message={deleteOne === null ? "" : deleteMessage([deleteOne.name])}
        confirmLabel={UI_TEXT.delete}
        cancelLabel={UI_TEXT.cancel}
        confirmTone="danger"
        onConfirm={() => {
          if (deleteOne !== null) {
            deleteCollection(deleteOne.id);
            setRevision((value) => value + 1);
          }
          setDeleteOne(null);
        }}
        onClose={() => {
          setDeleteOne(null);
        }}
      />
      <GroupDialogs
        request={groupRequest}
        groups={groups}
        countLabel={collectionsCountLabel}
        onCreate={(name, targets) => {
          if (targets.length > 0) {
            setCollectionGroup(targets, name);
          } else {
            createCollectionGroup(name);
          }
          setGroupRequest(null);
          setRevision((value) => value + 1);
        }}
        onRename={(from, to) => {
          renameCollectionGroup(from, to);
          if (groupTab === from) {
            setGroupTab(to);
          }
          setGroupRequest(null);
          setRevision((value) => value + 1);
        }}
        onDelete={(name) => {
          deleteCollectionGroup(name);
          if (groupTab === name) {
            setGroupTab(GROUP_ALL);
          }
          setGroupRequest(null);
          setRevision((value) => value + 1);
        }}
        onClose={() => {
          setGroupRequest(null);
        }}
      />
      <NewCollectionDialog
        open={dialogOpen}
        kind={newKind}
        name={nameDraft}
        query={queryDraft}
        error={formError}
        errorField={formErrorField}
        onClose={closeDialog}
        onKindChange={(kind) => {
          setNewKind(kind);
          setFormError("");
        }}
        onNameChange={(name) => {
          setNameDraft(name);
          // A name already taken is said while it is typed: the list of names
          // is at hand, and there is no reason to wait for Create.
          const taken = name.trim().length > 0 ? nameError(name, load().collections) : null;
          setFormErrorField(FIELD_NAME);
          setFormError(taken ?? "");
        }}
        onQueryChange={(query) => {
          setQueryDraft(query);
          setFormError("");
        }}
        onSubmit={submitNew}
      />
    </div>
  );
}

export function createCollectionsPage(): HTMLElement {
  const root = document.createElement("div");
  // A page stands on its own here, as in its shadow root: its dialogs are drawn in it.
  preactRender(
    <OverlayInPlace.Provider value={true}>
      <CollectionsPage />
    </OverlayInPlace.Provider>,
    root,
  );
  return root;
}
