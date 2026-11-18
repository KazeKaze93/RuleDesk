import type { JSX, TargetedMouseEvent, TargetedSubmitEvent } from "preact";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";

import {
  SEARCH_PAGE,
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
  SEARCH_SECTION_VIEW,
  UI_TEXT,
} from "../config/constants";
import { downloadsAvailable } from "../features/downloads/available";
import { isDownloadBusy, startDownload } from "../features/downloads/queue";
import type { CollectionPostsSnapshot } from "../storage/store";
import {
  deleteCollection,
  getCollectionOrder,
  listPlaylists,
  movePostInCollection,
  removePostsFromCollection,
  renameCollection,
  resetCollectionOrder,
  restorePosts,
  shuffleCollection,
} from "../storage/store";
import {
  Button,
  SelectionBar,
  Dialog,
  EmptyState,
  TextField,
  Toast,
} from "../ui/kit";
import { navigateToRdwRoute } from "./router";
import {
  collectionQueueHash,
  RDW_HASH_COLLECTIONS,
  RDW_ROUTE_COLLECTIONS,
} from "./constants";
import { useEscape } from "../ui/use-escape";

const CELL_SIZE_PX = 200;
const GRID_GAP_PX = 4;
const SECTION_GAP_PX = 12;
const ACTIONS_GAP_PX = 8;
const HEADING_GAP_PX = 8;
const NAME_MIN_LENGTH = 1;
const POST_COUNT_SINGULAR = 1;
const MOUSE_BUTTON_PRIMARY = 0;
const DRAG_EFFECT_MOVE = "move";
const DRAGGING_OPACITY = "0.4";
const OBJECT_FIT_CONTAIN = "contain";
const IMG_LOADING_LAZY = "lazy" as const;

/** Same mark chrome as favorites bulk select. */
const CLASS_MARK_SELECTED = "rdw-fav-bulk-selected";
const CLASS_MARK_CHECK = "rdw-fav-bulk-check";
const MARK_CHECK_GLYPH = "✓";
const SELECT_OUTLINE_WIDTH = "2px";
const SELECT_OUTLINE_OFFSET = "2px";
const CHECK_SIZE = "1.25rem";
const CHECK_INSET = "0.25rem";
const CHECK_Z_INDEX = 2;
const CHECK_FONT_SIZE = "0.75rem";
const ACCENT_FALLBACK = "#4c8bf5";
const SURFACE_FALLBACK = "#ffffff";

const CLASS_ROOT = "rdw-collection-detail";
const CLASS_BACK = "rdw-collection-back";
const CLASS_HEADING = "rdw-collection-heading";
const CLASS_NAME = "rdw-collection-name";
const CLASS_COUNT = "rdw-collection-count";
const CLASS_ACTIONS = "rdw-collection-actions";
const CLASS_GRID = "rdw-collection-grid";
const CLASS_CELL = "rdw-collection-cell";
const CLASS_FALLBACK = "rdw-collection-fallback";
const CLASS_MISSING = "rdw-collection-missing";
const CLASS_DIALOG_FORM = "rdw-collection-dialog-form";
const CLASS_DIALOG_ACTIONS = "rdw-collection-dialog-actions";

const LABEL_BACK = "← Collections";
const LABEL_SHUFFLE = "Shuffle";
const LABEL_ORIGINAL_ORDER = "Original order";
const LABEL_SELECT = "Select";
const LABEL_DOWNLOAD_ALL = "Download all";
const LABEL_DOWNLOAD_SELECTED = "Download selected";
const DRAG_HINT = "Drag a post onto another to change the order.";
const CLASS_DRAGGING = "rdw-collection-cell--dragging";
const CLASS_DROP_TARGET = "rdw-collection-cell--drop";
const CLASS_HINT = "rdw-collection-hint";
const LABEL_UNDO = "Undo";
const LABEL_REMOVE_SELECTED = "Remove from collection";
const FALLBACK_PREFIX = "#";
const POST_LINK_LABEL_PREFIX = "Post #";
const POST_NOUN_SINGULAR = "post";
const POST_NOUN_PLURAL = "posts";
const REMOVED_PREFIX = "Removed ";
const UNKNOWN_COLLECTION_MESSAGE = "Collection not found.";
const EMPTY_COLLECTION_TITLE = "No posts yet";
const EMPTY_COLLECTION_HINT =
  "Add posts with + on a thumbnail, and with Collections on the post page.";
