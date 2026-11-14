import type { JSX } from "preact";
import { useState } from "preact/hooks";

import type { Collection } from "../storage/schema";
import {
  addPostToCollection,
  createPlaylist,
  listPlaylists,
  playlistsContaining,
  removePostFromPlaylist,
} from "../storage/store";
import { Button, TextField } from "./kit";
import { IconCheck } from "./kit/icons";

export const COLLECTION_PICKER_CLASS = "rdw-collection-picker";
export const COLLECTION_PICKER_ITEM_CLASS = "rdw-collection-picker-item";
export const COLLECTION_PICKER_COUNT_CLASS = "rdw-collection-picker-count";
export const COLLECTION_PICKER_NEW_CLASS = "rdw-collection-picker-new";

const CLASS_LIST = "rdw-collection-picker-list";
const CLASS_CHECK = "rdw-collection-picker-check";
const CLASS_NAME = "rdw-collection-picker-name";
const CLASS_EMPTY = "rdw-collection-picker-empty";
const CLASS_NEW_FIELD = "rdw-collection-picker-new-field";

export const COLLECTION_PICKER_TEXT = {
  create: "Create",
  newName: "New collection name",
  filter: "Filter collections…",
  empty: "No collections yet",
  noMatch: "No matching collections",
  togglePrefix: "Toggle collection",
  list: "Custom collections",
} as const;

/** The name filter appears once the list is longer than this. */
export const COLLECTION_PICKER_FILTER_MIN = 8;

const MEMBER_ROLE = "menuitemcheckbox";
const CHECK_ICON_PX = 12;
const CHECK_BOX_PX = 15;
const ROW_GAP_PX = 8;
const STACK_GAP_PX = 6;
const LIST_MAX_HEIGHT_PX = 232;
const ROW_MIN_HEIGHT_PX = 28;

export const COLLECTION_PICKER_CSS = `
.${COLLECTION_PICKER_CLASS} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${String(STACK_GAP_PX)}px;
  min-width: 0;
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
.${CLASS_LIST} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  max-height: ${String(LIST_MAX_HEIGHT_PX)}px;
  overflow-x: hidden;
  overflow-y: auto;
}
button.${COLLECTION_PICKER_ITEM_CLASS} {
  display: flex;
  align-items: center;
  gap: ${String(ROW_GAP_PX)}px;
  box-sizing: border-box;
  width: 100%;
  min-height: ${String(ROW_MIN_HEIGHT_PX)}px;
  margin: 0;
  padding: 0 6px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: inherit;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
}
button.${COLLECTION_PICKER_ITEM_CLASS}:hover,
button.${COLLECTION_PICKER_ITEM_CLASS}:focus-visible {
  background: var(--rdw-surface-2);
}
button.${COLLECTION_PICKER_ITEM_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
.${CLASS_CHECK} {
  flex: 0 0 ${String(CHECK_BOX_PX)}px;
  display: inline-grid;
  place-items: center;
  box-sizing: border-box;
  width: ${String(CHECK_BOX_PX)}px;
  height: ${String(CHECK_BOX_PX)}px;
  border: 1px solid var(--rdw-border);
  border-radius: 4px;
  background: transparent;
  color: var(--rdw-surface);
}
.${COLLECTION_PICKER_ITEM_CLASS}[aria-checked="true"] .${CLASS_CHECK} {
  background: var(--rdw-accent);
  border-color: var(--rdw-accent);
}
.${CLASS_NAME} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${COLLECTION_PICKER_COUNT_CLASS} {
  flex: 0 0 auto;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
.${CLASS_EMPTY} {
  margin: 0;
  padding: 4px 6px;
  color: var(--rdw-muted);
}
form.${COLLECTION_PICKER_NEW_CLASS} {
  display: flex;
  align-items: center;
  gap: ${String(STACK_GAP_PX)}px;
  margin: 0;
  padding-top: ${String(STACK_GAP_PX)}px;
  border-top: 1px solid var(--rdw-border);
}
.${COLLECTION_PICKER_NEW_CLASS} .${CLASS_NEW_FIELD} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
}
`.trim();

export type CollectionPickerProps = {
  readonly postId: number;
  /** Thumb URL of the post right now, or null when the page does not show one. */
  readonly readThumbUrl: () => string | null;
  /** Called after a membership change or a new collection. */
  readonly onChange?: () => void;
};

