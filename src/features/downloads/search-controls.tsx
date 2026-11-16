import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import {
  SEARCH_PARAM_SECTION,
  SEARCH_PARAM_TAGS,
  SEARCH_SECTION,
  UI_TEXT,
} from "../../config/constants";
import { readDynamicCollectionMark } from "../../pages/constants";
import { isUnfilteredQuery, withoutSortRandom } from "../../search/query";
import { load } from "../../storage/store";
import type { CollectionPostInput } from "../../storage/store";
import {
  BulkCollectionDialog,
  bulkCollectionSummary,
} from "../../ui/bulk-collection-dialog";
import { Button, Dialog } from "../../ui/kit";
import { readPreviewThumbUrl, refreshAddButtons } from "../playlist-menu";
import { downloadsAvailable } from "./available";
import {
  readSelectedPostIds,
  readSelectedPosts,
  startGridSelect,
  stopGridSelect,
} from "./grid-select";
import { isDownloadBusy, startDownload } from "./queue";

/**
 * The buttons at the foot of the search panel that act on posts, on results
 * pages only. "Select posts" picks posts on the page; what was picked can be
 * added to a custom collection and, when the download manager is available
 * (see {@link downloadsAvailable}), downloaded. "Download results" takes the
 * whole search and needs the manager too.
 */

const LABEL_DOWNLOAD_RESULTS = "Download results";
const TITLE_DOWNLOAD_RESULTS = "Download every post of this search";
const LABEL_SELECT = "Select posts";
const TITLE_SELECT = "Pick posts on this page to add to a collection";
const TITLE_SELECT_WITH_DOWNLOADS = "Pick posts on this page to add to a collection or to download";
const ADD_SELECTED_PREFIX = "Add to collection (";
const ADD_SELECTED_SUFFIX = ")";
export const SELECT_NOTE_CLASS = "rdw-select-note";
const DOWNLOAD_SELECTED_PREFIX = "Download selected (";
const DOWNLOAD_SELECTED_SUFFIX = ")";
const DIALOG_TITLE = "Download results";
const CONFIRM_LABEL = "Download";
const SELECTION_LABEL_SUFFIX = " (selected)";
const UNNAMED_SELECTION = "selected posts";
const CONFIRM_PREFIX = "Download every post of “";
const CONFIRM_SUFFIX =
  "”? The list is read through the API first, then the files are saved one by one. A large search takes a long time; it can be paused or cancelled in the panel.";

function pageQuery(search: string): string {
  return withoutSortRandom(new URLSearchParams(search).get(SEARCH_PARAM_TAGS) ?? "");
}

function isResultsPage(search: string): boolean {
  return new URLSearchParams(search).get(SEARCH_PARAM_SECTION) === SEARCH_SECTION;
}

/** The collection's name when the page was opened from its card, else the query. */
function jobLabel(query: string): string {
  const markedId = readDynamicCollectionMark(window.location.hash);
  if (markedId !== null) {
    const collection = load().collections.find((item) => item.id === markedId);
    if (collection !== undefined) {
      return collection.name;
    }
  }
  return query;
}

export function DownloadControls(): JSX.Element | null {
  const [selecting, setSelecting] = useState(false);
  const [count, setCount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // The posts the collection dialog is open for; null while it is closed.
  const [collectionPosts, setCollectionPosts] = useState<readonly CollectionPostInput[] | null>(
    null,
  );
  // What the last "Add to collection" did.
  const [note, setNote] = useState("");

  useEffect(
    () => (): void => {
      stopGridSelect();
    },
    [],
  );

  const search = window.location.search;
  if (!isResultsPage(search)) {
    return null;
  }
  const canDownload = downloadsAvailable();
  const query = pageQuery(search);
  const label = jobLabel(query);

  const leaveSelect = (): void => {
    stopGridSelect();
    setSelecting(false);
    setCount(0);
  };

  if (selecting) {
    return (
      <>
        <Button
          variant="primary"
          size="s"
          disabled={count === 0}
          onClick={() => {
            setCollectionPosts(readSelectedPosts(readPreviewThumbUrl));
          }}
        >
          {`${ADD_SELECTED_PREFIX}${String(count)}${ADD_SELECTED_SUFFIX}`}
        </Button>
        {canDownload ? (
        <Button
          variant="secondary"
          size="s"
          disabled={count === 0}
          onClick={() => {
            const ids = readSelectedPostIds();
            leaveSelect();
            if (ids.length > 0 && !isDownloadBusy()) {
              void startDownload(
                label.length > 0 ? `${label}${SELECTION_LABEL_SUFFIX}` : UNNAMED_SELECTION,
                { kind: "ids", ids },
              );
            }
          }}
        >
          {`${DOWNLOAD_SELECTED_PREFIX}${String(count)}${DOWNLOAD_SELECTED_SUFFIX}`}
        </Button>
        ) : null}
        <Button variant="secondary" size="s" onClick={leaveSelect}>
          {UI_TEXT.cancel}
        </Button>
        <BulkCollectionDialog
          open={collectionPosts !== null}
          posts={collectionPosts ?? []}
          onClose={() => {
            setCollectionPosts(null);
          }}
          onDone={(result) => {
            leaveSelect();
            refreshAddButtons();
            setNote(bulkCollectionSummary(result));
          }}
        />
      </>
    );
  }

  return (
    <>
      {!canDownload || isUnfilteredQuery(query) ? null : (
        <Button
          variant="secondary"
          size="s"
          title={TITLE_DOWNLOAD_RESULTS}
          onClick={() => {
            setConfirmOpen(true);
          }}
        >
          {LABEL_DOWNLOAD_RESULTS}
        </Button>
      )}
      <Button
        variant="secondary"
        size="s"
        title={canDownload ? TITLE_SELECT_WITH_DOWNLOADS : TITLE_SELECT}
        onClick={() => {
          setNote("");
          startGridSelect(setCount);
          setSelecting(true);
        }}
      >
        {LABEL_SELECT}
      </Button>
      {note.length > 0 ? (
        <span className={SELECT_NOTE_CLASS} role="status">
          {note}
        </span>
      ) : null}
      <Dialog
        variant="confirm"
        open={confirmOpen}
        title={DIALOG_TITLE}
        message={`${CONFIRM_PREFIX}${label}${CONFIRM_SUFFIX}`}
        confirmLabel={CONFIRM_LABEL}
        cancelLabel={UI_TEXT.cancel}
        onConfirm={() => {
          setConfirmOpen(false);
          if (!isDownloadBusy()) {
            void startDownload(label, { kind: "query", tags: query });
          }
        }}
        onClose={() => {
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
