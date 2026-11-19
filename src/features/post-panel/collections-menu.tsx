import type { JSX } from "preact";
import { useCallback, useRef, useState } from "preact/hooks";

import { deriveThumbUrlFromMedia } from "../../site/thumb";
import { CollectionPicker } from "../../ui/collection-picker";
import { ANCHORED_POPOVER_WIDTH_PX, Button, Popover } from "../../ui/kit";
import { IconCheck, IconPlus } from "../../ui/kit/icons";
import { playlistsContaining } from "../../storage/store";
import { VIDEO_ELEMENT_ID } from "../video-player";
import { TITLE_DELETED } from "./deleted-block";
import { IMAGE_ID } from "./site-reads";

const TEXT_COLLECTIONS = "Collections";
const ARIA_COLLECTIONS = "Custom collections";
const SINGLE = 1;

/** "In 1 collection", "In 3 collections": the button of a post that some collections hold. */
export function collectionsHeldLabel(count: number): string {
  return `In ${String(count)} ${count === SINGLE ? "collection" : "collections"}`;
}
const TRIGGER_ICON_PX = 14;

const VIDEO_SOURCE_SELECTOR = "source";
const POST_ANCHOR_ID_PREFIX = "p";

const CLASS_WRAP = "rdw-post-panel-collections";
const CLASS_TRIGGER = "rdw-post-panel-collections-btn";

export type CollectionsMenuProps = {
  readonly postId: number;
  /**
   * The post was deleted on the site: one that no collection holds is not
   * added to any (the designer, 19.11.2026). One that some hold keeps the
   * list, to be taken out of them.
   */
  readonly deleted?: boolean;
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

export function CollectionsMenu(
  props: CollectionsMenuProps,
): JSX.Element {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // How many custom collections hold the post; read again when the list is
  // closed, where it may have been changed.
  const [held, setHeld] = useState(() => playlistsContaining(props.postId).length);
  const close = useCallback((): void => {
    setOpen(false);
    setHeld(playlistsContaining(props.postId).length);
  }, [props.postId]);

  const bindTrigger = useCallback((node: HTMLDivElement | null): void => {
    const button = node?.querySelector("button");
    triggerRef.current = button instanceof HTMLButtonElement ? button : null;
  }, []);

  const postId = props.postId;
  const readThumbUrl = useCallback(
    (): string | null => readPostPageThumbUrl(postId),
    [postId],
  );

  return (
    <div className={CLASS_WRAP} ref={bindTrigger}>
      <Button
        variant="secondary"
        size="m"
        className={CLASS_TRIGGER}
        pressed={held > 0}
        disabled={props.deleted === true && held === 0 && !open}
        {...(props.deleted === true && held === 0 ? { title: TITLE_DELETED } : {})}
        aria-label={held > 0 ? collectionsHeldLabel(held) : TEXT_COLLECTIONS}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
          }
        }}
      >
        {held > 0 ? <IconCheck size={TRIGGER_ICON_PX} /> : <IconPlus size={TRIGGER_ICON_PX} />}
        {held > 0 ? collectionsHeldLabel(held) : TEXT_COLLECTIONS}
      </Button>
      <Popover
        open={open}
        onClose={close}
        anchorRef={triggerRef}
        widthPx={ANCHORED_POPOVER_WIDTH_PX}
        aria-label={ARIA_COLLECTIONS}
      >
        <CollectionPicker postId={postId} readThumbUrl={readThumbUrl} />
      </Popover>
    </div>
  );
}

export { TEXT_COLLECTIONS, CLASS_TRIGGER as CLASS_COLLECTIONS_BTN };
