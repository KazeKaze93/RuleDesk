import type { ComponentChildren, JSX } from "preact";
import { render as preactRender } from "preact";
import { useCallback, useState } from "preact/hooks";

import {
  COLLECTION_KIND_POSTS,
  COLLECTION_KIND_SEARCH,
  EXCLUDE_PREFIX,
  UI_TEXT,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
  UPDATES_OR_OPEN,
} from "../config/constants";
import { buildSearchUrl, serialize } from "../search/query";
import {
  resolveCollectionKind,
  type Collection,
} from "../storage/schema";
import {
  createDynamicCollection,
  createPlaylist,
  load,
} from "../storage/store";
import {
  Button,
  Chip,
  Dialog,
  EmptyState,
  Segmented,
  TextField,
  type ChipVariant,
  type SegmentedOption,
} from "../ui/kit";
import { IconPlus } from "../ui/kit/icons";
import { QueryField } from "../ui/query-field";
import { collectionDetailHash } from "./constants";

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
const CHIPS_CLASS = "rdw-collection-chips";
const META_ROW_CLASS = "rdw-collection-meta-row";
const NAME_CLASS = "rdw-collection-name";
const BADGE_CLASS = "rdw-collection-badge";
const CAPTION_CLASS = "rdw-collection-caption";
const FORM_ERROR_CLASS = "rdw-collection-form-error";

const FILTER_ALL = "all";
const FILTER_CUSTOM = "custom";
const FILTER_DYNAMIC = "dynamic";
const KIND_CUSTOM = "custom";
const KIND_DYNAMIC = "dynamic";

const FILTER_ALL_LABEL = "All";
const FILTER_CUSTOM_LABEL = "Custom";
const FILTER_DYNAMIC_LABEL = "Dynamic";
const NEW_BUTTON_LABEL = "New";
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
const EMPTY_TITLE = "No collections yet";
const EMPTY_DESCRIPTION =
  "Custom collections are posts you pick. Dynamic collections are saved searches.";
const FILTER_EMPTY_TITLE = "No matching collections";
const FILTER_EMPTY_DESCRIPTION = "Nothing matches this filter.";
const EMPTY_NAME_MESSAGE = "Enter a name.";
const EMPTY_QUERY_MESSAGE = "Enter a query.";
const DUPLICATE_NAME_MESSAGE = "A collection with this name already exists.";
const ANY_OF_LABEL_PREFIX = "Any of ";
const ANY_OF_LABEL_SUFFIX = " tags";
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
const CHIP_GAP_PX = 4;
const CHIP_AREA_MAX_HEIGHT_PX = 72;
const BADGE_FONT_PX = 10;
const CAPTION_FONT_PX = 12;
const ICON_PX = 14;
const BADGE_TRACKING = "0.04em";

const NAME_FIELD_ID = "rdw-collection-name";
const QUERY_FIELD_ID = "rdw-collection-query";
const FILTER_FIELD_ID = "rdw-collections-filter";
const FORM_ERROR_ID = "rdw-collection-form-error";

const QUERY_TOKEN_SPLIT = /\s+/;
const CHIP_VARIANT_TOKEN: ChipVariant = "dot";
const CHIP_VARIANT_GROUP: ChipVariant = "group";
const CHIP_VARIANT_EXCLUDE: ChipVariant = "exclude";

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

type QueryChipModel = {
  readonly label: string;
  readonly variant: ChipVariant;
};

type ParenGroup = {
  readonly memberCount: number;
  readonly nextIndex: number;
};

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
.${CHIPS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: ${String(CHIP_GAP_PX)}px;
  max-height: ${String(CHIP_AREA_MAX_HEIGHT_PX)}px;
  overflow: hidden;
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

function anyOfLabel(count: number): string {
  return `${ANY_OF_LABEL_PREFIX}${String(count)}${ANY_OF_LABEL_SUFFIX}`;
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

function queryTokens(query: string): string[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }
  return trimmed.split(QUERY_TOKEN_SPLIT).filter((token) => token.length > 0);
}

function readParenGroup(
  tokens: readonly string[],
  start: number,
): ParenGroup | null {
  if (tokens[start] !== UPDATES_OR_OPEN) {
    return null;
  }
  let members = 0;
  for (let index = start + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === undefined || token === UPDATES_OR_OPEN) {
      return null;
    }
    if (token === UPDATES_OR_CLOSE) {
      if (members === 0) {
        return null;
      }
      return { memberCount: members, nextIndex: index + 1 };
    }
    if (token !== UPDATES_OR_JOIN) {
      members += 1;
    }
  }
  return null;
}

