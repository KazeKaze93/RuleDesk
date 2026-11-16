/**
 * The sticky header and sidebar: the site's header stays at the top of the
 * window while the page scrolls, and the sidebar of Posts and of a post stays
 * beside the content. On by default; one setting switches both off.
 *
 * Whatever else sticks to the top (the Favorites header, the toolbars of
 * Collections and Following) then has to sit under it, so the header's height
 * is kept in a custom property on <html> that those bars read.
 *
 * No imports: used before the first paint as well as from settings.
 */

export const STICKY_HEADER_SETTING_ID = "sticky-header";
export const STICKY_HEADER_SETTING_LABEL = "Keep the header and the sidebar in place while scrolling";
/** On unless switched off in settings. */
export const STICKY_HEADER_DEFAULT = true;
export const STICKY_HEADER_SWITCH_ID = "rdw-sticky-header";
export const STICKY_HEADER_CLASS = "rdw-sticky-header";
/** Height of the sticky header; absent while the header is not sticky. */
export const HEADER_HEIGHT_VAR = "--rdw-header-h";
/** Where a bar that sticks to the top of the window goes. */
export const STICKY_TOP = `var(${HEADER_HEIGHT_VAR}, 0px)`;

const HEADER_SELECTOR = "div#header";
const HEADER_Z_INDEX = 25;
/**
 * The sidebar of a search page and of a post page. It is taller than the
 * window (the tag list), so it scrolls inside itself once it is held.
 */
const SIDEBAR_SELECTORS = ["div#post-list > div.sidebar", "div#post-view > div.sidebar"] as const;
const SIDEBAR_GAP_PX = 8;

export const STICKY_HEADER_CSS = `
html.${STICKY_HEADER_CLASS} ${HEADER_SELECTOR} {
  position: sticky;
  top: 0;
  z-index: ${String(HEADER_Z_INDEX)};
}
html.${STICKY_HEADER_CLASS} ${SIDEBAR_SELECTORS[0]},
html.${STICKY_HEADER_CLASS} ${SIDEBAR_SELECTORS[1]} {
  position: sticky;
  top: calc(${STICKY_TOP} + ${String(SIDEBAR_GAP_PX)}px);
  max-height: calc(100vh - ${STICKY_TOP} - ${String(SIDEBAR_GAP_PX * 2)}px);
  overflow-y: auto;
  scrollbar-width: thin;
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
