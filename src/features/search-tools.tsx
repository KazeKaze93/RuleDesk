import { useTagKindLookup } from "../ui/use-tag-kinds";
import { chipKindOfTag } from "../ui/tag-chip-kind";
import { rememberTagKinds } from "../site/tag-types";
import {
  SEARCH_TOOLS_AI_ROW_BODY_CLASS,
  SEARCH_TOOLS_MOUNTED_CLASS,
  rememberSearchToolsHeight,
} from "../boot/search-tools-reserve";
import { render } from "preact";
import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import {
  EXCLUDE_PREFIX,
  SEARCH_PARAM_TAGS,
  SITE_ORIGIN,
  TAG_SEPARATOR,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
  UPDATES_OR_OPEN,
} from "../config/constants";
import { log } from "../log";
import {
  buildSearchUrl,
  findFeedGroupIndex,
  isFullUpdatesQuery,
  parsePlaylistQuery,
  parseTags,
} from "../search/query";
import { SITE_SELECTORS } from "../site/selectors";
import { readArtistsMirror } from "../storage/artists-mirror";
import { getUpdatesGroupSize, listArtistTags } from "../storage/store";
import {
  Button,
  Card,
  CHIP_CSS,
  type ChipKind,
  IconX,
  NumberField,
  SectionLabel,
  Segmented,
  Select,
} from "../ui/kit";
import { isGridSelecting } from "./downloads/grid-select";
import { DownloadControls, SELECT_NOTE_CLASS } from "./downloads/search-controls";
import { SaveSearchButton } from "./save-search";
import {
  SITE_SEARCH_BOX_CLASS,
  SITE_SEARCH_TOOLS_CLASS,
  SITE_SEARCH_TOOL_CLASS,
  mountSiteSearchTools,
} from "./site-search-tools";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";
import {
  AI_LABEL,
  AI_MODE_HIDE,
  AI_MODE_OPTIONS,
  AI_SCOPE_COLLECTIONS,
  AI_SCOPE_FEED,
  AI_SCOPE_FOLLOWING,
  AI_SCOPE_POSTS,
  aiHiddenEverywhere,
  aiModeIn,
  alignSiteAiFilter,
  currentListScope,
  setAiHiddenIn,
  type AiScope,
} from "./ai-scope";
import { AiEverywhereNote } from "../ui/ai-posts-select";

const FEATURE_ID = "search-tools";
const FEATURE_LABEL = "Search tools";
const FEATURE_PAGES = ["list", "post"] as const;

/**
 * Followed artists for the Feed chip (read-only).
 * Mirror first — GM snapshots on bfcache pages can omit recent follows.
 */
function resolveFollowedArtistTags(): string[] {
  const mirrored = readArtistsMirror();
  if (mirrored !== null && mirrored.length > 0) {
    return [...mirrored];
  }
  return listArtistTags();
}

const TAGS_INPUT_SELECTOR = 'input[name="tags"]';
const TAG_SIDEBAR_SELECTOR = "ul#tag-sidebar";

const ROOT_ID = "rdw-search-tools";
const ROOT_CLASS = "rdw-search-tools";
const CARD_CLASS = "rdw-search-tools-card";
const CHIPS_CLASS = "rdw-search-tools-chips";
const CHIP_CLASS = "rdw-search-tools-chip";
const CHIP_ATTR_START = "data-chip-start";
const CHIP_ATTR_END = "data-chip-end";
const CHIP_ATTR_TOGGLE = "data-chip-toggle";
const CHIP_ATTR_REMOVE = "data-chip-remove";
const FIELD_CLASS = "rdw-search-tools-field";
const ROW_SORT_CLASS = "rdw-search-tools-row-sort";
const FOOT_CLASS = "rdw-search-tools-foot";
/** Over the card: the bar of a selection is drawn into it. */
const BAR_HOST_CLASS = "rdw-search-tools-bar";
/** Around the card while posts are being selected: seen, dimmed, not to be pressed. */
const LOCKED_CLASS = "rdw-search-tools-locked";
const RESET_CLASS = "rdw-search-tools-reset";

const TOKEN_SPLIT_RE = /\s+/;
const MULTI_SPACE_RE = /\s+/g;
const POLL_INTERVAL_MS = 700;
const NAV_DEBOUNCE_MS = 400;
const META_SEP = ":";
const SCORE_TOKEN_PREFIX = "score:>=";
const SCORE_TOKEN_RE = /^score:>=(\d+)$/;
const SORT_TOKEN_PREFIX = "sort:";
const MEDIA_VIDEO = "video";
const MEDIA_IMAGES = `${EXCLUDE_PREFIX}${MEDIA_VIDEO}`;
const TAG_TYPE_CLASS_PREFIX = "tag-type-";
const SORT_HINT = "Sorts within the current search";
const RESET_LABEL = "Reset";
const RESET_TITLE = "Clear the search and all filters";
const KEY_ENTER = "Enter";

const EVENT_INPUT = "input";
const EVENT_CHANGE = "change";
const EVENT_CLICK = "click";
const EVENT_AWESOMPLETE_SELECT = "awesomplete-selectcomplete";

const WARN_NO_FORM = "search-tools: search form not found; not mounted";

const BODY_CLASS = featureBodyClass(FEATURE_ID);

/**
 * Set on document.body while the panel's «AI posts» row is rendered.
 * Site-skin (HANDOFF G) must hide native Filter AI only under this class.
 */
