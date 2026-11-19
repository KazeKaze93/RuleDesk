import {
  isBlacklisted,
  onSiteBlacklistChange,
  readSiteBlacklist,
} from "../site/blacklist";
import { SITE_SELECTORS } from "../site/selectors";
import { onThumbsAdded } from "../site/thumbs-bus";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

const FEATURE_ID = "blacklist-hide";
const FEATURE_LABEL = "Hide blacklisted posts";
const FEATURE_PAGES = ["list"] as const;

const BODY_FEATURE_CLASS = featureBodyClass(FEATURE_ID);
const CLASS_BLACKLISTED = "rdw-blacklisted";

const SCORE_TOKEN_PREFIX = "score:";
const RATING_TOKEN_PREFIX = "rating:";
const WHITESPACE_SPLIT = /\s+/;

const FEATURE_CSS = `
body.${BODY_FEATURE_CLASS} span.thumb.${CLASS_BLACKLISTED} {
  display: none !important;
}
`.trim();

let unsubscribeThumbsAdded: (() => void) | undefined;
let unsubscribeBlacklistChange: (() => void) | undefined;

function parseAltTags(alt: string): string[] {
  const tags: string[] = [];
  for (const token of alt.trim().split(WHITESPACE_SPLIT)) {
    if (token.length === 0) {
      continue;
    }
    const lower = token.toLowerCase();
    if (
      lower.startsWith(SCORE_TOKEN_PREFIX) ||
      lower.startsWith(RATING_TOKEN_PREFIX)
    ) {
      continue;
    }
    tags.push(token);
  }
  return tags;
}

function parseTitleRating(title: string): string {
  for (const token of title.trim().split(WHITESPACE_SPLIT)) {
    if (token.length === 0) {
      continue;
    }
    if (token.toLowerCase().startsWith(RATING_TOKEN_PREFIX)) {
      return token.slice(RATING_TOKEN_PREFIX.length);
    }
  }
  return "";
}

function applyBlacklistToThumb(
  thumb: Element,
  list: readonly string[],
): void {
  if (!(thumb instanceof HTMLElement)) {
    return;
  }
  const img = thumb.querySelector(SITE_SELECTORS.previewImage);
  const alt = img?.getAttribute("alt") ?? "";
  const title = img?.getAttribute("title") ?? "";
  const tags = parseAltTags(alt);
  const rating = parseTitleRating(title);
  const matched = isBlacklisted(tags, 0, rating, list);
  thumb.classList.toggle(CLASS_BLACKLISTED, matched);
}

function applyBlacklistToRoot(
  root: ParentNode,
  list: readonly string[] = readSiteBlacklist(),
): void {
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    applyBlacklistToThumb(thumb, list);
  }
}

function ensureSubscriptions(): void {
  if (unsubscribeThumbsAdded === undefined) {
    unsubscribeThumbsAdded = onThumbsAdded((root) => {
      applyBlacklistToRoot(root);
    });
  }
  if (unsubscribeBlacklistChange === undefined) {
    unsubscribeBlacklistChange = onSiteBlacklistChange((list) => {
      applyBlacklistToRoot(document, list);
    });
  }
}

/** Clears thumbs/blacklist subscriptions (tests). */
export function resetBlacklistHideRuntimeState(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    unsubscribeThumbsAdded();
    unsubscribeThumbsAdded = undefined;
  }
  if (unsubscribeBlacklistChange !== undefined) {
    unsubscribeBlacklistChange();
    unsubscribeBlacklistChange = undefined;
  }
}

function mountBlacklistHide(ctx: FeatureContext): void {
  if (ctx.pageKind !== "list") {
    return;
  }
  applyBlacklistToRoot(document);
  ensureSubscriptions();
}

export const blacklistHideFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  cssOnly: true,
  css: FEATURE_CSS,
  mount: mountBlacklistHide,
};