const RENAME_INPUT_ID = "rdw-collection-rename-name";
const RENAME_DIALOG_LABEL = "Rename collection";
const DELETE_DIALOG_LABEL = "Delete collection";

/** The confirmation names the collection and says what is and is not lost. */
export function deleteCollectionMessage(name: string): string {
  if (name.length === 0) {
    return UI_TEXT.confirmDelete;
  }
  return `Delete the collection \u201c${name}\u201d? The posts stay on the site; the list of them is lost. This cannot be undone.`;
}
const GRID_LABEL = "Collection posts";

const COLLECTION_DETAIL_CSS = `
.${CLASS_ROOT} {
  display: flex;
  flex-direction: column;
  gap: ${String(SECTION_GAP_PX)}px;
}
.${CLASS_BACK} {
  color: var(--rdw-accent);
  font-weight: 600;
  text-decoration: none;
}
.${CLASS_HEADING} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${String(HEADING_GAP_PX)}px ${String(SECTION_GAP_PX)}px;
}
.${CLASS_NAME} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
.${CLASS_COUNT} {
  margin: 0;
  color: var(--rdw-muted);
}
.${CLASS_ACTIONS} {
  display: flex;
  flex-wrap: wrap;
  gap: ${String(ACTIONS_GAP_PX)}px;
}
.${CLASS_HINT} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${CLASS_DRAGGING} {
  opacity: ${DRAGGING_OPACITY};
}
.${CLASS_DROP_TARGET} {
  outline: 2px dashed var(--rdw-accent);
  outline-offset: -2px;
}
.${CLASS_GRID} {
  display: grid;
  grid-template-columns: repeat(auto-fill, ${String(CELL_SIZE_PX)}px);
  gap: ${String(GRID_GAP_PX)}px;
}
.${CLASS_CELL} {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${String(CELL_SIZE_PX)}px;
  height: ${String(CELL_SIZE_PX)}px;
  overflow: hidden;
  border: 1px solid var(--rdw-border);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  text-decoration: none;
}
.${CLASS_CELL} img {
  width: 100%;
  height: 100%;
  object-fit: ${OBJECT_FIT_CONTAIN};
}
.${CLASS_FALLBACK} {
  font-weight: 600;
  color: var(--rdw-muted);
}
.${CLASS_MISSING} {
  margin: 0;
}
.${CLASS_DIALOG_FORM} {
  display: grid;
  gap: ${String(SECTION_GAP_PX)}px;
}
.${CLASS_DIALOG_ACTIONS} {
  display: flex;
  justify-content: flex-end;
  gap: ${String(ACTIONS_GAP_PX)}px;
}
.${CLASS_CELL}.${CLASS_MARK_SELECTED} {
  outline: ${SELECT_OUTLINE_WIDTH} solid var(--rdw-accent, ${ACCENT_FALLBACK});
  outline-offset: ${SELECT_OUTLINE_OFFSET};
}
.${CLASS_CELL} > .${CLASS_MARK_CHECK} {
  position: absolute;
  top: ${CHECK_INSET};
  left: ${CHECK_INSET};
  z-index: ${String(CHECK_Z_INDEX)};
  display: none;
  align-items: center;
  justify-content: center;
  width: ${CHECK_SIZE};
  height: ${CHECK_SIZE};
  border-radius: 999px;
  background: var(--rdw-accent, ${ACCENT_FALLBACK});
  color: var(--rdw-surface, ${SURFACE_FALLBACK});
  font-size: ${CHECK_FONT_SIZE};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
.${CLASS_CELL}.${CLASS_MARK_SELECTED} > .${CLASS_MARK_CHECK} {
  display: inline-flex;
}
`.trim();

type CollectionDetail = {
  readonly name: string;
  readonly order: readonly number[];
  readonly thumbs: Readonly<Record<string, string>>;
  readonly shuffled: boolean;
};

type RemovalToast = {
  /** New id per removal: remounts the toast so its hide timer starts over. */
  readonly id: number;
  readonly message: string;
  readonly snapshot: CollectionPostsSnapshot;
};

export type CollectionDetailPageProps = {
  readonly collectionId: string;
};

function postsCountLabel(count: number): string {
  const noun = count === POST_COUNT_SINGULAR ? POST_NOUN_SINGULAR : POST_NOUN_PLURAL;
  return `${String(count)} ${noun}`;
}

function removedPostsMessage(count: number): string {
  const noun = count === POST_COUNT_SINGULAR ? POST_NOUN_SINGULAR : POST_NOUN_PLURAL;
  return `${REMOVED_PREFIX}${String(count)} ${noun}`;
}



