import type { JSX } from "preact";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";

import { deriveThumbUrlFromMedia } from "../../site/thumb";
import type { Collection } from "../../storage/schema";
import {
  addPostToCollection,
  createPlaylist,
  listPlaylists,
  playlistsContaining,
  removePostFromPlaylist,
} from "../../storage/store";
import {
  ANCHORED_POPOVER_WIDTH_PX,
  Button,
  IconCheck,
  IconPlus,
  Popover,
  TextField,
} from "../../ui/kit";
import { VIDEO_ELEMENT_ID } from "../video-player";
import { IMAGE_ID } from "./site-reads";

const TEXT_COLLECTIONS = "Collections";
const TEXT_FILTER_PLACEHOLDER = "Filter collections…";
const TEXT_NEW = "New custom collection";
const TEXT_CREATE = "Create";
const TEXT_NEW_NAME_LABEL = "New collection name";
const ARIA_COLLECTIONS = "Custom collections";
const LABEL_TOGGLE_PREFIX = "Toggle collection";

const KEY_ENTER = "Enter";
const VIDEO_SOURCE_SELECTOR = "source";
const POST_ANCHOR_ID_PREFIX = "p";

const CLASS_WRAP = "rdw-post-panel-collections";
const CLASS_TRIGGER = "rdw-post-panel-collections-btn";
const CLASS_ITEM = "rdw-post-panel-collection-item";
const CLASS_CHECK = "rdw-post-panel-collection-check";
const CLASS_NAME = "rdw-post-panel-collection-name";
const CLASS_NEW = "rdw-post-panel-collection-new";
const CLASS_NEW_FORM = "rdw-post-panel-collection-new-form";

export type CollectionsMenuProps = {
  readonly postId: number;
};

function readAttributeSrc(
  element: HTMLImageElement | HTMLSourceElement | HTMLVideoElement,
): string | null {
  if (!(element instanceof HTMLSourceElement)) {
    const current = element.currentSrc.trim();
    if (current.length > 0) {
      return current;
    }
  }
  const attribute = element.getAttribute("src");
  if (attribute === null) {
    return null;
  }
  const trimmed = attribute.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed;
}

function postAnchorElement(postId: number): Element | null {
  const anchor = document.getElementById(`${POST_ANCHOR_ID_PREFIX}${String(postId)}`);
  return anchor instanceof Element ? anchor : null;
}

function isInsidePostAnchor(node: Node, postId: number): boolean {
  const anchor = postAnchorElement(postId);
  return anchor !== null && anchor.contains(node);
}

function readVideoElementUrl(video: HTMLVideoElement): string | null {
  const source = video.querySelector(VIDEO_SOURCE_SELECTOR);
  if (source instanceof HTMLSourceElement) {
    const sourceUrl = readAttributeSrc(source);
    if (sourceUrl !== null) {
      return sourceUrl;
    }
  }
  return readAttributeSrc(video);
}

function readVideoMediaUrl(postId: number): string | null {
  const candidates: HTMLVideoElement[] = [];
  const byId = document.getElementById(VIDEO_ELEMENT_ID);
  if (byId instanceof HTMLVideoElement) {
    candidates.push(byId);
  }
  for (const node of document.querySelectorAll("video")) {
    if (node instanceof HTMLVideoElement && node !== byId) {
      candidates.push(node);
    }
  }
  for (const video of candidates) {
    if (isInsidePostAnchor(video, postId)) {
      continue;
    }
    const url = readVideoElementUrl(video);
    if (url !== null) {
      return url;
    }
  }
  return null;
}

function thumbFromMedia(mediaUrl: string | null, postId: number): string | null {
  if (mediaUrl === null) {
    return null;
  }
  return deriveThumbUrlFromMedia(mediaUrl, postId);
}

/** Post-page thumb from img#image, otherwise the video source. Null when neither yields one. */
function readPostPageThumbUrl(postId: number): string | null {
  const image = document.getElementById(IMAGE_ID);
  if (image instanceof HTMLImageElement && !isInsidePostAnchor(image, postId)) {
    const fromImage = thumbFromMedia(readAttributeSrc(image), postId);
    if (fromImage !== null) {
      return fromImage;
    }
  }
  return thumbFromMedia(readVideoMediaUrl(postId), postId);
}

