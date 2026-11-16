import { FETCH_CREDENTIALS, FETCH_METHOD_GET, SEARCH_PARAM_TAGS } from "../config/constants";
import { log } from "../log";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

/**
 * A click on the "?" of a tag in the sidebar shows what the site's wiki says
 * about the tag, in a small panel beside it, instead of leaving the page.
 *
 * The "?" leads to a search of the wiki, not to the entry, so one click is two
 * requests: that search, then the entry it lists. Both only on the click, and
 * an answer is kept until the page is left. A click with a modifier key, or
 * the middle button, opens the wiki as before.
 */

const FEATURE_ID = "tag-wiki";
const FEATURE_LABEL = "Tag description on the ? in the sidebar";
const BODY_CLASS = featureBodyClass(FEATURE_ID);

const SIDEBAR_SELECTOR = "ul#tag-sidebar";
const HELP_LINK_TEXT = "?";
const WIKI_HREF_MARK = "page=wiki";
const ENTRY_LINK_SELECTOR = 'table.highlightable a[href*="page=wiki"][href*="s=view"]';
/** The left half of an entry page: heading, tag type, the text, then the site's own notes. */
const ENTRY_BODY_SELECTOR = "div#content > div.flexi > div";
const TAG_LINK_SELECTOR = `a[href*="${SEARCH_PARAM_TAGS}="]`;
const TITLE_PREFIX = "Now Viewing:";
const TYPE_PREFIX = "Tag type:";
const NOTES_HEADING = "Other Wiki Information";

export const PANEL_ID = "rdw-tag-wiki";
const TITLE_CLASS = "rdw-tag-wiki-title";
const TYPE_CLASS = "rdw-tag-wiki-type";
const TEXT_CLASS = "rdw-tag-wiki-text";
const FOOT_CLASS = "rdw-tag-wiki-foot";
const PANEL_WIDTH_PX = 320;
const PANEL_GAP_PX = 8;
const PANEL_Z_INDEX = 2147483000;

const TEXT_LOADING = "Reading the wiki…";
const TEXT_NO_ENTRY = "The wiki has no entry for this tag.";
const TEXT_EMPTY_ENTRY = "The wiki entry has no description.";
const TEXT_FAILED = "Could not read the wiki. Try again later.";
const TEXT_OPEN = "Open in the wiki";
const PANEL_LABEL = "Tag description";

const FEATURE_CSS = `
#${PANEL_ID} {
  position: fixed;
  z-index: ${String(PANEL_Z_INDEX)};
  box-sizing: border-box;
  width: ${String(PANEL_WIDTH_PX)}px;
  max-width: calc(100vw - ${String(PANEL_GAP_PX * 2)}px);
  padding: 10px 12px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12px/1.45 var(--rdw-font);
}
#${PANEL_ID} .${TITLE_CLASS} {
  margin: 0;
  font: 700 13px var(--rdw-font);
  overflow-wrap: anywhere;
}
#${PANEL_ID} .${TYPE_CLASS} {
  margin: 2px 0 0;
  color: var(--rdw-muted);
}
#${PANEL_ID} .${TEXT_CLASS} {
  margin: 8px 0 0;
  max-height: 240px;
  overflow-y: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
#${PANEL_ID} .${FOOT_CLASS} {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--rdw-border);
}
#${PANEL_ID} .${FOOT_CLASS} a {
  color: var(--rdw-accent);
}
`.trim();

export type WikiEntry = {
  readonly title: string;
  /** "Copyright", "Artist", …; empty when the page does not say. */
  readonly type: string;
  readonly text: string;
};

/** A tag as the wiki and the sidebar may spell it: case and underscores aside. */
function foldTag(tag: string): string {
  return tag.trim().toLowerCase().replaceAll(" ", "_");
}

/** The address of the entry for `tag` among the results of a wiki search, or null. */
export function findWikiEntryHref(results: ParentNode, tag: string): string | null {
  const wanted = foldTag(tag);
  for (const link of results.querySelectorAll(ENTRY_LINK_SELECTOR)) {
    if (foldTag(link.textContent ?? "") === wanted) {
      return link.getAttribute("href");
    }
  }
  return null;
}

