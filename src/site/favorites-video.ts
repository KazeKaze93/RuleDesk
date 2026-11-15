import { onThumbsAdded } from "../features/runtime";
import { SITE_SELECTORS } from "./selectors";

/**
 * Marks video posts on the favorites page.
 *
 * On a search page the site puts `webm-thumb` on the preview image of a video.
 * On the favorites page the image has no class at all; the only sign is its
 * `title`, the tag list. The site cuts the first and the last character off
 * that list, so `video` as the last tag arrives as `vide`.
 *
 * The mark is a class on `span.thumb`, outside `a#p{ID}`.
 */

export const VIDEO_THUMB_CLASS = "rdw-video-thumb";
/** The preview image of a favorites thumb: it has no class to select by. */
export const FAVORITE_IMAGE_SELECTOR = ":scope > a > img";

const VIDEO_TAG = "video";
/** `video` as the last tag of a title, after the site cut its last character. */
const VIDEO_TAG_CUT = "vide";
const TAG_SEPARATOR = /\s+/;

/** True when the tag list in a thumb `title` names the post a video. */
export function titleSaysVideo(title: string): boolean {
  const tags = title.trim().split(TAG_SEPARATOR);
  if (tags.includes(VIDEO_TAG)) {
    return true;
  }
  return tags[tags.length - 1] === VIDEO_TAG_CUT;
}

/** Marks the video thumbs under `root`; returns how many it marked. */
export function markFavoriteVideoThumbs(root: ParentNode): number {
  let marked = 0;
  for (const thumb of root.querySelectorAll(SITE_SELECTORS.thumb)) {
    const img = thumb.querySelector(FAVORITE_IMAGE_SELECTOR);
    if (!(img instanceof HTMLImageElement) || !titleSaysVideo(img.title)) {
      continue;
    }
    thumb.classList.add(VIDEO_THUMB_CLASS);
    marked += 1;
  }
  return marked;
}

/** Marks the thumbs on the page and those added to it later. */
export function mountFavoriteVideoMarks(): void {
  markFavoriteVideoThumbs(document);
  onThumbsAdded((root) => {
    markFavoriteVideoThumbs(root);
  });
}
