import { STICKY_TOP } from "../boot/sticky-header";
import type { JSX } from "preact";
import { render as preactRender } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import {
  APPEARANCE_THEME_CUSTOM,
  RDW_THEME_ATTR,
  SEARCH_PAGE,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
  SEARCH_SECTION,
  TAG_TYPE_INCLUDE,
  UI_TEXT,
} from "../config/constants";
import { log } from "../log";
import { buildSearchUrl } from "../search/query";
import { ARTIST_COVER_SIZE, fetchArtistSnapshot } from "../site/artist-snapshot";
import {
  AUTOCOMPLETE_TAG_TYPE_ARTIST,
  createAutocompleteQuerier,
  type AutocompleteSuggestion,
} from "../site/autocomplete";
import {
  FOLLOW_KIND_ARTIST,
  FOLLOW_KIND_CHARACTER,
  FOLLOW_KIND_COPYRIGHT,
  type ArtistEntry,
  type FollowKind,
} from "../storage/schema";
import {
  addArtists,
  createFollowGroup,
  deleteFollowGroup,
  followKindOf,
  getSeenPostId,
  listFollowGroups,
  load,
  reloadFromStorage,
  rememberArtistSnapshot,
  removeArtist,
  removeArtists,
  renameFollowGroup,
  setFollowGroup,
} from "../storage/store";
import {
  AutocompleteField,
  Button,
  SelectionBar,
  Dialog,
  OverlayInPlace,
  EmptyState,
  IconButton,
  ProgressBar,
  Segmented,
  Select,
  type SegmentedOption,
  type SelectOption,
} from "../ui/kit";
import {
  GROUP_ALL,
  GroupDialogs,
  GroupTabs,
  MoveToGroupMenu,
  countGroups,
  inGroupTab,
  type GroupRequest,
} from "../ui/groups";
import { SearchField } from "../ui/kit/search-field";
import { IconCheck, IconPlus, IconX } from "../ui/kit/icons";
import { completeLastQueryToken, readLastQueryToken } from "../ui/query-field";
import {
  ARTIST_FILTER_ID,
  ARTIST_FILTER_LABEL,
  ARTISTS_EMPTY_HINT,
  ARTISTS_EMPTY_TITLE,
} from "./constants";

const EVENT_PAGESHOW = "pageshow";

const PAGE_CLASS = "rdw-following-page";
const STICKY_CLASS = "rdw-following-sticky";
const TOOLBAR_CLASS = "rdw-following-toolbar";
const FILTER_CLASS = "rdw-following-filter";
const META_CLASS = "rdw-following-meta";
const GRID_CLASS = "rdw-following-grid";
const GRID_LIST_CLASS = "rdw-following-grid--list";
const CARD_CLASS = "rdw-artist-card";
const CARD_SELECTED_CLASS = "rdw-artist-card--selected";
const CARD_LINK_CLASS = "rdw-artist-card-link";
const CARD_MARK_CLASS = "rdw-artist-card-mark";
const CARD_ACTIONS_CLASS = "rdw-artist-card-actions";
const COVER_CLASS = "rdw-artist-cover";
const COVER_CELL_CLASS = "rdw-artist-cover-cell";
const COVER_IMAGE_CLASS = "rdw-artist-cover-image";
const NAME_ROW_CLASS = "rdw-artist-name-row";
const NAME_CLASS = "rdw-artist-name";
const NEW_BADGE_CLASS = "rdw-artist-new";
const CAPTION_CLASS = "rdw-artist-caption";
const PROGRESS_CLASS = "rdw-following-progress";

const ADD_INPUT_ID = "rdw-following-add-tag";
const OPEN_POSTS_LABEL = "Open Posts";
const OPEN_POSTS_HREF = `${SEARCH_PATH}?${SEARCH_PARAM_PAGE}=${SEARCH_PAGE}&${SEARCH_PARAM_SECTION}=${SEARCH_SECTION}`;

const SHOW_ALL = "all";
const SHOW_NEW = "new";
const SORT_NAME = "name";
const SORT_POSTS = "posts";
const SORT_ADDED = "added";

const SHOW_LABEL = "Show";
const SORT_LABEL = "Sort";
const NEW_BADGE = "new";
const SELECT_LABEL = "Select";
const UNFOLLOW_LABEL = "Unfollow";
/** In the bar of the selection: the dots say a confirmation follows. */
const UNFOLLOW_SELECTED_LABEL = "Unfollow\u2026";
const REFRESH_LABEL = "Refresh";
const REFRESH_TITLE = "Read each artist's first page again: cover, post count, newest post";
const ADD_FIELD_LABEL = "Artist tags, separated by spaces";
const ADD_BUTTON_LABEL = "Add artists";
const ADD_DIALOG_TITLE = "Follow artists";
const TAG_SPLIT = /\s+/;
const CLOSE_LABEL = "Close";
const NOT_OPENED_CAPTION = "not opened yet";
const QUIET_PREFIX = "no new posts since ";
const POST_WORD_SINGULAR = "post";
const POST_WORD_PLURAL = "posts";
const COUNT_AT_LEAST_MARK = "+";
const NO_MATCH_TITLE = "No matching artists";
const NO_MATCH_DESCRIPTION = "Nothing matches this filter.";
const UNFOLLOW_DIALOG_TITLE = "Unfollow artists";
const REFRESH_DIALOG_TITLE = "Refresh artists";
const REFRESH_STOPPED_PREFIX = "Stopped at ";
const REFRESH_DONE_PREFIX = "Refreshed ";
const ROLE_CHECKBOX = "checkbox";
const LOCALE = "en-US";
const DATE_LOCALE = "en-GB";

