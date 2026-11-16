import { COLLECTION_KIND_SEARCH, SEARCH_PARAM_TAGS } from "../config/constants";
import { normalizeArtistTag } from "../search/query";
import {
  FOLLOW_KIND_ARTIST,
  FOLLOW_KIND_CHARACTER,
  FOLLOW_KIND_COPYRIGHT,
  type FollowKind,
} from "../storage/schema";
import {
  createDynamicCollection,
  getFeatureState,
  load,
  setFeatureState,
} from "../storage/store";
import { attachFollowButton } from "../ui/artists-sidebar";
import { ensureDocumentStyles } from "../ui/cards";

/**
 * The site's list pages the script adds a little to, without changing how
 * they look otherwise:
 *
 * - Forum: a topic that is new, or whose row has changed since you last
 *   opened it, gets a mark. Nothing is requested: the marks come from
 *   comparing the row with what it said last time.
 * - Artists: a Follow button in every row.
 * - Tags: Follow (artists, characters, copyrights) and "Save as collection"
 *   in every row.
 *
 * Each page is recognised by its markup, not by its address.
 */

const STYLE_ID = "rdw-list-pages-style";
const ROW_SELECTOR = "table.highlightable tr.odd, table.highlightable tr.even";
const TAG_LINK_SELECTOR = `a[href*="${SEARCH_PARAM_TAGS}="]`;

// ---- forum

export const FORUM_STATE_ID = "forum-seen";
const FORUM_SELECTOR = "div#forum";
const FORUM_TOPIC_LINK_SELECTOR = "span.forum-topic a[href], a[href*='page=forum'][href*='s=view']";
export const FORUM_BADGE_CLASS = "rdw-forum-badge";
export const FORUM_MARKED_ROW_CLASS = "rdw-forum-row-marked";
const FORUM_READ_ALL_CLASS = "rdw-forum-read-all";
const FORUM_BADGE_NEW = "new";
const FORUM_BADGE_UPDATED = "updated";
const FORUM_READ_ALL_LABEL = "Mark all as read";
/** How many topics are remembered; the oldest are forgotten first. */
export const FORUM_MEMORY_MAX = 600;
const TOPIC_ID_PARAM = "id";
const SPACES = /\s+/g;

// ---- artists and tags

const ARTIST_ROW_SELECTOR = 'tr[id^="artist-"]';
/** The name of an artist row: `<a href="index.php?page=artist&s=show&id=…">name</a>`. */
const ARTIST_NAME_LINK_SELECTOR = 'a[href*="page=artist"][href*="s=show"]';
/** A row of the Tags table carries no class; the header row is the one with `th`. */
const TAGS_ROW_SELECTOR = "tr";
const FIRST_WORD = /^[a-z]+/;
const TAGS_PAGE_PARAM = "tags";
export const ROW_ACTIONS_CLASS = "rdw-row-actions";
export const SAVE_TAG_CLASS = "rdw-save-tag";
const SAVE_TAG_LABEL = "Save as collection";
const SAVED_TAG_LABEL = "Saved";
const ACTIONS_HEADING = "RuleDesk";
const KIND_BY_CLASS: readonly (readonly [string, FollowKind])[] = [
  ["tag-type-artist", FOLLOW_KIND_ARTIST],
  ["tag-type-character", FOLLOW_KIND_CHARACTER],
  ["tag-type-copyright", FOLLOW_KIND_COPYRIGHT],
];
const KIND_BY_TEXT: ReadonlyMap<string, FollowKind> = new Map([
  ["artist", FOLLOW_KIND_ARTIST],
  ["character", FOLLOW_KIND_CHARACTER],
  ["copyright", FOLLOW_KIND_COPYRIGHT],
]);

const LIST_PAGES_CSS = `
.${FORUM_BADGE_CLASS} {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font: 700 10.5px/16px var(--rdw-font);
  letter-spacing: 0.02em;
  vertical-align: middle;
}
tr.${FORUM_MARKED_ROW_CLASS} span.forum-topic a {
  font-weight: 700;
}
.${FORUM_READ_ALL_CLASS},
.${SAVE_TAG_CLASS} {
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 12px var(--rdw-font);
  cursor: pointer;
}
.${FORUM_READ_ALL_CLASS} {
  margin: 0 0 8px;
}
.${SAVE_TAG_CLASS}:disabled {
  color: var(--rdw-muted);
  cursor: default;
}
.${ROW_ACTIONS_CLASS} {
  white-space: nowrap;
}
.${ROW_ACTIONS_CLASS} > * + * {
  margin-left: 6px;
}
`.trim();

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = LIST_PAGES_CSS;
  document.head.append(style);
}

