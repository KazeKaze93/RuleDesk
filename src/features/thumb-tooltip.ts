import { SITE_SELECTORS } from "../site/selectors";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

/**
 * Hides the browser tooltip with the full tag list that shows when the pointer
 * rests on a thumbnail.
 *
 * The tooltip is the `title` of `img.preview`. The attribute stays: the site's
 * scripts and this script read tags from it, and nothing inside `a#p{ID}` is
 * changed. Instead the image stops taking the pointer, so the hovered element
 * is the link around it, which has no title. A click lands on the link as
 * before.
 */

const FEATURE_ID = "thumb-tooltip";
const FEATURE_LABEL = "Hide tag tooltip on thumbnails";
const FEATURE_PAGES = ["list", "favorites"] as const;

const BODY_CLASS = featureBodyClass(FEATURE_ID);
/** Added when the site lays the thumb link out inline (see mount). */
export const THUMB_TOOLTIP_INLINE_CLASS = `${BODY_CLASS}-inline`;

const DISPLAY_INLINE = "inline";
const THUMB_LINK_SELECTOR = `${SITE_SELECTORS.thumb} > a:not([onclick])`;

const FEATURE_CSS = `
body.${BODY_CLASS} ${SITE_SELECTORS.thumb} > a > ${SITE_SELECTORS.previewImage} {
  pointer-events: none;
}
body.${BODY_CLASS}.${THUMB_TOOLTIP_INLINE_CLASS} ${THUMB_LINK_SELECTOR} {
  display: inline-block;
}
`.trim();

/**
 * An inline link does not cover its image for hit-testing, so with the image
 * out of the way a click would miss the link. Such a link becomes an
 * inline-block, which wraps the image.
 */
function mountThumbTooltip(_ctx: FeatureContext): void {
  const link = document.querySelector(THUMB_LINK_SELECTOR);
  if (link === null) {
    return;
  }
  if (window.getComputedStyle(link).display === DISPLAY_INLINE) {
    document.body.classList.add(THUMB_TOOLTIP_INLINE_CLASS);
  }
}

export const thumbTooltipFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  cssOnly: true,
  mount: mountThumbTooltip,
};
