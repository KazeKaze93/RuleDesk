import type { JSX } from "preact";
import { useState } from "preact/hooks";

import {
  UI_TEXT,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
  UPDATES_OR_OPEN,
} from "../config/constants";
import {
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
  isUnfilteredQuery,
  parsePlaylistQuery,
  queriesMatchIgnoringSortRandom,
  serialize,
  withoutSortRandom,
} from "../search/query";
import { isPlaylist, type Collection } from "../storage/schema";
import { createDynamicCollection, listArtistTags, load } from "../storage/store";
import { Button, Dialog, TextField } from "../ui/kit";
import { QueryField } from "../ui/query-field";

export const SAVE_SEARCH_LABEL = "Save as collection";
export const SAVE_SEARCH_TITLE = "Save this search as a dynamic collection";
export const SAVE_SEARCH_DIALOG_TITLE = "New dynamic collection";
export const SAVE_SEARCH_CLASS = "rdw-search-tools-save";

const CLASS_FORM = "rdw-dialog__fields";
const CLASS_ACTIONS = "rdw-dialog__actions";
const CLASS_ERROR = "rdw-search-tools-save-error";
const CLASS_SAVED = "rdw-search-tools-saved";

export const SAVED_NOTE = "Saved to Collections";

/** `sort:score:desc`, `score:>=10`: a filter, not a tag. */
const FILTER_MARK = ":";
const TOKEN_SPLIT = /\s+/;
const NON_TAG_TOKENS: readonly string[] = [
  UPDATES_OR_OPEN,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
];

const QUERY_LABEL = "Query";
const EMPTY_NAME_MESSAGE = "Enter a name.";
const DUPLICATE_NAME_MESSAGE = "A collection with this name already exists.";
const REJECTED_QUERY_MESSAGE = "Enter a tag search that is not saved yet.";

export const SAVE_SEARCH_CSS = `
.${CLASS_ERROR} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
.${CLASS_SAVED} {
  flex: 1 1 auto;
  align-self: center;
  text-align: center;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();

function storedQuery(collection: Collection): string {
  return collection.query ?? serialize(collection.tags);
}

/**
 * A search text (the tags field, not the page address) without `sort:random`,
 * when it can be saved as a dynamic collection. Null for a search without tags
 * (empty, the site's `all`, or filters such as `sort:score:desc` only), the
 * Feed query, a custom collection's id list, and a search that is already saved.
 */
export function readSavableQuery(tags: string): string | null {
  const query = withoutSortRandom(tags);
  if (isUnfilteredQuery(query)) {
    return null;
  }
  const hasTag = query
    .split(TOKEN_SPLIT)
    .some((token) => !NON_TAG_TOKENS.includes(token) && !token.includes(FILTER_MARK));
  if (!hasTag) {
    return null;
  }
  if (parsePlaylistQuery(query) !== null) {
    return null;
  }
  const artistTags = listArtistTags();
  if (
    isFullUpdatesQuery(query, artistTags) ||
    isPartialUpdatesQuery(query, artistTags)
  ) {
    return null;
  }
  for (const collection of load().collections) {
    if (isPlaylist(collection)) {
      continue;
    }
    if (queriesMatchIgnoringSortRandom(query, storedQuery(collection))) {
      return null;
    }
  }
  return query;
}

function nameError(name: string): string | null {
  const folded = name.trim().toLowerCase();
  if (folded.length === 0) {
    return EMPTY_NAME_MESSAGE;
  }
  for (const collection of load().collections) {
    if (collection.name.trim().toLowerCase() === folded) {
      return DUPLICATE_NAME_MESSAGE;
    }
  }
  return null;
}

export type SaveSearchButtonProps = {
  /** Text of the site's tags field: what the panel shows as chips and filters. */
  readonly tags: string;
};

/**
 * "Save as collection" button for the search panel footer. Rendered only while
 * the search in the tags field can be saved. The dialog shows the name and the
 * query that will be stored. Saving changes nothing on the page except a short
 * note in place of the button: the collection is opened from Collections.
 */
export function SaveSearchButton(props: SaveSearchButtonProps): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const savable = readSavableQuery(props.tags);
  if (savable === null && !open) {
    if (!saved) {
      return null;
    }
    return (
      <>
        <style>{SAVE_SEARCH_CSS}</style>
        <span className={CLASS_SAVED} role="status">
          {SAVED_NOTE}
        </span>
      </>
    );
  }

  const close = (): void => {
    setOpen(false);
    setName("");
    setError("");
  };

  const submit = (): void => {
    const message = nameError(name);
    if (message !== null) {
      setError(message);
      return;
    }
    const query = readSavableQuery(queryDraft);
    if (query === null) {
      setError(REJECTED_QUERY_MESSAGE);
      return;
    }
    createDynamicCollection(name.trim(), query);
    setSaved(true);
    close();
  };

  return (
    <>
      <style>{SAVE_SEARCH_CSS}</style>
      <Button
        variant="secondary"
        size="s"
        className={SAVE_SEARCH_CLASS}
        title={SAVE_SEARCH_TITLE}
        onClick={() => {
          setQueryDraft(savable ?? "");
          setOpen(true);
        }}
      >
        {SAVE_SEARCH_LABEL}
      </Button>
      <Dialog open={open} onClose={close} title={SAVE_SEARCH_DIALOG_TITLE}>
        <form
          className={CLASS_FORM}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            submit();
          }}
        >
          <TextField
            label={UI_TEXT.nameLabel}
            value={name}
            onChange={(value) => {
              setName(value);
              setError("");
            }}
          />
          <QueryField
            label={QUERY_LABEL}
            value={queryDraft}
            onChange={(value) => {
              setQueryDraft(value);
              setError("");
            }}
          />
          {error.length > 0 ? (
            <p className={CLASS_ERROR} role="alert">
              {error}
            </p>
          ) : null}
          <div className={CLASS_ACTIONS}>
            <Button type="button" variant="secondary" size="s" onClick={close}>
              {UI_TEXT.cancel}
            </Button>
            <Button type="submit" variant="primary" size="s">
              {UI_TEXT.save}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
