/** Read-only helpers for native post-page markup used by the side panel. */

export const LINK_LIST_SELECTOR = "div.link-list ul";
export const STATS_SELECTOR = "div#stats";
export const STATS_LIST_SELECTOR = "div#stats > ul";
export const FLEXI_SELECTOR =
  "#fit-to-screen div.flexi, div#right-col div.flexi, div.flexi";
export const IMAGE_ID = "image";
export const HEADER_SELECTOR = "div#header";
export const POST_COMMENTS_ID = "post-comments";
export const COMMENT_LIST_ID = "comment-list";

export const ORIGINAL_LINK_TEXT = "Original image";
export const ICAME_ONCLICK_PREFIX = "iCame(";
export const ICAME_ANCHOR_SELECTOR = `a[onclick^="${ICAME_ONCLICK_PREFIX}"]`;
export const MORE_LINK_TEXTS = [
  "Edit",
  "Resize image",
  "Report to moderation",
  "Add Note",
] as const;

export type MoreLinkText = (typeof MORE_LINK_TEXTS)[number];

/** Panel row labels (Posted date and By author are split from one site li). */
export const PANEL_STAT_LABELS = [
  "Id",
  "Posted",
  "By",
  "Size",
  "Source",
  "Rating",
] as const;

export type PanelStatLabel = (typeof PANEL_STAT_LABELS)[number];

export type StatRow = {
  readonly label: PanelStatLabel;
  readonly value: string;
  readonly href: string | null;
};

export type MoreLink = {
  readonly text: MoreLinkText;
  readonly anchor: HTMLAnchorElement;
};

export type ICameTarget = {
  readonly anchor: HTMLAnchorElement;
  /** Digits-only counter when found next to the native control; else null. */
  readonly count: string | null;
};

const SCORE_SPAN_ID_PREFIX = "psc";
const STAT_PREFIX_RE = /^(Id|Posted|Size|Source|Rating|Score)\s*:/i;
const WHITESPACE_RE = /\s+/g;
const BY_SPLIT_RE = /\bby\b/i;
const DIGITS_ONLY_RE = /^\d+$/;
const COUNTER_CANDIDATE_SELECTOR = "span, b, strong, em, small";

const SOURCE_REL = "nofollow noreferrer";

function isMoreLinkText(value: string): value is MoreLinkText {
  for (const entry of MORE_LINK_TEXTS) {
    if (entry === value) {
      return true;
    }
  }
  return false;
}

function normalizeSpace(value: string): string {
  return value.replace(WHITESPACE_RE, " ").trim();
}

