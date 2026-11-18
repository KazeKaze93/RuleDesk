import { isGifUrl } from "./gif-post";
import { findOriginalAnchor, IMAGE_ID } from "./post-panel/site-reads";
import { POST_ACTIONS_ID, featureBodyClass, type Feature, type FeatureContext } from "./types";

/**
 * The picture of a post in its full size (the designer's variant C,
 * 18.11.2026; a request Kaze agreed to the same day).
 *
 * The site puts a scaled-down copy on the page, some 850 px wide, and keeps
 * the file itself behind the "Original image" link. With this on, the file is
 * loaded and put in place of the copy: sharper, and as wide as the room
 * between the columns lets it be, never wider than it is. It is off unless
 * turned on: an original is often several megabytes.
 *
 * The copy stays on the page until the original has come whole, so nothing is
 * blank meanwhile and the page changes once. Beside the panel the block of the
 * picture gives way, not the panel: the row is kept from wrapping, or a wide
 * original would push the panel under itself. The one thing asked of the site
 * is the file of the post the user has opened, and it is asked once.
 */

const FEATURE_ID = "full-image";
const FEATURE_LABEL = "Load full-size image";
const FEATURE_CAPTION =
  "Sharper and larger, but the page opens slower: originals are often several MB.";
/** On the picture once it shows the original. */
export const FULL_IMAGE_ATTRIBUTE = "data-rdw-full";
/** What an original has to be for this: a still picture. A GIF is the other feature's. */
const STILL_PATH = /\.(?:jpe?g|png|webp|bmp)$/i;
/** As in post-actions.ts: from this width the panel stands beside the picture. */
const WIDE_MEDIA_QUERY = "(min-width: 1100px)";

const BODY_SELECTOR = `body.${featureBodyClass(FEATURE_ID)}`;
const FULL_SELECTOR = `img#${IMAGE_ID}[${FULL_IMAGE_ATTRIBUTE}]`;

const FEATURE_CSS = `
${BODY_SELECTOR} ${FULL_SELECTOR} {
  width: auto !important;
  height: auto !important;
  max-width: 100%;
}
@media ${WIDE_MEDIA_QUERY} {
  ${BODY_SELECTOR} div#post-view > div#right-col {
    flex-grow: 1;
    min-width: 0;
  }
  ${BODY_SELECTOR} div.flexi:has(${FULL_SELECTOR}) {
    flex-wrap: nowrap;
  }
  ${BODY_SELECTOR} div.flexi > :has(${FULL_SELECTOR}) {
    flex: 0 1 auto;
    min-width: 0;
  }
  ${BODY_SELECTOR} div.flexi:has(${FULL_SELECTOR}) > #${POST_ACTIONS_ID} {
    flex-shrink: 0;
  }
}
`.trim();

function pathOf(url: string): string {
  try {
    return new URL(url, window.location.href).pathname;
  } catch {
    return url;
  }
}

/**
 * The address of the original when it is worth loading: a still picture, and
 * not the one the page already shows. Null otherwise.
 */
export function fullImageUrl(image: HTMLImageElement, originalHref: string): string | null {
  if (originalHref.length === 0 || isGifUrl(originalHref)) {
    return null;
  }
  const path = pathOf(originalHref);
  if (!STILL_PATH.test(path) || pathOf(image.currentSrc || image.src) === path) {
    return null;
  }
  return originalHref;
}

/**
 * Loads the original beside the page and, once it has come, shows it in place
 * of the copy. Returns true when the loading was started.
 */
export function loadFullImage(root: ParentNode = document, originalHref?: string): boolean {
  const image = root.querySelector(`img#${IMAGE_ID}`);
  if (!(image instanceof HTMLImageElement)) {
    return false;
  }
  const url = fullImageUrl(image, originalHref ?? findOriginalAnchor()?.href ?? "");
  if (url === null) {
    return false;
  }
  const loader = new Image();
  loader.addEventListener("load", () => {
    // The page may have put another picture there meanwhile; the copy stays then.
    if (!image.isConnected) {
      return;
    }
    image.setAttribute(FULL_IMAGE_ATTRIBUTE, "");
    image.src = url;
  });
  // A failed load leaves the copy as it is: nothing to show and nothing to undo.
  loader.src = url;
  return true;
}

function mountFullImage(_ctx: FeatureContext): void {
  if (document.body.classList.contains(featureBodyClass(FEATURE_ID))) {
    loadFullImage();
  }
}

export const fullImageFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: ["post"],
  defaultEnabled: false,
  settingsCaption: FEATURE_CAPTION,
  css: FEATURE_CSS,
  mount: mountFullImage,
};
