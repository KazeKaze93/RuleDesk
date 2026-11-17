import type { TagCount } from "./favorites-search";

/**
 * Suggestions for the search field of the Favorites page. Pure: no storage,
 * no page, no requests. The tags come from the local index of favorites, so
 * only a tag that some favorite has is offered, with the number of favorites
 * that have it.
 *
 * The word the caret stands in is the one completed; the rest of the query
 * is left alone. `-` before the word is kept, and the list then says that
 * the tag will be excluded. Only tags are offered: the order has a switch of
 * its own on the page.
 */

export const SUGGEST_LIMIT = 20;
/** A word of the query grammar, not a tag: nothing is offered for it. */
const GRAMMAR_WORDS: ReadonlySet<string> = new Set(["(", ")", "~"]);
const EXCLUDE_PREFIX = "-";
const WILDCARD = "*";
const SPACE = /\s/;

export const GROUP_STARTS = "starts";
export const GROUP_INSIDE = "inside";
export type SuggestGroup = typeof GROUP_STARTS | typeof GROUP_INSIDE;

export type Suggestion = {
  /** What is put into the field in place of the word. */
  readonly insert: string;
  /** The text shown: the tag, with its minus when it will be excluded. */
  readonly label: string;
  /** Where in `label` the typed part is, to be set off. */
  readonly matchStart: number;
  readonly matchLength: number;
  /** How many favorites have the tag; null for a command. */
  readonly count: number | null;
  /** A word of explanation in place of the count (commands). */
  readonly caption: string | null;
  readonly group: SuggestGroup;
};

export type Suggestions = {
  /** A line over the list, or null. */
  readonly heading: string | null;
  readonly items: readonly Suggestion[];
};

export type QueryWord = {
  readonly start: number;
  readonly end: number;
  /** The word without its minus, lower case. */
  readonly body: string;
  readonly negated: boolean;
};

export const EXCLUDE_HEADING = "Exclude";

/** The word the caret stands in or right after; null between words. */
export function wordAtCaret(text: string, caret: number): QueryWord | null {
  const at = Math.max(0, Math.min(caret, text.length));
  let start = at;
  while (start > 0 && !SPACE.test(text.charAt(start - 1))) {
    start -= 1;
  }
  let end = at;
  while (end < text.length && !SPACE.test(text.charAt(end))) {
    end += 1;
  }
  if (start === end) {
    return null;
  }
  const raw = text.slice(start, end).toLowerCase();
  const negated = raw.startsWith(EXCLUDE_PREFIX);
  return {
    start,
    end,
    body: negated ? raw.slice(EXCLUDE_PREFIX.length) : raw,
    negated,
  };
}

/**
 * What to offer for the word. An exact tag stands first, then the tags that
 * begin with what was typed, then those that hold it inside; within each, the
 * tag more favorites have comes first. `tags` is every tag with its count.
 */
export function suggestFor(tags: readonly TagCount[], word: QueryWord | null): Suggestions | null {
  if (word === null || word.body.length === 0) {
    return null;
  }
  const { body, negated } = word;
  if (GRAMMAR_WORDS.has(body) || body.includes(WILDCARD)) {
    return null;
  }
  const prefix = negated ? EXCLUDE_PREFIX : "";
  const items: Suggestion[] = [];
  const starts: TagCount[] = [];
  const inside: TagCount[] = [];
  let exact: TagCount | null = null;
  for (const item of tags) {
    if (item.tag === body) {
      exact = item;
    } else if (item.tag.startsWith(body)) {
      starts.push(item);
    } else if (item.tag.includes(body)) {
      inside.push(item);
    }
  }
  const byCount = (a: TagCount, b: TagCount): number =>
    b.count - a.count || a.tag.localeCompare(b.tag);
  starts.sort(byCount);
  inside.sort(byCount);
  const toSuggestion = (item: TagCount, group: SuggestGroup): Suggestion => ({
    insert: `${prefix}${item.tag}`,
    label: `${prefix}${item.tag}`,
    matchStart: prefix.length + item.tag.indexOf(body),
    matchLength: body.length,
    count: item.count,
    caption: null,
    group,
  });
  for (const item of exact === null ? starts : [exact, ...starts]) {
    items.push(toSuggestion(item, GROUP_STARTS));
  }
  for (const item of inside) {
    items.push(toSuggestion(item, GROUP_INSIDE));
  }
  // A word that is already a whole tag, with nothing longer to offer, needs no list.
  if (items.length === 0 || (items.length === 1 && exact !== null)) {
    return null;
  }
  return {
    heading: negated ? EXCLUDE_HEADING : null,
    items: items.slice(0, SUGGEST_LIMIT),
  };
}

export type Completed = { readonly text: string; readonly caret: number };

/** The query with the word replaced by the suggestion, ready for the next word. */
export function completeWord(text: string, word: QueryWord, insert: string): Completed {
  const before = text.slice(0, word.start);
  const after = text.slice(word.end);
  const gap = after.length === 0 || !SPACE.test(after.charAt(0)) ? " " : "";
  const head = `${before}${insert}${gap}`;
  // The caret goes after the space that follows the tag, typed or already there.
  const caret = gap.length > 0 ? head.length : head.length + 1;
  return { text: `${head}${after}`, caret: Math.min(caret, head.length + after.length) };
}

/**
 * The plain words of a query that are no tag of any favorite, in the order
 * typed: what an empty result is most likely owed to.
 */
export function unknownWords(text: string, tags: readonly TagCount[]): string[] {
  const known = new Set(tags.map((item) => item.tag));
  const unknown: string[] = [];
  for (const raw of text.toLowerCase().split(/\s+/)) {
    if (
      raw.length === 0 ||
      raw.startsWith(EXCLUDE_PREFIX) ||
      GRAMMAR_WORDS.has(raw) ||
      raw.includes(WILDCARD) ||
      raw.includes(":") ||
      known.has(raw)
    ) {
      continue;
    }
    unknown.push(raw);
  }
  return unknown;
}

/**
 * The tag to offer in place of a word that is no tag: the one with the least
 * added to the word. A tag that begins with the word is taken before one
 * that holds it inside; of two as long, the one more favorites have.
 */
export function closestTag(tags: readonly TagCount[], word: string): TagCount | null {
  let best: TagCount | null = null;
  let bestStarts = false;
  for (const item of tags) {
    if (item.tag === word || !item.tag.includes(word)) {
      continue;
    }
    const starts = item.tag.startsWith(word);
    const better =
      best === null ||
      (starts && !bestStarts) ||
      (starts === bestStarts &&
        (item.tag.length < best.tag.length ||
          (item.tag.length === best.tag.length && item.count > best.count)));
    if (better) {
      best = item;
      bestStarts = starts;
    }
  }
  return best;
}
