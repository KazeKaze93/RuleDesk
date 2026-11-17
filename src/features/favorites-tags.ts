import type { FavoriteIndexEntry } from "../storage/favorites-index";

/**
 * The tags of the favorites index, put right as far as they can be.
 *
 * An entry read from a favorites page has a damaged tag list: the site cuts
 * one character off each end of it, so the first tag lacks its first letter
 * and the last tag its last (`ai_generated … zootopia` is kept as
 * `i_generated … zootopi`). An entry made when a post was made a favorite
 * from the grid or from its own page has the list whole.
 *
 * The damaged ends are restored from what is whole: the tags of whole
 * entries, and the tags that stand inside a cut list. A cut `zootopi` becomes
 * `zootopia` when that is the only known tag one letter longer at that end.
 * When there are several such tags, or none, the end stays as it is and is
 * marked: the search then tries the cut spellings on it, and the counts of
 * tags leave it out. Pure: no storage, no page. Nothing is written back: the
 * index keeps what was read, and the next "Full resync" flags every entry.
 *
 * `cut` on an entry says where it came from; an entry written before that
 * flag existed has none, and its ends are judged by the tags themselves.
 */

const TAG_SEPARATOR = /\s+/;
const CUT_LENGTH = 1;

/**
 * What is known of a tag at an end of the list: it is whole; it is cut and
 * could not be restored; or, on an entry without the flag, it may be either.
 */
export const END_WHOLE = "whole";
export const END_CUT = "cut";
export const END_UNKNOWN = "unknown";
export type EndState = typeof END_WHOLE | typeof END_CUT | typeof END_UNKNOWN;

export type FavoriteTags = FavoriteIndexEntry & {
  /** The tags, restored where that was possible. */
  readonly tagList: readonly string[];
  /** The first tag: whether it still lacks its first character. */
  readonly firstEnd: EndState;
  /** The last tag: whether it still lacks its last character. */
  readonly lastEnd: EndState;
};

function splitTags(text: string): string[] {
  return text
    .trim()
    .split(TAG_SEPARATOR)
    .filter((tag) => tag.length > 0);
}

function addTo(map: Map<string, Set<string>>, key: string, tag: string): void {
  const known = map.get(key);
  if (known === undefined) {
    map.set(key, new Set([tag]));
  } else {
    known.add(tag);
  }
}

function only(tags: ReadonlySet<string> | undefined): string | null {
  if (tags?.size !== 1) {
    return null;
  }
  for (const tag of tags) {
    return tag;
  }
  return null;
}

type End = { readonly tag: string; readonly state: EndState };

/**
 * @param stored the tag as the entry holds it
 * @param candidates the whole tags that are `stored` plus one character at this end
 * @param knownWhole whether `stored` is itself a known whole tag
 * @param flagged the entry's own word on it: true cut, false whole, undefined unknown
 */
function restoreEnd(
  stored: string,
  candidates: ReadonlySet<string> | undefined,
  knownWhole: boolean,
  flagged: boolean | undefined,
): End {
  if (flagged === false) {
    return { tag: stored, state: END_WHOLE };
  }
  const single = only(candidates);
  if (flagged === true) {
    return single === null
      ? { tag: stored, state: END_CUT }
      : { tag: single, state: END_WHOLE };
  }
  // An entry without the flag: its end may be whole or cut.
  if (knownWhole && candidates === undefined) {
    return { tag: stored, state: END_WHOLE };
  }
  if (!knownWhole && single !== null) {
    return { tag: single, state: END_WHOLE };
  }
  return { tag: stored, state: END_UNKNOWN };
}

function restore(entries: readonly FavoriteIndexEntry[]): FavoriteTags[] {
  const lists = entries.map((entry) => splitTags(entry.tags));
  // Every tag known whole, and the same tags by what is left of them without
  // their first or their last character.
  const whole = new Set<string>();
  const byNoFirst = new Map<string, Set<string>>();
  const byNoLast = new Map<string, Set<string>>();
  const learn = (tag: string): void => {
    if (whole.has(tag)) {
      return;
    }
    whole.add(tag);
    if (tag.length > CUT_LENGTH) {
      addTo(byNoFirst, tag.slice(CUT_LENGTH), tag);
      addTo(byNoLast, tag.slice(0, -CUT_LENGTH), tag);
    }
  };
  entries.forEach((entry, at) => {
    const tags = lists[at] ?? [];
    const from = entry.cut === false ? 0 : 1;
    const to = entry.cut === false ? tags.length : tags.length - 1;
    for (let index = from; index < to; index += 1) {
      const tag = tags[index];
      if (tag !== undefined) {
        learn(tag);
      }
    }
  });

  return entries.map((entry, at) => {
    const tags = lists[at] ?? [];
    const first = tags[0];
    const last = tags[tags.length - 1];
    if (first === undefined || last === undefined || entry.cut === false) {
      return { ...entry, tagList: tags, firstEnd: END_WHOLE, lastEnd: END_WHOLE };
    }
    if (tags.length === 1) {
      // One tag cut at both ends: nothing to tell it by.
      const state = entry.cut === true ? END_CUT : END_UNKNOWN;
      return { ...entry, tagList: tags, firstEnd: state, lastEnd: state };
    }
    const head = restoreEnd(first, byNoFirst.get(first), whole.has(first), entry.cut);
    const tail = restoreEnd(last, byNoLast.get(last), whole.has(last), entry.cut);
    const tagList = [head.tag, ...tags.slice(1, -1), tail.tag];
    return { ...entry, tagList, firstEnd: head.state, lastEnd: tail.state };
  });
}

const RESTORED = new WeakMap<readonly FavoriteIndexEntry[], FavoriteTags[]>();

/**
 * The entries with their tags restored. The work is done once for a list of
 * entries and kept while that list is alive: the search asks on every key.
 */
export function restoreFavoriteTags(entries: readonly FavoriteIndexEntry[]): FavoriteTags[] {
  const known = RESTORED.get(entries);
  if (known !== undefined) {
    return known;
  }
  const restored = restore(entries);
  RESTORED.set(entries, restored);
  return restored;
}
