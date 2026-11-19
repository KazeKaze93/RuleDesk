/**
 * Hover video preview for grid `img.preview.webm-thumb` thumbs and for the
 * favorites and Comments page thumbs marked as video
 * (`src/site/video-thumbs.ts`).
 * Loads the CDN mp4 via a <video> element only — no post-page fetches.
 */

import { scheduleAfterFirstPaint } from "../boot/ready";
import { isCommentsPage } from "../site/comments-page";
import {
  THUMB_IMAGE_SELECTOR,
  VIDEO_THUMB_CLASS,
} from "../site/video-thumbs";
import {
  SITE_SELECTORS,
  extractPostIdFromCommentThumb,
  extractPostIdFromThumb,
  extractPostIdFromThumbLink,
} from "../site/selectors";
import {
  BASE_GRID_CSS,
  buildVideoUrlFromThumbUrl,
  ensureThumbAnchor,
} from "../site/thumb";
import { onThumbsAdded } from "../site/thumbs-bus";
import {
  THUMB_ANCHOR_NAME,
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

export const VIDEO_PREVIEW_FEATURE_ID = "video-preview";
const FEATURE_ID = VIDEO_PREVIEW_FEATURE_ID;
const FEATURE_LABEL = "Video preview on hover";
/** Settings caption for Phase 2 F/H (Switch hint under the toggle). */
export const VIDEO_PREVIEW_SETTING_CAPTION =
  "Each preview loads the video file itself.";

/** "other" is for the Comments page, which is recognised by its markup. */
const FEATURE_PAGES = ["list", "favorites", "other"] as const;
const HOVER_DELAY_MS = 200;
/** How long a post is left alone after its preview failed to load. */
const RETRY_AFTER_MS = 30_000;
const VIDEO_CLASS = "rdw-video-preview";
const WEBM_PREVIEW_SELECTOR = "img.preview.webm-thumb";
const THUMBS_SELECTOR = `${SITE_SELECTORS.thumb}, ${SITE_SELECTORS.commentThumb}`;
const VIDEO_Z_INDEX = 3;
const PRELOAD_NONE = "none";

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_CLASS}`;

/*
 * The base grid rules (the thumb as the containing block, the image as the
 * anchor) come with the feature: on the favorites page nothing else adds them,
 * and without them the video lands beside the image instead of on it.
 */
const FEATURE_CSS = `
${BASE_GRID_CSS.trim()}
${BODY_SELECTOR} .${VIDEO_CLASS} {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${String(VIDEO_Z_INDEX)};
  margin: 0;
  padding: 0;
  border: 0;
  object-fit: contain;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  ${BODY_SELECTOR} .${VIDEO_CLASS} {
    position-anchor: ${THUMB_ANCHOR_NAME};
    top: anchor(top);
    left: anchor(left);
    width: anchor-size(width);
    height: anchor-size(height);
  }
}
`.trim();

type ActivePreview = {
  readonly thumb: HTMLElement;
  readonly video: HTMLVideoElement;
  readonly postId: string;
  readonly onError: () => void;
};

/** Post id → when its preview last failed to load, ms since epoch. */
const failedPostIds = new Map<string, number>();

/**
 * A post whose preview failed is left alone for a while and then tried
 * again: a file just uploaded may not be served yet, and one stray error
 * should not switch the preview of that post off until the page is reloaded.
 */
function failedRecently(postId: string): boolean {
  const failedAt = failedPostIds.get(postId);
  if (failedAt === undefined) {
    return false;
  }
  if (Date.now() - failedAt < RETRY_AFTER_MS) {
    return true;
  }
  failedPostIds.delete(postId);
  return false;
}
const boundThumbGeneration = new WeakMap<HTMLElement, number>();

let bindGeneration = 0;
let activePreview: ActivePreview | null = null;
let hoverTimerId: number | null = null;
let hoverThumb: HTMLElement | null = null;
let unsubscribeThumbsAdded: (() => void) | undefined;
let started = false;

function clearHoverTimer(): void {
  if (hoverTimerId === null) {
    return;
  }
  window.clearTimeout(hoverTimerId);
  hoverTimerId = null;
}

function tearDownActive(): void {
  const current = activePreview;
  if (current === null) {
    return;
  }
  activePreview = null;
  current.video.removeEventListener("error", current.onError);
  current.video.pause();
  current.video.src = "";
  current.video.load();
  current.video.remove();
}

function findThumbLink(thumb: HTMLElement, postId: string): HTMLAnchorElement | null {
  const byId = thumb.querySelector(`#p${postId}`);
  if (byId instanceof HTMLAnchorElement) {
    return byId;
  }
  const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
  if (byHref instanceof HTMLAnchorElement) {
    return byHref;
  }
  // The link around the image, whatever its address looks like.
  const around = thumb.querySelector(THUMB_IMAGE_SELECTOR)?.parentElement;
  return around instanceof HTMLAnchorElement ? around : null;
}

function readPostId(thumb: HTMLElement): string | null {
  return (
    extractPostIdFromThumb(thumb) ??
    extractPostIdFromThumbLink(thumb) ??
    extractPostIdFromCommentThumb(thumb)
  );
}

function findWebmThumbImage(thumb: HTMLElement): HTMLImageElement | null {
  const img = thumb.querySelector(WEBM_PREVIEW_SELECTOR);
  if (img instanceof HTMLImageElement) {
    return img;
  }
  if (!thumb.classList.contains(VIDEO_THUMB_CLASS)) {
    return null;
  }
  const favorite = thumb.querySelector(THUMB_IMAGE_SELECTOR);
  return favorite instanceof HTMLImageElement ? favorite : null;
}

