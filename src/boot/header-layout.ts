import { CURRENT_PAGE_CLASS, MENU_ITEM_ID, MY_FAVORITES_CONTAINER_ID } from "../pages/constants";
import { STICKY_HEADER_CSS } from "./sticky-header";

/**
 * The header in three zones (design by Kaze, variant A):
 *
 * - left: what is used all the time (Posts, Feed, Collections, Following,
 *   Favorites), as the site and the script put it;
 * - a "More" menu with the site's rarely used sections;
 * - right: Statistics, My Account and RuleDesk as icons.
 *
 * The site's title stands in the same row, before the menu, instead of in a
 * row of its own above it.
 *
 * The second row (`ul#subnavbar`) stays the row of the current section. On
 * Posts its links get icons and the two upload links become buttons on the
 * right.
 *
 * The zones are made by CSS `order`, not by moving items: the code that
 * places the script's menu items relies on their order in the page. Only the
 * rare sections move, into the list of the "More" item.
 *
 * Runs before the first paint, with the menu skeleton: nothing heavy here.
 * Icons are Lucide outlines, drawn as CSS masks so they take the text colour.
 */

export const MORE_ITEM_ID = "rdw-nav-more";
export const MORE_LIST_CLASS = "rdw-nav-more-list";
export const ACCOUNT_ITEM_CLASS = "rdw-nav-account";
export const ICON_ITEM_CLASS = "rdw-nav-icon";
export const SUBNAV_ACTION_CLASS = "rdw-subnav-action";
/** On the RuleDesk item while something there wants attention (a backup is due). */
export const NAV_DUE_CLASS = "rdw-nav-due";
const SUBNAV_ICON_CLASS_PREFIX = "rdw-subnav-";
const STYLE_ID = "rdw-header-layout";
const MORE_LABEL = "More";
const ACCOUNT_LINK_TEXT = "My Account";
const SUBNAV_SELECTOR = "div#header ul#subnavbar";

/** The site's sections that go into "More", by the text of their menu link. */
const RARE_LINK_TEXTS: ReadonlySet<string> = new Set([
  "Comments",
  "Wiki",
  "Aliases",
  "Artists",
  "Tags",
  "Pools",
  "Forum",
  "Help",
]);

/** Second-row links of the Posts section, by text → icon name. */
const SUBNAV_ICONS: ReadonlyMap<string, string> = new Map([
  ["Video", "video"],
  ["Random", "random"],
  ["Help", "help"],
  ["Upload", "upload"],
  ["Upload Video", "upload-video"],
]);
const SUBNAV_ACTIONS: ReadonlySet<string> = new Set(["Upload", "Upload Video"]);

function mask(paths: string): string {
  const svg = `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${paths
    .replaceAll("<", "%3C")
    .replaceAll(">", "%3E")}%3C/svg%3E`;
  return `url("data:image/svg+xml,${svg}") center / contain no-repeat`;
}

const ICON = {
  chevron: mask("<path d='m6 9 6 6 6-6'/>"),
  stats: mask("<path d='M3 3v18h18'/><path d='M18 17V9'/><path d='M13 17V5'/><path d='M8 17v-3'/>"),
  account: mask(
    "<path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/>",
  ),
  settings: mask(
    "<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'/><circle cx='12' cy='12' r='3'/>",
  ),
  video: mask("<polygon points='6 3 20 12 6 21 6 3'/>"),
  random: mask(
    "<path d='m18 14 4 4-4 4'/><path d='m18 2 4 4-4 4'/><path d='M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22'/><path d='M2 6h1.972a4 4 0 0 1 3.6 2.2'/><path d='M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45'/>",
  ),
  help: mask(
    "<circle cx='12' cy='12' r='10'/><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/><path d='M12 17h.01'/>",
  ),
  upload: mask(
    "<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' x2='12' y1='3' y2='15'/>",
  ),
  uploadVideo: mask(
    "<path d='m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5'/><rect x='2' y='6' width='14' height='12' rx='2'/>",
  ),
} as const;

const NAV = "div#header ul#navbar";
/**
 * The header when it is the title followed by the menu, as the site has it.
 * Any other markup is left as it is.
 */
const ONE_ROW_HEADER = "div#header:has(> #site-title):has(> ul#navbar)";
const FAVORITES_PAGE_PARAM = "favorites";
const ARIA_CURRENT = "aria-current";
const ICON_PX = 18;
const SUBNAV_ICON_PX = 14;
const MENU_Z_INDEX = 30;

function iconRule(selector: string, icon: string, px: number): string {
  return `${selector}::before {
  content: "";
  display: inline-block;
  flex: none;
  width: ${String(px)}px;
  height: ${String(px)}px;
  background: currentColor;
  -webkit-mask: ${icon};
  mask: ${icon};
}`;
}