function addPostWithThumb(collectionId: string, postId: number): void {
  const thumbUrl = readPostPageThumbUrl(postId);
  if (thumbUrl !== null) {
    addPostToCollection(collectionId, postId, thumbUrl);
    return;
  }
  addPostToCollection(collectionId, postId);
}

function memberIdSet(postId: number): Set<string> {
  return new Set(playlistsContaining(postId).map((item) => item.id));
}

function filterPlaylists(
  playlists: readonly Collection[],
  query: string,
): Collection[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) {
    return [...playlists];
  }
  return playlists.filter((item) =>
    item.name.toLowerCase().includes(trimmed),
  );
}

export function CollectionsMenu(
  props: CollectionsMenuProps,
): JSX.Element {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revision, setRevision] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const playlists = useMemo(() => {
    void revision;
    return listPlaylists();
  }, [revision]);

  const members = useMemo(() => {
    void revision;
    return memberIdSet(props.postId);
  }, [props.postId, revision]);

  const visible = useMemo(
    () => filterPlaylists(playlists, filter),
    [playlists, filter],
  );

  const bump = useCallback((): void => {
    setRevision((value) => value + 1);
  }, []);

  const close = useCallback((): void => {
    setOpen(false);
    setCreating(false);
    setNewName("");
    setFilter("");
  }, []);

  const bindTrigger = useCallback((node: HTMLDivElement | null): void => {
    const button = node?.querySelector("button");
    triggerRef.current = button instanceof HTMLButtonElement ? button : null;
  }, []);

  const toggleMembership = useCallback(
    (playlistId: string): void => {
      if (members.has(playlistId)) {
        removePostFromPlaylist(playlistId, props.postId);
      } else {
        addPostWithThumb(playlistId, props.postId);
      }
      bump();
    },
    [bump, members, props.postId],
  );

  const commitNew = useCallback((): void => {
    const name = newName.trim();
    if (name.length === 0) {
      return;
    }
    const playlist = createPlaylist(name);
    addPostWithThumb(playlist.id, props.postId);
    bump();
    setCreating(false);
    setNewName("");
  }, [bump, newName, props.postId]);

  return (
    <div className={CLASS_WRAP} ref={bindTrigger}>
      <Button
        variant="secondary"
        size="m"
        className={CLASS_TRIGGER}
        aria-label={TEXT_COLLECTIONS}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <IconPlus size={14} />
        {TEXT_COLLECTIONS}
      </Button>
      <Popover
        open={open}
        onClose={close}
        anchorRef={triggerRef}
        widthPx={ANCHORED_POPOVER_WIDTH_PX}
        aria-label={ARIA_COLLECTIONS}
      >
        <TextField
          value={filter}
          onChange={setFilter}
          placeholder={TEXT_FILTER_PLACEHOLDER}
          aria-label={TEXT_FILTER_PLACEHOLDER}
        />
        {visible.map((playlist) => {
          const checked = members.has(playlist.id);
          return (
            <button
              key={playlist.id}
              type="button"
              className={CLASS_ITEM}
              role="menuitemcheckbox"
              aria-checked={checked}
              aria-label={`${LABEL_TOGGLE_PREFIX} ${playlist.name}`}
              onClick={() => {
                toggleMembership(playlist.id);
              }}
            >
              <span className={CLASS_CHECK} aria-hidden="true">
                {checked ? <IconCheck size={14} /> : null}
              </span>
              <span className={CLASS_NAME}>{playlist.name}</span>
            </button>
          );
        })}
        {creating ? (
          <div
            className={CLASS_NEW_FORM}
            onKeyDown={(event) => {
              if (event.key === KEY_ENTER) {
                event.preventDefault();
                commitNew();
              }
            }}
          >
            <TextField
              value={newName}
              onChange={setNewName}
              label={TEXT_NEW_NAME_LABEL}
              aria-label={TEXT_NEW_NAME_LABEL}
            />
            <Button variant="primary" size="s" onClick={commitNew}>
              {TEXT_CREATE}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="s"
            className={CLASS_NEW}
            onClick={() => {
              setCreating(true);
            }}
          >
            <IconPlus size={14} />
            {TEXT_NEW}
          </Button>
        )}
      </Popover>
    </div>
  );
}

export { TEXT_COLLECTIONS, CLASS_TRIGGER as CLASS_COLLECTIONS_BTN };