type PostDrag = {
  readonly draggingId: number | null;
  readonly overId: number | null;
  readonly onStart: (postId: number) => void;
  readonly onOver: (postId: number) => void;
  readonly onDrop: (postId: number) => void;
  readonly onEnd: () => void;
};

function fallbackLabel(postId: number): string {
  return `${FALLBACK_PREFIX}${String(postId)}`;
}

function thumbUrlFor(
  thumbs: Readonly<Record<string, string>>,
  postId: number,
): string | null {
  const value = thumbs[String(postId)];
  if (value === undefined || value.length === 0) {
    return null;
  }
  return value;
}

function readCollectionDetail(collectionId: string): CollectionDetail | null {
  const order = getCollectionOrder(collectionId);
  if (order === null) {
    return null;
  }
  const collection = listPlaylists().find((item) => item.id === collectionId);
  if (collection === undefined) {
    return null;
  }
  return {
    name: collection.name,
    order,
    thumbs: collection.thumbs ?? {},
    shuffled:
      collection.shuffledOrder !== null && collection.shuffledOrder !== undefined,
  };
}

/** Post page link that carries the collection queue hash, not a script route. */
export function collectionPostHref(collectionId: string, postId: number): string {
  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, SEARCH_PAGE);
  params.set(SEARCH_PARAM_SECTION, SEARCH_SECTION_VIEW);
  params.set(SEARCH_PARAM_ID, String(postId));
  return `${SEARCH_PATH}?${params.toString()}${collectionQueueHash(collectionId)}`;
}