const SINGLE = 1;
const MS_PER_DAY = 86_400_000;
/** An artist whose newest post has not changed for this long is marked quiet. */
const QUIET_AFTER_DAYS = 60;
/** Pause between two requests of a Refresh run. */
export const REFRESH_INTERVAL_MS = 1500;
/** How long the line of a finished Refresh stays before it closes by itself. */
export const REFRESH_DONE_CLOSE_MS = 2000;
const MS_PER_SECOND = 1000;
const COVER_AXIS_COUNT = 2;
const ICON_PX = 14;
const LIST_COVER_PX = 44;
const FILTER_FIELD_WIDTH_PX = 220;
/** Above the cards and their corner buttons. */
const TOOLBAR_Z_INDEX = 5;
const TOOLBAR_SPACER_CLASS = "rdw-following-toolbar-spacer";
const TOOLBAR_COUNT_CLASS = "rdw-following-toolbar-count";

const FOLLOW_FILTER_PLACEHOLDER = "Filter by name";
const KIND_ALL = "all";
const KIND_LABEL = "Type";
const KIND_OPTIONS: readonly SelectOption[] = [
  { value: KIND_ALL, label: "All types" },
  { value: FOLLOW_KIND_ARTIST, label: "Artists" },
  { value: FOLLOW_KIND_CHARACTER, label: "Characters" },
  { value: FOLLOW_KIND_COPYRIGHT, label: "Copyrights" },
];
/** What a card of something other than an artist says it is. */
const KIND_CAPTION: Readonly<Record<FollowKind, string>> = {
  [FOLLOW_KIND_ARTIST]: "",
  [FOLLOW_KIND_CHARACTER]: "character",
  [FOLLOW_KIND_COPYRIGHT]: "copyright",
};
/** The small button of a card that opens "Move to group". */
const MOVE_ONE_PREFIX = "Move to a group: ";
/** What a card carries while it is dragged to a tab of a group. */
const DRAG_DATA_TYPE = "text/plain";

const SHOW_OPTIONS: readonly SegmentedOption[] = [
  { value: SHOW_ALL, label: "All" },
  { value: SHOW_NEW, label: "New" },
];

const SORT_OPTIONS: readonly SelectOption[] = [
  { value: SORT_NAME, label: "By name" },
  { value: SORT_POSTS, label: "By posts" },
  { value: SORT_ADDED, label: "Recently followed" },
];

import { ARTIST_TERM_SEPARATOR, filterTerms, matchesAnyTerm } from "./filter-terms";
import { PAGE_CENTRE_PADDING, TILE_MIN_WIDTH_PX } from "./view-mode";
import {
  FOLLOWING_VIEW_STATE_ID,
  VIEW_LABEL,
  VIEW_LIST,
  VIEW_OPTIONS,
  isViewMode,
  readViewMode,
  writeViewMode,
  type ViewMode,
} from "./view-mode";
import { AI_SCOPE_FOLLOWING, alignSiteAiFilter } from "../features/ai-scope";
import { AiPostsToggle } from "../ui/ai-posts-select";
import { useEscape } from "../ui/use-escape";

