import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HOVER_DELAY_MS,
  VIDEO_CLASS,
  resetVideoPreviewRuntimeState,
  videoPreviewFeature,
} from "../../src/features/video-preview";
import { thumbTooltipFeature } from "../../src/features/thumb-tooltip";
import type { FeatureContext } from "../../src/features/types";
import {
  TAGS_COLLAPSED_CLASS,
  TAGS_TOGGLE_CLASS,
  foldLongTagLists,
  isCommentsPage,
  mountCommentsPage,
} from "../../src/site/comments-page";
import { VIDEO_THUMB_CLASS } from "../../src/site/video-thumbs";

const POST_ID = "19298136";
const THUMB_URL = `https://wimg.rule34.xxx/thumbnails/1111/thumbnail_hash.jpg?${POST_ID}`;

function ctx(): FeatureContext {
  return {
    pageKind: "other",
    search: "",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

/** `div#comments > div#comment-list > div#p{ID}.post > [div.col1.thumb, div.col2]`. */
function buildPage(title: string, tagCount: number): { thumb: HTMLElement; tags: HTMLElement } {
  const comments = document.createElement("div");
  comments.id = "comments";
  const list = document.createElement("div");
  list.id = "comment-list";
  const post = document.createElement("div");
  post.id = `p${POST_ID}`;
  post.className = "post";
  const thumb = document.createElement("div");
  thumb.className = "col1 thumb";
  const link = document.createElement("a");
  link.href = "#";
  const img = document.createElement("img");
  img.className = "preview";
  img.src = THUMB_URL;
  img.title = title;
  link.append(img);
  thumb.append(link);
  const col2 = document.createElement("div");
  col2.className = "col2";
  const header = document.createElement("div");
  header.className = "header";
  const tags = document.createElement("div");
  tags.className = "tags";
  for (let index = 0; index < tagCount; index += 1) {
    const tag = document.createElement("span");
    tag.textContent = `tag_${String(index)}`;
    tags.append(tag);
  }
  header.append(document.createElement("div"), tags);
  col2.append(header);
  post.append(thumb, col2);
  list.append(post);
  comments.append(list);
  document.body.append(comments);
  return { thumb, tags };
}

function setHeights(element: HTMLElement, scrollHeight: number, clientHeight: number): void {
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
}

describe("comments page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetVideoPreviewRuntimeState();
    vi.useRealTimers();
    document.body.replaceChildren();
    document.head.replaceChildren();
  });

  it("is recognised by its markup and left alone elsewhere", () => {
    expect(isCommentsPage()).toBe(false);
    mountCommentsPage();
    expect(document.head.querySelector("style")).toBeNull();
    buildPage("1boy video", 2);
    expect(isCommentsPage()).toBe(true);
  });

  it("marks the preview cell of a video post, outside its link", () => {
    const video = buildPage("1boy 3d sound video watermark", 2);
    const before = video.thumb.querySelector("a")?.outerHTML;
    mountCommentsPage();
    expect(video.thumb.classList.contains(VIDEO_THUMB_CLASS)).toBe(true);
    expect(video.thumb.querySelector("a")?.outerHTML).toBe(before);
  });

  it("folds a tag list that is taller than the folded height and opens it by the button", () => {
    const { tags } = buildPage("1girls", 120);
    setHeights(tags, 900, 54);
    expect(foldLongTagLists()).toBe(1);
    expect(tags.classList.contains(TAGS_COLLAPSED_CLASS)).toBe(true);
    const button = tags.nextElementSibling;
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("no toggle button after the tags");
    }
    expect(button.className).toBe(TAGS_TOGGLE_CLASS);
    expect(button.textContent).toBe("Show all 120 tags");

    button.click();
    expect(tags.classList.contains(TAGS_COLLAPSED_CLASS)).toBe(false);
    expect(button.textContent).toBe("Show fewer tags");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    button.click();
    expect(tags.classList.contains(TAGS_COLLAPSED_CLASS)).toBe(true);
    expect(button.textContent).toBe("Show all 120 tags");
  });

  it("leaves a tag list that fits as it is", () => {
    const { tags } = buildPage("1girls", 5);
    setHeights(tags, 36, 36);
    expect(foldLongTagLists()).toBe(0);
    expect(tags.classList.contains(TAGS_COLLAPSED_CLASS)).toBe(false);
    expect(tags.nextElementSibling).toBeNull();
  });

  it("plays the hover preview on a marked preview cell", () => {
    const { thumb } = buildPage("1boy video", 2);
    mountCommentsPage();
    videoPreviewFeature.mount(ctx());
    vi.runAllTimers();

    thumb.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    const video = thumb.querySelector(`video.${VIDEO_CLASS}`);
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("no preview video");
    }
    expect(video.src).toBe(
      `https://ws-cdn-video.rule34.xxx//images/1111/hash.mp4?${POST_ID}`,
    );
    expect(video.previousElementSibling).toBe(thumb.querySelector("a"));
  });

  it("gives no preview to a post that is not a video", () => {
    const { thumb } = buildPage("1girls solo", 2);
    mountCommentsPage();
    videoPreviewFeature.mount(ctx());
    vi.runAllTimers();
    thumb.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(thumb.querySelector("video")).toBeNull();
  });

  it("takes the tag tooltip off the comments previews too", () => {
    expect(thumbTooltipFeature.pages).toContain("other");
    expect(thumbTooltipFeature.css).toContain("div.col1.thumb > a > img {");
  });
});
