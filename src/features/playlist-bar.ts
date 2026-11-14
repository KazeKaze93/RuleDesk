import { Fragment, h, render } from "preact";
import type { JSX } from "preact";
import { useState } from "preact/hooks";

import {
  SEARCH_PARAM_PID,
  SEARCH_PARAM_TAGS,
  UI_TEXT,
} from "../config/constants";
import { log } from "../log";
import {
  buildPlaylistQueries,
  buildSearchUrl,
  parsePlaylistQuery,
  parseTags,
  queriesMatchIgnoringSortRandom,
  queryHasSortRandom,
  serialize,
  withSortRandom,
  withoutSortRandom,
} from "../search/query";
import { SITE_SELECTORS } from "../site/selectors";
import {
  isPlaylist,
  type Collection,
  type PostCount,
} from "../storage/schema";
import {
  deleteCollection,
  DYNAMIC_COVER_SIZE,
  getPlaylistChunkSize,
  listPlaylists,
  load,
  renameCollection,
  setDynamicCover,
  setDynamicPostCount,
  updateDynamicQuery,
} from "../storage/store";
import { Button, Dialog, type DialogFieldValues } from "../ui/kit";
import { QueryField } from "../ui/query-field";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

const FEATURE_ID = "playlist-bar";
const FEATURE_LABEL = "Collection header";
const FEATURE_PAGES = ["list"] as const;

const ROOT_ID = "rdw-playlist-bar";
const ROOT_CLASS = "rdw-playlist-bar";
const TITLE_CLASS = "rdw-playlist-bar-title";
const NAME_CLASS = "rdw-playlist-bar-name";
const COUNT_CLASS = "rdw-playlist-bar-count";
const PARTS_CLASS = "rdw-playlist-bar-parts";
const PART_LABEL_CLASS = "rdw-playlist-bar-part-label";
const PART_LINK_CLASS = "rdw-playlist-bar-part-link";
const CAPTION_CLASS = "rdw-playlist-bar-caption";

const DYNAMIC_ROOT_ID = "rdw-dynamic-collection-bar";
const ACTIONS_CLASS = "rdw-dynamic-collection-actions";

const TEXT_POSTS_SUFFIX = " posts";
const TEXT_PART_PREFIX = "Part ";
const TEXT_PART_OF = " of ";
const TEXT_CAPTION = "Posts are ordered by the site (newest first).";
const TEXT_PREV = "Previous";
const TEXT_NEXT = "Next";
const TEXT_SHUFFLE = "Shuffle";
const TEXT_ORIGINAL_ORDER = "Original order";
const TEXT_EDIT_QUERY = "Edit query";
const TEXT_QUERY_LABEL = "Query";

const DIALOG_NONE = "none";
const DIALOG_EDIT_QUERY = "edit-query";
const DIALOG_RENAME = "rename";
const DIALOG_DELETE = "delete";
const DIALOG_VARIANT_FIELDS = "fields" as const;
const DIALOG_VARIANT_CONFIRM = "confirm" as const;
const DIALOG_TONE_DANGER = "danger" as const;
const DIALOG_ONLY_NAME = "name" as const;
const DIALOG_ONLY_QUERY = "query" as const;
const BAR_BUTTON_VARIANT = "secondary" as const;
const BAR_BUTTON_SIZE = "s" as const;
/** Same heading size and button gap as the custom collection page. */
const NAME_FONT_PX = 18;
const ACTIONS_GAP_PX = 8;

type DynamicDialogKind =
  | typeof DIALOG_NONE
  | typeof DIALOG_EDIT_QUERY
  | typeof DIALOG_RENAME
  | typeof DIALOG_DELETE;

const WARN_MISSING_HOST =
  "playlist-bar: image-list not found; playlist bar not mounted";

const BODY_CLASS = featureBodyClass(FEATURE_ID);

