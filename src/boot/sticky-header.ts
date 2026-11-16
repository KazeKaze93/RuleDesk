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
const SIDEBAR_SELECTOR = SIDEBAR_SELECTORS.join(", ");
/**
 * How far the bottom of the sidebar's block is above the bottom of the window
 * right now, in px; 0 while the block reaches the window's bottom. A sticky
 * element cannot leave its block: at the end of the page the block ends above
 * the bottom of the window (the footer is under it), and a sidebar as tall as
 * the window would be pushed up under the header. Instead it gets shorter by
 * this much, so it is full height everywhere but at the very end of a page.
 */
const SIDEBAR_FOOT_VAR = "--rdw-sidebar-foot";
/** On the sidebar while it has more content below what is shown. */
export const SIDEBAR_MORE_CLASS = "rdw-sidebar-more";
const SIDEBAR_FADE_PX = 32;
const SCROLL_END_SLACK_PX = 2;

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
  max-height: calc(100vh - ${STICKY_TOP} - ${String(SIDEBAR_GAP_PX * 2)}px - var(${SIDEBAR_FOOT_VAR}, 0px));
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
}
html.${STICKY_HEADER_CLASS} div.sidebar.${SIDEBAR_MORE_CLASS} {
  -webkit-mask-image: linear-gradient(to bottom, black calc(100% - ${String(SIDEBAR_FADE_PX)}px), transparent);
  mask-image: linear-gradient(to bottom, black calc(100% - ${String(SIDEBAR_FADE_PX)}px), transparent);
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
  writeSidebarFoot();
}

function findSidebar(): HTMLElement | null {
  const sidebar = document.querySelector(SIDEBAR_SELECTOR);
  return sidebar instanceof HTMLElement ? sidebar : null;
}

function writeSidebarFoot(): void {
  const root = document.documentElement;
  const sidebar = findSidebar();
  const block = sidebar?.parentElement;
  if (sidebar === null || block === null || block === undefined) {
    root.style.removeProperty(SIDEBAR_FOOT_VAR);
    return;
  }
  if (boundSidebar !== sidebar && document.documentElement.classList.contains(STICKY_HEADER_CLASS)) {
    // The sidebar is parsed after the header: its own scrolling is watched
    // from the first time it is seen.
    boundSidebar?.removeEventListener("scroll", scheduleSidebarFoot);
    boundSidebar = sidebar;
    sidebar.addEventListener("scroll", scheduleSidebarFoot, { passive: true });
  }
  // On a page whose content is shorter than the window the block is only as
  // tall as the sidebar makes it: shortening the sidebar by the gap under the
  // block would shrink the block, and so on until the tag list is gone. There
  // the sidebar keeps its full height and the page scrolls as a whole.
  let tallestOther = 0;
  for (const child of block.children) {
    if (child !== sidebar && child instanceof HTMLElement) {
      tallestOther = Math.max(tallestOther, child.offsetHeight);
    }
  }
  const foot =
    tallestOther < window.innerHeight
      ? 0
      : Math.max(0, Math.round(window.innerHeight - block.getBoundingClientRect().bottom));
  root.style.setProperty(SIDEBAR_FOOT_VAR, `${String(foot)}px`);
  // The fade at the bottom says there is more to scroll to; none at the end.
  const hidden = sidebar.scrollHeight - sidebar.scrollTop - sidebar.clientHeight;
  sidebar.classList.toggle(SIDEBAR_MORE_CLASS, hidden > SCROLL_END_SLACK_PX);
}

/**
 * Runs on every scroll event. Browsers deliver those once per frame, and the
 * work is one rectangle read, so there is no throttle of its own (one made of
 * requestAnimationFrame would also stall while the tab is in the background).
 */
function scheduleSidebarFoot(): void {
  writeSidebarFoot();
}

let boundSidebar: HTMLElement | null = null;

function bindScroll(enabled: boolean): void {
  window.removeEventListener("scroll", scheduleSidebarFoot);
  window.removeEventListener("resize", scheduleSidebarFoot);
  boundSidebar?.removeEventListener("scroll", scheduleSidebarFoot);
  boundSidebar?.classList.remove(SIDEBAR_MORE_CLASS);
  boundSidebar = null;
  if (!enabled) {
    return;
  }
  window.addEventListener("scroll", scheduleSidebarFoot, { passive: true });
  window.addEventListener("resize", scheduleSidebarFoot, { passive: true });
  boundSidebar = findSidebar();
  boundSidebar?.addEventListener("scroll", scheduleSidebarFoot, { passive: true });
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
    // The page grows while it loads; what is under the sidebar's block changes.
    if (document.body !== null) {
      observer.observe(document.body);
    }
  }
  bindScroll(enabled);
  writeHeight();
}