export { SEARCH_TOOLS_AI_ROW_BODY_CLASS };

const FILTER_AI_WAIT_TIMEOUT_MS = 4000;
const FILTER_AI_OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
};

const TAG_TYPES = [
  "artist",
  "character",
  "copyright",
  "general",
  "metadata",
] as const;

type TagType = (typeof TAG_TYPES)[number];

function isTagType(value: string): value is TagType {
  for (const entry of TAG_TYPES) {
    if (entry === value) {
      return true;
    }
  }
  return false;
}

type MediaMode = "all" | "images" | "videos";
type SortMode = "newest" | "oldest" | "score" | "updated" | "random";
type AiPostsMode = "show" | "hide";

const MEDIA_OPTIONS = [
  { value: "all", label: "All" },
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
] as const;

const AI_POSTS_OPTIONS = AI_MODE_OPTIONS;

const AI_POSTS_SECTION_LABEL = AI_LABEL;
/** After "AI posts" in the label, where the choice is not that of Posts: "AI posts in Feed". */
const AI_SCOPE_NAMES: Partial<Record<AiScope, string>> = {
  [AI_SCOPE_FEED]: "Feed",
  [AI_SCOPE_FOLLOWING]: "Following",
  [AI_SCOPE_COLLECTIONS]: "Collections",
};

const SORT_OPTIONS: ReadonlyArray<{
  value: SortMode;
  label: string;
  token: string | null;
}> = [
  { value: "newest", label: "Newest", token: null },
  { value: "oldest", label: "Oldest", token: "sort:id:asc" },
  { value: "score", label: "Top score", token: "sort:score:desc" },
  {
    value: "updated",
    label: "Recently updated",
    token: "sort:updated:desc",
  },
  { value: "random", label: "Random", token: "sort:random" },
];

const SORT_TOKEN_TO_MODE = new Map<string, SortMode>();
for (const option of SORT_OPTIONS) {
  if (option.token !== null) {
    SORT_TOKEN_TO_MODE.set(option.token, option.value);
  }
}

const SEARCH_ICON_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E\") center / contain no-repeat";

/** The width the skin gives the sidebar (site-skin.ts); the panel is drawn for it. */
const SIDEBAR_WIDTH_PX = 228;

const FEATURE_CSS = [
  `body.${BODY_CLASS} .${ROOT_CLASS} {`,
  "  margin-top: 8px;",
  "  max-width: 100%;",
  "  box-sizing: border-box;",
  "}",
  // The panel needs the width the skin gives the sidebar, and the script's
  // font. Without the skin (Site default, Site dark) the sidebar is the
  // site's narrower one and the site's stylesheet sets its wider font on
  // every div and button: the arrow of Sort was pushed out of its field and
  // the two buttons at the bottom stood one over the other.
  `body.${BODY_CLASS} div.sidebar {`,
  `  width: ${String(SIDEBAR_WIDTH_PX)}px;`,
  `  min-width: ${String(SIDEBAR_WIDTH_PX)}px;`,
  `  max-width: ${String(SIDEBAR_WIDTH_PX)}px;`,
  "}",
  `body.${BODY_CLASS} .${ROOT_CLASS} {`,
  "  font-family: var(--rdw-font);",
  "}",
  `body.${BODY_CLASS} .${ROOT_CLASS} * {`,
  "  font-family: var(--rdw-font);",
  "}",
  `body.${BODY_CLASS} .${CARD_CLASS} {`,
  "  padding: 10px;",
  "  display: grid;",
  "  gap: 10px;",
  "}",
  `body.${BODY_CLASS} .${CHIPS_CLASS} {`,
  "  display: flex;",
  "  flex-wrap: wrap;",
  "  gap: 5px;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS} {`,
  "  cursor: default;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS}[${CHIP_ATTR_TOGGLE}="1"] {`,
  "  cursor: pointer;",
  "}",
  `body.${BODY_CLASS} .${FIELD_CLASS} {`,
  "  display: grid;",
  "  gap: 0;",
  "  min-width: 0;",
  "}",
  `body.${BODY_CLASS} .${ROW_SORT_CLASS} {`,
  "  display: grid;",
  "  grid-template-columns: 1fr 72px;",
  "  gap: 8px;",
  "  align-items: start;",
  "}",
  // Always a column of full-width buttons: in a row the two buttons of an
  // empty search became four stacked ones as soon as a query was typed, and
  // the same panel changed its layout with the number of buttons.
  `body.${BODY_CLASS} .${FOOT_CLASS} {`,
  "  display: flex;",
  "  flex-direction: column;",
  "  align-items: stretch;",
  "  gap: 6px;",
  "  border-top: 1px solid var(--rdw-border);",
  "  padding-top: 10px;",
  "}",
  `body.${BODY_CLASS} .${FOOT_CLASS} > button {`,
  "  width: 100%;",
  "  white-space: nowrap;",
  "}",
  // The site's search field, dressed like the script's own (site-search-tools.tsx).
  `body.${BODY_CLASS} .${SITE_SEARCH_BOX_CLASS} {`,
  "  position: relative;",
  "  display: block;",
  "}",
  `body.${BODY_CLASS} .${SITE_SEARCH_BOX_CLASS}::before {`,
  '  content: "";',
  "  position: absolute;",
  "  left: 9px;",
  "  top: 50%;",
  "  z-index: 1;",
  "  width: 14px;",
  "  height: 14px;",
  "  transform: translateY(-50%);",
  "  background: var(--rdw-muted);",
  `  -webkit-mask: ${SEARCH_ICON_MASK};`,
  `  mask: ${SEARCH_ICON_MASK};`,
  "  pointer-events: none;",
  "}",
  `body.${BODY_CLASS} .${SITE_SEARCH_BOX_CLASS} > input[name="tags"] {`,
  "  padding-left: 30px !important;",
  "  padding-right: 54px !important;",
  "  box-sizing: border-box;",
  "}",
  `body.${BODY_CLASS} .${SITE_SEARCH_TOOLS_CLASS} {`,
  "  position: absolute;",
  "  right: 4px;",
  "  top: 50%;",
  "  z-index: 1;",
  "  transform: translateY(-50%);",
  "  display: flex;",
  "  gap: 2px;",
  "}",
  `body.${BODY_CLASS} button.${SITE_SEARCH_TOOL_CLASS} {`,
  "  display: inline-grid;",
  "  place-items: center;",
  "  width: 22px;",
  "  height: 22px;",
  "  min-height: 0;",
  "  margin: 0;",
  "  padding: 0;",
  "  border: 0;",
  "  border-radius: var(--rdw-radius-s);",
  "  background: transparent;",
  "  color: var(--rdw-muted);",
  "  cursor: pointer;",
  "}",
  `body.${BODY_CLASS} button.${SITE_SEARCH_TOOL_CLASS}:hover {`,
  "  color: var(--rdw-text);",
  "}",
  `body.${BODY_CLASS} .${BAR_HOST_CLASS}:not(:empty) {`,
  "  margin-bottom: 8px;",
  "}",
  `body.${BODY_CLASS} .${LOCKED_CLASS} {`,
  "  opacity: 0.45;",
  "  pointer-events: none;",
  "}",
  `body.${BODY_CLASS} .${FOOT_CLASS} > .${SELECT_NOTE_CLASS} {`,
  "  font: 12px/1.4 var(--rdw-font);",
  "  color: var(--rdw-muted);",
  "}",
].join("\n");

