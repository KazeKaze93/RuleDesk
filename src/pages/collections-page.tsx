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
import { backupDateStamp, downloadBackupText } from "../storage/backup";
import {
  collectionsFileName,
  parseCollectionsFile,
  serializeCollections,
} from "../storage/collection-transfer";
import { readCountMirror, readCoverMirror } from "../storage/cover-mirror";
import {
  createDynamicCollection,
  createPlaylist,
  deleteCollection,
  importCollections,
  load,
  reloadFromStorage,
} from "../storage/store";
import {
  Button,
  Dialog,
  EmptyState,
  Segmented,
  TextField,
  type SegmentedOption,
} from "../ui/kit";
import { IconCheck, IconPlus } from "../ui/kit/icons";
import { QueryField } from "../ui/query-field";
import { readFileText } from "../ui/read-file";
import { collectionDetailHash, dynamicCollectionMarkHash } from "./constants";

const EVENT_PAGESHOW = "pageshow";

const PAGE_CLASS = "rdw-collections-page";
const HEADER_CLASS = "rdw-collections-header";
const TOOLBAR_CLASS = "rdw-collections-toolbar";
const FILTER_FIELD_CLASS = "rdw-collections-filter";
const GRID_CLASS = "rdw-collections-grid";
const CARD_CLASS = "rdw-collection-card";
const COVER_CLASS = "rdw-collection-cover";
const COVER_CELL_CLASS = "rdw-collection-cover-cell";
const COVER_IMAGE_CLASS = "rdw-collection-cover-image";
const COVER_EMPTY_CLASS = "rdw-collection-cover-empty";
const META_ROW_CLASS = "rdw-collection-meta-row";
const NAME_CLASS = "rdw-collection-name";
const BADGE_CLASS = "rdw-collection-badge";
const CAPTION_CLASS = "rdw-collection-caption";
const FORM_ERROR_CLASS = "rdw-collection-form-error";
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
const SELECT_ALL_LABEL = "Select all";
const EXPORT_LABEL = "Export";
const EXPORT_TITLE = "Save the selected collections to a file";
const IMPORT_LABEL = "Import";
const IMPORT_TITLE = "Add collections from an exported file";
const IMPORT_ACCEPT = "application/json,.json";
const IMPORT_BAD_FILE = "This file is not a collections export.";
const IMPORT_DONE_PREFIX = "Imported collections: ";
const FILE_INPUT_CLASS = "rdw-collections-file";
const NOTICE_CLASS = "rdw-collections-notice";
const SELECTED_SUFFIX = " selected";
const DELETE_DIALOG_TITLE = "Delete collections";
const DELETE_ONE_MESSAGE = "Delete 1 collection? This cannot be undone.";
const DELETE_MANY_PREFIX = "Delete ";
const DELETE_MANY_SUFFIX = " collections? This cannot be undone.";
const ROLE_CHECKBOX = "checkbox";
const SINGLE_SELECTION = 1;
const NEW_DIALOG_TITLE = "New collection";
const CREATE_LABEL = "Create";
const QUERY_FIELD_LABEL = "Query";
const QUERY_PLACEHOLDER = "tag -tag ( a ~ b )";
const TYPE_SEGMENTED_LABEL = "Show";
const KIND_SEGMENTED_LABEL = "Collection kind";
const FILTER_ARIA_LABEL = "Filter by name";
const FILTER_PLACEHOLDER = "Filter by name";
const GRID_LABEL = "Collections";
const BADGE_CUSTOM = "Custom";
const BADGE_DYNAMIC = "Dynamic";
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
const GRID_MIN_TRACK_PX = 200;
const GRID_GAP_PX = 12;
const PAGE_STACK_GAP_PX = 12;
const HEADER_GAP_PX = 12;
const TOOLBAR_GAP_PX = 8;
const FILTER_FIELD_MIN_PX = 160;
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
  flex: 1 1 ${String(FILTER_FIELD_MIN_PX)}px;
  min-width: 0;
  margin: 0;
}
.${GRID_CLASS} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${String(GRID_MIN_TRACK_PX)}px, 1fr));
  gap: ${String(GRID_GAP_PX)}px;
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
.${CARD_CLASS}:hover,
.${CARD_CLASS}:focus,
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
.${FILE_INPUT_CLASS} {
  display: none;
}
.${NOTICE_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: ${String(CAPTION_FONT_PX)}px;
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
.${BADGE_CLASS} {
  flex: none;
  font-size: ${String(BADGE_FONT_PX)}px;
  font-weight: 700;
  letter-spacing: ${BADGE_TRACKING};
  text-transform: uppercase;
  color: var(--rdw-accent);
}
.${CAPTION_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: ${String(CAPTION_FONT_PX)}px;
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
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return true;
  }
  return name.toLowerCase().includes(needle);
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
};

