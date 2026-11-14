import { h, render } from "preact";

import { playlistsContaining } from "../storage/store";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import { ensureThumbAnchor } from "../site/thumb";
import { CollectionPicker } from "../ui/collection-picker";
import { KIT_ICON_BUTTON_CLASS } from "../ui/fav-button";
import { THUMB_CLASS, featureBodyClass, type Feature, type FeatureContext } from "./types";
import { onThumbsAdded } from "./runtime";

const FEATURE_ID = "playlist-menu";
const FEATURE_LABEL = "Add to collection button";
const FEATURE_PAGES = ["list", "post"] as const;

const CLASS_ADD = "rdw-playlist-add";
const CLASS_ADD_IN = "rdw-playlist-add--in";
const CLASS_MENU = "rdw-playlist-menu";
const CLASS_MENU_POPUP = "rdw-playlist-menu--popup";

const ATTR_POST_ID = "data-rdw-post-id";

const TEXT_ADD_GLYPH = "+";

const LABEL_ADD = "Add to collection";

const MENU_Z_INDEX = 2147483645;
const MENU_WIDTH_PX = 260;
const MENU_PADDING_PX = 8;
const MENU_GAP_PX = 4;
const BUTTON_SIZE_PX = 28;
const BUTTON_OFFSET_PX = 6;
const BUTTON_BELOW_FAV_TOP_PX = BUTTON_OFFSET_PX + BUTTON_SIZE_PX + 4;

const FOCUS_OUTLINE = "2px solid #4c8bf5";
const FOCUS_OUTLINE_OFFSET = "2px";

const EVENT_KEYDOWN = "keydown";
const EVENT_POINTERDOWN = "pointerdown";
const KEY_ESCAPE = "Escape";

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_CLASS}`;

const FEATURE_CSS = `
${BODY_SELECTOR} .${CLASS_ADD} {
  position: absolute;
  top: ${String(BUTTON_BELOW_FAV_TOP_PX)}px;
  right: ${String(BUTTON_OFFSET_PX)}px;
  position-anchor: --rdw-img;
  top: calc(anchor(top) + ${String(BUTTON_BELOW_FAV_TOP_PX)}px);
  right: calc(anchor(right) + ${String(BUTTON_OFFSET_PX)}px);
  z-index: 5;
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: ${String(BUTTON_SIZE_PX)}px;
  min-height: ${String(BUTTON_SIZE_PX)}px;
  width: ${String(BUTTON_SIZE_PX)}px;
  height: ${String(BUTTON_SIZE_PX)}px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.13);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.93);
  color: #1c2228;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
}
${BODY_SELECTOR} .${THUMB_CLASS}:hover .${CLASS_ADD},
${BODY_SELECTOR} .${CLASS_ADD}:focus-visible {
  opacity: 0.65;
}
${BODY_SELECTOR} .${THUMB_CLASS} .${CLASS_ADD}:hover,
${BODY_SELECTOR} .${CLASS_ADD}:focus-visible {
  opacity: 1;
}
${BODY_SELECTOR} .${CLASS_ADD}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR} .${CLASS_ADD}.${CLASS_ADD_IN} {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
}
${BODY_SELECTOR} .${CLASS_MENU} {
  box-sizing: border-box;
  width: ${String(MENU_WIDTH_PX)}px;
  max-width: calc(100vw - ${String(MENU_GAP_PX * 2)}px);
  padding: ${String(MENU_PADDING_PX)}px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
${BODY_SELECTOR} .${CLASS_MENU}.${CLASS_MENU_POPUP} {
  position: fixed;
  z-index: ${String(MENU_Z_INDEX)};
  box-shadow: var(--rdw-shadow-2);
}
`;

type OpenPopup = {
  menu: HTMLElement;
  trigger: HTMLElement;
  postId: number;
};

/** Reads a non-empty thumb URL at the moment of add, or null when none is known. */
type ThumbUrlReader = () => string | null;

const NO_THUMB_URL: ThumbUrlReader = () => null;

let unsubscribeThumbsAdded: (() => void) | undefined;
let openPopup: OpenPopup | null = null;
let escapeBound = false;
let pointerBound = false;

function parsePostId(value: string | null): number | null {
  if (value === null || value.length === 0) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const truncated = Math.trunc(parsed);
  return truncated < 0 ? null : truncated;
}

function postInAnyPlaylist(postId: number): boolean {
  return playlistsContaining(postId).length > 0;
}

function applyAddButtonState(button: HTMLButtonElement, postId: number): void {
  const inPlaylist = postInAnyPlaylist(postId);
  button.classList.toggle(CLASS_ADD_IN, inPlaylist);
  button.setAttribute("aria-pressed", inPlaylist ? "true" : "false");
  button.setAttribute("aria-label", `${LABEL_ADD} ${String(postId)}`);
}

function postAnchorSelector(postId: string): string {
  return `#p${postId}`;
}

