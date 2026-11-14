import {
  addPostToCollection,
  createPlaylist,
  listPlaylists,
  playlistsContaining,
  removePostFromPlaylist,
} from "../storage/store";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import { ensureThumbAnchor } from "../site/thumb";
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
const CLASS_LIST = "rdw-playlist-menu-list";
const CLASS_ITEM = "rdw-playlist-menu-item";
const CLASS_CHECK = "rdw-playlist-menu-check";
const CLASS_NAME = "rdw-playlist-menu-name";
const CLASS_NEW = "rdw-playlist-menu-new";
const CLASS_NEW_FORM = "rdw-playlist-menu-new-form";
const CLASS_NEW_INPUT = "rdw-playlist-menu-new-input";
const CLASS_NEW_SUBMIT = "rdw-playlist-menu-new-submit";

const ATTR_POST_ID = "data-rdw-post-id";

const TEXT_ADD_GLYPH = "+";
const TEXT_NEW_PLAYLIST = "New collection…";
const TEXT_CREATE = "Create";
const TEXT_CHECK_MARK = "✓";

const LABEL_ADD = "Add to collection";
const LABEL_TOGGLE_PREFIX = "Toggle collection";
const LABEL_NEW_NAME = "New collection name";

const MENU_Z_INDEX = 2147483645;
const MENU_MIN_WIDTH_PX = 180;
const MENU_MAX_HEIGHT_PX = 280;
const MENU_GAP_PX = 4;
const BUTTON_SIZE_PX = 28;
const BUTTON_OFFSET_PX = 6;
const BUTTON_BELOW_FAV_TOP_PX = BUTTON_OFFSET_PX + BUTTON_SIZE_PX + 4;

const FOCUS_OUTLINE = "2px solid #4c8bf5";
const FOCUS_OUTLINE_OFFSET = "2px";

const EVENT_KEYDOWN = "keydown";
const EVENT_POINTERDOWN = "pointerdown";
const KEY_ESCAPE = "Escape";
const KEY_ENTER = "Enter";

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
  min-width: ${String(MENU_MIN_WIDTH_PX)}px;
  max-height: ${String(MENU_MAX_HEIGHT_PX)}px;
  overflow: auto;
  padding: 0.35rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #fff;
  color: #1a1a1a;
  font: 13px/1.3 Segoe UI, system-ui, sans-serif;
}
${BODY_SELECTOR} .${CLASS_MENU}.${CLASS_MENU_POPUP} {
  position: fixed;
  z-index: ${String(MENU_Z_INDEX)};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}