function nodeText(node: Node): string {
  if (node instanceof HTMLBRElement) {
    return "\n";
  }
  return node.textContent ?? "";
}

/** What an entry page says: the heading, the tag type and the text between them and the site's notes. */
export function readWikiEntry(page: ParentNode): WikiEntry | null {
  const body = page.querySelector(ENTRY_BODY_SELECTOR);
  const heading = body?.querySelector("h2") ?? null;
  if (body === null || body === undefined || heading === null) {
    return null;
  }
  const title = (heading.textContent ?? "").replace(TITLE_PREFIX, "").trim();
  let type = "";
  let text = "";
  let started = false;
  for (const node of body.childNodes) {
    const content = (node.textContent ?? "").trim();
    if (node === heading) {
      started = true;
      continue;
    }
    if (!started) {
      continue;
    }
    if (node instanceof HTMLElement && content.startsWith(TYPE_PREFIX)) {
      type = content.slice(TYPE_PREFIX.length).trim();
      continue;
    }
    if (node instanceof HTMLElement && content === NOTES_HEADING) {
      break;
    }
    text += nodeText(node);
  }
  const clean = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, type, text: clean };
}

type Answer =
  | { readonly kind: "entry"; readonly entry: WikiEntry; readonly href: string }
  | { readonly kind: "none"; readonly href: string }
  | { readonly kind: "failed"; readonly href: string };

const answers = new Map<string, Answer>();