export const FOLLOWING_PAGE_CSS = `
.${PAGE_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${TOOLBAR_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${TOOLBAR_CLASS} .${FILTER_CLASS} {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  margin: 0;
}
/*
 * The caption over the sort list made the row taller than the one on
 * Collections. It stays for screen readers; the options say what they sort by.
 */
.${TOOLBAR_CLASS} .rdw-select__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Starts short and grows with what is typed, up to the row. */
.${FILTER_CLASS} .rdw-field__input {
  field-sizing: content;
  width: ${String(FILTER_FIELD_WIDTH_PX)}px;
  min-width: ${String(FILTER_FIELD_WIDTH_PX)}px;
  max-width: 100%;
}
@supports (field-sizing: content) {
  .${FILTER_CLASS} .rdw-field__input {
    width: auto;
  }
}
/*
 * The row with the filter and the buttons stays at the top of the window
 * while the list scrolls under it.
 */
.${STICKY_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: ${STICKY_TOP};
  z-index: ${String(TOOLBAR_Z_INDEX)};
  padding-block: 8px;
  margin: -8px 0;
  background: var(--rdw-bg);
}
/* Custom theme: over the user's picture a bar of the page's colour from edge
   to edge is a black slab. The toolbar is a card there, like the tiles. */
:host-context(html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_CUSTOM}"]) .${STICKY_CLASS} {
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: color-mix(in srgb, var(--rdw-surface) 88%, transparent);
  backdrop-filter: blur(10px);
}
.${META_CLASS},
.${CAPTION_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
/* The count in the toolbar: level with the controls, never broken in two. */
.${TOOLBAR_COUNT_CLASS} {
  align-self: center;
  white-space: nowrap;
}
.${GRID_CLASS} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${String(TILE_MIN_WIDTH_PX)}px, 1fr));
  gap: 12px;
}
/*
 * The tiles take the whole window, and so does the toolbar over them: its
 * filters start where the first tile starts and its actions end where the
 * last one ends. Kept to a centred column, the toolbar broke into two rows
 * with half the window free beside it. The list view stays centred.
 */
.${PAGE_CLASS} > :not(.${GRID_CLASS}):not(.${STICKY_CLASS}),
.${GRID_LIST_CLASS} {
  padding-inline: ${PAGE_CENTRE_PADDING};
}
/* Between the filters and the actions: the actions stand at the right end. */
.${TOOLBAR_SPACER_CLASS} {
  flex: 1 1 auto;
}
/* List view: one artist per row, a small cover, the numbers on the right. */
.${GRID_LIST_CLASS} {
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
}
.${GRID_LIST_CLASS} .${CARD_CLASS} {
  padding: 6px 8px;
}
.${GRID_LIST_CLASS} .${CARD_LINK_CLASS} {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding-right: 40px;
}
.${GRID_LIST_CLASS} .${COVER_CLASS} {
  flex: none;
  width: ${String(LIST_COVER_PX)}px;
}
.${GRID_LIST_CLASS} .${NAME_ROW_CLASS} {
  flex: 1 1 auto;
}
.${GRID_LIST_CLASS} .${CAPTION_CLASS} {
  flex: none;
}
.${GRID_LIST_CLASS} .${CARD_ACTIONS_CLASS} {
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}
.${GRID_LIST_CLASS} .${CARD_MARK_CLASS} {
  top: 50%;
  left: 17px;
  transform: translateY(-50%);
}
.${CARD_CLASS} {
  position: relative;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
}
/* Under the pointer a card is only lighter. The accent frame is for the card
   the keyboard is in, and for a selected one: hover used to look selected. */
.${CARD_CLASS}:hover {
  border-color: var(--rdw-muted);
  background: var(--rdw-surface-2);
}
/* The keyboard's focus only: a card clicked with the mouse keeps the focus
   too, and with ":focus-within" a card just unselected kept the frame of a
   selected one. */
.${CARD_CLASS}:has(:focus-visible),
.${CARD_SELECTED_CLASS} {
  border-color: var(--rdw-accent);
}
.${CARD_SELECTED_CLASS},
.${CARD_SELECTED_CLASS}:hover {
  box-shadow: 0 0 0 1px var(--rdw-accent);
  background: var(--rdw-accent-soft);
}
.${CARD_LINK_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  color: var(--rdw-text);
  text-decoration: none;
  outline: none;
}
.${COVER_CLASS} {
  display: grid;
  grid-template-columns: repeat(${String(COVER_AXIS_COUNT)}, minmax(0, 1fr));
  grid-template-rows: repeat(${String(COVER_AXIS_COUNT)}, minmax(0, 1fr));
  aspect-ratio: 1;
  gap: 2px;
  border-radius: var(--rdw-radius-m);
  overflow: hidden;
}
.${COVER_CELL_CLASS} {
  min-width: 0;
  min-height: 0;
  background: var(--rdw-surface-2);
}
.${COVER_IMAGE_CLASS} {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.${NAME_ROW_CLASS} {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.${NAME_CLASS} {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.${NEW_BADGE_CLASS} {
  flex: none;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.${CARD_ACTIONS_CLASS} {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
}
/* With its menu open the corner of a card is over the cards after it. */
.${CARD_ACTIONS_CLASS}:has([aria-expanded="true"]) {
  z-index: ${String(TOOLBAR_Z_INDEX - 1)};
}
.${CARD_ACTIONS_CLASS} .rdw-icon-btn {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
}
/* The buttons of a card are there under the pointer, for the keyboard and
   while the menu is open: on every card at once they crowded the covers.
   Where there is no pointer to hover with, they stay. */
@media (hover: hover) {
  .${CARD_CLASS}:not(:hover):not(:focus-within) .${CARD_ACTIONS_CLASS}:not(:has([aria-expanded="true"])) {
    opacity: 0;
  }
}
.${CARD_ACTIONS_CLASS} {
  transition: opacity 120ms ease;
}
/* The card that is being carried to a tab stays in its place, faded. */
.${CARD_CLASS} {
  transition: opacity 160ms ease, transform 160ms ease;
}
.${CARD_CLASS}[data-dragged] {
  opacity: 0.4;
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .${CARD_CLASS},
  .${CARD_ACTIONS_CLASS} {
    transition: none;
  }
}
.${CARD_MARK_CLASS} {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  border: 2px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-surface);
}
.${CARD_SELECTED_CLASS} .${CARD_MARK_CLASS} {
  border-color: var(--rdw-accent);
  background: var(--rdw-accent);
}
.${PROGRESS_CLASS} {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${PROGRESS_CLASS} .rdw-progress {
  flex: 1 1 auto;
}
`.trim();

type ShowMode = typeof SHOW_ALL | typeof SHOW_NEW;
type SortMode = typeof SORT_NAME | typeof SORT_POSTS | typeof SORT_ADDED;