function liPrefixLabel(li: HTMLElement): string | null {
  const full = normalizeSpace(li.textContent ?? "");
  const match = STAT_PREFIX_RE.exec(full);
  if (match === null) {
    return null;
  }
  const raw = match[1];
  if (raw === undefined) {
    return null;
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/**
 * The site's notice on the page of a deleted post (from Kaze, 19.11.2026):
 * `div.status-notices > div.status-notice`, "This post was deleted. Reason:
 * tos / MD5: <hash>". The page has no picture then.
 */
const DELETED_NOTICE_SELECTOR = "div.status-notices > div.status-notice";
const DELETED_PREFIX = "This post was deleted";
const DELETED_REASON = /Reason:\s*(.*?)\s*(?:\/\s*MD5:|$)/;
const DELETED_MD5 = /MD5:\s*([0-9a-f]+)/i;

export type DeletedNotice = {
  readonly element: HTMLElement;
  /** What the site gives as the reason; empty when it gives none. */
  readonly reason: string;
  /** The hash of the file that was there; empty when the notice has none. */
  readonly md5: string;
};

export function findDeletedNotice(root: ParentNode = document): DeletedNotice | null {
  for (const element of root.querySelectorAll(DELETED_NOTICE_SELECTOR)) {
    const text = element.textContent?.trim() ?? "";
    if (!(element instanceof HTMLElement) || !text.startsWith(DELETED_PREFIX)) {
      continue;
    }
    return {
      element,
      reason: DELETED_REASON.exec(text)?.[1] ?? "",
      md5: DELETED_MD5.exec(text)?.[1] ?? "",
    };
  }
  return null;
}

export function findFlexi(): HTMLElement | null {
  const node = document.querySelector(FLEXI_SELECTOR);
  return node instanceof HTMLElement ? node : null;
}

/**
 * Media / player wrapper = flexi child that holds video or img#image
 * (never the panel host). Video posts have no img#image — use the player block.
 */
export function findMediaWrapper(
  flexi: HTMLElement,
  panelId: string,
): HTMLElement | null {
  for (const child of flexi.children) {
    if (!(child instanceof HTMLElement)) {
      continue;
    }
    if (child.id === panelId) {
      continue;
    }
    if (child.querySelector("video") !== null) {
      return child;
    }
  }
  for (const child of flexi.children) {
    if (!(child instanceof HTMLElement)) {
      continue;
    }
    if (child.id === panelId) {
      continue;
    }
    if (child.querySelector(`#${IMAGE_ID}`) !== null) {
      return child;
    }
  }
  for (const child of flexi.children) {
    if (!(child instanceof HTMLElement)) {
      continue;
    }
    if (child.id === panelId) {
      continue;
    }
    return child;
  }
  return null;
}

export function findOriginalAnchor(): HTMLAnchorElement | null {
  const list = document.querySelector(LINK_LIST_SELECTOR);
  const roots: ParentNode[] =
    list !== null ? [list, document] : [document];
  for (const root of roots) {
    const links = root.querySelectorAll("a[href]");
    for (const node of links) {
      if (!(node instanceof HTMLAnchorElement)) {
        continue;
      }
      if (node.textContent?.trim() !== ORIGINAL_LINK_TEXT) {
        continue;
      }
      const href = node.getAttribute("href");
      if (href === null || href.length === 0 || href === "#") {
        continue;
      }
      return node;
    }
  }
  return null;
}

export function collectMoreLinks(): MoreLink[] {
  const list = document.querySelector(LINK_LIST_SELECTOR);
  if (list === null) {
    return [];
  }
  const result: MoreLink[] = [];
  const links = list.querySelectorAll("a[href]");
  for (const node of links) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    const text = node.textContent?.trim() ?? "";
    if (!isMoreLinkText(text)) {
      continue;
    }
    result.push({ text, anchor: node });
  }
  return result;
}

export function scoreSpanId(postId: string): string {
  return `${SCORE_SPAN_ID_PREFIX}${postId}`;
}

export function findScoreSpan(postId: string): HTMLElement | null {
  const span = document.getElementById(scoreSpanId(postId));
  return span instanceof HTMLElement ? span : null;
}

export function readScoreText(postId: string): string | null {
  const span = findScoreSpan(postId);
  if (span === null) {
    return null;
  }
  const text = span.textContent?.trim() ?? "";
  return text.length > 0 ? text : null;
}

export function writeScoreText(postId: string, score: number): void {
  const span = findScoreSpan(postId);
  if (span !== null) {
    span.textContent = String(score);
  }
}

/** Keep panel score in sync when the site mutates span#psc{ID}. */
export function observeScoreSpan(
  postId: string,
  onChange: (text: string) => void,
): () => void {
  const span = findScoreSpan(postId);
  if (span === null) {
    return (): void => {};
  }
  const emit = (): void => {
    onChange(span.textContent?.trim() ?? "");
  };
  const observer = new MutationObserver(emit);
  observer.observe(span, {
    characterData: true,
    childList: true,
    subtree: true,
  });
  return (): void => {
    observer.disconnect();
  };
}

function parsePostedRows(li: HTMLElement): StatRow[] {
  const rows: StatRow[] = [];
  const authorLink = li.querySelector("a[href]");
  let authorName: string | null = null;
  let authorHref: string | null = null;
  if (authorLink instanceof HTMLAnchorElement) {
    const href = authorLink.getAttribute("href");
    const name = authorLink.textContent?.trim() ?? "";
    if (href !== null && href.length > 0 && name.length > 0) {
      authorName = name;
      authorHref = href;
    }
  }

  const clone = li.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    return rows;
  }
  for (const node of clone.querySelectorAll("a")) {
    node.remove();
  }
  for (const node of clone.querySelectorAll("br")) {
    node.replaceWith(" ");
  }
  let dateText = normalizeSpace(clone.textContent ?? "");
  dateText = dateText.replace(/^Posted\s*:\s*/i, "");
  dateText = dateText.replace(BY_SPLIT_RE, "").trim();
  dateText = normalizeSpace(dateText);

  if (dateText.length > 0) {
    rows.push({ label: "Posted", value: dateText, href: null });
  }
  if (authorName !== null && authorHref !== null) {
    rows.push({ label: "By", value: authorName, href: authorHref });
  }
  return rows;
}

function parseSourceRow(li: HTMLElement): StatRow | null {
  const link = li.querySelector("a[href]");
  if (!(link instanceof HTMLAnchorElement)) {
    return null;
  }
  const href = link.getAttribute("href");
  if (href === null || href.length === 0 || href === "#") {
    return null;
  }
  const text = link.textContent?.trim() ?? "";
  return {
    label: "Source",
    value: text.length > 0 ? text : href,
    href,
  };
}

function parseSimpleRow(
  li: HTMLElement,
  label: "Id" | "Size" | "Rating",
): StatRow | null {
  const full = normalizeSpace(li.textContent ?? "");
  const prefix = `${label}:`;
  const lower = full.toLowerCase();
  const prefixLower = prefix.toLowerCase();
  if (!lower.startsWith(prefixLower)) {
    return null;
  }
  const value = full.slice(prefix.length).trim();
  if (value.length === 0) {
    return null;
  }
  return { label, value, href: null };
}

/**
 * Parse statistics lis by prefix before colon.
 * Posted → date + By (author link) as separate rows. Score is not a stats row.
 */
