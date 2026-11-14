import type { JSX } from "preact";
import { useState } from "preact/hooks";

import {
  SEARCH_PARAM_TAGS,
  UI_TEXT,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
  UPDATES_OR_OPEN,
} from "../config/constants";
import {
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
  parsePlaylistQuery,
  queriesMatchIgnoringSortRandom,
  serialize,
  withoutSortRandom,
} from "../search/query";
import { isPlaylist, type Collection } from "../storage/schema";
import { createDynamicCollection, listArtistTags, load } from "../storage/store";
import { Button, Dialog, TextField } from "../ui/kit";
import { refreshDynamicBar } from "./playlist-bar";

export const SAVE_SEARCH_LABEL = "Save search";
export const SAVE_SEARCH_TITLE = "Save as dynamic collection";
export const SAVE_SEARCH_CLASS = "rdw-search-tools-save";

const CLASS_FORM = "rdw-dialog__fields";
const CLASS_ACTIONS = "rdw-dialog__actions";
const CLASS_ERROR = "rdw-search-tools-save-error";

/** `sort:score:desc`, `score:>=10`: a filter, not a tag. */
const FILTER_MARK = ":";
const TOKEN_SPLIT = /\s+/;
const NON_TAG_TOKENS: readonly string[] = [
  UPDATES_OR_OPEN,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
];

const EMPTY_NAME_MESSAGE = "Enter a name.";
const DUPLICATE_NAME_MESSAGE = "A collection with this name already exists.";

export const SAVE_SEARCH_CSS = `
.${CLASS_ERROR} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
`.trim();

function storedQuery(collection: Collection): string {
  return collection.query ?? serialize(collection.tags);
}

/**
 * The search this page shows, without `sort:random`, when it can be saved as a
 * dynamic collection. Null for a search without tags (empty, or filters such
 * as `sort:score:desc` only), the Feed query, a custom
 * collection's id list, and a search that is already saved.
 */
export function readSavableQuery(search: string): string | null {
  const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS) ?? "";
  const query = withoutSortRandom(tagsParam);
  if (query.length === 0) {
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

/**
 * Quiet "Save search" link for the search panel footer. Rendered only while
 * the current search can be saved; saving asks for a name, stores the dynamic
 * collection, and shows its bar above the results without leaving the page.
 */
export function SaveSearchLink(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [, setRevision] = useState(0);

  const search = window.location.search;
  const query = readSavableQuery(search);
  if (query === null) {
    return null;
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
    createDynamicCollection(name.trim(), query);
    close();
    setRevision((value) => value + 1);
    refreshDynamicBar(search);
  };

  return (
    <>
      <style>{SAVE_SEARCH_CSS}</style>
      <Button
        variant="ghost"
        size="s"
        className={SAVE_SEARCH_CLASS}
        title={SAVE_SEARCH_TITLE}
        onClick={() => {
          setOpen(true);
        }}
      >
        {SAVE_SEARCH_LABEL}
      </Button>
      <Dialog open={open} onClose={close} title={SAVE_SEARCH_TITLE}>
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