type TagChipModel = {
  readonly kind: "tag";
  readonly start: number;
  readonly end: number;
  readonly token: string;
  readonly label: string;
  readonly excluded: boolean;
  readonly chipKind: ChipKind;
  readonly title: string | null;
};

type GroupChipModel = {
  readonly kind: "or-group" | "id-group";
  readonly start: number;
  readonly end: number;
  readonly label: string;
  readonly title: string;
};

type ChipModel = TagChipModel | GroupChipModel;

type PanelView = {
  readonly chips: readonly ChipModel[];
  readonly chipsSig: string;
  readonly media: MediaMode;
  readonly sort: SortMode;
  readonly minScore: number | null;
};

function findTagsInput(): HTMLInputElement | null {
  const input = document.querySelector(TAGS_INPUT_SELECTOR);
  return input instanceof HTMLInputElement ? input : null;
}

function findSearchForm(input: HTMLInputElement): HTMLFormElement | null {
  const form = input.closest("form");
  return form instanceof HTMLFormElement ? form : null;
}

function parseTokens(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [];
  }
  return trimmed.split(TOKEN_SPLIT_RE).filter((token) => token.length > 0);
}

function normalizeSpaces(value: string): string {
  return value.replace(MULTI_SPACE_RE, " ").trim();
}

function joinTokens(tokens: readonly string[]): string {
  return tokens.join(TAG_SEPARATOR);
}

function bareTag(token: string): string {
  if (token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length) {
    return token.slice(EXCLUDE_PREFIX.length);
  }
  return token;
}

function normalizeTagKey(raw: string): string {
  return raw.trim().toLowerCase().replaceAll(" ", "_");
}

function isMediaToken(token: string): boolean {
  return token === MEDIA_VIDEO || token === MEDIA_IMAGES;
}

function isSortToken(token: string): boolean {
  return bareTag(token).startsWith(SORT_TOKEN_PREFIX);
}

function isScoreToken(token: string): boolean {
  return SCORE_TOKEN_RE.test(bareTag(token));
}

function isControlledToken(token: string): boolean {
  return isMediaToken(token) || isSortToken(token) || isScoreToken(token);
}

function isMetaToken(token: string): boolean {
  return bareTag(token).includes(META_SEP);
}

function readMediaMode(tokens: readonly string[]): MediaMode {
  let hasVideo = false;
  let hasImages = false;
  for (const token of tokens) {
    if (token === MEDIA_VIDEO) {
      hasVideo = true;
    } else if (token === MEDIA_IMAGES) {
      hasImages = true;
    }
  }
  if (hasVideo) {
    return "videos";
  }
  if (hasImages) {
    return "images";
  }
  return "all";
}

function readSortMode(tokens: readonly string[]): SortMode {
  for (const token of tokens) {
    const mode = SORT_TOKEN_TO_MODE.get(bareTag(token));
    if (mode !== undefined) {
      return mode;
    }
  }
  return "newest";
}