function isModifiedClick(
  event: TargetedMouseEvent<HTMLAnchorElement>,
): boolean {
  return (
    event.button !== MOUSE_BUTTON_PRIMARY ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function PostCell(props: {
  readonly postId: number;
  readonly collectionId: string;
  readonly thumbUrl: string | null;
  readonly selecting: boolean;
  readonly selected: boolean;
  readonly onToggle: (postId: number) => void;
  /** Null while posts are being selected: then nothing can be dragged. */
  readonly drag: PostDrag | null;
}): JSX.Element {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const thumbUrl = props.thumbUrl;
  const failed = thumbUrl !== null && failedUrl === thumbUrl;
  const thumbUrlRef = useRef(thumbUrl);
  thumbUrlRef.current = thumbUrl;

  const markFailed = useCallback((): void => {
    setFailedUrl(thumbUrlRef.current);
  }, []);

  const imageRef = useCallback((node: HTMLImageElement | null): void => {
    if (node === null) {
      return;
    }
    // `error` does not bubble, so a parent listener never sees a failed thumb.
    node.addEventListener("error", markFailed);
  }, [markFailed]);

  const showImage = thumbUrl !== null && !failed;
  const drag = props.drag;
  const className = [
    CLASS_CELL,
    props.selected ? CLASS_MARK_SELECTED : "",
    drag?.draggingId === props.postId ? CLASS_DRAGGING : "",
    drag !== null && drag.overId === props.postId && drag.draggingId !== props.postId
      ? CLASS_DROP_TARGET
      : "",
  ]
    .filter((part) => part.length > 0)
    .join(" ");

  return (
    <a
      className={className}
      href={collectionPostHref(props.collectionId, props.postId)}
      aria-label={`${POST_LINK_LABEL_PREFIX}${String(props.postId)}`}
      {...(props.selecting ? { "aria-pressed": props.selected } : {})}
      draggable={drag !== null}
      onDragStart={(event) => {
        if (drag === null) {
          return;
        }
        if (event.dataTransfer !== null) {
          event.dataTransfer.effectAllowed = DRAG_EFFECT_MOVE;
        }
        drag.onStart(props.postId);
      }}
      onDragOver={(event) => {
        if (drag === null || drag.draggingId === null) {
          return;
        }
        event.preventDefault();
        drag.onOver(props.postId);
      }}
      onDrop={(event) => {
        if (drag === null || drag.draggingId === null) {
          return;
        }
        event.preventDefault();
        drag.onDrop(props.postId);
      }}
      onDragEnd={() => {
        drag?.onEnd();
      }}
      onClick={(event) => {
        if (!props.selecting || isModifiedClick(event)) {
          return;
        }
        event.preventDefault();
        props.onToggle(props.postId);
      }}
    >
      {showImage ? (
        <img
          src={thumbUrl}
          alt=""
          loading={IMG_LOADING_LAZY}
          ref={imageRef}
        />
      ) : (
        <span className={CLASS_FALLBACK}>{fallbackLabel(props.postId)}</span>
      )}
      {props.selected ? (
        <span className={CLASS_MARK_CHECK} aria-hidden="true">
          {MARK_CHECK_GLYPH}
        </span>
      ) : null}
    </a>
  );
}

function BackToCollections(): JSX.Element {
  return (
    <a className={CLASS_BACK} href={RDW_HASH_COLLECTIONS}>
      {LABEL_BACK}
    </a>
  );
}

export function CollectionDetailPage(
  props: CollectionDetailPageProps,
): JSX.Element {
  const [revision, setRevision] = useState(0);
  const [selecting, setSelecting] = useState(false);
  // Escape leaves the selection, as Cancel does.
  useEscape(selecting, leaveSelectMode);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [renameOpen, setRenameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<RemovalToast | null>(null);
  const toastRef = useRef<RemovalToast | null>(null);
  const toastIdRef = useRef(0);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);


  const detail = useMemo(
    () => readCollectionDetail(props.collectionId),
    [props.collectionId, revision],
  );

  const refresh = useCallback((): void => {
    setRevision((value) => value + 1);
  }, []);

  const onToastClose = useCallback((): void => {
    toastRef.current = null;
    setToast(null);
  }, []);

  const onUndo = useCallback((): void => {
    const current = toastRef.current;
    if (current === null) {
      return;
    }
    restorePosts(current.snapshot);
    toastRef.current = null;
    setToast(null);
    setRevision((value) => value + 1);
  }, []);

  function showRemoval(snapshot: CollectionPostsSnapshot): void {
    if (snapshot.posts.length === 0) {
      return;
    }
    toastIdRef.current += 1;
    const next: RemovalToast = {
      id: toastIdRef.current,
      message: removedPostsMessage(snapshot.posts.length),
      snapshot,
    };
    toastRef.current = next;
    setToast(next);
  }

  const drag: PostDrag = {
    draggingId,
    overId,
    onStart: setDraggingId,
    onOver: setOverId,
    onDrop: (targetId) => {
      if (draggingId !== null) {
        movePostInCollection(props.collectionId, draggingId, targetId);
      }
      setDraggingId(null);
      setOverId(null);
      refresh();
    },
    onEnd: () => {
      setDraggingId(null);
      setOverId(null);
    },
  };

  // The download manager shows progress in its own panel on every page.
  function download(name: string, ids: readonly number[]): void {
    if (ids.length === 0 || isDownloadBusy()) {
      return;
    }
    void startDownload(name, { kind: "ids", ids });
  }

  const downloadAvailable = downloadsAvailable();

  function leaveSelectMode(): void {
    setSelecting(false);
    setSelected(new Set());
  }

  function togglePost(postId: number): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }

  function openRename(): void {
    if (detail === null) {
      return;
    }
    setNameDraft(detail.name);
    setRenameOpen(true);
  }

  function submitRename(event: TargetedSubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (trimmed.length < NAME_MIN_LENGTH) {
      return;
    }
    renameCollection(props.collectionId, trimmed);
    setRenameOpen(false);
    refresh();
  }

  function confirmDelete(): void {
    setDeleteOpen(false);
    const deleted = deleteCollection(props.collectionId);
    if (!deleted) {
      refresh();
      return;
    }
    void navigateToRdwRoute(RDW_ROUTE_COLLECTIONS);
  }

  function removeSelected(): void {
    if (selected.size === 0) {
      return;
    }
    const snapshot = removePostsFromCollection(props.collectionId, [...selected]);
    leaveSelectMode();
    refresh();
    if (snapshot !== null) {
      showRemoval(snapshot);
    }
  }

  const toastAction =
    toast === null ? null : { label: LABEL_UNDO, onClick: onUndo };

  return (
    <div className={CLASS_ROOT} data-collection-id={props.collectionId}>
      <style>{COLLECTION_DETAIL_CSS}</style>
      {detail === null ? (
        <>
          <p className={CLASS_MISSING}>{UNKNOWN_COLLECTION_MESSAGE}</p>
          <BackToCollections />
        </>
      ) : (
        <>
          <BackToCollections />
          <div className={CLASS_HEADING}>
            <h1 className={CLASS_NAME}>{detail.name}</h1>
            <p className={CLASS_COUNT}>{postsCountLabel(detail.order.length)}</p>
          </div>
          {selecting ? (
            <SelectionBar
              count={selected.size}
              onSelectAll={() => {
                setSelected(new Set(detail.order));
              }}
              onClear={() => {
                setSelected(new Set());
              }}
              onCancel={leaveSelectMode}
              danger={
                // No dots: nothing is asked, the removal can be undone.
                <Button variant="danger-quiet" disabled={selected.size === 0} onClick={removeSelected}>
                  {LABEL_REMOVE_SELECTED}
                </Button>
              }
            >
              {downloadAvailable ? (
                <Button
                  variant="secondary"
                  disabled={selected.size === 0}
                  onClick={() => {
                    download(detail.name, detail.order.filter((id) => selected.has(id)));
                    leaveSelectMode();
                  }}
                >
                  {LABEL_DOWNLOAD_SELECTED}
                </Button>
              ) : null}
            </SelectionBar>
          ) : (
          <div className={CLASS_ACTIONS}>
              <>
                <Button
                  variant="secondary"
                  size="s"
                  onClick={() => {
                    shuffleCollection(props.collectionId);
                    refresh();
                  }}
                >
                  {LABEL_SHUFFLE}
                </Button>
                {detail.shuffled ? (
                  <Button
                    variant="secondary"
                    size="s"
                    onClick={() => {
                      resetCollectionOrder(props.collectionId);
                      refresh();
                    }}
                  >
                    {LABEL_ORIGINAL_ORDER}
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  size="s"
                  onClick={() => {
                    setSelected(new Set());
                    setSelecting(true);
                  }}
                >
                  {LABEL_SELECT}
                </Button>
                {downloadAvailable && detail.order.length > 0 ? (
                  <Button
                    variant="secondary"
                    size="s"
                    onClick={() => {
                      download(detail.name, detail.order);
                    }}
                  >
                    {LABEL_DOWNLOAD_ALL}
                  </Button>
                ) : null}
                <Button variant="secondary" size="s" onClick={openRename}>
                  {UI_TEXT.rename}
                </Button>
                <Button
                  variant="danger-quiet"
                  size="s"
                  onClick={() => {
                    setDeleteOpen(true);
                  }}
                >
                  {UI_TEXT.delete}
                </Button>
              </>
          </div>
          )}
          {!selecting && detail.order.length > POST_COUNT_SINGULAR ? (
            <p className={CLASS_HINT}>{DRAG_HINT}</p>
          ) : null}
          {detail.order.length === 0 ? (
            <EmptyState
              title={EMPTY_COLLECTION_TITLE}
              description={EMPTY_COLLECTION_HINT}
            />
          ) : (
            <div className={CLASS_GRID} aria-label={GRID_LABEL}>
              {detail.order.map((postId) => (
                <PostCell
                  key={postId}
                  postId={postId}
                  collectionId={props.collectionId}
                  thumbUrl={thumbUrlFor(detail.thumbs, postId)}
                  selecting={selecting}
                  selected={selected.has(postId)}
                  onToggle={togglePost}
                  drag={selecting ? null : drag}
                />
              ))}
            </div>
          )}
          <Dialog
            open={renameOpen}
            onClose={() => {
              setRenameOpen(false);
            }}
            title={UI_TEXT.rename}
            aria-label={RENAME_DIALOG_LABEL}
          >
            <form className={CLASS_DIALOG_FORM} onSubmit={submitRename}>
              <TextField
                id={RENAME_INPUT_ID}
                label={UI_TEXT.nameLabel}
                value={nameDraft}
                onChange={setNameDraft}
              />
              <div className={CLASS_DIALOG_ACTIONS}>
                <Button
                  type="button"
                  variant="secondary"
                  size="s"
                  onClick={() => {
                    setRenameOpen(false);
                  }}
                >
                  {UI_TEXT.cancel}
                </Button>
                <Button type="submit" variant="primary" size="s">
                  {UI_TEXT.save}
                </Button>
              </div>
            </form>
          </Dialog>
          <Dialog
            variant="confirm"
            open={deleteOpen}
            onClose={() => {
              setDeleteOpen(false);
            }}
            title={UI_TEXT.delete}
            aria-label={DELETE_DIALOG_LABEL}
            message={deleteCollectionMessage(detail === null ? "" : detail.name)}
            confirmLabel={UI_TEXT.delete}
            cancelLabel={UI_TEXT.cancel}
            confirmTone="danger"
            onConfirm={confirmDelete}
          />
        </>
      )}
      <Toast
        key={toast?.id}
        open={toast !== null}
        message={toast === null ? "" : toast.message}
        onClose={onToastClose}
        {...(toastAction === null ? {} : { action: toastAction })}
      />
    </div>
  );
}
