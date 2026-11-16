import { SITE_SELECTORS } from "../site/selectors";
import { getFeatureState, setFeatureState } from "../storage/store";
import { SEEN_CLASS, ensureSeenStamps } from "./grid-marks";

/**
 * "Hide seen posts": a switch in the search panel that takes the posts you
 * have already opened out of the grid. It only hides: nothing is requested and
 * nothing in the page is removed, so switching it off brings them back.
 */

export const HIDE_SEEN_STATE_ID = "hide-seen";
export const HIDE_SEEN_BODY_CLASS = "rdw-hide-seen";
const STYLE_ID = "rdw-hide-seen-style";

export const HIDE_SEEN_CSS = `
body.${HIDE_SEEN_BODY_CLASS} ${SITE_SELECTORS.thumb}.${SEEN_CLASS} {
  display: none !important;
}
`.trim();

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = HIDE_SEEN_CSS;
  document.head.append(style);
}

export function isHideSeen(): boolean {
  return getFeatureState(HIDE_SEEN_STATE_ID) === true;
}

/** Puts the page in step with the switch. The seen marks are stamped on the thumbs first. */
export function applyHideSeen(on: boolean): void {
  if (on) {
    ensureStyle();
    ensureSeenStamps();
  }
  document.body.classList.toggle(HIDE_SEEN_BODY_CLASS, on);
}

export function setHideSeen(on: boolean): void {
  setFeatureState(HIDE_SEEN_STATE_ID, on);
  applyHideSeen(on);
}

/** How many posts of the page are hidden right now. */
export function countHiddenSeen(root: ParentNode = document): number {
  if (!document.body.classList.contains(HIDE_SEEN_BODY_CLASS)) {
    return 0;
  }
  return root.querySelectorAll(`${SITE_SELECTORS.thumb}.${SEEN_CLASS}`).length;
}