const FEATURE_CSS = `
body.${BODY_CLASS} .${ROOT_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.5rem 0;
  color: var(--rdw-text);
  box-sizing: border-box;
}
body.${BODY_CLASS} .${TITLE_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${BODY_CLASS} .${NAME_CLASS} {
  font-size: ${String(NAME_FONT_PX)}px;
  font-weight: 700;
}
body.${BODY_CLASS} .${COUNT_CLASS} {
  opacity: 0.85;
}
body.${BODY_CLASS} .${PARTS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${BODY_CLASS} .${PART_LABEL_CLASS} {
  flex: 0 0 auto;
}
body.${BODY_CLASS} a.${PART_LINK_CLASS} {
  color: inherit;
  text-decoration: underline;
}
body.${BODY_CLASS} a.${PART_LINK_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
body.${BODY_CLASS} .${CAPTION_CLASS} {
  margin: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  opacity: 0.8;
}
body.${BODY_CLASS} .${ACTIONS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${String(ACTIONS_GAP_PX)}px;
  max-width: 100%;
}
`.trim();

function readTagsParam(search: string): string {
  return new URLSearchParams(search).get(SEARCH_PARAM_TAGS) ?? "";
}

function idsEqualAsSet(left: readonly number[], right: readonly number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const set = new Set(left);
  if (set.size !== left.length) {
    return false;
  }
  for (const id of right) {
    if (!set.has(id)) {
      return false;
    }
  }
  return true;
}

function containsAllIds(
  postIds: readonly number[],
  queryIds: readonly number[],
): boolean {
  const set = new Set(postIds);
  for (const id of queryIds) {
    if (!set.has(id)) {
      return false;
    }
  }
  return true;
}

type PlaylistMatch = {
  playlist: Collection;
  partIndex: number;
  partQueries: string[];
};

function findPlaylistMatch(queryIds: number[]): PlaylistMatch | null {
  const chunkSize = getPlaylistChunkSize();
  const candidates: PlaylistMatch[] = [];

  for (const playlist of listPlaylists()) {
    const postIds = playlist.postIds ?? [];
    if (!containsAllIds(postIds, queryIds)) {
      continue;
    }
    const partQueries = buildPlaylistQueries(postIds, chunkSize);
    let partIndex = -1;
    for (let index = 0; index < partQueries.length; index += 1) {
      const chunkQuery = partQueries[index];
      if (chunkQuery === undefined) {
        continue;
      }
      const chunkIds = parsePlaylistQuery(chunkQuery);
      if (chunkIds !== null && idsEqualAsSet(queryIds, chunkIds)) {
        partIndex = index;
        break;
      }
    }
    candidates.push({ playlist, partIndex, partQueries });
  }

  if (candidates.length === 0) {
    return null;
  }

  const exact = candidates.find((entry) => entry.partIndex >= 0);
  return exact ?? candidates[0] ?? null;
}

function buildPlaylistSearchUrl(query: string): string {
  return buildSearchUrl(parseTags(query));
}

function removeExistingBar(root: ParentNode): void {
  const existing =
    root instanceof Document
      ? root.getElementById(ROOT_ID)
      : root.querySelector(`#${ROOT_ID}`);
  if (existing !== null) {
    existing.remove();
  }
}

function findImageList(root: ParentNode): Element | null {
  return root.querySelector(SITE_SELECTORS.imageList);
}

function findFallbackHost(root: ParentNode): Element | null {
  return (
    root.querySelector(SITE_SELECTORS.postListContent) ??
    root.querySelector(SITE_SELECTORS.contentRoot)
  );
}

function insertBar(host: Element, bar: HTMLElement, before: Element | null): void {
  if (before !== null && before.parentElement === host) {
    host.insertBefore(bar, before);
    return;
  }
  if (before !== null) {
    before.parentElement?.insertBefore(bar, before);
    return;
  }
  host.insertBefore(bar, host.firstChild);
}

function formatPostCount(count: number): string {
  return `${String(count)}${TEXT_POSTS_SUFFIX}`;
}

function formatPartLabel(partIndex: number, total: number): string {
  return `${TEXT_PART_PREFIX}${String(partIndex + 1)}${TEXT_PART_OF}${String(total)}`;
}

function appendNeighborLink(
  parent: Element,
  label: string,
  query: string | undefined,
): void {
  if (query === undefined) {
    return;
  }
  const link = document.createElement("a");
  link.className = PART_LINK_CLASS;
  link.href = buildPlaylistSearchUrl(query);
  link.textContent = label;
  parent.append(link);
}