function buildQueryChips(query: string): QueryChipModel[] {
  const tokens = queryTokens(query);
  const chips: QueryChipModel[] = [];
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) {
      break;
    }
    if (token === UPDATES_OR_OPEN) {
      const group = readParenGroup(tokens, index);
      if (group !== null) {
        chips.push({
          label: anyOfLabel(group.memberCount),
          variant: CHIP_VARIANT_GROUP,
        });
        index = group.nextIndex;
        continue;
      }
    }
    const excluded =
      token.startsWith(EXCLUDE_PREFIX) &&
      token.length > EXCLUDE_PREFIX.length;
    chips.push({
      label: token,
      variant: excluded ? CHIP_VARIANT_EXCLUDE : CHIP_VARIANT_TOKEN,
    });
    index += 1;
  }
  return chips;
}

function dynamicQueryText(collection: Collection): string {
  if (collection.query !== undefined) {
    return collection.query;
  }
  return serialize(collection.tags);
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

function cardAriaLabel(name: string, badge: string, meta: string): string {
  return `${name}, ${badge}, ${meta}`;
}

function CardLink(props: {
  readonly collection: Collection;
  readonly href: string;
  readonly kind: string;
  readonly badge: string;
  readonly meta: string;
  readonly children: ComponentChildren;
}): JSX.Element {
  return (
    <a
      className={CARD_CLASS}
      href={props.href}
      aria-label={cardAriaLabel(props.collection.name, props.badge, props.meta)}
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

function CustomCard(props: { readonly collection: Collection }): JSX.Element {
  const count = props.collection.postIds?.length ?? 0;
  const meta = postsLabel(count);
  const slots = coverPostIds(props.collection);
  return (
    <CardLink
      collection={props.collection}
      href={collectionDetailHash(props.collection.id)}
      kind={COLLECTION_KIND_POSTS}
      badge={BADGE_CUSTOM}
      meta={meta}
    >
      <span className={COVER_CLASS}>
        {slots.map((postId, index) => {
          const url = postId === null ? null : thumbUrl(props.collection, postId);
          return (
            <span
              key={`${props.collection.id}-${String(index)}`}
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
    </CardLink>
  );
}

function DynamicCard(props: { readonly collection: Collection }): JSX.Element {
  const chips = buildQueryChips(dynamicQueryText(props.collection));
  return (
    <CardLink
      collection={props.collection}
      href={buildSearchUrl(props.collection.tags)}
      kind={COLLECTION_KIND_SEARCH}
      badge={BADGE_DYNAMIC}
      meta={SAVED_SEARCH_CAPTION}
    >
      <span className={CHIPS_CLASS}>
        {chips.map((chip, index) => (
          <Chip
            key={`${chip.variant}-${chip.label}-${String(index)}`}
            label={chip.label}
            variant={chip.variant}
          />
        ))}
      </span>
    </CardLink>
  );
}

function CollectionCard(props: {
  readonly collection: Collection;
}): JSX.Element {
  if (resolveCollectionKind(props.collection) === COLLECTION_KIND_POSTS) {
    return <CustomCard collection={props.collection} />;
  }
  return <DynamicCard collection={props.collection} />;
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

  const closeDialog = useCallback((): void => {
    setDialogOpen(false);
    setFormError("");
    setNameDraft("");
    setQueryDraft("");
  }, []);

  const collections = load().collections;
  const visible = visibleCollections(collections, filter, nameQuery);
  const emptyCopy =
    collections.length === 0
      ? { title: EMPTY_TITLE, description: EMPTY_DESCRIPTION }
      : { title: FILTER_EMPTY_TITLE, description: FILTER_EMPTY_DESCRIPTION };

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
    if (newKind === KIND_DYNAMIC && queryDraft.trim().length === 0) {
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
          <Button type="button" variant="primary" onClick={openDialog}>
            <IconPlus size={ICON_PX} />
            {NEW_BUTTON_LABEL}
          </Button>
        </div>
      </header>
      {visible.length === 0 ? (
        <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
      ) : (
        <div className={GRID_CLASS} aria-label={GRID_LABEL}>
          {visible.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
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