function readMinScore(tokens: readonly string[]): number | null {
  for (const token of tokens) {
    const match = SCORE_TOKEN_RE.exec(bareTag(token));
    if (match === null) {
      continue;
    }
    const raw = match[1];
    if (raw === undefined) {
      continue;
    }
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return null;
}

function freeTokens(tokens: readonly string[]): string[] {
  return tokens.filter((token) => !isControlledToken(token));
}

function sortTokenForMode(mode: SortMode): string | null {
  const option = SORT_OPTIONS.find((entry) => entry.value === mode);
  return option?.token ?? null;
}

function buildTokenSet(
  current: readonly string[],
  media: MediaMode,
  sort: SortMode,
  minScore: number | null,
): string[] {
  const next = freeTokens(current);
  if (media === "images") {
    next.push(MEDIA_IMAGES);
  } else if (media === "videos") {
    next.push(MEDIA_VIDEO);
  }
  const sortToken = sortTokenForMode(sort);
  if (sortToken !== null) {
    next.push(sortToken);
  }
  if (minScore !== null && minScore > 0) {
    next.push(`${SCORE_TOKEN_PREFIX}${String(minScore)}`);
  }
  return next;
}

function navigateTokens(tokens: readonly string[]): void {
  window.location.assign(buildSearchUrl(parseTags(joinTokens(tokens))));
}

function toggleExclude(token: string): string {
  if (token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length) {
    return token.slice(EXCLUDE_PREFIX.length);
  }
  return `${EXCLUDE_PREFIX}${token}`;
}

function removeTokenRange(
  tokens: readonly string[],
  start: number,
  end: number,
): string[] {
  if (start < 0 || end < start || start >= tokens.length) {
    return [...tokens];
  }
  return tokens.filter((_, index) => index < start || index > end);
}

function replaceTokenAt(
  tokens: readonly string[],
  index: number,
  nextToken: string,
): string[] {
  return tokens.map((token, tokenIndex) =>
    tokenIndex === index ? nextToken : token,
  );
}

function chipKindFromTagType(tagType: TagType | null): ChipKind {
  if (tagType === "artist") {
    return "artist";
  }
  if (tagType === "character") {
    return "character";
  }
  if (tagType === "copyright") {
    return "copyright";
  }
  if (tagType === "metadata") {
    return "metadata";
  }
  return "default";
}

function readTagTypeFromClassList(classList: DOMTokenList): TagType | null {
  for (const className of classList) {
    if (!className.startsWith(TAG_TYPE_CLASS_PREFIX)) {
      continue;
    }
    const typeName = className.slice(TAG_TYPE_CLASS_PREFIX.length);
    if (isTagType(typeName)) {
      return typeName;
    }
  }
  return null;
}

/** The marks a row of the tag list has before the tag: the wiki, add, exclude. */
const SIDEBAR_MARK_LINKS: readonly string[] = ["?", "+", "-"];
const SINGLE_TOKEN = 1;

/**
 * The tag of a row of the tag list. A row is "? + - tag count": the link of
 * the tag is the one that searches for this tag alone, and it is the last.
 * Taking the first link gave "?" for every row, or the tag of the search the
 * "+" adds to, and no chip of the panel was coloured.
 */
function extractSidebarTag(li: Element): string | null {
  const links = [...li.querySelectorAll("a[href]")].reverse();
  for (const node of links) {
    const href = node.getAttribute("href");
    if (href === null || href.length === 0) {
      continue;
    }
    let url: URL;
    try {
      url = new URL(href, SITE_ORIGIN);
    } catch {
      continue;
    }
    const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
    if (tags === null) {
      continue;
    }
    const tokens = parseTokens(tags);
    const only = tokens[0];
    if (tokens.length === SINGLE_TOKEN && only !== undefined) {
      return normalizeTagKey(bareTag(only));
    }
  }
  for (const node of links) {
    const text = node.textContent?.trim() ?? "";
    if (text.length > 0 && !SIDEBAR_MARK_LINKS.includes(text)) {
      return normalizeTagKey(text);
    }
  }
  return null;
}

function buildSidebarTagTypes(): Map<string, TagType> {
  const map = new Map<string, TagType>();
  const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR);
  if (!(sidebar instanceof HTMLUListElement)) {
    return map;
  }
  for (const child of sidebar.children) {
    if (!(child instanceof HTMLLIElement)) {
      continue;
    }
    const tagType = readTagTypeFromClassList(child.classList);
    if (tagType === null) {
      continue;
    }
    const tag = extractSidebarTag(child);
    if (tag === null) {
      continue;
    }
    map.set(tag, tagType);
  }
  // The tag list beside the posts names the kind of every tag in it.
  rememberTagKinds(map);
  return map;
}

function findFilterAiCheckbox(): HTMLInputElement | null {
  const node = document.querySelector(SITE_SELECTORS.filterAiCheckbox);
  return node instanceof HTMLInputElement ? node : null;
}

function setAiRowBodyClass(active: boolean): void {
  document.body.classList.toggle(SEARCH_TOOLS_AI_ROW_BODY_CLASS, active);
}

/**
 * Resolve #chkFilterAI now or when the site injects it. Disconnects on find
 * or timeout. Returns a cancel function for unmount.
 */
