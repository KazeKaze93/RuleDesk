import { findOriginalAnchor, IMAGE_ID } from "./post-panel/site-reads";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

/**
 * A post that is an animated GIF moves on its page.
 *
 * The site puts a still, scaled-down copy on the page
 * (`/samples/…/sample_<hash>.jpg`) and keeps the GIF itself behind the
 * "Original image" link, so nothing moves until the original is opened. Here
 * the picture of the page is pointed at the original. The size the site gave
 * the picture stays, so the page does not jump.
 *
 * The one thing this asks the site for is the GIF itself, the file of the
 * post the user has opened.
 */

const FEATURE_ID = "gif-post";
const FEATURE_LABEL = "Play GIFs on the post page";
const GIF_PATH = /\.gif$/i;
export const GIF_PLAYING_ATTRIBUTE = "data-rdw-gif";

function pathOf(url: string): string {
  try {
    return new URL(url, window.location.href).pathname;
  } catch {
    return url;
  }
}

/** True when the address ends in `.gif`, whatever follows the question mark. */
export function isGifUrl(url: string): boolean {
  return GIF_PATH.test(pathOf(url));
}

/**
 * Points the picture of the page at the original GIF. Returns true when it
 * did: the original is a GIF and the picture shows something else.
 */
export function playGifOnPage(root: ParentNode = document, originalHref?: string): boolean {
  const image = root.querySelector(`img#${IMAGE_ID}`);
  const original = originalHref ?? findOriginalAnchor()?.href ?? "";
  if (!(image instanceof HTMLImageElement) || !isGifUrl(original)) {
    return false;
  }
  if (isGifUrl(image.currentSrc || image.src)) {
    return false;
  }
  image.setAttribute(GIF_PLAYING_ATTRIBUTE, "");
  image.src = original;
  return true;
}

function mountGifPost(_ctx: FeatureContext): void {
  if (document.body.classList.contains(featureBodyClass(FEATURE_ID))) {
    playGifOnPage();
  }
}

export const gifPostFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: ["post"],
  defaultEnabled: true,
  settingsCaption:
    "The site shows a still copy of a GIF until its original is opened. With this on, the original is loaded at once.",
  css: "",
  mount: mountGifPost,
};
