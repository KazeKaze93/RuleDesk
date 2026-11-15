/**
 * The optional sticky header: the site's header stays at the top of the
 * window while the page scrolls.
 *
 * Whatever else sticks to the top (the Favorites header, the toolbars of
 * Collections and Following) then has to sit under it, so the header's height
 * is kept in a custom property on <html> that those bars read.
 *
 * No imports: used before the first paint as well as from settings.
 */

export const STICKY_HEADER_SETTING_ID = "sticky-header";
export const STICKY_HEADER_SETTING_LABEL = "Keep the header at the top while scrolling";
export const STICKY_HEADER_SWITCH_ID = "rdw-sticky-header";
export const STICKY_HEADER_CLASS = "rdw-sticky-header";
/** Height of the sticky header; absent while the header is not sticky. */
export const HEADER_HEIGHT_VAR = "--rdw-header-h";
/** Where a bar that sticks to the top of the window goes. */
export const STICKY_TOP = `var(${HEADER_HEIGHT_VAR}, 0px)`;

const HEADER_SELECTOR = "div#header";
const HEADER_Z_INDEX = 25;

export const STICKY_HEADER_CSS = `
html.${STICKY_HEADER_CLASS} ${HEADER_SELECTOR} {
  position: sticky;
  top: 0;
  z-index: ${String(HEADER_Z_INDEX)};
}
`.trim();

let observer: ResizeObserver | null = null;

function writeHeight(): void {
  const header = document.querySelector(HEADER_SELECTOR);
  const root = document.documentElement;
  if (header === null || !root.classList.contains(STICKY_HEADER_CLASS)) {
    root.style.removeProperty(HEADER_HEIGHT_VAR);
    return;
  }
  const height = Math.round(header.getBoundingClientRect().height);
  root.style.setProperty(HEADER_HEIGHT_VAR, `${String(height)}px`);
}

/** Switches the sticky header on or off and keeps the height property in step. */
export function applyStickyHeader(enabled: boolean): void {
  document.documentElement.classList.toggle(STICKY_HEADER_CLASS, enabled);
  if (observer !== null) {
    observer.disconnect();
    observer = null;
  }
  const header = document.querySelector(HEADER_SELECTOR);
  if (enabled && header !== null && typeof ResizeObserver === "function") {
    observer = new ResizeObserver(writeHeight);
    observer.observe(header);
  }
  writeHeight();
}