/** The text of a row as one line: what is compared between two visits. */
export function rowSignature(row: Element): string {
  return (row.textContent ?? "").replace(SPACES, " ").trim();
}

/** The topic a forum row is about: its id, or the address of its link when there is none. */
export function forumTopicKey(row: Element): string | null {
  const link = row.querySelector(FORUM_TOPIC_LINK_SELECTOR);
  const href = link?.getAttribute("href") ?? null;
  if (href === null || href.length === 0) {
    return null;
  }
  try {
    return new URL(href, window.location.href).searchParams.get(TOPIC_ID_PARAM) ?? href;
  } catch {
    return href;
  }
}

type ForumMemory = Record<string, string>;

function isForumMemory(value: unknown): value is ForumMemory {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

function readForumMemory(): ForumMemory | null {
  const stored = getFeatureState(FORUM_STATE_ID);
  return isForumMemory(stored) ? stored : null;
}

/** Keeps the newest entries: a topic written again moves to the end. */
export function withForumEntries(
  memory: ForumMemory,
  entries: readonly (readonly [string, string])[],
): ForumMemory {
  const next = new Map(Object.entries(memory));
  for (const [key, signature] of entries) {
    next.delete(key);
    next.set(key, signature);
  }
  const kept = [...next].slice(Math.max(0, next.size - FORUM_MEMORY_MAX));
  return Object.fromEntries(kept);
}

/** "new" for a topic never seen, "updated" for one whose row changed, null for a read one. */
export function forumBadge(memory: ForumMemory, key: string, signature: string): string | null {
  const known = memory[key];
  if (known === undefined) {
    return FORUM_BADGE_NEW;
  }
  return known === signature ? null : FORUM_BADGE_UPDATED;
}

function clearForumMark(row: Element): void {
  row.classList.remove(FORUM_MARKED_ROW_CLASS);
  row.querySelector(`.${FORUM_BADGE_CLASS}`)?.remove();
}

function mountForum(forum: Element): void {
  const rows = [...forum.querySelectorAll(ROW_SELECTOR)];
  const topics: { row: Element; key: string; signature: string }[] = [];
  for (const row of rows) {
    const key = forumTopicKey(row);
    if (key !== null) {
      topics.push({ row, key, signature: rowSignature(row) });
    }
  }
  if (topics.length === 0) {
    return;
  }
  const memory = readForumMemory();
  if (memory === null) {
    // The first visit: everything on the page counts as read, or every topic
    // would be marked new.
    setFeatureState(
      FORUM_STATE_ID,
      withForumEntries(
        {},
        topics.map((topic) => [topic.key, topic.signature]),
      ),
    );
    return;
  }

  const remember = (entries: readonly (readonly [string, string])[]): void => {
    setFeatureState(FORUM_STATE_ID, withForumEntries(readForumMemory() ?? {}, entries));
  };

  let marked = 0;
  for (const topic of topics) {
    const badge = forumBadge(memory, topic.key, topic.signature);
    if (badge === null) {
      continue;
    }
    marked += 1;
    topic.row.classList.add(FORUM_MARKED_ROW_CLASS);
    const label = document.createElement("span");
    label.className = FORUM_BADGE_CLASS;
    label.textContent = badge;
    const link = topic.row.querySelector(FORUM_TOPIC_LINK_SELECTOR);
    (link?.parentElement ?? topic.row.lastElementChild)?.append(label);
    // Opening the topic reads it.
    link?.addEventListener("click", () => {
      remember([[topic.key, topic.signature]]);
    });
  }
  if (marked === 0) {
    return;
  }

  const readAll = document.createElement("button");
  readAll.type = "button";
  readAll.className = FORUM_READ_ALL_CLASS;
  readAll.textContent = FORUM_READ_ALL_LABEL;
  readAll.addEventListener("click", () => {
    remember(topics.map((topic) => [topic.key, topic.signature]));
    for (const topic of topics) {
      clearForumMark(topic.row);
    }
    readAll.remove();
  });
  const table = forum.querySelector("table.highlightable");
  table?.before(readAll);
}

/** The tag a row's link searches for, or null when the row has no such link. */
export function rowTag(row: Element): string | null {
  for (const link of row.querySelectorAll(TAG_LINK_SELECTOR)) {
    const href = link.getAttribute("href");
    if (href === null) {
      continue;
    }
    try {
      const tags = new URL(href, window.location.href).searchParams.get(SEARCH_PARAM_TAGS);
      const tag = tags === null ? null : normalizeArtistTag(tags);
      if (tag !== null) {
        return tag;
      }
    } catch {
      // Not an address: try the next link.
    }
  }
  return null;
}

/**
 * What kind of tag a row of the Tags page holds: from a `tag-type-*` class on
 * the row or inside it, else from a cell that says the type in words. Null for
 * a general tag, and when the page says nothing the script knows.
 */
export function rowTagKind(row: Element): FollowKind | null {
  for (const [className, kind] of KIND_BY_CLASS) {
    if (row.classList.contains(className) || row.querySelector(`.${className}`) !== null) {
      return kind;
    }
  }
  // The Type cell reads "Artist (edit)", "Character, ambiguous (edit)": the
  // first word is the type.
  for (const cell of row.querySelectorAll("td")) {
    const word = FIRST_WORD.exec((cell.textContent ?? "").trim().toLowerCase())?.[0] ?? "";
    const kind = KIND_BY_TEXT.get(word);
    if (kind !== undefined && cell.querySelector(TAG_LINK_SELECTOR) === null) {
      return kind;
    }
  }
  return null;
}

/** The tag of an Artists row: the text of its name link. */
export function artistRowTag(row: Element): string | null {
  const name = row.querySelector(ARTIST_NAME_LINK_SELECTOR)?.textContent ?? "";
  return name.trim().length === 0 ? null : normalizeArtistTag(name.trim());
}

function mountArtists(rows: readonly Element[]): void {
  ensureDocumentStyles();
  for (const row of rows) {
    const tag = artistRowTag(row);
    const cell = row.querySelector(ARTIST_NAME_LINK_SELECTOR)?.closest("td");
    if (tag !== null && cell instanceof HTMLElement) {
      attachFollowButton(cell, tag, FOLLOW_KIND_ARTIST);
    }
  }
}

function hasCollectionFor(tag: string): boolean {
  return load().collections.some(
    (item) =>
      (item.kind === COLLECTION_KIND_SEARCH && (item.query ?? "").trim() === tag) ||
      item.name.trim().toLowerCase() === tag,
  );
}

function buildSaveButton(tag: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = SAVE_TAG_CLASS;
  const saved = hasCollectionFor(tag);
  button.textContent = saved ? SAVED_TAG_LABEL : SAVE_TAG_LABEL;
  button.disabled = saved;
  button.title = `${SAVE_TAG_LABEL}: ${tag}`;
  button.addEventListener("click", () => {
    if (!hasCollectionFor(tag)) {
      createDynamicCollection(tag, tag);
    }
    button.textContent = SAVED_TAG_LABEL;
    button.disabled = true;
  });
  return button;
}

function mountTags(table: Element): void {
  ensureDocumentStyles();
  const rows = [...table.querySelectorAll(TAGS_ROW_SELECTOR)].filter(
    (row) => row.querySelector("th") === null,
  );
  let added = 0;
  for (const row of rows) {
    const tag = rowTag(row);
    if (tag === null || row.querySelector(`.${ROW_ACTIONS_CLASS}`) !== null) {
      continue;
    }
    const cell = document.createElement("td");
    cell.className = ROW_ACTIONS_CLASS;
    const kind = rowTagKind(row);
    if (kind !== null) {
      attachFollowButton(cell, tag, kind);
    }
    cell.append(buildSaveButton(tag));
    row.append(cell);
    added += 1;
  }
  const header = table.querySelector("tr.tableheader") ?? table.querySelector("th")?.closest("tr") ?? null;
  if (added > 0 && header !== null && header.querySelector(`.${ROW_ACTIONS_CLASS}`) === null) {
    const heading = document.createElement("th");
    heading.className = ROW_ACTIONS_CLASS;
    heading.textContent = ACTIONS_HEADING;
    header.append(heading);
  }
}

function isTagsListPage(search: string): boolean {
  return new URLSearchParams(search).get("page") === TAGS_PAGE_PARAM;
}

/** Does nothing on a page that is none of the three. */
export function mountListPages(search: string = window.location.search): void {
  const forum = document.querySelector(FORUM_SELECTOR);
  if (forum !== null) {
    ensureStyle();
    mountForum(forum);
    return;
  }
  const artistRows = [...document.querySelectorAll(ARTIST_ROW_SELECTOR)];
  if (artistRows.length > 0) {
    ensureStyle();
    mountArtists(artistRows);
    return;
  }
  const table = document.querySelector("table.highlightable");
  if (table !== null && isTagsListPage(search)) {
    ensureStyle();
    mountTags(table);
  }
}