export function readStatRows(): StatRow[] {
  const stats = document.querySelector(STATS_SELECTOR);
  if (stats === null) {
    return [];
  }
  const rows: StatRow[] = [];
  const seen = new Set<PanelStatLabel>();
  const items = stats.querySelectorAll("li");
  for (const node of items) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const prefix = liPrefixLabel(node);
    if (prefix === null || prefix === "Score") {
      continue;
    }
    if (prefix === "Posted") {
      for (const row of parsePostedRows(node)) {
        if (!seen.has(row.label)) {
          seen.add(row.label);
          rows.push(row);
        }
      }
      continue;
    }
    if (prefix === "Source") {
      if (seen.has("Source")) {
        continue;
      }
      const row = parseSourceRow(node);
      if (row !== null) {
        seen.add("Source");
        rows.push(row);
      }
      continue;
    }
    if (prefix === "Id" || prefix === "Size" || prefix === "Rating") {
      if (seen.has(prefix)) {
        continue;
      }
      const row = parseSimpleRow(node, prefix);
      if (row !== null) {
        seen.add(prefix);
        rows.push(row);
      }
    }
  }
  return rows;
}

export const SOURCE_LINK_REL = SOURCE_REL;

function readDigitsCandidate(node: Element): string | null {
  const text = normalizeSpace(node.textContent ?? "");
  if (DIGITS_ONLY_RE.test(text)) {
    return text;
  }
  return null;
}

function readCountInElement(root: Element): string | null {
  for (const node of root.querySelectorAll(COUNTER_CANDIDATE_SELECTOR)) {
    const digits = readDigitsCandidate(node);
    if (digits !== null) {
      return digits;
    }
  }
  const own = readDigitsCandidate(root);
  if (own !== null) {
    return own;
  }
  return null;
}

/**
 * Look for a numeric counter in the same li or immediate neighbor lis/elements.
 * Does not scan the whole stats ul (would false-match span#psc{ID}).
 * No known site counter element → returns null (report «нужна разметка»).
 */
export function findICameCount(anchor: HTMLAnchorElement): string | null {
  const li = anchor.closest("li");
  if (li !== null) {
    for (const node of li.querySelectorAll(COUNTER_CANDIDATE_SELECTOR)) {
      if (anchor.contains(node)) {
        continue;
      }
      const digits = readDigitsCandidate(node);
      if (digits !== null) {
        return digits;
      }
    }
    for (const child of li.childNodes) {
      if (child.nodeType !== Node.TEXT_NODE) {
        continue;
      }
      const digits = normalizeSpace(child.textContent ?? "");
      if (DIGITS_ONLY_RE.test(digits)) {
        return digits;
      }
    }

    const neighborLis = [li.previousElementSibling, li.nextElementSibling];
    for (const neighbor of neighborLis) {
      if (!(neighbor instanceof HTMLElement)) {
        continue;
      }
      if (neighbor.querySelector(ICAME_ANCHOR_SELECTOR) !== null) {
        continue;
      }
      if (liPrefixLabel(neighbor) !== null) {
        continue;
      }
      const digits = readCountInElement(neighbor);
      if (digits !== null) {
        return digits;
      }
    }
  }

  const sibling = anchor.nextElementSibling;
  if (sibling !== null) {
    const digits = readCountInElement(sibling);
    if (digits !== null) {
      return digits;
    }
  }
  return null;
}

export function findICameTarget(): ICameTarget | null {
  const statsList = document.querySelector(STATS_LIST_SELECTOR);
  const scoped =
    statsList?.querySelector(ICAME_ANCHOR_SELECTOR) ??
    document.querySelector(ICAME_ANCHOR_SELECTOR);
  if (!(scoped instanceof HTMLAnchorElement)) {
    return null;
  }
  return {
    anchor: scoped,
    count: findICameCount(scoped),
  };
}

export function measureHeaderOffsetPx(gapPx: number): number {
  const header = document.querySelector(HEADER_SELECTOR);
  if (!(header instanceof HTMLElement)) {
    return gapPx;
  }
  return header.getBoundingClientRect().height + gapPx;
}

/** Native comments block on the post page (moved into the panel, not cloned). */
export function findPostComments(): HTMLElement | null {
  const node = document.getElementById(POST_COMMENTS_ID);
  return node instanceof HTMLElement ? node : null;
}

const COMMENT_COUNT_RE = /^(\d+)\s+comments?\b/i;

/**
 * Parse leading «N comment(s)» from the first non-empty text node under
 * div#comment-list (not full textContent — child nodes glue into one word
 * and break the trailing word-boundary).
 * Returns null when the list is missing or the prefix is unparseable.
 */
export function readCommentCount(): number | null {
  const list = document.getElementById(COMMENT_LIST_ID);
  if (list === null) {
    return null;
  }
  for (const child of list.childNodes) {
    if (child.nodeType !== Node.TEXT_NODE) {
      continue;
    }
    const text = normalizeSpace(child.textContent ?? "");
    if (text.length === 0) {
      continue;
    }
    const match = COMMENT_COUNT_RE.exec(text);
    if (match === null) {
      return null;
    }
    const raw = match[1];
    if (raw === undefined) {
      return null;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return Math.trunc(parsed);
  }
  return null;
}