type RefreshState = {
  readonly done: number;
  readonly total: number;
  readonly running: boolean;
  readonly message: string;
  /** A finished run that went through: its line closes by itself. */
  readonly succeeded?: boolean;
};

type CardSelect = {
  readonly selected: boolean;
  readonly onToggle: () => void;
};

function isShowMode(value: string): value is ShowMode {
  return value === SHOW_ALL || value === SHOW_NEW;
}

/**
 * "character · Favourites": what a card says under the name, when there is
 * anything to say. Under the tab of its own group the name of the group is
 * not said again.
 */
export function followCaption(artist: ArtistEntry, openTab: string = GROUP_ALL): string {
  const group = artist.group ?? "";
  return [KIND_CAPTION[followKindOf(artist)], group === openTab ? "" : group]
    .filter((part) => part.length > 0)
    .join(" · ");
}

/** Whether an entry passes the Type and Group filters of the toolbar. */
export function matchesKindAndGroup(artist: ArtistEntry, kind: string, group: string): boolean {
  if (kind !== KIND_ALL && followKindOf(artist) !== kind) {
    return false;
  }
  return inGroupTab(artist.group, group);
}

/** "22 artists", or "11 of 22 artists" when the filters leave fewer. */
export function artistsCountLabel(shown: number, total: number): string {
  const word = total === SINGLE ? "artist" : "artists";
  return shown === total ? `${String(total)} ${word}` : `${String(shown)} of ${String(total)} ${word}`;
}

function isSortMode(value: string): value is SortMode {
  return value === SORT_NAME || value === SORT_POSTS || value === SORT_ADDED;
}

function displayArtistName(tag: string): string {
  return tag.replaceAll("_", " ");
}

