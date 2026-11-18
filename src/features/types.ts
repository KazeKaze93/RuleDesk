import type { PageKind } from "../site/pages";

export const THUMB_CLASS = "rdw-thumb";
/**
 * On <html> on the site's Favorites page, set before the first paint. The
 * skin rules for a favorites cell are held to it: the pool page has thumbs
 * of a similar shape, and their links carry an onclick too.
 */
export const FAVORITES_PAGE_CLASS = "rdw-page-favorites";
export const THUMB_ANCHOR_NAME = "--rdw-img";
/**
 * Anchor of a favorites picture. Its scope is the whole cell and comes from
 * the stylesheet, so it is there from the first layout; the buttons of a
 * favorites thumb are placed by it.
 */
export const FAVORITE_IMAGE_ANCHOR_NAME = "--rdw-fav-img";

export const FEATURE_STYLE_ID_PREFIX = "rdw-feature-style-";
export const POST_ACTIONS_ID = "rdw-post-actions";

export function featureBodyClass(id: string): string {
  return `rdw-f-${id}`;
}

export function featureChoiceBodyClass(id: string, value: string): string {
  return `rdw-f-${id}-${value}`;
}

export type FeatureStateParse<T> = (raw: unknown) => T;

export type FeatureContext = {
  pageKind: PageKind;
  search: string;
  getState: <T>(parse: FeatureStateParse<T>) => T;
  setState: (value: unknown) => void;
};

export type FeatureChoiceOption = {
  value: string;
  label: string;
};

export type FeatureChoice = {
  options: FeatureChoiceOption[];
  defaultValue: string;
  /** Select label when the feature also shows an enable Switch (defaults to feature.label). */
  label?: string;
};

export type Feature = {
  id: string;
  label: string;
  pages: PageKind[];
  defaultEnabled: boolean;
  css: string;
  /** Live toggle via body class + CSS only; mount runs at most once per page load. */
  cssOnly?: boolean;
  choice?: FeatureChoice;
  /** Optional hint under the settings Switch (e.g. video-preview bandwidth note). */
  settingsCaption?: string;
  /** Forget the saved feature state whenever its settings Switch is flipped. */
  resetStateOnToggle?: boolean;
  mount: (ctx: FeatureContext) => void;
};

/**
 * On the element around the link of a video thumb (site/video-thumbs.ts puts
 * it there). Kept here, in a module that imports nothing, because both the
 * marking and the feature that draws the mark need it.
 */
export const VIDEO_THUMB_CLASS = "rdw-video-thumb";
/** How far a label on a thumb stands from the corner of the picture. */
export const THUMB_LABEL_INSET_PX = 6;
/** How a label on a thumb looks: "GIF", and the play sign of a video. */
export const THUMB_LABEL_RULES = `
  position: absolute;
  left: ${String(THUMB_LABEL_INSET_PX)}px;
  bottom: ${String(THUMB_LABEL_INSET_PX)}px;
  z-index: 2;
  padding: 1px 5px;
  border: 1px solid var(--rdw-border);
  border-radius: 4px;
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 700 10px/1.4 var(--rdw-font);
  letter-spacing: 0.04em;
  pointer-events: none;`;

/**
 * Names the start of the page needs before the features are loaded: whether
 * the Favorites page opens narrowed (and the site's own grid must not be
 * shown for the moment it takes to read the local list). Kept here, in a
 * module that imports nothing, so that the start stays small.
 */
/** On <body> while the script's own grid of favorites stands in place of the site's. */
export const FAVORITES_BROWSING_BODY_CLASS = "rdw-fav-browsing";
/** On the script's own grid of favorites. */
export const FAVORITES_RESULTS_CLASS = "rdw-fav-results";
/** Feature state: how Favorites is paged. */
export const FAVORITES_VIEW_STATE_ID = "favorites-view";
export const FAVORITES_VIEW_SCROLL = "scroll";
/** Feature state: AI posts shown or hidden, by the part of the site. */
export const AI_STATE_ID = "ai-posts";
export const AI_STATE_ALL = "all";
export const AI_STATE_HIDE = "hide";
export const AI_SCOPE_FAVORITES = "favorites";