${BODY_SELECTOR} .${CLASS_LIST} {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin: 0 0 0.35rem;
  padding: 0;
  list-style: none;
}
${BODY_SELECTOR} .${CLASS_ITEM} {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  margin: 0;
  padding: 0.25rem 0.35rem;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
${BODY_SELECTOR} .${CLASS_ITEM}:hover,
${BODY_SELECTOR} .${CLASS_ITEM}:focus-visible {
  background: #e8f0fe;
}
${BODY_SELECTOR} .${CLASS_ITEM}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR} .${CLASS_CHECK} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  flex: 0 0 1rem;
  font-weight: 700;
}
${BODY_SELECTOR} .${CLASS_NAME} {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${BODY_SELECTOR} .${CLASS_NEW},
${BODY_SELECTOR} .${CLASS_NEW_SUBMIT} {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0.3rem 0.4rem;
  border: 1px solid #666;
  border-radius: 2px;
  background: #f5f5f5;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}
${BODY_SELECTOR} .${CLASS_NEW}:focus-visible,
${BODY_SELECTOR} .${CLASS_NEW_SUBMIT}:focus-visible,
${BODY_SELECTOR} .${CLASS_NEW_INPUT}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR} .${CLASS_NEW_FORM} {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
${BODY_SELECTOR} .${CLASS_NEW_INPUT} {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 0.3rem 0.4rem;
  border: 1px solid #666;
  border-radius: 2px;
  font: inherit;
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

function addPostWithThumb(
  collectionId: string,
  postId: number,
  readThumbUrl: ThumbUrlReader,
): void {
  const thumbUrl = readThumbUrl();
  if (thumbUrl !== null) {
    addPostToCollection(collectionId, postId, thumbUrl);
    return;
  }
  addPostToCollection(collectionId, postId);
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

function fillPlaylistList(
  list: HTMLElement,
  postId: number,
  readThumbUrl: ThumbUrlReader,
): void {
  list.replaceChildren();
  const playlists = listPlaylists();
  const memberIds = new Set(playlistsContaining(postId).map((item) => item.id));

  for (const playlist of playlists) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = CLASS_ITEM;
    item.setAttribute("role", "menuitemcheckbox");
    const checked = memberIds.has(playlist.id);
    item.setAttribute("aria-checked", checked ? "true" : "false");
    item.setAttribute(
      "aria-label",
      `${LABEL_TOGGLE_PREFIX} ${playlist.name}`,
    );

    const check = document.createElement("span");
    check.className = CLASS_CHECK;
    check.setAttribute("aria-hidden", "true");
    check.textContent = checked ? TEXT_CHECK_MARK : "";

    const name = document.createElement("span");
    name.className = CLASS_NAME;
    name.textContent = playlist.name;

    item.append(check, name);
    item.addEventListener("click", (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if (memberIds.has(playlist.id)) {
        removePostFromPlaylist(playlist.id, postId);
      } else {
        addPostWithThumb(playlist.id, postId, readThumbUrl);
      }
      fillPlaylistList(list, postId, readThumbUrl);
      syncAddButtonsForPost(postId);
    });
    list.append(item);
  }
}

function showNewPlaylistForm(
  host: HTMLElement,
  list: HTMLElement,
  postId: number,
  readThumbUrl: ThumbUrlReader,
  onCreated: (() => void) | undefined,
): void {
  host.replaceChildren();
  const form = document.createElement("div");
  form.className = CLASS_NEW_FORM;

  const input = document.createElement("input");
  input.type = "text";
  input.className = CLASS_NEW_INPUT;
  input.setAttribute("aria-label", LABEL_NEW_NAME);
  input.autocomplete = "off";

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = CLASS_NEW_SUBMIT;
  submit.textContent = TEXT_CREATE;

  const commit = (): void => {
    const name = input.value.trim();
    if (name.length === 0) {
      return;
    }
    const playlist = createPlaylist(name);
    addPostWithThumb(playlist.id, postId, readThumbUrl);
    fillPlaylistList(list, postId, readThumbUrl);
    syncAddButtonsForPost(postId);
    onCreated?.();
  };

  submit.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    commit();
  });
  input.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key !== KEY_ENTER) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    commit();
  });

  form.append(input, submit);
  host.append(form);
  input.focus();
}

function mountNewPlaylistControl(
  host: HTMLElement,
  list: HTMLElement,
  postId: number,
  readThumbUrl: ThumbUrlReader,
  onCreated: (() => void) | undefined,
): void {
  host.replaceChildren();
  const button = document.createElement("button");
  button.type = "button";
  button.className = CLASS_NEW;
  button.textContent = TEXT_NEW_PLAYLIST;
  button.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    showNewPlaylistForm(host, list, postId, readThumbUrl, onCreated);
  });
  host.append(button);
}

/**
 * Builds the playlist membership menu for a post (list popup or post-actions).
 * Callers own placement; list page uses a single floating instance.
 */
export function createPlaylistMenu(
  postId: number,
  options?: { onCreated?: () => void; readThumbUrl?: ThumbUrlReader },
): HTMLElement {
  const readThumbUrl = options?.readThumbUrl ?? NO_THUMB_URL;
  const root = document.createElement("div");
  root.className = CLASS_MENU;
  root.setAttribute("role", "menu");
  root.setAttribute(ATTR_POST_ID, String(postId));

  const list = document.createElement("div");
  list.className = CLASS_LIST;
  list.setAttribute("role", "group");
  fillPlaylistList(list, postId, readThumbUrl);

  const newHost = document.createElement("div");
  mountNewPlaylistControl(newHost, list, postId, readThumbUrl, options?.onCreated);

  root.append(list, newHost);
  return root;
}

function openMenuForButton(button: HTMLButtonElement, postId: number): void {
  if (openPopup !== null && openPopup.trigger === button) {
    closeOpenMenu();
    return;
  }
  closeOpenMenu();

  const menu = createPlaylistMenu(postId, {
    onCreated: (): void => {
      closeOpenMenu();
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
