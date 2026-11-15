import { SITE_SELECTORS, extractPostIdFromThumb } from "../../site/selectors";

/**
 * Picking posts on a results page for the download manager. While it is on, a
 * click on a thumbnail marks the post instead of opening it. Only a class on
 * `span.thumb` changes; nothing inside the post link is touched.
 */

export const GRID_SELECT_BODY_CLASS = "rdw-dl-select";
export const GRID_SELECTED_CLASS = "rdw-dl-selected";
const EVENT_CLICK = "click";

export const GRID_SELECT_CSS = `
body.${GRID_SELECT_BODY_CLASS} ${SITE_SELECTORS.thumb} {
  cursor: pointer;
}
body.${GRID_SELECT_BODY_CLASS} ${SITE_SELECTORS.thumb}.${GRID_SELECTED_CLASS} {
  outline: 3px solid var(--rdw-accent);
  outline-offset: -3px;
  border-radius: var(--rdw-radius-m);
}
`.trim();

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

function onGridClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const thumb = target.closest(SITE_SELECTORS.thumb);
  if (thumb === null || target.closest("button") !== null) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  thumb.classList.toggle(GRID_SELECTED_CLASS);
  onCountChange?.(readSelectedPostIds().length);
}

export function isGridSelecting(): boolean {
  return document.body.classList.contains(GRID_SELECT_BODY_CLASS);
}

/** Turns picking on. `onChange` gets the number of marked posts after each click. */
export function startGridSelect(onChange: (count: number) => void): void {
  if (isGridSelecting()) {
    return;
  }
  onCountChange = onChange;
  document.body.classList.add(GRID_SELECT_BODY_CLASS);
  document.addEventListener(EVENT_CLICK, onGridClick, true);
}

/** Turns picking off and clears the marks. */
export function stopGridSelect(): void {
  document.removeEventListener(EVENT_CLICK, onGridClick, true);
  document.body.classList.remove(GRID_SELECT_BODY_CLASS);
  for (const thumb of document.querySelectorAll(`.${GRID_SELECTED_CLASS}`)) {
    thumb.classList.remove(GRID_SELECTED_CLASS);
  }
  onCountChange = null;
}
