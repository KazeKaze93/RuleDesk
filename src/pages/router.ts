import { ensureStyleElement } from "../boot/appearance-dom";
import {
  HEADER_SELECTOR,
  RDW_OWN_PAGE_CLASS,
  RDW_OWN_PAGE_STYLE_ID,
  buildOwnPageCss,
  menuRouteForPage,
  parseRdwHash,
  rdwPageHash,
  type RdwPage,
} from "./constants";
import { hideRdwPage, showRdwPage } from "./host";
import {
  clearOwnPageCurrentHighlight,
  installSiteMenu,
  setOwnPageCurrentHighlight,
} from "./menu";

const EVENT_HASHCHANGE = "hashchange";
const EVENT_POPSTATE = "popstate";
const EVENT_CLICK = "click";
const HISTORY_STATE_TITLE = "";

let routerBound = false;
let syncGeneration = 0;

export { isRdwRoute, parseRdwHash } from "./constants";

export function ensureOwnPageStyle(): void {
  const style = ensureStyleElement(RDW_OWN_PAGE_STYLE_ID);
  style.textContent = buildOwnPageCss();
}

function findHeader(): HTMLElement | null {
  const header = document.querySelector(HEADER_SELECTOR);
  return header instanceof HTMLElement ? header : null;
}

async function enterRoute(route: RdwPage): Promise<void> {
  const header = findHeader();
  if (header === null) {
    return;
  }
  document.documentElement.classList.add(RDW_OWN_PAGE_CLASS);
  await showRdwPage(route, header);
  setOwnPageCurrentHighlight(menuRouteForPage(route));
}

function leaveRoute(): void {
  document.documentElement.classList.remove(RDW_OWN_PAGE_CLASS);
  hideRdwPage();
  clearOwnPageCurrentHighlight();
}

async function syncFromHash(): Promise<void> {
  const generation = ++syncGeneration;
  const header = findHeader();
  if (header === null) {
    leaveRoute();
    return;
  }
  const route = parseRdwHash(window.location.hash);
  if (route === null) {
    leaveRoute();
    return;
  }
  await enterRoute(route);
  if (generation !== syncGeneration) {
    return;
  }
}

function onHashChange(): void {
  void syncFromHash();
}

function onPopState(): void {
  void syncFromHash();
}

function isModifiedClick(event: MouseEvent): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

/**
 * First visit to a #rdw/* route pushes history; switching among script pages
 * replaces so Back returns to the underlying site page.
 */
export async function navigateToRdwRoute(route: RdwPage): Promise<void> {
  const nextHash = rdwPageHash(route);
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
  const alreadyOnScriptPage = parseRdwHash(window.location.hash) !== null;
  if (alreadyOnScriptPage) {
    window.history.replaceState(window.history.state, HISTORY_STATE_TITLE, nextUrl);
  } else {
    window.history.pushState(window.history.state, HISTORY_STATE_TITLE, nextUrl);
  }
  await syncFromHash();
}

function onDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented || isModifiedClick(event)) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const anchor = target.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) {
    return;
  }
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return;
  }
  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin) {
    return;
  }
  if (
    url.pathname !== window.location.pathname ||
    url.search !== window.location.search
  ) {
    return;
  }
  const route = parseRdwHash(url.hash);
  if (route === null) {
    return;
  }
  event.preventDefault();
  void navigateToRdwRoute(route);
}

/**
 * Install navbar items + hash router. No menu / no page when div#header is absent.
 * Page Preact modules load lazily on first #rdw/* open (factories in host).
 * The collection detail module loads only for #rdw/collections/<id>.
 */
export async function startRdwPages(): Promise<void> {
  ensureOwnPageStyle();
  const header = findHeader();
  if (header === null) {
    leaveRoute();
    return;
  }
  installSiteMenu();
  if (!routerBound) {
    routerBound = true;
    window.addEventListener(EVENT_HASHCHANGE, onHashChange);
    window.addEventListener(EVENT_POPSTATE, onPopState);
    document.addEventListener(EVENT_CLICK, onDocumentClick);
  }
  await syncFromHash();
}
