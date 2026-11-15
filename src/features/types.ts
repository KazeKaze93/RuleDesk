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