/**
 * Puts the video exactly over the image by measuring both. The stylesheet
 * does the same by anchor positioning, but the browser does not always find
 * the anchor for a thumb that got its anchor scope only now, on hover (seen
 * on the favorites page: the video took the size of the whole cell). Measured
 * numbers do not depend on that. Nothing is set when there is no layout.
 */
function placeOverImage(
  video: HTMLVideoElement,
  thumb: HTMLElement,
  img: HTMLImageElement,
): void {
  const image = img.getBoundingClientRect();
  if (image.width <= 0 || image.height <= 0) {
    return;
  }
  const cell = thumb.getBoundingClientRect();
  video.style.top = `${String(image.top - cell.top - thumb.clientTop)}px`;
  video.style.left = `${String(image.left - cell.left - thumb.clientLeft)}px`;
  video.style.width = `${String(image.width)}px`;
  video.style.height = `${String(image.height)}px`;
}

function startPreview(thumb: HTMLElement): void {
  const postId = readPostId(thumb);
  if (postId === null || failedRecently(postId)) {
    return;
  }
  const img = findWebmThumbImage(thumb);
  if (img === null) {
    return;
  }
  const videoUrl = buildVideoUrlFromThumbUrl(img.currentSrc || img.src);
  if (videoUrl === null) {
    return;
  }
  const link = findThumbLink(thumb, postId);
  if (link === null) {
    return;
  }

  tearDownActive();
  ensureThumbAnchor(thumb);

  const video = document.createElement("video");
  video.className = VIDEO_CLASS;
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = PRELOAD_NONE;
  video.setAttribute("aria-hidden", "true");

  const onError = (): void => {
    failedPostIds.set(postId, Date.now());
    if (activePreview?.video === video) {
      tearDownActive();
    } else {
      video.removeEventListener("error", onError);
      video.pause();
      video.src = "";
      video.load();
      video.remove();
    }
  };
  video.addEventListener("error", onError);

  video.src = videoUrl;
  link.after(video);
  placeOverImage(video, thumb, img);
  activePreview = { thumb, video, postId, onError };

  const playResult = video.play();
  if (playResult !== undefined) {
    void playResult.catch(() => {
      /* Autoplay may reject; media `error` handles real load failures. */
    });
  }
}

function onThumbPointerEnter(event: Event): void {
  const thumb = event.currentTarget;
  if (!(thumb instanceof HTMLElement)) {
    return;
  }
  const postId = readPostId(thumb);
  if (postId === null || failedRecently(postId)) {
    return;
  }
  if (findWebmThumbImage(thumb) === null) {
    return;
  }
  clearHoverTimer();
  hoverThumb = thumb;
  hoverTimerId = window.setTimeout(() => {
    hoverTimerId = null;
    if (hoverThumb !== thumb) {
      return;
    }
    startPreview(thumb);
  }, HOVER_DELAY_MS);
}

function onThumbPointerLeave(event: Event): void {
  const thumb = event.currentTarget;
  if (!(thumb instanceof HTMLElement)) {
    return;
  }
  if (hoverThumb === thumb) {
    hoverThumb = null;
  }
  clearHoverTimer();
  if (activePreview?.thumb === thumb) {
    tearDownActive();
  }
}

function bindThumb(thumb: HTMLElement): void {
  if (boundThumbGeneration.get(thumb) === bindGeneration) {
    return;
  }
  if (findWebmThumbImage(thumb) === null) {
    return;
  }
  boundThumbGeneration.set(thumb, bindGeneration);
  thumb.addEventListener("pointerenter", onThumbPointerEnter);
  thumb.addEventListener("pointerleave", onThumbPointerLeave);
}

function bindThumbsInRoot(root: ParentNode): void {
  const thumbs = root.querySelectorAll(THUMBS_SELECTOR);
  for (const thumb of thumbs) {
    if (thumb instanceof HTMLElement) {
      bindThumb(thumb);
    }
  }
}

function startBindings(): void {
  if (started) {
    return;
  }
  started = true;
  bindThumbsInRoot(document);
  unsubscribeThumbsAdded = onThumbsAdded((root) => {
    bindThumbsInRoot(root);
  });
}

/** Clears timers, active video, failed ids, and thumbs bus (tests). */
export function resetVideoPreviewRuntimeState(): void {
  clearHoverTimer();
  hoverThumb = null;
  tearDownActive();
  failedPostIds.clear();
  if (unsubscribeThumbsAdded !== undefined) {
    unsubscribeThumbsAdded();
    unsubscribeThumbsAdded = undefined;
  }
  started = false;
  bindGeneration += 1;
}

function mountVideoPreview(ctx: FeatureContext): void {
  if (ctx.pageKind === "other" && !isCommentsPage()) {
    return;
  }
  scheduleAfterFirstPaint(() => {
    startBindings();
  });
}

export const videoPreviewFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: false,
  settingsCaption: VIDEO_PREVIEW_SETTING_CAPTION,
  css: FEATURE_CSS,
  mount: mountVideoPreview,
};

export { HOVER_DELAY_MS, RETRY_AFTER_MS, VIDEO_CLASS, WEBM_PREVIEW_SELECTOR };