async function fetchDocument(url: string): Promise<Document> {
  const absolute = new URL(url, window.location.href);
  if (absolute.origin !== window.location.origin) {
    throw new Error("cross-origin wiki address");
  }
  const response = await fetch(absolute.href, {
    method: FETCH_METHOD_GET,
    credentials: FETCH_CREDENTIALS,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  return new DOMParser().parseFromString(await response.text(), "text/html");
}

async function readAnswer(tag: string, searchHref: string): Promise<Answer> {
  const known = answers.get(tag);
  if (known !== undefined && known.kind !== "failed") {
    return known;
  }
  let answer: Answer;
  try {
    const results = await fetchDocument(searchHref);
    const entryHref = findWikiEntryHref(results, tag);
    if (entryHref === null) {
      answer = { kind: "none", href: searchHref };
    } else {
      const entry = readWikiEntry(await fetchDocument(entryHref));
      answer =
        entry === null
          ? { kind: "none", href: entryHref }
          : { kind: "entry", entry, href: entryHref };
    }
  } catch (error) {
    log.warn("tag-wiki: request failed", tag, error);
    answer = { kind: "failed", href: searchHref };
  }
  answers.set(tag, answer);
  return answer;
}

let openFor: HTMLElement | null = null;

export function closeTagWiki(): void {
  document.getElementById(PANEL_ID)?.remove();
  document.removeEventListener("keydown", onKeyDown, true);
  document.removeEventListener("pointerdown", onPointerDown, true);
  const opener = openFor;
  openFor = null;
  opener?.focus();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeTagWiki();
  }
}

function onPointerDown(event: PointerEvent): void {
  const panel = document.getElementById(PANEL_ID);
  const target = event.target;
  if (panel === null || !(target instanceof Node)) {
    return;
  }
  if (!panel.contains(target) && !(openFor?.contains(target) ?? false)) {
    closeTagWiki();
  }
}

function line(className: string, text: string): HTMLElement {
  const element = document.createElement("p");
  element.className = className;
  element.textContent = text;
  return element;
}

function fill(panel: HTMLElement, tag: string, answer: Answer | null): void {
  const parts: HTMLElement[] = [line(TITLE_CLASS, answer?.kind === "entry" ? answer.entry.title : tag)];
  if (answer === null) {
    parts.push(line(TEXT_CLASS, TEXT_LOADING));
  } else if (answer.kind === "entry") {
    if (answer.entry.type.length > 0) {
      parts.push(line(TYPE_CLASS, answer.entry.type));
    }
    parts.push(line(TEXT_CLASS, answer.entry.text.length > 0 ? answer.entry.text : TEXT_EMPTY_ENTRY));
  } else {
    parts.push(line(TEXT_CLASS, answer.kind === "none" ? TEXT_NO_ENTRY : TEXT_FAILED));
  }
  if (answer !== null) {
    const foot = document.createElement("p");
    foot.className = FOOT_CLASS;
    const link = document.createElement("a");
    link.href = answer.href;
    link.textContent = TEXT_OPEN;
    foot.append(link);
    parts.push(foot);
  }
  panel.replaceChildren(...parts);
}

function place(panel: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(PANEL_WIDTH_PX, window.innerWidth - PANEL_GAP_PX * 2);
  // Beside the sidebar when there is room on the right, else over it.
  let left = rect.right + PANEL_GAP_PX;
  if (left + width > window.innerWidth - PANEL_GAP_PX) {
    left = Math.max(PANEL_GAP_PX, rect.left - width - PANEL_GAP_PX);
  }
  const height = panel.offsetHeight;
  const top = Math.max(
    PANEL_GAP_PX,
    Math.min(rect.top, window.innerHeight - height - PANEL_GAP_PX),
  );
  panel.style.left = `${String(left)}px`;
  panel.style.top = `${String(top)}px`;
}

/** The tag a row of the sidebar is about, from its search link. */
export function sidebarRowTag(row: Element): string | null {
  const links = row.querySelectorAll(TAG_LINK_SELECTOR);
  const href = links[links.length - 1]?.getAttribute("href") ?? null;
  if (href === null) {
    return null;
  }
  try {
    const tag = new URL(href, window.location.href).searchParams.get(SEARCH_PARAM_TAGS);
    return tag === null || tag.trim().length === 0 ? null : tag.trim();
  } catch {
    return null;
  }
}

function showFor(link: HTMLAnchorElement, tag: string): void {
  if (openFor === link) {
    closeTagWiki();
    return;
  }
  closeTagWiki();
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", PANEL_LABEL);
  fill(panel, tag, null);
  document.body.append(panel);
  place(panel, link);
  openFor = link;
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("pointerdown", onPointerDown, true);
  void readAnswer(tag, link.href).then((answer) => {
    // The panel may have been closed, or opened for another tag, meanwhile.
    if (openFor === link && panel.isConnected) {
      fill(panel, tag, answer);
      place(panel, link);
    }
  });
}

function onSidebarClick(event: MouseEvent): void {
  if (!document.body.classList.contains(BODY_CLASS)) {
    return;
  }
  // A click with a modifier is the browser's: a new tab, a new window.
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return;
  }
  const target = event.target;
  const link = target instanceof Element ? target.closest("a") : null;
  if (
    !(link instanceof HTMLAnchorElement) ||
    (link.textContent ?? "").trim() !== HELP_LINK_TEXT ||
    !(link.getAttribute("href") ?? "").includes(WIKI_HREF_MARK)
  ) {
    return;
  }
  const row = link.closest("li");
  const tag = row === null ? null : sidebarRowTag(row);
  if (tag === null) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  showFor(link, tag);
}

let boundSidebar: Element | null = null;

function mountTagWiki(_ctx: FeatureContext): void {
  const sidebar = document.querySelector(SIDEBAR_SELECTOR);
  if (sidebar === null || sidebar === boundSidebar) {
    return;
  }
  boundSidebar = sidebar;
  sidebar.addEventListener("click", (event) => {
    if (event instanceof MouseEvent) {
      onSidebarClick(event);
    }
  });
}

/** Forgets the kept answers and the open panel (tests). */
export function resetTagWikiState(): void {
  closeTagWiki();
  answers.clear();
  boundSidebar = null;
}

export const tagWikiFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: ["list", "post"],
  defaultEnabled: true,
  cssOnly: true,
  settingsCaption:
    "Shows the wiki text beside the tag instead of opening the wiki. Two requests on a click: the wiki search and the entry.",
  css: FEATURE_CSS,
  mount: mountTagWiki,
};