function buildPartsRow(match: PlaylistMatch): HTMLDivElement | null {
  const { partIndex, partQueries } = match;
  if (partQueries.length === 0 || partIndex < 0) {
    return null;
  }

  const row = document.createElement("div");
  row.className = PARTS_CLASS;

  const label = document.createElement("span");
  label.className = PART_LABEL_CLASS;
  label.textContent = formatPartLabel(partIndex, partQueries.length);
  row.append(label);

  if (partQueries.length > 1) {
    appendNeighborLink(row, TEXT_PREV, partQueries[partIndex - 1]);
    appendNeighborLink(row, TEXT_NEXT, partQueries[partIndex + 1]);
  }

  return row;
}

function createBar(match: PlaylistMatch): HTMLDivElement {
  const bar = document.createElement("div");
  bar.id = ROOT_ID;
  bar.className = ROOT_CLASS;

  const title = document.createElement("div");
  title.className = TITLE_CLASS;

  const name = document.createElement("span");
  name.className = NAME_CLASS;
  name.textContent = match.playlist.name;

  const count = document.createElement("span");
  count.className = COUNT_CLASS;
  count.textContent = formatPostCount(match.playlist.postIds?.length ?? 0);

  title.append(name, count);
  bar.append(title);

  const parts = buildPartsRow(match);
  if (parts !== null) {
    bar.append(parts);
  }

  const caption = document.createElement("p");
  caption.className = CAPTION_CLASS;
  caption.textContent = TEXT_CAPTION;
  bar.append(caption);

  return bar;
}

function placeBar(bar: HTMLElement): boolean {
  const imageList = findImageList(document);
  if (imageList !== null) {
    const host = imageList.parentElement;
    if (host === null) {
      log.warn(WARN_MISSING_HOST);
      return false;
    }
    insertBar(host, bar, imageList);
    return true;
  }

  const fallback = findFallbackHost(document);
  if (fallback === null) {
    log.warn(WARN_MISSING_HOST);
    return false;
  }
  log.warn(WARN_MISSING_HOST);
  insertBar(fallback, bar, null);
  return true;
}

function storedDynamicQuery(collection: Collection): string {
  if (collection.query !== undefined) {
    return collection.query;
  }
  return serialize(collection.tags);
}

function findDynamicCollection(tagsParam: string): Collection | null {
  for (const collection of load().collections) {
    if (isPlaylist(collection)) {
      continue;
    }
    const stored = storedDynamicQuery(collection);
    // An empty saved query would match the plain post list.
    if (withoutSortRandom(stored).length === 0) {
      continue;
    }
    if (queriesMatchIgnoringSortRandom(tagsParam, stored)) {
      return collection;
    }
  }
  return null;
}

function removeDynamicBar(root: ParentNode): void {
  const existing =
    root instanceof Document
      ? root.getElementById(DYNAMIC_ROOT_ID)
      : root.querySelector(`#${DYNAMIC_ROOT_ID}`);
  if (!(existing instanceof HTMLElement)) {
    return;
  }
  render(null, existing);
  existing.remove();
}

function deleteConfirmMessage(collectionName: string): string {
  return `${UI_TEXT.confirmDelete} (${collectionName})`;
}

function navigateToQuery(query: string): void {
  window.location.assign(buildSearchUrl(parseTags(query)));
}

type DynamicBarProps = {
  readonly collectionId: string;
  readonly initialName: string;
  readonly storedQuery: string;
  readonly pageQuery: string;
};

