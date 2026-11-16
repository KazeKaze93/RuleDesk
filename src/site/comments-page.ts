import { SITE_SELECTORS } from "./selectors";
import { markVideoThumbs, mountGifMarks } from "./video-thumbs";

/**
 * The site's Comments page: a list of posts, each with its preview, its whole
 * tag list and its latest comments.
 *
 * - Video posts get the mark the outline and the hover preview go by.
 * - A long tag list is folded to a few lines, with a button that opens it.
 *
 * The page is recognised by its markup, not by its address.
 */

export const TAGS_COLLAPSED_CLASS = "rdw-tags-collapsed";
export const TAGS_TOGGLE_CLASS = "rdw-tags-toggle";

const STYLE_ID = "rdw-comments-page-style";
/** How many lines of tags stay visible while the list is folded. */
const COLLAPSED_LINES = 3;
/** Rounding slack when comparing the full height with the folded one. */
const OVERFLOW_SLACK_PX = 1;
const TAG_SELECTOR = ":scope > span";
const ARIA_EXPANDED = "aria-expanded";

const COMMENTS_PAGE_CSS = `
${SITE_SELECTORS.commentTags}.${TAGS_COLLAPSED_CLASS} {
  max-height: ${String(COLLAPSED_LINES)}lh !important;
  overflow: hidden !important;
}
.${TAGS_TOGGLE_CLASS} {
  display: block;
  margin: 4px 0 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.${TAGS_TOGGLE_CLASS}:hover {
  color: var(--rdw-text);
}
.${TAGS_TOGGLE_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`.trim();

export function isCommentsPage(root: ParentNode = document): boolean {
  return root.querySelector(SITE_SELECTORS.commentList) !== null;
}

function showAllLabel(count: number): string {
  return `Show all ${String(count)} tags`;
}

const SHOW_FEWER_LABEL = "Show fewer tags";

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = COMMENTS_PAGE_CSS;
  document.head.append(style);
}

/**
 * Folds one tag list when it is taller than the folded height and puts the
 * button under it. A list that fits is left as it is.
 */
function foldTags(tags: HTMLElement): boolean {
  tags.classList.add(TAGS_COLLAPSED_CLASS);
  if (tags.scrollHeight <= tags.clientHeight + OVERFLOW_SLACK_PX) {
    tags.classList.remove(TAGS_COLLAPSED_CLASS);
    return false;
  }
  const collapsedLabel = showAllLabel(tags.querySelectorAll(TAG_SELECTOR).length);
  const button = document.createElement("button");
  button.type = "button";
  button.className = TAGS_TOGGLE_CLASS;
  button.textContent = collapsedLabel;
  button.setAttribute(ARIA_EXPANDED, "false");
  button.addEventListener("click", () => {
    const collapsed = tags.classList.toggle(TAGS_COLLAPSED_CLASS);
    button.textContent = collapsed ? collapsedLabel : SHOW_FEWER_LABEL;
    button.setAttribute(ARIA_EXPANDED, collapsed ? "false" : "true");
  });
  tags.after(button);
  return true;
}

/** Folds the long tag lists under `root`; returns how many it folded. */
export function foldLongTagLists(root: ParentNode = document): number {
  let folded = 0;
  for (const tags of root.querySelectorAll(SITE_SELECTORS.commentTags)) {
    if (tags instanceof HTMLElement && foldTags(tags)) {
      folded += 1;
    }
  }
  return folded;
}

/** Does nothing on a page that is not the Comments list. */
export function mountCommentsPage(): void {
  if (!isCommentsPage()) {
    return;
  }
  ensureStyle();
  markVideoThumbs(document, SITE_SELECTORS.commentThumb);
  mountGifMarks(SITE_SELECTORS.commentThumb);
  foldLongTagLists();
}