function readImageAddress(img: HTMLImageElement): string | null {
  const current = img.currentSrc.trim();
  if (current.length > 0) {
    return current;
  }
  const attribute = img.getAttribute("src");
  if (attribute === null) {
    return null;
  }
  const trimmed = attribute.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed;
}

/**
 * Thumb URL from this post's `img.preview`.
 * A preview outside `a#p{id}` wins. The copy nested in the link is used only
 * when that is the only preview (rule34 puts `img.preview` inside the anchor).
 */
function readPreviewThumbUrl(thumb: HTMLElement, postId: string): string | null {
  const anchor = thumb.querySelector(postAnchorSelector(postId));
  const images = thumb.querySelectorAll(SITE_SELECTORS.previewImage);
  let nestedImage: HTMLImageElement | null = null;
  for (const node of images) {
    if (!(node instanceof HTMLImageElement)) {
      continue;
    }
    const nested = anchor instanceof Element && anchor.contains(node);
    if (nested) {
      if (nestedImage === null) {
        nestedImage = node;
      }
      continue;
    }
    const url = readImageAddress(node);
    if (url !== null) {
      return url;
    }
  }
  if (nestedImage === null) {
    return null;
  }
  return readImageAddress(nestedImage);
}

function readThumbUrlFromTrigger(button: HTMLElement): string | null {
  const postId = button.getAttribute(ATTR_POST_ID);
  if (postId === null || postId.length === 0) {
    return null;
  }
  const thumb = button.closest(SITE_SELECTORS.thumb);
  if (!(thumb instanceof HTMLElement)) {
    return null;
  }
  return readPreviewThumbUrl(thumb, postId);
}

function findThumbLink(thumb: HTMLElement, postId: string): HTMLAnchorElement | null {
  const byId = thumb.querySelector(postAnchorSelector(postId));
  if (byId instanceof HTMLAnchorElement) {
    return byId;
  }
  const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
  return byHref instanceof HTMLAnchorElement ? byHref : null;
}

function closeOpenMenu(): void {
  if (openPopup === null) {
    return;
  }
  render(null, openPopup.menu);
  openPopup.menu.remove();
  openPopup.trigger.setAttribute("aria-expanded", "false");
  openPopup = null;
  unbindGlobalCloseListeners();
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key !== KEY_ESCAPE) {
    return;
  }
  if (openPopup === null) {
    return;
  }
  event.preventDefault();
  closeOpenMenu();
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (openPopup === null) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }
  if (openPopup.menu.contains(target) || openPopup.trigger.contains(target)) {
    return;
  }
  closeOpenMenu();
}

function bindGlobalCloseListeners(): void {
  if (!escapeBound) {
    escapeBound = true;
    document.addEventListener(EVENT_KEYDOWN, onDocumentKeydown);
  }
  if (!pointerBound) {
    pointerBound = true;
    document.addEventListener(EVENT_POINTERDOWN, onDocumentPointerDown, true);
  }
}

function unbindGlobalCloseListeners(): void {
  if (escapeBound) {
    document.removeEventListener(EVENT_KEYDOWN, onDocumentKeydown);
    escapeBound = false;
  }
  if (pointerBound) {
    document.removeEventListener(EVENT_POINTERDOWN, onDocumentPointerDown, true);
    pointerBound = false;
  }
}