function compareArtistTags(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function readArtists(): ArtistEntry[] {
  return [...load().artists];
}

/** True when the artist's newest known post is newer than the feed's seen mark. */
export function artistHasNew(artist: ArtistEntry, seenPostId: number): boolean {
  return seenPostId > 0 && (artist.lastPostId ?? 0) > seenPostId;
}

/** The day the artist's newest post was first noticed, when that is long ago. */
export function quietSince(artist: ArtistEntry, now: number): number | null {
  const since = artist.lastPostSince;
  if (since === undefined || now - since < QUIET_AFTER_DAYS * MS_PER_DAY) {
    return null;
  }
  return since;
}

function postsCaption(artist: ArtistEntry): string {
  const count = artist.postCount;
  if (count === undefined) {
    return NOT_OPENED_CAPTION;
  }
  const number = count.value.toLocaleString(LOCALE);
  if (!count.exact) {
    return `${number}${COUNT_AT_LEAST_MARK} ${POST_WORD_PLURAL}`;
  }
  return `${number} ${count.value === SINGLE ? POST_WORD_SINGULAR : POST_WORD_PLURAL}`;
}

function formatDay(time: number): string {
  return new Date(time).toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function sortArtists(
  artists: readonly ArtistEntry[],
  mode: SortMode,
): ArtistEntry[] {
  const sorted = [...artists].sort((a, b) => compareArtistTags(a.tag, b.tag));
  if (mode === SORT_POSTS) {
    // Unknown counts go last; the name order above breaks ties.
    sorted.sort((a, b) => (b.postCount?.value ?? -1) - (a.postCount?.value ?? -1));
  } else if (mode === SORT_ADDED) {
    sorted.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
  }
  return sorted;
}

function unfollowOneMessage(tag: string): string {
  return `Unfollow ${displayArtistName(tag)}? This cannot be undone.`;
}

/** What an Add of several tags did, or an empty text when all were added. */
function addSummary(result: {
  readonly added: number;
  readonly duplicates: number;
  readonly invalid: number;
}): string {
  if (result.duplicates === 0 && result.invalid === 0) {
    return "";
  }
  if (result.added === 0 && result.invalid === 0) {
    return UI_TEXT.artistDuplicate;
  }
  if (result.added === 0 && result.duplicates === 0) {
    return UI_TEXT.artistInvalid;
  }
  return `Added ${String(result.added)}, already followed ${String(result.duplicates)}, invalid ${String(result.invalid)}.`;
}

function unfollowMessage(count: number): string {
  return count === SINGLE
    ? "Unfollow 1 artist? This cannot be undone."
    : `Unfollow ${String(count)} artists? This cannot be undone.`;
}

function refreshMessage(count: number): string {
  const seconds = Math.ceil((count * REFRESH_INTERVAL_MS) / MS_PER_SECOND);
  const requests = count === SINGLE ? "1 request" : `${String(count)} requests`;
  return `This makes ${requests} to the site, one every ${String(REFRESH_INTERVAL_MS / MS_PER_SECOND)} seconds (about ${String(seconds)} s). It stops at the first error.`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function CoverThumb(props: { readonly url: string }): JSX.Element | null {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (failedUrl === props.url) {
    return null;
  }
  return (
    <img
      className={COVER_IMAGE_CLASS}
      src={props.url}
      alt=""
      loading="lazy"
      onError={() => {
        setFailedUrl(props.url);
      }}
    />
  );
}

function ArtistCover(props: { readonly artist: ArtistEntry }): JSX.Element {
  const cover = props.artist.cover ?? [];
  const cells: JSX.Element[] = [];
  for (let index = 0; index < ARTIST_COVER_SIZE; index += 1) {
    const url = cover[index];
    cells.push(
      <span key={index} className={COVER_CELL_CLASS}>
        {url === undefined ? null : <CoverThumb url={url} />}
      </span>,
    );
  }
  return <span className={COVER_CLASS}>{cells}</span>;
}

function ArtistCard(props: {
  readonly artist: ArtistEntry;
  readonly hasNew: boolean;
  readonly now: number;
  readonly select: CardSelect | null;
  readonly onUnfollow: () => void;
  readonly groups: readonly string[];
  /** The open tab: its group is not named on the cards under it. */
  readonly openTab: string;
  readonly onMove: (group: string | null) => void;
  readonly onNewGroup: () => void;
  readonly onDragStart: () => void;
  readonly onDragEnd: () => void;
  /** True while this card is carried to a tab. */
  readonly dragged: boolean;
}): JSX.Element {
  const { artist, select } = props;
  const caption = followCaption(artist, props.openTab);
  const quiet = quietSince(artist, props.now);
  const body = (
    <>
      <ArtistCover artist={artist} />
      <span className={NAME_ROW_CLASS}>
        <span className={NAME_CLASS} title={artist.tag}>
          {displayArtistName(artist.tag)}
        </span>
        {props.hasNew ? <span className={NEW_BADGE_CLASS}>{NEW_BADGE}</span> : null}
      </span>
      <span className={CAPTION_CLASS}>{postsCaption(artist)}</span>
      {caption.length > 0 ? <span className={CAPTION_CLASS}>{caption}</span> : null}
      {quiet === null ? null : (
        <span className={CAPTION_CLASS}>{`${QUIET_PREFIX}${formatDay(quiet)}`}</span>
      )}
    </>
  );
  const href = buildSearchUrl([{ tag: artist.tag, type: TAG_TYPE_INCLUDE }]);

  if (select !== null) {
    // While selecting, the card is a checkbox: a click marks it and opens nothing.
    return (
      <div
        className={
          select.selected ? `${CARD_CLASS} ${CARD_SELECTED_CLASS}` : CARD_CLASS
        }
        data-tag={artist.tag}
      >
        <a
          className={CARD_LINK_CLASS}
          href={href}
          role={ROLE_CHECKBOX}
          aria-checked={select.selected}
          aria-label={artist.tag}
          onClick={(event) => {
            event.preventDefault();
            select.onToggle();
          }}
        >
          {body}
        </a>
        <span className={CARD_MARK_CLASS} aria-hidden="true">
          {select.selected ? <IconCheck size={ICON_PX} /> : null}
        </span>
      </div>
    );
  }

  return (
    // Dragged, the card can be dropped on the tab of a group; the menu beside
    // the cross does the same without dragging.
    <div
      className={CARD_CLASS}
      data-tag={artist.tag}
      {...(props.dragged ? { "data-dragged": "" } : {})}
      draggable
      onDragStart={(event) => {
        event.dataTransfer?.setData(DRAG_DATA_TYPE, artist.tag);
        props.onDragStart();
      }}
      onDragEnd={props.onDragEnd}
    >
      <a className={CARD_LINK_CLASS} href={href} draggable={false}>
        {body}
      </a>
      <div className={CARD_ACTIONS_CLASS}>
        <MoveToGroupMenu
          groups={props.groups}
          current={artist.group ?? ""}
          iconLabel={`${MOVE_ONE_PREFIX}${artist.tag}`}
          onMove={props.onMove}
          onNew={props.onNewGroup}
        />
        <IconButton label={`Unfollow ${artist.tag}`} onClick={props.onUnfollow}>
          <IconX size={ICON_PX} />
        </IconButton>
      </div>
    </div>
  );
}

/**
 * The window behind "Add artists": one field for several tags. It closes when
 * every tag was added; when some were skipped it stays and says which.
 */
function AddArtistDialog(props: {
  readonly open: boolean;
  readonly draft: string;
  readonly error: string;
  readonly suggestions: readonly AutocompleteSuggestion[];
  readonly onDraftChange: (value: string) => void;
  readonly onSuggestionSelect: (tag: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      variant="content"
      open={props.open}
      onClose={props.onClose}
      title={ADD_DIALOG_TITLE}
    >
      <form
        className="rdw-dialog__fields"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
      >
        <AutocompleteField
          id={ADD_INPUT_ID}
          label={ADD_FIELD_LABEL}
          value={props.draft}
          suggestions={props.suggestions}
          replaceOnSelect={false}
          onChange={props.onDraftChange}
          onSelect={(option) => {
            props.onSuggestionSelect(option.value);
          }}
        />
        {props.error.length > 0 ? (
          <p className="rdw-error" role="alert">
            {props.error}
          </p>
        ) : null}
        <div className="rdw-dialog__actions">
          <Button type="button" variant="secondary" size="s" onClick={props.onClose}>
            {UI_TEXT.cancel}
          </Button>
          <Button type="submit" variant="primary" size="s">
            {UI_TEXT.artistAdd}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function FollowingPage(): JSX.Element {
  const [artists, setArtists] = useState<ArtistEntry[]>(() => readArtists());
  const [filter, setFilter] = useState("");
  const [show, setShow] = useState<ShowMode>(SHOW_ALL);
  const [sort, setSort] = useState<SortMode>(SORT_NAME);
  const [view, setView] = useState<ViewMode>(() => readViewMode(FOLLOWING_VIEW_STATE_ID));
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<
    readonly AutocompleteSuggestion[]
  >([]);
  const [selecting, setSelecting] = useState(false);
  const [kindFilter, setKindFilter] = useState(KIND_ALL);
  const [groupFilter, setGroupFilter] = useState(GROUP_ALL);
  const [groupRequest, setGroupRequest] = useState<GroupRequest | null>(null);
  // The tag of the card being dragged to a tab, or null.
  const [dragTag, setDragTag] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  const [unfollowTag, setUnfollowTag] = useState<string | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [refresh, setRefresh] = useState<RefreshState | null>(null);
  const cancelRefreshRef = useRef(false);
  const querierRef = useRef(
    createAutocompleteQuerier({ preferType: AUTOCOMPLETE_TAG_TYPE_ARTIST }),
  );

  useEffect(() => {
    const querier = querierRef.current;
    // Back from an artist's page restores this page as it was: read the data again.
    const onPageShow = (): void => {
      reloadFromStorage();
      setArtists(readArtists());
    };
    window.addEventListener(EVENT_PAGESHOW, onPageShow);
    return () => {
      window.removeEventListener(EVENT_PAGESHOW, onPageShow);
      querier.cancel();
      cancelRefreshRef.current = true;
    };
  }, []);

  const refreshSucceeded = refresh?.succeeded === true;
  useEffect(() => {
    if (!refreshSucceeded) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setRefresh(null);
    }, REFRESH_DONE_CLOSE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshSucceeded]);

  const onAdd = (): void => {
    const tags = draft.split(TAG_SPLIT).filter((tag) => tag.length > 0);
    if (tags.length === 0) {
      setAddError(UI_TEXT.artistInvalid);
      return;
    }
    const result = addArtists(tags);
    const summary = addSummary(result);
    setAddError(summary);
    if (result.added > 0) {
      setDraft("");
    }
    if (summary.length === 0) {
      setAdding(false);
    }
    setSuggestions([]);
    querierRef.current.cancel();
    setArtists(readArtists());
  };

  const seen = getSeenPostId();
  const now = Date.now();
  const terms = filterTerms(filter, ARTIST_TERM_SEPARATOR);
  const matches = (artist: ArtistEntry): boolean => {
    if (show === SHOW_NEW && !artistHasNew(artist, seen)) {
      return false;
    }
    if (!matchesKindAndGroup(artist, kindFilter, groupFilter)) {
      return false;
    }
    return matchesAnyTerm([artist.tag], terms);
  };
  const groups = listFollowGroups();
  // The Type filter is of use only once something other than an artist is followed.
  const hasOtherKinds = artists.some((artist) => followKindOf(artist) !== FOLLOW_KIND_ARTIST);
  const moveToGroup = (tags: readonly string[], name: string | null): void => {
    setFollowGroup(tags, name);
    setArtists(readArtists());
  };
  const visible = sortArtists(artists, sort).filter(matches);
  // Only cards on screen count: a filter never hides a card that is acted on.
  const selectedVisible = visible.filter((artist) =>
    selectedTags.includes(artist.tag),
  );
  const count = artists.length;
  const empty = count === 0;
  const busy = refresh !== null && refresh.running;

  const stopSelecting = (): void => {
    setSelecting(false);
    setSelectedTags([]);
    setConfirmUnfollow(false);
  };
  // Escape leaves the selection, as Cancel does.
  useEscape(selecting, stopSelecting);

  const toggleSelected = (tag: string): void => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((entry) => entry !== tag)
        : [...current, tag],
    );
  };

  const unfollowSelected = (): void => {
    removeArtists(selectedVisible.map((artist) => artist.tag));
    stopSelecting();
    setArtists(readArtists());
  };

  const runRefresh = async (targets: readonly ArtistEntry[]): Promise<void> => {
    cancelRefreshRef.current = false;
    const total = targets.length;
    setRefresh({ done: 0, total, running: true, message: "" });
    let done = 0;
    for (const artist of targets) {
      if (cancelRefreshRef.current) {
        break;
      }
      if (done > 0) {
        await sleep(REFRESH_INTERVAL_MS);
        if (cancelRefreshRef.current) {
          break;
        }
      }
      try {
        alignSiteAiFilter(AI_SCOPE_FOLLOWING);
        rememberArtistSnapshot(artist.tag, await fetchArtistSnapshot(artist.tag));
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        log.warn("following: refresh failed", artist.tag, error);
        setArtists(readArtists());
        setRefresh({
          done,
          total,
          running: false,
          message: `${REFRESH_STOPPED_PREFIX}${artist.tag}: ${reason}`,
        });
        return;
      }
      done += 1;
      setArtists(readArtists());
      setRefresh({ done, total, running: true, message: "" });
    }
    setRefresh({
      done,
      total,
      running: false,
      message: `${REFRESH_DONE_PREFIX}${String(done)} of ${String(total)}`,
      succeeded: true,
    });
  };

  const closeAdding = (): void => {
    setAdding(false);
    setAddError("");
    setSuggestions([]);
    querierRef.current.cancel();
  };
  const addButton = (
    <Button
      variant="primary"
      onClick={() => {
        setAdding(true);
      }}
    >
      <IconPlus size={ICON_PX} />
      {ADD_BUTTON_LABEL}
    </Button>
  );
  const addDialog = (
      <AddArtistDialog
        open={adding}
        onClose={closeAdding}
        draft={draft}
        error={addError}
        suggestions={suggestions}
        onDraftChange={(value) => {
          setDraft(value);
          if (addError.length > 0) {
            setAddError("");
          }
          const last = readLastQueryToken(value);
          if (last === null) {
            querierRef.current.cancel();
            setSuggestions([]);
            return;
          }
          querierRef.current.query(last.stem, setSuggestions);
        }}
        onSuggestionSelect={(tag) => {
          // Only the tag being typed is replaced; earlier tags stay.
          setDraft(completeLastQueryToken(draft, tag));
          querierRef.current.cancel();
          setSuggestions([]);
        }}
        onSubmit={onAdd}
      />
  );

  return (
    <div className={PAGE_CLASS}>
      <style>{FOLLOWING_PAGE_CSS}</style>

      {empty ? (
        <EmptyState
          title={ARTISTS_EMPTY_TITLE}
          description={ARTISTS_EMPTY_HINT}
          action={
            <>
              {addButton}
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.assign(OPEN_POSTS_HREF);
                }}
              >
                {OPEN_POSTS_LABEL}
              </Button>
            </>
          }
        />
      ) : (
        <>
          <div className={STICKY_CLASS}>
          {selecting ? (
            // The selection has the place of the toolbar: the filters are away
            // while it lasts, so what is selected cannot change under it.
            <SelectionBar
              count={selectedVisible.length}
              onSelectAll={() => {
                setSelectedTags(visible.map((artist) => artist.tag));
              }}
              onClear={() => {
                setSelectedTags([]);
              }}
              onCancel={stopSelecting}
              danger={
                <Button
                  variant="danger-quiet"
                  disabled={selectedVisible.length === 0}
                  onClick={() => {
                    setConfirmUnfollow(true);
                  }}
                >
                  {UNFOLLOW_SELECTED_LABEL}
                </Button>
              }
            >
              <MoveToGroupMenu
                groups={groups}
                disabled={selectedVisible.length === 0}
                onMove={(name) => {
                  moveToGroup(
                    selectedVisible.map((artist) => artist.tag),
                    name,
                  );
                }}
                onNew={() => {
                  setGroupRequest({
                    kind: "new",
                    targets: selectedVisible.map((artist) => artist.tag),
                  });
                }}
              />
            </SelectionBar>
          ) : (
          <div className={TOOLBAR_CLASS}>
            <Segmented
              label={SHOW_LABEL}
              options={SHOW_OPTIONS}
              value={show}
              onChange={(value) => {
                if (isShowMode(value)) {
                  setShow(value);
                }
              }}
            />
            <SearchField
              id={ARTIST_FILTER_ID}
              className={FILTER_CLASS}
              value={filter}
              placeholder={FOLLOW_FILTER_PLACEHOLDER}
              aria-label={ARTIST_FILTER_LABEL}
              onChange={setFilter}
            />
            <Select
              label={SORT_LABEL}
              options={SORT_OPTIONS}
              value={sort}
              onChange={(value) => {
                if (isSortMode(value)) {
                  setSort(value);
                }
              }}
            />
            {hasOtherKinds ? (
              <Select
                label={KIND_LABEL}
                options={KIND_OPTIONS}
                value={kindFilter}
                onChange={setKindFilter}
              />
            ) : null}
            {/* What a card opens, and what Refresh reads, with AI posts shown or hidden. */}
            <AiPostsToggle scope={AI_SCOPE_FOLLOWING} />
            <Segmented
              label={VIEW_LABEL}
              options={VIEW_OPTIONS}
              value={view}
              onChange={(value) => {
                if (isViewMode(value)) {
                  writeViewMode(FOLLOWING_VIEW_STATE_ID, value);
                  setView(value);
                }
              }}
            />
            {/* How many are followed and how far the feed was seen: in the toolbar
                itself (Kaze, 18.11.2026), not a line of its own under it. */}
            <span className={`${META_CLASS} ${TOOLBAR_COUNT_CLASS}`}>
              {`${artistsCountLabel(visible.length, count)} · ${
                seen > 0 ? `${UI_TEXT.seenUpTo}${String(seen)}` : UI_TEXT.seenNothing
              }`}
            </span>
            <span className={TOOLBAR_SPACER_CLASS} aria-hidden="true" />
              <>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setSelecting(true);
                  }}
                >
                  {SELECT_LABEL}
                </Button>
                <Button
                  variant="secondary"
                  title={REFRESH_TITLE}
                  disabled={busy || visible.length === 0}
                  onClick={() => {
                    setConfirmRefresh(true);
                  }}
                >
                  {REFRESH_LABEL}
                </Button>
                {addButton}
              </>
          </div>
          )}
          {/* Under the toolbar and kept with it: each card is under one tab.
              Locked while cards are selected, as the filters are away then. */}
          <GroupTabs
            total={count}
            groups={countGroups(groups, artists.map((artist) => artist.group))}
            value={groupFilter}
            onChange={setGroupFilter}
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
                count: artists.filter((artist) => artist.group === name).length,
              });
            }}
            dragging={dragTag !== null}
            onDropTo={(name) => {
              if (dragTag !== null) {
                moveToGroup([dragTag], name);
              }
              setDragTag(null);
            }}
            locked={selecting}
          />
          </div>


          {refresh === null ? null : (
            <div className={PROGRESS_CLASS} role="status">
              <ProgressBar
                value={refresh.total === 0 ? 0 : refresh.done / refresh.total}
                label={
                  refresh.running
                    ? `${REFRESH_LABEL}: ${String(refresh.done)} of ${String(refresh.total)}`
                    : refresh.message
                }
              />
              {refresh.running ? (
                <Button
                  variant="secondary"
                  size="s"
                  onClick={() => {
                    cancelRefreshRef.current = true;
                  }}
                >
                  {UI_TEXT.cancel}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="s"
                  onClick={() => {
                    setRefresh(null);
                  }}
                >
                  {CLOSE_LABEL}
                </Button>
              )}
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState title={NO_MATCH_TITLE} description={NO_MATCH_DESCRIPTION} />
          ) : (
            <div
              className={view === VIEW_LIST ? `${GRID_CLASS} ${GRID_LIST_CLASS}` : GRID_CLASS}
            >
              {visible.map((artist) => (
                <ArtistCard
                  key={artist.tag}
                  artist={artist}
                  hasNew={artistHasNew(artist, seen)}
                  now={now}
                  select={
                    selecting
                      ? {
                          selected: selectedTags.includes(artist.tag),
                          onToggle: () => {
                            toggleSelected(artist.tag);
                          },
                        }
                      : null
                  }
                  onUnfollow={() => {
                    setUnfollowTag(artist.tag);
                  }}
                  groups={groups}
                  openTab={groupFilter}
                  onMove={(name) => {
                    moveToGroup([artist.tag], name);
                  }}
                  onNewGroup={() => {
                    setGroupRequest({ kind: "new", targets: [artist.tag] });
                  }}
                  onDragStart={() => {
                    setDragTag(artist.tag);
                  }}
                  onDragEnd={() => {
                    setDragTag(null);
                  }}
                  dragged={dragTag === artist.tag}
                />
              ))}
            </div>
          )}
        </>
      )}

      {addDialog}
      <GroupDialogs
        request={groupRequest}
        groups={groups}
        countLabel={(number) => artistsCountLabel(number, number)}
        onCreate={(name, targets) => {
          if (targets.length > 0) {
            setFollowGroup(targets, name);
          } else {
            createFollowGroup(name);
          }
          setGroupRequest(null);
          setArtists(readArtists());
        }}
        onRename={(from, to) => {
          renameFollowGroup(from, to);
          if (groupFilter === from) {
            setGroupFilter(to);
          }
          setGroupRequest(null);
          setArtists(readArtists());
        }}
        onDelete={(name) => {
          deleteFollowGroup(name);
          if (groupFilter === name) {
            setGroupFilter(GROUP_ALL);
          }
          setGroupRequest(null);
          setArtists(readArtists());
        }}
        onClose={() => {
          setGroupRequest(null);
        }}
      />
      <Dialog
        variant="confirm"
        open={confirmUnfollow}
        title={UNFOLLOW_DIALOG_TITLE}
        message={unfollowMessage(selectedVisible.length)}
        confirmLabel={UNFOLLOW_LABEL}
        cancelLabel={UI_TEXT.cancel}
        confirmTone="danger"
        onConfirm={unfollowSelected}
        onClose={() => {
          setConfirmUnfollow(false);
        }}
      />
      <Dialog
        variant="confirm"
        open={unfollowTag !== null}
        title={UNFOLLOW_LABEL}
        message={unfollowOneMessage(unfollowTag ?? "")}
        confirmLabel={UNFOLLOW_LABEL}
        cancelLabel={UI_TEXT.cancel}
        confirmTone="danger"
        onConfirm={() => {
          if (unfollowTag !== null) {
            removeArtist(unfollowTag);
            setArtists(readArtists());
          }
          setUnfollowTag(null);
        }}
        onClose={() => {
          setUnfollowTag(null);
        }}
      />
      <Dialog
        variant="confirm"
        open={confirmRefresh}
        title={REFRESH_DIALOG_TITLE}
        message={refreshMessage(visible.length)}
        confirmLabel={REFRESH_LABEL}
        cancelLabel={UI_TEXT.cancel}
        onConfirm={() => {
          setConfirmRefresh(false);
          void runRefresh(visible);
        }}
        onClose={() => {
          setConfirmRefresh(false);
        }}
      />
    </div>
  );
}

export function createFollowingPage(): HTMLElement {
  const root = document.createElement("div");
  // A page stands on its own here, as in its shadow root: its dialogs are drawn in it.
  preactRender(
    <OverlayInPlace.Provider value={true}>
      <FollowingPage />
    </OverlayInPlace.Provider>,
    root,
  );
  return root;
}
