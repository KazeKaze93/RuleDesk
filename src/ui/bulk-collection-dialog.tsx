import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import {
  addPostsToCollection,
  createPlaylist,
  listPlaylists,
  load,
  type CollectionPostInput,
} from "../storage/store";
import { Button, Dialog, TextField } from "./kit";

/**
 * Adds several posts to one custom collection at once: pick a collection, or
 * name a new one. Used by the selection bars of Posts and Favorites. Nothing
 * is requested: the posts and their previews are what the page already shows.
 */

export const BULK_COLLECTION_CLASS = "rdw-bulk-collection";
const LIST_CLASS = "rdw-bulk-collection-list";
const ITEM_CLASS = "rdw-bulk-collection-item";
const NAME_CLASS = "rdw-bulk-collection-name";
const COUNT_CLASS = "rdw-bulk-collection-count";
const NEW_CLASS = "rdw-bulk-collection-new";
const NEW_FIELD_CLASS = "rdw-bulk-collection-new-field";
const TITLE_CLASS = "rdw-bulk-collection-title";
const NOTE_CLASS = "rdw-bulk-collection-note";
const ERROR_CLASS = "rdw-bulk-collection-error";
const FOOT_CLASS = "rdw-bulk-collection-foot";

const LIST_MAX_HEIGHT_PX = 260;
/** The name filter appears once the list is longer than this. */
const FILTER_MIN = 8;
const LOCALE = "en-US";

const TEXT = {
  aria: "Add posts to a collection",
  filter: "Filter collections…",
  empty: "No custom collections yet. Name one below.",
  noMatch: "No matching collections",
  newName: "New collection name",
  create: "Create and add",
  nameTaken: "A collection with this name already exists.",
} as const;

export const BULK_COLLECTION_CSS = `
.${BULK_COLLECTION_CLASS} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  color: var(--rdw-text);
  font: 13px/1.4 var(--rdw-font);
}
.${TITLE_CLASS} {
  margin: 0;
  font: 700 15px var(--rdw-font);
  color: var(--rdw-text);
}
.${NOTE_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
}
.${LIST_CLASS} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  max-height: ${String(LIST_MAX_HEIGHT_PX)}px;
  overflow-x: hidden;
  overflow-y: auto;
}
button.${ITEM_CLASS} {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  margin: 0;
  padding: 0 8px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: inherit;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
}
button.${ITEM_CLASS}:hover,
button.${ITEM_CLASS}:focus-visible {
  background: var(--rdw-surface-2);
}
button.${ITEM_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
.${NAME_CLASS} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${COUNT_CLASS} {
  flex: none;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
form.${NEW_CLASS} {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding-top: 10px;
  border-top: 1px solid var(--rdw-border);
}
.${NEW_CLASS} .${NEW_FIELD_CLASS} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
}
.${ERROR_CLASS} {
  margin: 0;
  color: var(--rdw-danger);
}
.${FOOT_CLASS} {
  display: flex;
  justify-content: flex-end;
}
`.trim();

/** What was done, for the bar that opened the dialog to say. */
export type BulkCollectionResult = {
  readonly name: string;
  /** Posts that were not in the collection before. */
  readonly added: number;
  /** Posts that were asked for. */
  readonly total: number;
};

export type BulkCollectionDialogProps = {
  readonly open: boolean;
  readonly posts: readonly CollectionPostInput[];
  readonly onClose: () => void;
  readonly onDone: (result: BulkCollectionResult) => void;
};

function foldName(name: string): string {
  return name.trim().toLowerCase();
}

function postsWord(count: number): string {
  return `${count.toLocaleString(LOCALE)} ${count === 1 ? "post" : "posts"}`;
}

/** "Add 12 posts to a collection". */
export function bulkCollectionTitle(count: number): string {
  return `Add ${postsWord(count)} to a collection`;
}

/** "Added 12 posts to “name”." or "Added 3 of 12 posts to “name”; the rest were already there." */
export function bulkCollectionSummary(result: BulkCollectionResult): string {
  if (result.added === result.total) {
    return `Added ${postsWord(result.total)} to “${result.name}”.`;
  }
  if (result.added === 0) {
    return `All ${postsWord(result.total)} were already in “${result.name}”.`;
  }
  return `Added ${result.added.toLocaleString(LOCALE)} of ${postsWord(result.total)} to “${result.name}”; the rest were already there.`;
}

export function BulkCollectionDialog(props: BulkCollectionDialogProps): JSX.Element {
  const [filter, setFilter] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const collections = props.open ? listPlaylists() : [];
  const filterShown = collections.length > FILTER_MIN;
  const needle = foldName(filter);
  const visible =
    filterShown && needle.length > 0
      ? collections.filter((item) => item.name.toLowerCase().includes(needle))
      : collections;

  const close = (): void => {
    setFilter("");
    setNewName("");
    setError("");
    props.onClose();
  };

  const addTo = (collectionId: string): void => {
    const result = addPostsToCollection(collectionId, props.posts);
    if (result === null) {
      return;
    }
    const done: BulkCollectionResult = {
      name: result.collection.name,
      added: result.added,
      total: props.posts.length,
    };
    close();
    props.onDone(done);
  };

  const createAndAdd = (): void => {
    const name = newName.trim();
    if (name.length === 0) {
      return;
    }
    const taken = load().collections.some((item) => foldName(item.name) === foldName(name));
    if (taken) {
      setError(TEXT.nameTaken);
      return;
    }
    addTo(createPlaylist(name).id);
  };

  return (
    <Dialog open={props.open} onClose={close} aria-label={TEXT.aria} className={BULK_COLLECTION_CLASS}>
      <style>{BULK_COLLECTION_CSS}</style>
      <h3 className={TITLE_CLASS}>{bulkCollectionTitle(props.posts.length)}</h3>
      {filterShown ? (
        <TextField
          value={filter}
          onChange={setFilter}
          placeholder={TEXT.filter}
          aria-label={TEXT.filter}
        />
      ) : null}
      {visible.length === 0 ? (
        <p className={NOTE_CLASS}>{collections.length === 0 ? TEXT.empty : TEXT.noMatch}</p>
      ) : (
        <div className={LIST_CLASS}>
          {visible.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={ITEM_CLASS}
              onClick={() => {
                addTo(collection.id);
              }}
            >
              <span className={NAME_CLASS}>{collection.name}</span>
              <span className={COUNT_CLASS}>{String(collection.postIds?.length ?? 0)}</span>
            </button>
          ))}
        </div>
      )}
      <form
        className={NEW_CLASS}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          createAndAdd();
        }}
      >
        <TextField
          className={NEW_FIELD_CLASS}
          value={newName}
          onChange={(value) => {
            setNewName(value);
            setError("");
          }}
          placeholder={TEXT.newName}
          aria-label={TEXT.newName}
        />
        <Button type="submit" variant="primary" size="s" disabled={newName.trim().length === 0}>
          {TEXT.create}
        </Button>
      </form>
      {error.length > 0 ? (
        <p className={ERROR_CLASS} role="alert">
          {error}
        </p>
      ) : null}
      <div className={FOOT_CLASS}>
        <Button variant="secondary" size="s" onClick={close}>
          {UI_TEXT.cancel}
        </Button>
      </div>
    </Dialog>
  );
}