function DynamicCollectionBar(props: DynamicBarProps): JSX.Element {
  const [name, setName] = useState(props.initialName);
  const [query, setQuery] = useState(props.storedQuery);
  const [dialog, setDialog] = useState<DynamicDialogKind>(DIALOG_NONE);
  const [fields, setFields] = useState<DialogFieldValues>({
    name: props.initialName,
    query: props.storedQuery,
  });
  const shuffled = queryHasSortRandom(props.pageQuery);

  function closeDialog(): void {
    setDialog(DIALOG_NONE);
  }

  function openFields(kind: typeof DIALOG_EDIT_QUERY | typeof DIALOG_RENAME): void {
    setFields({ name, query });
    setDialog(kind);
  }

  function onShuffle(): void {
    if (shuffled) {
      window.location.reload();
      return;
    }
    navigateToQuery(withSortRandom(props.pageQuery));
  }

  function onOriginalOrder(): void {
    navigateToQuery(withoutSortRandom(props.pageQuery));
  }

  function onEditSubmit(): void {
    if (fields.query.trim().length === 0) {
      return;
    }
    const updated = updateDynamicQuery(props.collectionId, fields.query);
    if (updated === null) {
      return;
    }
    const nextQuery = updated.query ?? serialize(updated.tags);
    setQuery(nextQuery);
    navigateToQuery(nextQuery);
  }

  function onRenameSubmit(): void {
    const trimmedName = fields.name.trim();
    if (trimmedName.length === 0) {
      return;
    }
    const renamed = renameCollection(props.collectionId, trimmedName);
    if (renamed === null) {
      return;
    }
    setName(renamed.name);
    closeDialog();
  }

  function onConfirmDelete(): void {
    const removed = deleteCollection(props.collectionId);
    if (!removed) {
      closeDialog();
      return;
    }
    const root = document.getElementById(DYNAMIC_ROOT_ID);
    if (!(root instanceof HTMLElement)) {
      return;
    }
    root.remove();
    render(null, root);
  }

  const fieldsOpen = dialog === DIALOG_EDIT_QUERY || dialog === DIALOG_RENAME;
  const fieldsTitle = dialog === DIALOG_RENAME ? UI_TEXT.rename : TEXT_EDIT_QUERY;
  const onFieldsSubmit = dialog === DIALOG_RENAME ? onRenameSubmit : onEditSubmit;

  return h(
    Fragment,
    null,
    h(
      "div",
      { className: TITLE_CLASS },
      h("span", { className: NAME_CLASS }, name),
    ),
    h(
      "div",
      { className: ACTIONS_CLASS },
      h(
        Button,
        {
          variant: BAR_BUTTON_VARIANT,
          size: BAR_BUTTON_SIZE,
          onClick: onShuffle,
        },
        TEXT_SHUFFLE,
      ),
      shuffled
        ? h(
            Button,
            {
              variant: BAR_BUTTON_VARIANT,
              size: BAR_BUTTON_SIZE,
              onClick: onOriginalOrder,
            },
            TEXT_ORIGINAL_ORDER,
          )
        : null,
      h(
        Button,
        {
          variant: BAR_BUTTON_VARIANT,
          size: BAR_BUTTON_SIZE,
          onClick: () => {
            openFields(DIALOG_EDIT_QUERY);
          },
        },
        TEXT_EDIT_QUERY,
      ),
      h(
        Button,
        {
          variant: BAR_BUTTON_VARIANT,
          size: BAR_BUTTON_SIZE,
          onClick: () => {
            openFields(DIALOG_RENAME);
          },
        },
        UI_TEXT.rename,
      ),
      h(
        Button,
        {
          variant: DIALOG_TONE_DANGER,
          size: BAR_BUTTON_SIZE,
          onClick: () => {
            setDialog(DIALOG_DELETE);
          },
        },
        UI_TEXT.delete,
      ),
    ),
    fieldsOpen
      ? h(Dialog, {
          variant: DIALOG_VARIANT_FIELDS,
          open: true,
          title: fieldsTitle,
          fields,
          onFieldsChange: setFields,
          onSubmit: onFieldsSubmit,
          onClose: closeDialog,
          submitLabel: UI_TEXT.save,
          cancelLabel: UI_TEXT.cancel,
          nameLabel: UI_TEXT.nameLabel,
          queryLabel: TEXT_QUERY_LABEL,
          only: dialog === DIALOG_RENAME ? DIALOG_ONLY_NAME : DIALOG_ONLY_QUERY,
          renderQueryField: (field) => h(QueryField, field),
        })
      : null,
    dialog === DIALOG_DELETE
      ? h(Dialog, {
          variant: DIALOG_VARIANT_CONFIRM,
          open: true,
          title: UI_TEXT.delete,
          message: deleteConfirmMessage(name),
          confirmLabel: UI_TEXT.confirm,
          cancelLabel: UI_TEXT.cancel,
          confirmTone: DIALOG_TONE_DANGER,
          onConfirm: onConfirmDelete,
          onClose: closeDialog,
        })
      : null,
  );
}