function foldName(name: string): string {
  return name.trim().toLowerCase();
}

function matchesFilter(collection: Collection, filter: string): boolean {
  const needle = foldName(filter);
  return needle.length === 0 || collection.name.toLowerCase().includes(needle);
}

function addPost(
  collectionId: string,
  postId: number,
  readThumbUrl: () => string | null,
): void {
  const thumbUrl = readThumbUrl();
  if (thumbUrl === null) {
    addPostToCollection(collectionId, postId);
    return;
  }
  addPostToCollection(collectionId, postId, thumbUrl);
}

/**
 * Custom collections of one post: a checkbox row per collection with its post
 * count, and a "name + Create" row. Used by the post panel and the grid "+" menu.
 * A new name that matches an existing custom collection adds the post to it.
 */
export function CollectionPicker(props: CollectionPickerProps): JSX.Element {
  const [filter, setFilter] = useState("");
  const [newName, setNewName] = useState("");
  const [, setRevision] = useState(0);

  const collections = listPlaylists();
  const memberIds = new Set(
    playlistsContaining(props.postId).map((item) => item.id),
  );
  const filterShown = collections.length > COLLECTION_PICKER_FILTER_MIN;
  const visible = filterShown
    ? collections.filter((item) => matchesFilter(item, filter))
    : collections;

  const changed = (): void => {
    setRevision((value) => value + 1);
    props.onChange?.();
  };

  const toggle = (collectionId: string): void => {
    if (memberIds.has(collectionId)) {
      removePostFromPlaylist(collectionId, props.postId);
    } else {
      addPost(collectionId, props.postId, props.readThumbUrl);
    }
    changed();
  };

  const createFromName = (): void => {
    const name = newName.trim();
    if (name.length === 0) {
      return;
    }
    const existing = listPlaylists().find(
      (item) => foldName(item.name) === foldName(name),
    );
    const target = existing ?? createPlaylist(name);
    addPost(target.id, props.postId, props.readThumbUrl);
    setNewName("");
    changed();
  };

  const emptyText =
    collections.length === 0
      ? COLLECTION_PICKER_TEXT.empty
      : COLLECTION_PICKER_TEXT.noMatch;

  return (
    <div className={COLLECTION_PICKER_CLASS}>
      <style>{COLLECTION_PICKER_CSS}</style>
      {filterShown ? (
        <TextField
          value={filter}
          onChange={setFilter}
          placeholder={COLLECTION_PICKER_TEXT.filter}
          aria-label={COLLECTION_PICKER_TEXT.filter}
        />
      ) : null}
      {visible.length === 0 ? (
        <p className={CLASS_EMPTY}>{emptyText}</p>
      ) : (
        <div
          className={CLASS_LIST}
          role="group"
          aria-label={COLLECTION_PICKER_TEXT.list}
        >
          {visible.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={COLLECTION_PICKER_ITEM_CLASS}
              role={MEMBER_ROLE}
              aria-checked={memberIds.has(collection.id)}
              aria-label={`${COLLECTION_PICKER_TEXT.togglePrefix} ${collection.name}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggle(collection.id);
              }}
            >
              <span className={CLASS_CHECK} aria-hidden="true">
                {memberIds.has(collection.id) ? (
                  <IconCheck size={CHECK_ICON_PX} />
                ) : null}
              </span>
              <span className={CLASS_NAME}>{collection.name}</span>
              <span className={COLLECTION_PICKER_COUNT_CLASS}>
                {String(collection.postIds?.length ?? 0)}
              </span>
            </button>
          ))}
        </div>
      )}
      <form
        className={COLLECTION_PICKER_NEW_CLASS}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          createFromName();
        }}
      >
        <TextField
          className={CLASS_NEW_FIELD}
          value={newName}
          onChange={setNewName}
          placeholder={COLLECTION_PICKER_TEXT.newName}
          aria-label={COLLECTION_PICKER_TEXT.newName}
        />
        <Button
          type="submit"
          variant="primary"
          size="s"
          disabled={newName.trim().length === 0}
        >
          {COLLECTION_PICKER_TEXT.create}
        </Button>
      </form>
    </div>
  );
}