function waitForFilterAiCheckbox(
  onFound: (checkbox: HTMLInputElement) => void,
  onTimeout: () => void,
): () => void {
  const existing = findFilterAiCheckbox();
  if (existing !== null) {
    onFound(existing);
    return (): void => {};
  }

  let settled = false;
  const finish = (action: () => void): void => {
    if (settled) {
      return;
    }
    settled = true;
    observer.disconnect();
    window.clearTimeout(timeoutId);
    action();
  };

  const observer = new MutationObserver(() => {
    const checkbox = findFilterAiCheckbox();
    if (checkbox === null) {
      return;
    }
    finish(() => {
      onFound(checkbox);
    });
  });
  observer.observe(document.documentElement, FILTER_AI_OBSERVER_OPTIONS);

  const timeoutId = window.setTimeout(() => {
    finish(onTimeout);
  }, FILTER_AI_WAIT_TIMEOUT_MS);

  return (): void => {
    finish(() => {});
  };
}

/** The part of the site this list belongs to: each has its own choice for AI posts. */
function pageAiScope(): AiScope {
  return currentListScope() ?? AI_SCOPE_POSTS;
}

/**
 * The choice of this part of the site, not the state of the site's checkbox:
 * the checkbox is one for the whole site, and the script moves it.
 */
function readAiPostsMode(_checkbox: HTMLInputElement): AiPostsMode {
  return aiModeIn(pageAiScope());
}

function tryParseParenGroup(
  tokens: readonly string[],
  start: number,
): { end: number; inner: string[] } | null {
  if (tokens[start] !== UPDATES_OR_OPEN) {
    return null;
  }
  for (let index = start + 1; index < tokens.length; index += 1) {
    if (tokens[index] === UPDATES_OR_OPEN) {
      return null;
    }
    if (tokens[index] === UPDATES_OR_CLOSE) {
      const inner = tokens.slice(start + 1, index);
      if (inner.length === 0) {
        return null;
      }
      return { end: index, inner };
    }
  }
  return null;
}

function isOrJoinedMembers(inner: readonly string[]): string[] | null {
  if (inner.length === 0 || inner.length % 2 === 0) {
    return null;
  }
  const members: string[] = [];
  for (let index = 0; index < inner.length; index += 1) {
    const token = inner[index];
    if (token === undefined) {
      return null;
    }
    if (index % 2 === 1) {
      if (token !== UPDATES_OR_JOIN) {
        return null;
      }
      continue;
    }
    if (
      token === UPDATES_OR_OPEN ||
      token === UPDATES_OR_CLOSE ||
      token === UPDATES_OR_JOIN
    ) {
      return null;
    }
    members.push(token);
  }
  return members.length > 0 ? members : null;
}

function orGroupLabel(members: readonly string[]): {
  label: string;
  title: string;
} {
  const title = members.join(" ");
  const query = joinTokens([
    UPDATES_OR_OPEN,
    ...members.flatMap((member, index) =>
      index === 0 ? [member] : [UPDATES_OR_JOIN, member],
    ),
    UPDATES_OR_CLOSE,
  ]);
  const artists = resolveFollowedArtistTags();
  const count = members.length;
  if (
    isFullUpdatesQuery(query, artists) ||
    findFeedGroupIndex(query, artists, getUpdatesGroupSize()) >= 0
  ) {
    return {
      label: `Feed · ${String(artists.length)} artists`,
      title,
    };
  }
  return {
    label: `Any of ${String(count)} tags`,
    title,
  };
}

function chipsSignature(chips: readonly ChipModel[]): string {
  return chips
    .map((chip) => {
      if (chip.kind === "tag") {
        return `t:${String(chip.start)}:${chip.token}:${chip.chipKind}`;
      }
      return `g:${chip.kind}:${String(chip.start)}:${String(chip.end)}:${chip.label}:${chip.title}`;
    })
    .join("|");
}

function buildChipModels(tokens: readonly string[]): ChipModel[] {
  const tagTypes = buildSidebarTagTypes();
  const chips: ChipModel[] = [];
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) {
      break;
    }
    if (isControlledToken(token)) {
      index += 1;
      continue;
    }

    const group = tryParseParenGroup(tokens, index);
    if (group !== null) {
      const groupTokens = tokens.slice(index, group.end + 1);
      const playlistIds = parsePlaylistQuery(joinTokens(groupTokens));
      if (playlistIds !== null && playlistIds.length > 0) {
        chips.push({
          kind: "id-group",
          start: index,
          end: group.end,
          label: `${String(playlistIds.length)} posts`,
          title: groupTokens.join(" "),
        });
        index = group.end + 1;
        continue;
      }
      const members = isOrJoinedMembers(group.inner);
      if (members !== null) {
        const { label, title } = orGroupLabel(members);
        chips.push({
          kind: "or-group",
          start: index,
          end: group.end,
          label,
          title,
        });
        index = group.end + 1;
        continue;
      }
    }

    const excluded =
      token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length;
    const tagType =
      tagTypes.get(normalizeTagKey(bareTag(token))) ?? null;
    chips.push({
      kind: "tag",
      start: index,
      end: index,
      token,
      label: token,
      excluded,
      // Not in the list beside the posts: what is remembered of the tag, or
      // the kind it is followed as.
      chipKind: tagType === null ? chipKindOfTag(bareTag(token)) : chipKindFromTagType(tagType),
      title: isMetaToken(token) ? token : null,
    });
    index += 1;
  }
  return chips;
}

function readPanelView(inputValue: string, search: string): PanelView {
  const tokens = parseTokens(inputValue);
  const chips = buildChipModels(tokens);
  return {
    chips,
    chipsSig: chipsSignature(chips),
    media: readMediaMode(tokens),
    sort: readSortMode(tokens),
    minScore: readMinScore(tokens),
  };
}

