import { SITE_SELECTORS, extractPostIdFromThumb } from "../../site/selectors";
import { bindPressSelect } from "../press-select";

/**
 * Picking posts on a results page, to add them to a collection or to download
 * them. While it is on, a click on a thumbnail marks the post instead of opening it. Only a class on
 * `span.thumb` changes; nothing inside the post link is touched.
 */

export const GRID_SELECT_BODY_CLASS = "rdw-dl-select";
export const GRID_SELECTED_CLASS = "rdw-dl-selected";

const FRAME_PX = 3;
/**
 * Over the picture, and over the video that plays in its place under the
 * pointer (video-preview.ts, z-index 3): that video stood over the frame of a
 * marked video post.
 */
const FRAME_Z_INDEX = 4;
const TICK_RADIUS_PX = 10;
/** The centre of the tick from the inner edges of the frame: 16 px from the cell's own. */
const TICK_CENTRE_PX = 16 - FRAME_PX;
const TICK_LINE_PX = 12;
const TICK_GLYPH_HALF_PX = 4;

export const GRID_SELECT_CSS = `
body.${GRID_SELECT_BODY_CLASS} ${SITE_SELECTORS.thumb} {
  cursor: pointer;
}
/* While posts are being marked a thumbnail does not lift under the pointer
   ("Motion" in the settings): lifted, it stands out of the frame of a marked post. */
body.${GRID_SELECT_BODY_CLASS} ${SITE_SELECTORS.thumb}:hover img {
  transform: none !important;
}
/* The frame of a marked post is a layer over the whole cell, the picture
   under it. It was an outline of the cell, drawn inside it: a picture as tall
   as the cell stood over that line, and read as a post that had come out of
   its frame (Kaze, 19.11.2026). The tick is in the same layer: a round ground
   in its corner and the sign over it. A tick as well as a frame, because a
   frame alone would mark a post by colour only. "html" in front makes these
   rules stronger than those of the play sign and of GIF, which are the same
   pseudo-element of a thumb and gave way only by standing earlier. */
html body.${GRID_SELECT_BODY_CLASS} ${SITE_SELECTORS.thumb}.${GRID_SELECTED_CLASS} {
  position: relative;
  border-radius: var(--rdw-radius-m);
}
html body.${GRID_SELECT_BODY_CLASS} ${SITE_SELECTORS.thumb}.${GRID_SELECTED_CLASS}::after {
  content: "✓";
  position: absolute;
  inset: 0;
  z-index: ${String(FRAME_Z_INDEX)};
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  width: auto;
  height: auto;
  padding: 0 0 ${String(TICK_CENTRE_PX - TICK_LINE_PX / 2)}px ${String(TICK_CENTRE_PX - TICK_GLYPH_HALF_PX)}px;
  border: ${String(FRAME_PX)}px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-m);
  background: radial-gradient(
      circle at ${String(TICK_CENTRE_PX)}px calc(100% - ${String(TICK_CENTRE_PX)}px),
      var(--rdw-accent) ${String(TICK_RADIUS_PX)}px,
      transparent ${String(TICK_RADIUS_PX)}.5px
    )
    no-repeat;
  color: var(--rdw-surface);
  font: 700 ${String(TICK_LINE_PX)}px/1 var(--rdw-font);
  letter-spacing: 0;
  pointer-events: none;
}
`.trim();

const STYLE_ID = "rdw-grid-select-style";

/**
 * Selecting works without the download manager too, so the styles are put in
 * when selecting starts and do not depend on that feature's stylesheet.
 */
function ensureStyle(): void {
  if (document.getElementById(STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = GRID_SELECT_CSS;
  document.head.append(style);
}

let onCountChange: ((count: number) => void) | null = null;

/** Ids of the marked posts, in page order. */
export function readSelectedPostIds(): number[] {
  const ids: number[] = [];
  for (const thumb of document.querySelectorAll(
    `${SITE_SELECTORS.thumb}.${GRID_SELECTED_CLASS}`,
  )) {
    const raw = extractPostIdFromThumb(thumb);
    const id = raw === null ? Number.NaN : Number(raw);
    if (Number.isFinite(id)) {
      ids.push(id);
    }
  }
  return ids;
}

/** What a press does: marks the post under it; a press on a button of the thumb is the button's. */
function pressOnGrid(target: Element): (() => void) | null {
  const thumb = target.closest(SITE_SELECTORS.thumb);
  if (thumb === null || target.closest("button") !== null) {
    return null;
  }
  return () => {
    thumb.classList.toggle(GRID_SELECTED_CLASS);
    onCountChange?.(readSelectedPostIds().length);
  };
}

let unbindPress: (() => void) | null = null;

/** The marked posts with the address of their preview, in page order. */
export function readSelectedPosts(
  readThumbUrl: (thumb: HTMLElement, postId: string) => string | null,
): { id: number; thumbUrl: string | null }[] {
  const posts: { id: number; thumbUrl: string | null }[] = [];
  for (const thumb of document.querySelectorAll(
    `${SITE_SELECTORS.thumb}.${GRID_SELECTED_CLASS}`,
  )) {
    const raw = extractPostIdFromThumb(thumb);
    const id = raw === null ? Number.NaN : Number(raw);
    if (raw !== null && Number.isFinite(id) && thumb instanceof HTMLElement) {
      posts.push({ id, thumbUrl: readThumbUrl(thumb, raw) });
    }
  }
  return posts;
}

/** Marks every post of the page. */
export function selectGridPage(): void {
  for (const thumb of document.querySelectorAll(SITE_SELECTORS.thumb)) {
    if (extractPostIdFromThumb(thumb) !== null) {
      thumb.classList.add(GRID_SELECTED_CLASS);
    }
  }
  onCountChange?.(readSelectedPostIds().length);
}

/** Takes every mark off; picking stays on. */
export function clearGridSelection(): void {
  for (const thumb of document.querySelectorAll(`.${GRID_SELECTED_CLASS}`)) {
    thumb.classList.remove(GRID_SELECTED_CLASS);
  }
  onCountChange?.(0);
}

export function isGridSelecting(): boolean {
  return document.body.classList.contains(GRID_SELECT_BODY_CLASS);
}

/** Turns picking on. `onChange` gets the number of marked posts after each click. */
export function startGridSelect(onChange: (count: number) => void): void {
  if (isGridSelecting()) {
    return;
  }
  ensureStyle();
  onCountChange = onChange;
  document.body.classList.add(GRID_SELECT_BODY_CLASS);
  unbindPress = bindPressSelect(pressOnGrid);
}

/** Turns picking off and clears the marks. */
export function stopGridSelect(): void {
  unbindPress?.();
  unbindPress = null;
  document.body.classList.remove(GRID_SELECT_BODY_CLASS);
  for (const thumb of document.querySelectorAll(`.${GRID_SELECTED_CLASS}`)) {
    thumb.classList.remove(GRID_SELECTED_CLASS);
  }
  onCountChange = null;
}
