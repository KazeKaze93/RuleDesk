import { onThumbsAdded } from "../features/runtime";
import { SITE_SELECTORS } from "./selectors";

/**
 * Marks the previews of video posts where the site does not do it itself.
 *
 * On a search page the site puts `webm-thumb` on the preview image of a video.
 * On the favorites page the image has no class at all, and on the comments
 * page it is a plain `img.preview`; the only sign is its `title`, the tag
 * list. On the favorites page the site cuts the first and the last character
 * off that list, so `video` as the last tag arrives as `vide`.
 *
 * The mark is a class on the element around the link (`span.thumb`,
 * `div.col1.thumb`), outside the link itself.
 */

export const VIDEO_THUMB_CLASS = "rdw-video-thumb";
/** The preview image of a thumb, whatever classes the page gave it. */
export const THUMB_IMAGE_SELECTOR = ":scope > a > img";

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

/**
 * Marks the video thumbs among the `thumbSelector` elements under `root`;
 * returns how many it marked.
 */
export function markVideoThumbs(root: ParentNode, thumbSelector: string): number {
  let marked = 0;
  for (const thumb of root.querySelectorAll(thumbSelector)) {
    const img = thumb.querySelector(THUMB_IMAGE_SELECTOR);
    if (!(img instanceof HTMLImageElement) || !titleSaysVideo(img.title)) {
      continue;
    }
    thumb.classList.add(VIDEO_THUMB_CLASS);
    marked += 1;
  }
  return marked;
}

/** Favorites page: marks the thumbs on the page and those added to it later. */
export function mountFavoriteVideoMarks(): void {
  markVideoThumbs(document, SITE_SELECTORS.thumb);
  onThumbsAdded((root) => {
    markVideoThumbs(root, SITE_SELECTORS.thumb);
  });
}