export const HEADER_LAYOUT_CSS = `
${ONE_ROW_HEADER} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
${ONE_ROW_HEADER} > * {
  flex: 0 0 100%;
  box-sizing: border-box;
}
${ONE_ROW_HEADER} > #site-title {
  flex: none;
  margin: 0;
  padding: 0 2px 0 18px;
  background-image: none;
}
${ONE_ROW_HEADER} > ul#navbar {
  flex: 1 1 0;
  min-width: 0;
  padding: 6px 18px 6px 6px;
}
${NAV} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
${NAV} > li#${MORE_ITEM_ID} {
  order: 1;
  position: relative;
}
${NAV} > li#${MENU_ITEM_ID.stats} {
  order: 2;
  margin-left: auto;
}
${NAV}:not(:has(> li#${MENU_ITEM_ID.stats})) > li.${ACCOUNT_ITEM_CLASS} {
  margin-left: auto;
}
${NAV} > li.${ACCOUNT_ITEM_CLASS} {
  order: 3;
}
${NAV} > li#${MENU_ITEM_ID.settings} {
  order: 4;
}
${NAV} > li.${ICON_ITEM_CLASS} > a {
  display: inline-flex;
  align-items: center;
  font-size: 0;
  line-height: 0;
  padding: 6px 8px;
}
${iconRule(`${NAV} > li#${MENU_ITEM_ID.stats} > a`, ICON.stats, ICON_PX)}
${iconRule(`${NAV} > li.${ACCOUNT_ITEM_CLASS} > a`, ICON.account, ICON_PX)}
${iconRule(`${NAV} > li#${MENU_ITEM_ID.settings} > a`, ICON.settings, ICON_PX)}
${NAV} > li.${NAV_DUE_CLASS} > a {
  position: relative;
}
${NAV} > li.${NAV_DUE_CLASS} > a::after {
  content: "";
  position: absolute;
  top: 3px;
  right: 3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--rdw-accent);
}
${NAV} > li#${MORE_ITEM_ID} > button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--rdw-radius-m);
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  cursor: pointer;
}
${NAV} > li#${MORE_ITEM_ID} > button:hover,
${NAV} > li#${MORE_ITEM_ID} > button[aria-expanded="true"] {
  color: var(--rdw-text);
}
${NAV} > li#${MORE_ITEM_ID}:has(li.${CURRENT_PAGE_CLASS}) > button {
  color: var(--rdw-text);
  font-weight: 600;
  border-radius: 0;
  box-shadow: inset 0 -2px 0 var(--rdw-accent);
}
${NAV} > li#${MORE_ITEM_ID} > button::after {
  content: "";
  width: 14px;
  height: 14px;
  background: currentColor;
  -webkit-mask: ${ICON.chevron};
  mask: ${ICON.chevron};
}
${NAV} ul.${MORE_LIST_CLASS} {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: ${String(MENU_Z_INDEX)};
  display: grid;
  grid-template-columns: repeat(2, max-content);
  gap: 2px 4px;
  margin: 4px 0 0;
  padding: 6px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
}
${NAV} ul.${MORE_LIST_CLASS}[hidden] {
  display: none;
}
${NAV} ul.${MORE_LIST_CLASS} > li {
  display: block;
}
${NAV} ul.${MORE_LIST_CLASS} > li > a {
  display: block;
}
${SUBNAV_SELECTOR} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
${SUBNAV_SELECTOR} > li > a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
${SUBNAV_SELECTOR} > li.${SUBNAV_ACTION_CLASS} > a {
  padding: 3px 10px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  color: var(--rdw-text);
}
${SUBNAV_SELECTOR} > li.${SUBNAV_ACTION_CLASS} > a:hover {
  border-color: var(--rdw-accent);
}
${SUBNAV_SELECTOR} > li {
  list-style: none;
}
${SUBNAV_SELECTOR} > li.${SUBNAV_ACTION_CLASS} {
  order: 1;
}
${SUBNAV_SELECTOR} > li.${SUBNAV_ACTION_CLASS}:not(li.${SUBNAV_ACTION_CLASS} ~ li.${SUBNAV_ACTION_CLASS}) {
  margin-left: auto;
}
${iconRule(`${SUBNAV_SELECTOR} > li.${SUBNAV_ICON_CLASS_PREFIX}video > a`, ICON.video, SUBNAV_ICON_PX)}
${iconRule(`${SUBNAV_SELECTOR} > li.${SUBNAV_ICON_CLASS_PREFIX}random > a`, ICON.random, SUBNAV_ICON_PX)}
${iconRule(`${SUBNAV_SELECTOR} > li.${SUBNAV_ICON_CLASS_PREFIX}help > a`, ICON.help, SUBNAV_ICON_PX)}
${iconRule(`${SUBNAV_SELECTOR} > li.${SUBNAV_ICON_CLASS_PREFIX}upload > a`, ICON.upload, SUBNAV_ICON_PX)}
${iconRule(`${SUBNAV_SELECTOR} > li.${SUBNAV_ICON_CLASS_PREFIX}upload-video > a`, ICON.uploadVideo, SUBNAV_ICON_PX)}
${STICKY_HEADER_CSS}
`.trim();

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = HEADER_LAYOUT_CSS;
  (document.head ?? document.documentElement).append(style);
}

function linkText(item: Element): string {
  return item.querySelector(":scope > a")?.textContent?.trim() ?? "";
}

function setMoreOpen(more: HTMLElement, open: boolean): void {
  const button = more.querySelector(":scope > button");
  const list = more.querySelector(`:scope > ul.${MORE_LIST_CLASS}`);
  if (!(button instanceof HTMLButtonElement) || !(list instanceof HTMLElement)) {
    return;
  }
  list.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
}

function buildMoreItem(): { item: HTMLLIElement; list: HTMLUListElement } {
  const item = document.createElement("li");
  item.id = MORE_ITEM_ID;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = MORE_LABEL;
  button.setAttribute("aria-haspopup", "true");
  button.setAttribute("aria-expanded", "false");
  const list = document.createElement("ul");
  list.className = MORE_LIST_CLASS;
  list.hidden = true;
  item.append(button, list);

  button.addEventListener("click", () => {
    setMoreOpen(item, list.hasAttribute("hidden"));
  });
  document.addEventListener("pointerdown", (event) => {
    if (!list.hidden && event.target instanceof Node && !item.contains(event.target)) {
      setMoreOpen(item, false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !list.hidden) {
      setMoreOpen(item, false);
      button.focus();
    }
  });
  return { item, list };
}

/** Moves the rare sections into "More". Returns the item, or null when none is in the menu. */
function groupRareSections(navbar: Element): HTMLLIElement | null {
  const existing = document.getElementById(MORE_ITEM_ID);
  if (existing instanceof HTMLLIElement) {
    return existing;
  }
  const rare = [...navbar.querySelectorAll(":scope > li")].filter((item) =>
    RARE_LINK_TEXTS.has(linkText(item)),
  );
  const first = rare[0];
  if (first === undefined) {
    return null;
  }
  const { item, list } = buildMoreItem();
  first.before(item);
  list.append(...rare);
  return item;
}

function markIconItems(navbar: Element): void {
  for (const item of navbar.querySelectorAll(":scope > li")) {
    const text = linkText(item);
    const isAccount = text === ACCOUNT_LINK_TEXT;
    if (isAccount) {
      item.classList.add(ACCOUNT_ITEM_CLASS);
    }
    if (isAccount || item.id === MENU_ITEM_ID.stats || item.id === MENU_ITEM_ID.settings) {
      item.classList.add(ICON_ITEM_CLASS);
      // The label is not shown: it becomes the tooltip.
      item.querySelector(":scope > a")?.setAttribute("title", text);
    }
  }
}

function markSubnav(): void {
  const subnav = document.querySelector(SUBNAV_SELECTOR);
  if (subnav === null) {
    return;
  }
  for (const item of subnav.querySelectorAll(":scope > li")) {
    const text = linkText(item);
    const icon = SUBNAV_ICONS.get(text);
    if (icon !== undefined) {
      item.classList.add(`${SUBNAV_ICON_CLASS_PREFIX}${icon}`);
    }
    if (SUBNAV_ACTIONS.has(text)) {
      item.classList.add(SUBNAV_ACTION_CLASS);
    }
  }
}

/**
 * The site does not mark its Favorites item as the current one on the
 * Favorites page; nothing in the menu then says where you are.
 */
export function markFavoritesCurrent(navbar: Element): void {
  if (new URLSearchParams(window.location.search).get("page") !== FAVORITES_PAGE_PARAM) {
    return;
  }
  if (navbar.querySelector(`li.${CURRENT_PAGE_CLASS}`) !== null) {
    return;
  }
  // The script's own Favorites item stands in for the site's, which is hidden then.
  const item =
    navbar.querySelector(`li#${MENU_ITEM_ID.favorites}`) ??
    navbar.querySelector(`li#${MY_FAVORITES_CONTAINER_ID}`);
  item?.classList.add(CURRENT_PAGE_CLASS);
}