function ensureRoot(form: HTMLFormElement): HTMLDivElement {
  const existing = document.getElementById(ROOT_ID);
  if (existing instanceof HTMLDivElement) {
    if (existing.previousElementSibling !== form) {
      form.after(existing);
    }
    return existing;
  }
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = ROOT_CLASS;
  form.after(root);
  return root;
}

function setInputValueOnly(input: HTMLInputElement, tokens: readonly string[]): void {
  input.value = normalizeSpaces(joinTokens(tokens));
}

type SearchToolsPanelProps = {
  readonly input: HTMLInputElement;
};

function SearchToolsPanel(props: SearchToolsPanelProps): JSX.Element {
  const { input } = props;
  const [view, setView] = useState<PanelView>(() =>
    readPanelView(input.value, window.location.search),
  );
  const [scoreDraft, setScoreDraft] = useState<number | null>(view.minScore);
  useTagKindLookup(
    view.chips.flatMap((chip) =>
      chip.kind === "tag" && !chip.excluded && chip.chipKind === "default" && !isMetaToken(chip.token)
        ? [bareTag(chip.token)]
        : [],
    ),
  );
  // Read at once when the site's checkbox is already in the page: the row is
  // then part of the first render, and the panel does not grow a moment later.
  const [aiPosts, setAiPosts] = useState<AiPostsMode | null>(() => {
    const checkbox = findFilterAiCheckbox();
    return checkbox === null ? null : readAiPostsMode(checkbox);
  });
  const scoreFocusedRef = useRef(false);
  const navTimerRef = useRef<number | null>(null);
  const lastPolledValueRef = useRef(input.value);

  const clearNavTimer = (): void => {
    if (navTimerRef.current !== null) {
      window.clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
  };

  const scheduleNavigate = (tokens: readonly string[]): void => {
    clearNavTimer();
    navTimerRef.current = window.setTimeout(() => {
      navTimerRef.current = null;
      navigateTokens(tokens);
    }, NAV_DEBOUNCE_MS);
  };

  const applyViewFromInput = (options: {
    readonly navigate: boolean;
  }): void => {
    const next = readPanelView(input.value, window.location.search);
    lastPolledValueRef.current = input.value;
    setView((prev) => {
      const chipsUnchanged = next.chipsSig === prev.chipsSig;
      if (
        chipsUnchanged &&
        next.media === prev.media &&
        next.sort === prev.sort &&
        next.minScore === prev.minScore
      ) {
        return prev;
      }
      return {
        ...next,
        chips: chipsUnchanged ? prev.chips : next.chips,
      };
    });
    if (!scoreFocusedRef.current) {
      setScoreDraft(next.minScore);
    }
    if (options.navigate) {
      scheduleNavigate(parseTokens(input.value));
    }
  };

  const writeTokens = (
    tokens: readonly string[],
    options: { readonly navigate: boolean },
  ): void => {
    setInputValueOnly(input, tokens);
    lastPolledValueRef.current = input.value;
    const next = readPanelView(input.value, window.location.search);
    setView((prev) => {
      const chipsUnchanged = next.chipsSig === prev.chipsSig;
      return {
        ...next,
        chips: chipsUnchanged ? prev.chips : next.chips,
      };
    });
    if (!scoreFocusedRef.current) {
      setScoreDraft(next.minScore);
    }
    if (options.navigate) {
      scheduleNavigate(tokens);
    }
  };

  const applyViewRef = useRef(applyViewFromInput);
  applyViewRef.current = applyViewFromInput;

  useEffect(() => {
    // Site tags field: refresh chips only. Search/reload is the site's
    // Search button or Enter — never auto-apply on type or autocomplete.
    const onSiteInput = (): void => {
      applyViewRef.current({ navigate: false });
    };
    input.addEventListener(EVENT_INPUT, onSiteInput);
    input.addEventListener(EVENT_CHANGE, onSiteInput);
    input.addEventListener(EVENT_AWESOMPLETE_SELECT, onSiteInput);

    const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR);
    const onSidebarClick = (): void => {
      window.setTimeout(() => {
        applyViewRef.current({ navigate: false });
      }, 0);
    };
    if (sidebar !== null) {
      sidebar.addEventListener(EVENT_CLICK, onSidebarClick);
    }

    const pollId = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      if (input.value === lastPolledValueRef.current) {
        return;
      }
      applyViewRef.current({ navigate: false });
    }, POLL_INTERVAL_MS);

    return () => {
      clearNavTimer();
      input.removeEventListener(EVENT_INPUT, onSiteInput);
      input.removeEventListener(EVENT_CHANGE, onSiteInput);
      input.removeEventListener(EVENT_AWESOMPLETE_SELECT, onSiteInput);
      if (sidebar !== null) {
        sidebar.removeEventListener(EVENT_CLICK, onSidebarClick);
      }
      window.clearInterval(pollId);
    };
  }, [input]);

  useEffect(() => {
    let checkbox: HTMLInputElement | null = null;
    const onCheckboxChange = (): void => {
      if (checkbox === null) {
        return;
      }
      setAiPosts(readAiPostsMode(checkbox));
    };

    const cancelWait = waitForFilterAiCheckbox(
      (found) => {
        checkbox = found;
        setAiPosts(readAiPostsMode(found));
        setAiRowBodyClass(true);
        found.addEventListener(EVENT_CHANGE, onCheckboxChange);
      },
      () => {
        setAiPosts(null);
        setAiRowBodyClass(false);
      },
    );

    return () => {
      cancelWait();
      if (checkbox !== null) {
        checkbox.removeEventListener(EVENT_CHANGE, onCheckboxChange);
      }
      setAiRowBodyClass(false);
    };
  }, []);

  const onChipsClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const chipEl = target.closest(`[${CHIP_ATTR_START}]`);
    if (!(chipEl instanceof HTMLElement)) {
      return;
    }
    const startRaw = chipEl.getAttribute(CHIP_ATTR_START);
    const endRaw = chipEl.getAttribute(CHIP_ATTR_END);
    if (startRaw === null || endRaw === null) {
      return;
    }
    const start = Number(startRaw);
    const end = Number(endRaw);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return;
    }

    const removeEl = target.closest(`[${CHIP_ATTR_REMOVE}]`);
    if (removeEl !== null) {
      event.preventDefault();
      const current = parseTokens(input.value);
      writeTokens(removeTokenRange(current, start, end), { navigate: true });
      return;
    }

    if (chipEl.getAttribute(CHIP_ATTR_TOGGLE) !== "1") {
      return;
    }
    event.preventDefault();
    const current = parseTokens(input.value);
    const currentToken = current[start];
    if (currentToken === undefined || isMetaToken(currentToken)) {
      return;
    }
    writeTokens(replaceTokenAt(current, start, toggleExclude(currentToken)), {
      navigate: true,
    });
  };

  const onMediaChange = (value: string): void => {
    const media = MEDIA_OPTIONS.find((entry) => entry.value === value)?.value;
    if (media === undefined) {
      return;
    }
    const tokens = parseTokens(input.value);
    writeTokens(
      buildTokenSet(tokens, media, readSortMode(tokens), readMinScore(tokens)),
      { navigate: true },
    );
  };

  const onSortChange = (value: string): void => {
    const sort = SORT_OPTIONS.find((entry) => entry.value === value)?.value;
    if (sort === undefined) {
      return;
    }
    const tokens = parseTokens(input.value);
    writeTokens(
      buildTokenSet(tokens, readMediaMode(tokens), sort, readMinScore(tokens)),
      { navigate: true },
    );
  };

  const commitScore = (): void => {
    const tokens = parseTokens(input.value);
    let minScore: number | null = null;
    if (scoreDraft !== null && Number.isFinite(scoreDraft) && scoreDraft > 0) {
      minScore = Math.floor(scoreDraft);
    }
    const current = readMinScore(tokens);
    if (current === minScore) {
      setScoreDraft(current);
      return;
    }
    writeTokens(
      buildTokenSet(
        tokens,
        readMediaMode(tokens),
        readSortMode(tokens),
        minScore,
      ),
      { navigate: true },
    );
  };

  const onAiPostsChange = (value: string): void => {
    const mode = AI_POSTS_OPTIONS.find((entry) => entry.value === value)?.value;
    if (mode === undefined) {
      return;
    }
    const checkbox = findFilterAiCheckbox();
    if (checkbox === null) {
      setAiPosts(null);
      return;
    }
    if (aiHiddenEverywhere() || mode === aiModeIn(pageAiScope())) {
      return;
    }
    // The choice is kept for this part of the site, the site's switch is put
    // to it, and the list is asked for again: the server does the filtering.
    const scope = pageAiScope();
    setAiHiddenIn(scope, mode === AI_MODE_HIDE);
    alignSiteAiFilter(scope);
    setAiPosts(mode);
    // What is typed in the field and not searched yet would be lost with the
    // page: it is searched for instead, as a change of Media or Sort does.
    const typed = parseTokens(input.value);
    const shown = parseTokens(
      new URLSearchParams(window.location.search).get(SEARCH_PARAM_TAGS) ?? "",
    );
    if (joinTokens(typed) !== joinTokens(shown)) {
      clearNavTimer();
      navigateTokens(typed);
      return;
    }
    window.location.reload();
  };

  const aiScopeName = AI_SCOPE_NAMES[pageAiScope()];
  const aiLabel =
    aiScopeName === undefined
      ? AI_POSTS_SECTION_LABEL
      : `${AI_POSTS_SECTION_LABEL} in ${aiScopeName}`;

  const [barHost, setBarHost] = useState<HTMLElement | null>(null);
  const [selecting, setSelecting] = useState(false);

  const onReset = (): void => {
    clearNavTimer();
    setInputValueOnly(input, []);
    lastPolledValueRef.current = input.value;
    setView(readPanelView("", window.location.search));
    setScoreDraft(null);
    window.location.assign(buildSearchUrl([]));
  };

  return (
    <>
      <style>{CHIP_CSS}</style>
      <div className={BAR_HOST_CLASS} ref={setBarHost} />
      {/* While posts are selected the filters are seen and locked: they say
          what is being selected from, and cannot change it. */}
      <div {...(selecting ? { className: LOCKED_CLASS, inert: true } : {})}>
      <Card className={CARD_CLASS}>
        {view.chips.length > 0 ? (
          <div className={FIELD_CLASS}>
            <SectionLabel>Tags</SectionLabel>
            <div
              className={CHIPS_CLASS}
              onClick={onChipsClick}
              role="list"
              aria-label="Search tags"
            >
              {view.chips.map((chip) => {
                if (chip.kind === "tag") {
                  const excluded = chip.excluded;
                  const variantClass = excluded
                    ? "rdw-chip--exclude"
                    : "rdw-chip--dot";
                  // Read when drawn: the kind may have been learned since the chip was made.
                  const chipKind =
                    chip.chipKind === "default" ? chipKindOfTag(bareTag(chip.token)) : chip.chipKind;
                  const kindClass =
                    !excluded && chipKind !== "default" ? `rdw-chip--${chipKind}` : "";
                  const toggleable = !isMetaToken(chip.token);
                  return (
                    <span
                      key={`t-${String(chip.start)}-${chip.token}`}
                      className={[
                        "rdw-chip",
                        variantClass,
                        kindClass,
                        CHIP_CLASS,
                      ]
                        .filter((part) => part.length > 0)
                        .join(" ")}
                      role="listitem"
                      title={chip.title ?? undefined}
                      data-chip-start={String(chip.start)}
                      data-chip-end={String(chip.end)}
                      data-chip-toggle={toggleable ? "1" : "0"}
                    >
                      {!excluded ? (
                        <i className="rdw-chip__dot" aria-hidden="true" />
                      ) : null}
                      <span>{chip.label}</span>
                      <button
                        type="button"
                        className="rdw-chip__remove rdw-kit-focusable"
                        aria-label={`Remove ${chip.label}`}
                        data-chip-remove="1"
                      >
                        <IconX size={12} />
                      </button>
                    </span>
                  );
                }

                return (
                  <span
                    key={`g-${String(chip.start)}-${String(chip.end)}-${chip.label}`}
                    className={`rdw-chip rdw-chip--group ${CHIP_CLASS}`}
                    role="listitem"
                    title={chip.title}
                    data-chip-start={String(chip.start)}
                    data-chip-end={String(chip.end)}
                    data-chip-toggle="0"
                  >
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      className="rdw-chip__remove rdw-kit-focusable"
                      aria-label={`Remove ${chip.label}`}
                      data-chip-remove="1"
                    >
                      <IconX size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={FIELD_CLASS}>
          <SectionLabel>Media</SectionLabel>
          <Segmented
            label="Media"
            options={MEDIA_OPTIONS.map((entry) => ({
              value: entry.value,
              label: entry.label,
            }))}
            value={view.media}
            onChange={onMediaChange}
          />
        </div>

        <div className={ROW_SORT_CLASS} title={SORT_HINT}>
          <Select
            label="Sort"
            options={SORT_OPTIONS.map((entry) => ({
              value: entry.value,
              label: entry.label,
            }))}
            value={view.sort}
            onChange={onSortChange}
          />
          <div
            onFocusIn={() => {
              scoreFocusedRef.current = true;
            }}
            onFocusOut={(event) => {
              const next = event.relatedTarget;
              if (
                next instanceof Node &&
                event.currentTarget.contains(next)
              ) {
                return;
              }
              scoreFocusedRef.current = false;
              commitScore();
            }}
            onKeyDown={(event) => {
              if (event.key !== KEY_ENTER) {
                return;
              }
              event.preventDefault();
              commitScore();
            }}
          >
            <NumberField
              label="Min score"
              placeholder="Any"
              value={scoreDraft}
              min={1}
              step={1}
              onChange={setScoreDraft}
            />
          </div>
        </div>

        {aiPosts !== null ? (
          <div className={FIELD_CLASS}>
            <SectionLabel>{aiLabel}</SectionLabel>
            <Segmented
              label={aiLabel}
              options={AI_POSTS_OPTIONS.map((entry) => ({
                value: entry.value,
                label: entry.label,
              }))}
              value={aiPosts}
              disabled={aiHiddenEverywhere()}
              onChange={onAiPostsChange}
            />
            {aiHiddenEverywhere() ? <AiEverywhereNote /> : null}
          </div>
        ) : null}

        <div className={FOOT_CLASS}>
          <Button
            variant="secondary"
            size="s"
            className={RESET_CLASS}
            title={RESET_TITLE}
            onClick={onReset}
          >
            {RESET_LABEL}
          </Button>
          <SaveSearchButton tags={input.value} />
          <DownloadControls barHost={barHost} onSelectingChange={setSelecting} />
        </div>
      </Card>
      </div>
    </>
  );
}

function mountSearchTools(_ctx: FeatureContext): void {
  const input = findTagsInput();
  if (input === null) {
    log.warn(WARN_NO_FORM);
    return;
  }
  const form = findSearchForm(input);
  if (form === null) {
    log.warn(WARN_NO_FORM);
    return;
  }

  mountSiteSearchTools(input);
  const root = ensureRoot(form);
  render(<SearchToolsPanel input={input} />, root);
  // The place reserved before the first paint is no longer needed, and the
  // real height is kept for the next page load, so nothing jumps there.
  root.classList.add(SEARCH_TOOLS_MOUNTED_CLASS);
  const remember = (): void => {
    // With the bar of a selection over it the panel is taller than it is on a fresh page.
    if (isGridSelecting()) {
      return;
    }
    rememberSearchToolsHeight(root.getBoundingClientRect().height);
  };
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(remember).observe(root);
  } else {
    window.requestAnimationFrame(remember);
  }
}

export const searchToolsFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  settingsCaption:
    "A panel under the search field: rating, type, order and score are picked there and written into the search as text.",
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountSearchTools,
};