function deleteMessage(count: number): string {
  if (count === SINGLE_SELECTION) {
    return DELETE_ONE_MESSAGE;
  }
  return `${DELETE_MANY_PREFIX}${String(count)}${DELETE_MANY_SUFFIX}`;
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
  readonly select: CardSelect | null;
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
          <span className={BADGE_CLASS}>{props.badge}</span>
        </span>
        <span className={CAPTION_CLASS}>{props.meta}</span>
      </a>
    );
  }
  return (
    <a
      className={CARD_CLASS}
      href={props.href}
      aria-label={label}
      data-collection-id={props.collection.id}
      data-collection-kind={props.kind}
    >
      {props.children}
      <span className={META_ROW_CLASS}>
        <span className={NAME_CLASS}>{props.collection.name}</span>
        <span className={BADGE_CLASS}>{props.badge}</span>
      </span>
      <span className={CAPTION_CLASS}>{props.meta}</span>
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
  return (
    <span className={COVER_CLASS}>
      {props.urls.map((url, index) => {
        const postId = props.postIds?.[index] ?? null;
        return (
          <span
            key={`${props.collectionId}-${String(index)}`}
            className={COVER_CELL_CLASS}
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
      meta={dynamicMeta(props.collection)}
      select={props.select}
    >
      <Cover collectionId={props.collection.id} urls={slots} />
    </CardLink>
  );
}

function CollectionCard(props: CardProps): JSX.Element {
  if (resolveCollectionKind(props.collection) === COLLECTION_KIND_POSTS) {
    return <CustomCard collection={props.collection} select={props.select} />;
  }
  return <DynamicCard collection={props.collection} select={props.select} />;
}

function NewCollectionDialog(props: {
  readonly open: boolean;
  readonly kind: NewKind;
  readonly name: string;
  readonly query: string;
  readonly error: string;
  readonly onClose: () => void;
  readonly onKindChange: (kind: NewKind) => void;
  readonly onNameChange: (name: string) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSubmit: () => void;
}): JSX.Element {
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
        {props.kind === KIND_DYNAMIC ? (
          <QueryField
            id={QUERY_FIELD_ID}
            label={QUERY_FIELD_LABEL}
            placeholder={QUERY_PLACEHOLDER}
            value={props.query}
            onChange={props.onQueryChange}
          />
        ) : null}
        {props.error.length > 0 ? (
          <p id={FORM_ERROR_ID} className={FORM_ERROR_CLASS} role="alert">
            {props.error}
          </p>
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
          <Button type="submit" variant="primary" size="s">
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKind, setNewKind] = useState<NewKind>(KIND_CUSTOM);
  const [nameDraft, setNameDraft] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [, setRevision] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

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
  const visible = visibleCollections(collections, filter, nameQuery);
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

  const toggleSelected = (id: string): void => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  const exportSelected = (): void => {
    downloadBackupText(
      serializeCollections(selectedVisible),
      collectionsFileName(backupDateStamp()),
    );
    stopSelecting();
  };

  const importFile = (file: File): void => {
    void readFileText(file).then(
      (text) => {
        const parsed = parseCollectionsFile(text);
        if (parsed === null) {
          setNotice(IMPORT_BAD_FILE);
          return;
        }
        setNotice(`${IMPORT_DONE_PREFIX}${String(importCollections(parsed))}`);
        setRevision((value) => value + 1);
      },
      () => {
        setNotice(IMPORT_BAD_FILE);
      },
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
      setFormError(message);
      return;
    }
    if (newKind === KIND_DYNAMIC && isUnfilteredQuery(queryDraft)) {
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
          <TextField
            id={FILTER_FIELD_ID}
            className={FILTER_FIELD_CLASS}
            value={nameQuery}
            placeholder={FILTER_PLACEHOLDER}
            aria-label={FILTER_ARIA_LABEL}
            onChange={setNameQuery}
          />
          {selecting ? (
            <>
              <span className={SELECTED_COUNT_CLASS} aria-live="polite">
                {`${String(selectedVisible.length)}${SELECTED_SUFFIX}`}
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedIds(visible.map((collection) => collection.id));
                }}
              >
                {SELECT_ALL_LABEL}
              </Button>
              <Button
                type="button"
                variant="secondary"
                title={EXPORT_TITLE}
                disabled={selectedVisible.length === 0}
                onClick={exportSelected}
              >
                {EXPORT_LABEL}
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={selectedVisible.length === 0}
                onClick={() => {
                  setConfirmOpen(true);
                }}
              >
                {UI_TEXT.delete}
              </Button>
              <Button type="button" variant="secondary" onClick={stopSelecting}>
                {UI_TEXT.cancel}
              </Button>
            </>
          ) : (
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
              <Button
                type="button"
                variant="secondary"
                title={IMPORT_TITLE}
                onClick={() => {
                  importRef.current?.click();
                }}
              >
                {IMPORT_LABEL}
              </Button>
              <input
                ref={importRef}
                className={FILE_INPUT_CLASS}
                type="file"
                accept={IMPORT_ACCEPT}
                aria-hidden="true"
                tabIndex={-1}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file !== undefined) {
                    importFile(file);
                  }
                }}
              />
              <Button type="button" variant="primary" onClick={openDialog}>
                <IconPlus size={ICON_PX} />
                {NEW_BUTTON_LABEL}
              </Button>
            </>
          )}
        </div>
      </header>
      {notice.length > 0 ? (
        <p className={NOTICE_CLASS} role="status">
          {notice}
        </p>
      ) : null}
      {visible.length === 0 ? (
        <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
      ) : (
        <div className={GRID_CLASS} aria-label={GRID_LABEL}>
          {visible.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
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
          ))}
        </div>
      )}
      <Dialog
        variant="confirm"
        open={confirmOpen}
        title={DELETE_DIALOG_TITLE}
        message={deleteMessage(selectedVisible.length)}
        confirmLabel={UI_TEXT.delete}
        cancelLabel={UI_TEXT.cancel}
        confirmTone="danger"
        onConfirm={deleteSelected}
        onClose={() => {
          setConfirmOpen(false);
        }}
      />
      <NewCollectionDialog
        open={dialogOpen}
        kind={newKind}
        name={nameDraft}
        query={queryDraft}
        error={formError}
        onClose={closeDialog}
        onKindChange={(kind) => {
          setNewKind(kind);
          setFormError("");
        }}
        onNameChange={(name) => {
          setNameDraft(name);
          setFormError("");
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
  preactRender(<CollectionsPage />, root);
  return root;
}