function positionMenuNear(menu: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  menu.style.visibility = "hidden";
  menu.style.left = "0";
  menu.style.top = "0";
  document.body.append(menu);
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;

  let left = rect.right - menuWidth;
  if (left < MENU_GAP_PX) {
    left = Math.min(rect.left, viewportWidth - menuWidth - MENU_GAP_PX);
  }
  left = Math.max(MENU_GAP_PX, Math.min(left, viewportWidth - menuWidth - MENU_GAP_PX));

  let top = rect.bottom + MENU_GAP_PX;
  if (top + menuHeight > viewportHeight - MENU_GAP_PX) {
    top = rect.top - menuHeight - MENU_GAP_PX;
  }
  if (top < MENU_GAP_PX) {
    top = MENU_GAP_PX;
  }

  menu.style.left = `${String(left)}px`;
  menu.style.top = `${String(top)}px`;
  menu.style.visibility = "";
}

function syncAddButtonsForPost(postId: number): void {
  const buttons = document.querySelectorAll(
    `button.${CLASS_ADD}[${ATTR_POST_ID}="${String(postId)}"]`,
  );
  for (const node of buttons) {
    if (!(node instanceof HTMLButtonElement)) {
      continue;
    }
    applyAddButtonState(node, postId);
  }
}

/**
 * Builds the collection menu for a post: a themed panel holding the shared
 * collection picker. Callers own placement; the list page keeps one open at a time.
 */
export function createPlaylistMenu(
  postId: number,
  options?: { onChange?: () => void; readThumbUrl?: ThumbUrlReader },
): HTMLElement {
  const root = document.createElement("div");
  root.className = CLASS_MENU;
  root.setAttribute("role", "menu");
  root.setAttribute(ATTR_POST_ID, String(postId));
  const onChange = options?.onChange;
  render(
    h(CollectionPicker, {
      postId,
      readThumbUrl: options?.readThumbUrl ?? NO_THUMB_URL,
      ...(onChange === undefined ? {} : { onChange }),
    }),
    root,
  );
  return root;
}

function openMenuForButton(button: HTMLButtonElement, postId: number): void {
  if (openPopup !== null && openPopup.trigger === button) {
    closeOpenMenu();
    return;
  }
  closeOpenMenu();

  const menu = createPlaylistMenu(postId, {
    onChange: (): void => {
      syncAddButtonsForPost(postId);
    },
    readThumbUrl: (): string | null => readThumbUrlFromTrigger(button),
  });
  menu.classList.add(CLASS_MENU_POPUP);
  positionMenuNear(menu, button);
  button.setAttribute("aria-expanded", "true");
  openPopup = { menu, trigger: button, postId };
  bindGlobalCloseListeners();
}

function attachAddButton(thumb: HTMLElement, postId: string): void {
  if (thumb.querySelector(`button.${CLASS_ADD}`) !== null) {
    return;
  }
  const numericId = parsePostId(postId);
  if (numericId === null) {
    return;
  }
  const link = findThumbLink(thumb, postId);
  if (link === null) {
    return;
  }

  ensureThumbAnchor(thumb);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${KIT_ICON_BUTTON_CLASS} ${CLASS_ADD}`;
  button.textContent = TEXT_ADD_GLYPH;
  button.setAttribute(ATTR_POST_ID, String(numericId));
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  applyAddButtonState(button, numericId);
  button.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    openMenuForButton(button, numericId);
  });
  link.after(button);
}

function stampPlaylistButtons(root: ParentNode = document): void {
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    if (!(thumb instanceof HTMLElement)) {
      continue;
    }
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    attachAddButton(thumb, postId);
  }
}

function ensureListSubscriptions(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    return;
  }
  unsubscribeThumbsAdded = onThumbsAdded((root) => {
    stampPlaylistButtons(root);
  });
}

/** Clears thumbs subscription and any open popup (tests). */
export function resetPlaylistMenuRuntimeState(): void {
  closeOpenMenu();
  if (unsubscribeThumbsAdded !== undefined) {
    unsubscribeThumbsAdded();
    unsubscribeThumbsAdded = undefined;
  }
}

function mountPlaylistMenu(ctx: FeatureContext): void {
  if (ctx.pageKind !== "list") {
    return;
  }
  stampPlaylistButtons(document);
  ensureListSubscriptions();
}

export const playlistMenuFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountPlaylistMenu,
};
