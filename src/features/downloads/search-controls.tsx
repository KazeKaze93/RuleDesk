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
import { Button, Dialog } from "../../ui/kit";
import { downloadsAvailable } from "./available";
import {
  readSelectedPostIds,
  startGridSelect,
  stopGridSelect,
} from "./grid-select";
import { isDownloadBusy, startDownload } from "./queue";

/**
 * Download buttons of the search panel, on results pages only: the whole
 * search, or posts picked on the page. Rendered only when the download
 * manager is available (see {@link downloadsAvailable}).
 */

const LABEL_DOWNLOAD_RESULTS = "Download results";
const TITLE_DOWNLOAD_RESULTS = "Download every post of this search";
const LABEL_SELECT = "Select posts";
const TITLE_SELECT = "Pick posts on this page to download";
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

  useEffect(
    () => (): void => {
      stopGridSelect();
    },
    [],
  );

  const search = window.location.search;
  if (!isResultsPage(search) || !downloadsAvailable()) {
    return null;
  }
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
        <Button variant="secondary" size="s" onClick={leaveSelect}>
          {UI_TEXT.cancel}
        </Button>
      </>
    );
  }

  return (
    <>
      {isUnfilteredQuery(query) ? null : (
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
        title={TITLE_SELECT}
        onClick={() => {
          startGridSelect(setCount);
          setSelecting(true);
        }}
      >
        {LABEL_SELECT}
      </Button>
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
