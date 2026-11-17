import { RDW_SKIN_CLASS } from "../config/constants";
import {
  FAVORITE_IMAGE_ANCHOR_NAME,
  FAVORITES_PAGE_CLASS,
  THUMB_ANCHOR_NAME,
  THUMB_LABEL_INSET_PX,
  THUMB_LABEL_RULES,
  VIDEO_THUMB_CLASS,
  featureBodyClass,
  type Feature,
} from "./types";

/**
 * How a video is told from a picture in a grid: a play sign in a small plate
 * on the thumbnail, the same plate "GIF" has, in place of the frame around
 * it. A frame is told by its colour alone and reads as a focus ring or as a
 * selection (the designer, 17.11.2026). Kaze asked for it as a choice: with
 * the switch off the frame is back.
 *
 * Styles only, and in the script's own themes only: in Site default and Site
 * dark the thumbnails keep the site's own frame whatever the switch says.
 * Which thumbs are videos is marked by site/video-thumbs.ts.
 */

export const VIDEO_MARK_FEATURE_ID = "video-mark";
const FEATURE_LABEL = "Play icon on video thumbnails";
const FEATURE_CAPTION =
  "Off: a frame around the thumbnail instead. In the site's own themes the site's frame stays.";
const BODY_CLASS = featureBodyClass(VIDEO_MARK_FEATURE_ID);
const SCOPE = `html.${RDW_SKIN_CLASS} body.${BODY_CLASS}`;
/** A play sign in its text form: without the selector some systems draw a picture. */
const VIDEO_LABEL = "\\25B6\\FE0E";

const VIDEO_MARK_CSS = `
${SCOPE} .${VIDEO_THUMB_CLASS} > a > img,
${SCOPE} .webm-thumb {
  border: 0;
}
${SCOPE} .${VIDEO_THUMB_CLASS}::after {
  content: "${VIDEO_LABEL}";${THUMB_LABEL_RULES}
}
@supports (anchor-name: --a) {
  ${SCOPE} .${VIDEO_THUMB_CLASS}::after {
    position-anchor: ${THUMB_ANCHOR_NAME};
    left: calc(anchor(left) + ${String(THUMB_LABEL_INSET_PX)}px);
    bottom: calc(anchor(bottom) + ${String(THUMB_LABEL_INSET_PX)}px);
  }
  html.${FAVORITES_PAGE_CLASS}.${RDW_SKIN_CLASS} body.${BODY_CLASS} .${VIDEO_THUMB_CLASS}::after {
    position-anchor: ${FAVORITE_IMAGE_ANCHOR_NAME};
  }
}
`.trim();

export const videoMarkFeature: Feature = {
  id: VIDEO_MARK_FEATURE_ID,
  label: FEATURE_LABEL,
  pages: ["list", "favorites", "other"],
  defaultEnabled: true,
  cssOnly: true,
  settingsCaption: FEATURE_CAPTION,
  css: VIDEO_MARK_CSS,
  mount: () => undefined,
};
