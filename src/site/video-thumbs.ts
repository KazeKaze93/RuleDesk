import { onThumbsAdded } from "./thumbs-bus";
import {
  FAVORITE_IMAGE_ANCHOR_NAME,
  FAVORITES_PAGE_CLASS,
  THUMB_ANCHOR_NAME,
  THUMB_CLASS,
  THUMB_LABEL_INSET_PX,
  THUMB_LABEL_RULES,
  VIDEO_THUMB_CLASS,
} from "../features/types";
import { SITE_SELECTORS } from "./selectors";
import { BASE_GRID_CSS } from "./thumb";

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

export { VIDEO_THUMB_CLASS };
/** The preview image of a thumb, whatever classes the page gave it. */
export const THUMB_IMAGE_SELECTOR = ":scope > a > img";

/** The class the site itself puts on the preview image of a video on a search page. */
const SITE_VIDEO_IMAGE_CLASS = "webm-thumb";
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
    if (
      !(img instanceof HTMLImageElement) ||
      !(img.classList.contains(SITE_VIDEO_IMAGE_CLASS) || titleSaysVideo(img.title))
    ) {
      continue;
    }
    // THUMB_CLASS is what the label of a video is placed by (see below).
    thumb.classList.add(THUMB_CLASS, VIDEO_THUMB_CLASS);
    marked += 1;
  }
  return marked;
}

/**
 * Marks the video thumbs on the page and those added to it later. On a
 * search page the site's own class on the image says which are videos; on
 * the favorites page only the tag list does.
 */
export function mountVideoMarks(thumbSelector: string = SITE_SELECTORS.thumb): void {
  markVideoThumbs(document, thumbSelector);
  onThumbsAdded((root) => {
    markVideoThumbs(root, thumbSelector);
  });
}

/** Favorites page: marks the thumbs on the page and those added to it later. */
export function mountFavoriteVideoMarks(): void {
  mountVideoMarks(SITE_SELECTORS.thumb);
}

/**
 * Animated GIFs get a small "GIF" label on the preview: the site marks them
 * only with the `animated_gif` tag, and nothing on a thumbnail tells them from
 * a still picture. The label is a pseudo-element of the thumb, outside the
 * link, placed against the picture by its anchor.
 */

export const GIF_THUMB_CLASS = "rdw-gif-thumb";
const GIF_TAG = "animated_gif";
/** The tag as the first or the last one of a favorites title, cut by the site. */
const GIF_TAG_CUT_START = "nimated_gif";
const GIF_TAG_CUT_END = "animated_gi";
const GIF_STYLE_ID = "rdw-gif-thumb-style";
const GIF_LABEL = "GIF";
const GIF_INSET_PX = THUMB_LABEL_INSET_PX;

export const GIF_THUMB_CSS = `
${BASE_GRID_CSS.trim()}
.${GIF_THUMB_CLASS}::after {
  content: "${GIF_LABEL}";${THUMB_LABEL_RULES}
}
@supports (anchor-name: --a) {
  .${GIF_THUMB_CLASS}::after {
    position-anchor: ${THUMB_ANCHOR_NAME};
    left: calc(anchor(left) + ${String(GIF_INSET_PX)}px);
    bottom: calc(anchor(bottom) + ${String(GIF_INSET_PX)}px);
  }
  html.${FAVORITES_PAGE_CLASS} .${GIF_THUMB_CLASS}::after {
    position-anchor: ${FAVORITE_IMAGE_ANCHOR_NAME};
  }
}
`.trim();

/** True when the tag list in a thumb `title` names the post an animated GIF. */
export function titleSaysGif(title: string): boolean {
  const tags = title.trim().split(TAG_SEPARATOR);
  return (
    tags.includes(GIF_TAG) ||
    tags[0] === GIF_TAG_CUT_START ||
    tags[tags.length - 1] === GIF_TAG_CUT_END
  );
}

/** Marks the GIF thumbs among the `thumbSelector` elements under `root`. */
export function markGifThumbs(root: ParentNode, thumbSelector: string): number {
  let marked = 0;
  for (const thumb of root.querySelectorAll(thumbSelector)) {
    const img = thumb.querySelector(THUMB_IMAGE_SELECTOR);
    if (!(img instanceof HTMLImageElement) || !titleSaysGif(img.title)) {
      continue;
    }
    // The class the anchor rules go by; the label is placed against the picture.
    thumb.classList.add(THUMB_CLASS, GIF_THUMB_CLASS);
    marked += 1;
  }
  return marked;
}

/** Marks the GIF thumbs on the page and those added to it later. */
export function mountGifMarks(thumbSelector: string): void {
  if (document.getElementById(GIF_STYLE_ID) === null) {
    const style = document.createElement("style");
    style.id = GIF_STYLE_ID;
    style.textContent = GIF_THUMB_CSS;
    document.head.append(style);
  }
  markGifThumbs(document, thumbSelector);
  onThumbsAdded((root) => {
    markGifThumbs(root, thumbSelector);
  });
}