/** Puts aria-current on the link of the current item and takes it off the others. */
export function syncAriaCurrent(navbar: Element): void {
  for (const link of navbar.querySelectorAll("li > a")) {
    const current = link.parentElement?.classList.contains(CURRENT_PAGE_CLASS) === true;
    if (current && link.getAttribute(ARIA_CURRENT) !== "page") {
      link.setAttribute(ARIA_CURRENT, "page");
    } else if (!current && link.hasAttribute(ARIA_CURRENT)) {
      link.removeAttribute(ARIA_CURRENT);
    }
  }
}

const watchedNavbars = new WeakSet<Element>();

/** The current item changes while the page lives (the script's own pages, the feed). */
function watchCurrentItem(navbar: Element): void {
  if (watchedNavbars.has(navbar) || typeof MutationObserver !== "function") {
    return;
  }
  watchedNavbars.add(navbar);
  new MutationObserver(() => {
    syncAriaCurrent(navbar);
  }).observe(navbar, { subtree: true, attributes: true, attributeFilter: ["class"] });
}

/** Lays the header out. Safe to call again: it adds what is missing. */
export function applyHeaderLayout(navbar: Element): void {
  ensureStyle();
  groupRareSections(navbar);
  markIconItems(navbar);
  markSubnav();
  markFavoritesCurrent(navbar);
  syncAriaCurrent(navbar);
  watchCurrentItem(navbar);
}
