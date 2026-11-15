import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HOVER_DELAY_MS,
  RETRY_AFTER_MS,
  VIDEO_CLASS,
  VIDEO_PREVIEW_FEATURE_ID,
  VIDEO_PREVIEW_SETTING_CAPTION,
  resetVideoPreviewRuntimeState,
  videoPreviewFeature,
} from "../../src/features/video-preview";
import {
  notifyThumbsAdded,
  resetFeatureRuntimeState,
} from "../../src/features/runtime";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import {
  THUMB_IMAGE_HOST,
  VIDEO_CDN_ORIGIN,
} from "../../src/site/thumb";

const POST_ID_A = "101";
const POST_ID_B = "202";
const DIR_A = "1111";
const HASH_A = "hashaaaa";
const DIR_B = "2222";
const HASH_B = "hashbbbb";

function makeCtx(
  pageKind: FeatureContext["pageKind"] = "list",
): FeatureContext {
  return {
    pageKind,
    search: "?page=post&s=list&tags=test",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function thumbSrc(dir: string, hash: string, id: string): string {
  return `https://${THUMB_IMAGE_HOST}/thumbnails/${dir}/thumbnail_${hash}.jpg?${id}`;
}

function expectedVideoSrc(dir: string, hash: string, id: string): string {
  return `${VIDEO_CDN_ORIGIN}//images/${dir}/${hash}.mp4?${id}`;
}

function buildWebmThumb(
  postId: string,
  dir: string,
  hash: string,
): HTMLElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${postId}`;
  const link = document.createElement("a");
  link.id = `p${postId}`;
  link.href = `index.php?page=post&s=view&id=${postId}`;
  const img = document.createElement("img");
  img.className = "preview webm-thumb";
  img.src = thumbSrc(dir, hash, postId);
  link.append(img);
  thumb.append(link);
  return thumb;
}

function buildStillThumb(postId: string): HTMLElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${postId}`;
  const link = document.createElement("a");
  link.id = `p${postId}`;
  link.href = `index.php?page=post&s=view&id=${postId}`;
  const img = document.createElement("img");
  img.className = "preview";
  img.src = `https://${THUMB_IMAGE_HOST}/thumbnails/1/thumbnail_still.jpg?${postId}`;
  link.append(img);
  thumb.append(link);
  return thumb;
}

function mountFeature(): void {
  document.body.classList.add(featureBodyClass(VIDEO_PREVIEW_FEATURE_ID));
  videoPreviewFeature.mount(makeCtx());
  // scheduleAfterFirstPaint: rAF → setTimeout(0)
  vi.runAllTimers();
}

function dispatchPointer(target: EventTarget, type: "pointerenter" | "pointerleave"): void {
  target.dispatchEvent(new Event(type));
}

describe("videoPreviewFeature", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.replaceChildren();
    document.body.className = "";
    resetFeatureRuntimeState();
    resetVideoPreviewRuntimeState();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  afterEach(() => {
    resetVideoPreviewRuntimeState();
    resetFeatureRuntimeState();
    document.body.replaceChildren();
    document.body.className = "";
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("exports default-off feature with settings caption", () => {
    expect(videoPreviewFeature.id).toBe(VIDEO_PREVIEW_FEATURE_ID);
    expect(videoPreviewFeature.label).toBe("Video preview on hover");
    expect(videoPreviewFeature.defaultEnabled).toBe(false);
    expect(VIDEO_PREVIEW_SETTING_CAPTION).toBe(
      "Each preview loads the video file itself.",
    );
  });

  it("uses a 200ms hover delay", () => {
    expect(HOVER_DELAY_MS).toBe(200);
  });

  it("does not create video before the hover delay", () => {
    const thumb = buildWebmThumb(POST_ID_A, DIR_A, HASH_A);
    document.body.append(thumb);
    mountFeature();

    dispatchPointer(thumb, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS - 1);
    expect(document.querySelector(`video.${VIDEO_CLASS}`)).toBeNull();
  });

  it("places muted looping video as sibling of a#p{ID} after delay", () => {
    const thumb = buildWebmThumb(POST_ID_A, DIR_A, HASH_A);
    document.body.append(thumb);
    mountFeature();

    dispatchPointer(thumb, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);

    const link = thumb.querySelector(`#p${POST_ID_A}`);
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    const video = thumb.querySelector(`video.${VIDEO_CLASS}`);
    expect(video).toBeInstanceOf(HTMLVideoElement);
    if (!(video instanceof HTMLVideoElement) || link === null) {
      return;
    }
    expect(video.previousElementSibling).toBe(link);
    expect(link.contains(video)).toBe(false);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.preload).toBe("none");
    expect(video.getAttribute("playsinline")).toBe("");
    expect(video.src).toBe(expectedVideoSrc(DIR_A, HASH_A, POST_ID_A));
    expect(videoPreviewFeature.css).toContain("pointer-events: none");
  });

  it("puts the video over the image by measured numbers, not by the size of the cell", () => {
    const thumb = buildWebmThumb(POST_ID_A, DIR_A, HASH_A);
    document.body.append(thumb);
    const img = thumb.querySelector("img");
    if (img === null) {
      throw new Error("no image");
    }
    // The cell is 250x250 at (782, 381); the image is smaller and lower in it.
    thumb.getBoundingClientRect = (): DOMRect => new DOMRect(782, 381, 250, 250);
    img.getBoundingClientRect = (): DOMRect => new DOMRect(790, 442, 234, 133);
    mountFeature();

    dispatchPointer(thumb, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    const video = thumb.querySelector(`video.${VIDEO_CLASS}`);
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("no preview video");
    }
    expect(video.style.top).toBe("61px");
    expect(video.style.left).toBe("8px");
    expect(video.style.width).toBe("234px");
    expect(video.style.height).toBe("133px");
  });

  it("tears down video on leave: pause, clear src, load, remove", () => {
    const thumb = buildWebmThumb(POST_ID_A, DIR_A, HASH_A);
    document.body.append(thumb);
    mountFeature();

    dispatchPointer(thumb, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    const video = thumb.querySelector(`video.${VIDEO_CLASS}`);
    expect(video).toBeInstanceOf(HTMLVideoElement);
    if (!(video instanceof HTMLVideoElement)) {
      return;
    }

    const pauseSpy = vi.spyOn(video, "pause");
    const loadSpy = vi.spyOn(video, "load");
    dispatchPointer(thumb, "pointerleave");

    expect(pauseSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
    expect(thumb.querySelector(`video.${VIDEO_CLASS}`)).toBeNull();
  });

  it("keeps only one active video across thumbs", () => {
    const thumbA = buildWebmThumb(POST_ID_A, DIR_A, HASH_A);
    const thumbB = buildWebmThumb(POST_ID_B, DIR_B, HASH_B);
    document.body.append(thumbA, thumbB);
    mountFeature();

    dispatchPointer(thumbA, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(thumbA.querySelector(`video.${VIDEO_CLASS}`)).not.toBeNull();

    dispatchPointer(thumbA, "pointerleave");
    dispatchPointer(thumbB, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);

    expect(thumbA.querySelector(`video.${VIDEO_CLASS}`)).toBeNull();
    expect(thumbB.querySelector(`video.${VIDEO_CLASS}`)).not.toBeNull();
    expect(document.querySelectorAll(`video.${VIDEO_CLASS}`)).toHaveLength(1);
  });

  it("on error removes the video, leaves the post alone for a while, then tries again", () => {
    const thumb = buildWebmThumb(POST_ID_A, DIR_A, HASH_A);
    document.body.append(thumb);
    mountFeature();

    dispatchPointer(thumb, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    const video = thumb.querySelector(`video.${VIDEO_CLASS}`);
    expect(video).toBeInstanceOf(HTMLVideoElement);
    if (!(video instanceof HTMLVideoElement)) {
      return;
    }
    video.dispatchEvent(new Event("error"));
    expect(thumb.querySelector(`video.${VIDEO_CLASS}`)).toBeNull();

    dispatchPointer(thumb, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(thumb.querySelector(`video.${VIDEO_CLASS}`)).toBeNull();
    dispatchPointer(thumb, "pointerleave");

    vi.advanceTimersByTime(RETRY_AFTER_MS);
    dispatchPointer(thumb, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(thumb.querySelector(`video.${VIDEO_CLASS}`)).toBeInstanceOf(HTMLVideoElement);
  });

  it("ignores non-webm thumbs and cancels pending preview on leave", () => {
    const still = buildStillThumb("303");
    const webm = buildWebmThumb(POST_ID_A, DIR_A, HASH_A);
    document.body.append(still, webm);
    mountFeature();

    dispatchPointer(still, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(document.querySelector(`video.${VIDEO_CLASS}`)).toBeNull();

    dispatchPointer(webm, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS - 1);
    dispatchPointer(webm, "pointerleave");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(document.querySelector(`video.${VIDEO_CLASS}`)).toBeNull();
  });

  it("binds thumbs added after mount via notifyThumbsAdded", () => {
    mountFeature();
    const thumb = buildWebmThumb(POST_ID_A, DIR_A, HASH_A);
    document.body.append(thumb);
    notifyThumbsAdded(document.body);

    dispatchPointer(thumb, "pointerenter");
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(thumb.querySelector(`video.${VIDEO_CLASS}`)).toBeInstanceOf(
      HTMLVideoElement,
    );
  });
});
