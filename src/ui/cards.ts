import {
  CSS_CLASS,
  DOCUMENT_STYLE_ID,
} from "../config/constants";
import { onThumbsAdded } from "../features/runtime";
import { detectPageKind } from "../site/pages";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import { BASE_GRID_CSS, ensureThumbAnchor } from "../site/thumb";
import { isFav } from "../storage/favs";
import { getGridFavButtonsEnabled } from "../storage/store";
import { createFavButton, KIT_ICON_BUTTON_CLASS } from "./fav-button";
import { ICON_BUTTON_CSS } from "./kit/icon-button";
import { CARD_CSS } from "./document-chrome-css";

let unsubscribeThumbsAdded: (() => void) | undefined;

/**
 * Document overlays for preview badges + feed bar (mock layout 1).
 * Appended after CARD_CSS so hover-only visibility wins over marked-always-visible.
 */
const DOCUMENT_OVERLAY_CSS = `
${ICON_BUTTON_CSS}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending} {
  opacity: 0;
}

.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav},
.${CSS_CLASS.cardFav}:focus-visible {
  opacity: 0.65;
}

.${CSS_CLASS.thumb} .${CSS_CLASS.cardFav}:hover,
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked}:focus-visible,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError}:focus-visible,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending}:focus-visible {
  opacity: 1;
}

.${CSS_CLASS.cardFav}.rdw-icon-btn {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid rgba(0, 0, 0, 0.13);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  color: #1c2228;
  font-size: 13px;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked}.rdw-icon-btn {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
}

.${CSS_CLASS.updatesBar} {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.${CSS_CLASS.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.hint} {
  margin: 0;
  font-weight: 700;
  font-size: 12px;
  color: var(--rdw-text);
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton} {
  margin-left: auto;
  background: var(--rdw-accent);
  border: 1px solid var(--rdw-accent);
  border-radius: 8px;
  height: 28px;
  min-height: 28px;
  padding: 0 12px;
  font-weight: 600;
  font-size: 12px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.secondaryButton} {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--rdw-border);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  border-radius: 8px;
  height: 28px;
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.secondaryButton}:focus-visible,
.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`;

function ensureThumbsAddedSubscription(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    return;
  }
  unsubscribeThumbsAdded = onThumbsAdded((root) => {
    mountCards(root);
  });
}

/** Clears the thumbs-added subscription (tests). */
export function resetCardsRuntimeState(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    unsubscribeThumbsAdded();
    unsubscribeThumbsAdded = undefined;
  }
}

export function ensureDocumentStyles(): void {
  if (document.getElementById(DOCUMENT_STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = DOCUMENT_STYLE_ID;
  style.textContent = `${BASE_GRID_CSS}\n${CARD_CSS}\n${DOCUMENT_OVERLAY_CSS}`;
  document.head.append(style);
}

function findThumbLink(thumb: HTMLElement, postId: string): HTMLAnchorElement | null {
  const byId = thumb.querySelector(`#p${postId}`);
  if (byId instanceof HTMLAnchorElement) {
    return byId;
  }
  const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
  return byHref instanceof HTMLAnchorElement ? byHref : null;
}

function attachFavButton(thumb: HTMLElement, postId: string, marked: boolean): void {
  if (thumb.querySelector(SITE_SELECTORS.cardFavButton) !== null) {
    return;
  }

  const link = findThumbLink(thumb, postId);
  if (link === null) {
    return;
  }

  ensureThumbAnchor(thumb);
  const button = createFavButton(postId, marked);
  button.classList.add(KIT_ICON_BUTTON_CLASS);
  link.after(button);
}

function applyGridFavVisibilityClass(visible: boolean): void {
  document.body.classList.toggle(CSS_CLASS.gridFavsHidden, !visible);
}

export function setGridFavButtonsVisible(visible: boolean): void {
  applyGridFavVisibilityClass(visible);
  if (visible && detectPageKind(window.location.search) === "list") {
    mountCards();
  }
}

export function mountCards(
  root: ParentNode = document,
  search: string = window.location.search,
): void {
  ensureThumbsAddedSubscription();

  if (detectPageKind(search) !== "list") {
    return;
  }

  ensureDocumentStyles();
  const enabled = getGridFavButtonsEnabled();
  applyGridFavVisibilityClass(enabled);
  if (!enabled) {
    return;
  }

  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);

  for (const thumb of thumbs) {
    if (!(thumb instanceof HTMLElement)) {
      continue;
    }
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    const marked = isFav(postId);
    attachFavButton(thumb, postId, marked);
  }
}