const FIRST_PAGE_PID = "0";
const QUERY_MARK = "?";
const PID_PATTERN = /^\d+$/;

function isFirstResultsPage(search: string): boolean {
  const pid = new URLSearchParams(search).get(SEARCH_PARAM_PID);
  return pid === null || pid.length === 0 || pid === FIRST_PAGE_PID;
}

/** Thumb URLs of the first posts in the grid, read from the page as it is. */
function readFirstThumbUrls(): string[] {
  const imageList = findImageList(document);
  if (imageList === null) {
    return [];
  }
  const urls: string[] = [];
  const images = imageList.querySelectorAll(
    `${SITE_SELECTORS.thumb} ${SITE_SELECTORS.previewImage}`,
  );
  for (const image of images) {
    const src = image.getAttribute("src");
    if (src === null || src.trim().length === 0) {
      continue;
    }
    urls.push(src.trim());
    if (urls.length === DYNAMIC_COVER_SIZE) {
      break;
    }
  }
  return urls;
}

/**
 * The card cover of a dynamic collection is whatever its first results page
 * showed last. Shuffled pages and later pages are skipped. No request is made.
 */
function rememberDynamicCover(
  collectionId: string,
  tagsParam: string,
  search: string,
): void {
  if (queryHasSortRandom(tagsParam) || !isFirstResultsPage(search)) {
    return;
  }
  setDynamicCover(collectionId, readFirstThumbUrls());
  const count = readResultCount();
  if (count !== null) {
    setDynamicPostCount(collectionId, count);
  }
}

function readPidFromLink(link: Element): number | null {
  const href = link.getAttribute("href");
  if (href === null) {
    return null;
  }
  const query = href.slice(href.indexOf(QUERY_MARK) + QUERY_MARK.length);
  const raw = new URLSearchParams(query).get(SEARCH_PARAM_PID);
  if (raw === null || !PID_PATTERN.test(raw)) {
    return null;
  }
  return Number(raw);
}

/**
 * Size of the current search, read from the first results page.
 * With a last-page link: at least its offset (`pid`), so the count is a lower
 * bound. With other page links only: the largest offset among them. With no
 * page links: the number of thumbs on the page, exact. No grid: null.
 */
function readResultCount(): PostCount | null {
  const last = document.querySelector(SITE_SELECTORS.paginationLastPage);
  if (last !== null) {
    const pid = readPidFromLink(last);
    if (pid !== null) {
      return { value: pid, exact: false };
    }
  }
  let largest: number | null = null;
  for (const link of document.querySelectorAll(SITE_SELECTORS.paginationPageLink)) {
    const pid = readPidFromLink(link);
    if (pid !== null && (largest === null || pid > largest)) {
      largest = pid;
    }
  }
  if (largest !== null) {
    return { value: largest, exact: false };
  }
  const imageList = findImageList(document);
  if (imageList === null) {
    return null;
  }
  return {
    value: imageList.querySelectorAll(SITE_SELECTORS.thumb).length,
    exact: true,
  };
}

function mountDynamicBar(tagsParam: string, search: string): void {
  const collection = findDynamicCollection(tagsParam);
  if (collection === null) {
    return;
  }
  rememberDynamicCover(collection.id, tagsParam, search);
  const bar = document.createElement("div");
  bar.id = DYNAMIC_ROOT_ID;
  bar.className = ROOT_CLASS;
  if (!placeBar(bar)) {
    return;
  }
  render(
    h(DynamicCollectionBar, {
      collectionId: collection.id,
      initialName: collection.name,
      storedQuery: storedDynamicQuery(collection),
      pageQuery: tagsParam,
    }),
    bar,
  );
}

function mountPlaylistBar(ctx: FeatureContext): void {
  removeExistingBar(document);
  removeDynamicBar(document);

  const tagsParam = readTagsParam(ctx.search);
  const queryIds = parsePlaylistQuery(tagsParam);
  if (queryIds !== null) {
    const match = findPlaylistMatch(queryIds);
    if (match !== null) {
      placeBar(createBar(match));
    }
  }

  mountDynamicBar(tagsParam, ctx.search);
}

export const playlistBarFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountPlaylistBar,
};
