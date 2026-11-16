import { log } from "../log";
import { load, reloadFromStorage, setPostSeenMark } from "../storage/store";
import { readPostIdFromSearch } from "../site/pages";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import { onThumbsAdded } from "./runtime";
import {
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const SEEN_DIM_FEATURE_ID = "seen-dim";
const SEEN_CLASS = "rdw-seen";
const SEEN_DIM_LABEL = "Dim seen posts";
const SEEN_DIM_OPACITY = "0.65";
const SEEN_DIM_HOVER_OPACITY = "1";
const EVENT_PAGESHOW = "pageshow";

let unsubscribeThumbsAdded: (() => void) | undefined;
let pageshowBound = false;

function stampSeenOnThumbs(root: ParentNode = document): void {
  const marks = load().marks;
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    if (!(thumb instanceof HTMLElement)) {
      continue;
    }
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    thumb.classList.toggle(SEEN_CLASS, marks[postId]?.seen === true);
  }
}

function onPageShow(event: PageTransitionEvent): void {
  if (!event.persisted) {
    return;
  }
  reloadFromStorage();
  stampSeenOnThumbs(document);
}

function ensureListSubscriptions(): void {
  if (unsubscribeThumbsAdded === undefined) {
    unsubscribeThumbsAdded = onThumbsAdded((root) => {
      stampSeenOnThumbs(root);
    });
  }
  if (!pageshowBound) {
    pageshowBound = true;
    window.addEventListener(EVENT_PAGESHOW, onPageShow);
  }
}

/** Clears thumbs/pageshow subscriptions (tests). */
export function resetSeenDimRuntimeState(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    unsubscribeThumbsAdded();
    unsubscribeThumbsAdded = undefined;
  }
  if (pageshowBound) {
    window.removeEventListener(EVENT_PAGESHOW, onPageShow);
    pageshowBound = false;
  }
}

function mountSeenDim(ctx: FeatureContext): void {
  if (ctx.pageKind === "post") {
    const postId = readPostIdFromSearch(ctx.search);
    if (postId === null) {
      log.warn("seen-dim: missing post id in search", ctx.search);
      return;
    }
    setPostSeenMark(postId);
    return;
  }

  if (ctx.pageKind !== "list") {
    return;
  }

  stampSeenOnThumbs(document);
  ensureListSubscriptions();
}

export const seenDimFeature: Feature = {
  id: SEEN_DIM_FEATURE_ID,
  label: SEEN_DIM_LABEL,
  pages: ["list", "post"],
  defaultEnabled: true,
  cssOnly: true,
  css: `
body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS} img.preview {
  opacity: ${SEEN_DIM_OPACITY};
}

body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS}:hover img.preview {
  opacity: ${SEEN_DIM_HOVER_OPACITY};
}
`,
  mount: mountSeenDim,
};
