import { getFeatureEnabled } from "../storage/store";
import { AUTOCOMPLETE_MIN_CHARS, fetchAutocompleteResult } from "./autocomplete";
import { rememberTagKinds, tagKey, tagSeen } from "./tag-types";

/**
 * The kind of a tag the script has not seen on the site yet, asked of the
 * site's tag suggestions: the same request a search field makes while a tag
 * is typed, with the whole tag in it (Kaze agreed to it on 19.11.2026: it is
 * made without an action of his, when a chip of an unknown tag is drawn).
 *
 * One request a tag, one at a time, a pause between two, a limit on a page,
 * and never twice: what the site answered is remembered, a general tag too. A
 * failed request ends the run; what was left is asked on another page.
 */

/** In the settings: off, no chip asks the site for anything. */
export const TAG_KIND_LOOKUP_SETTING_ID = "tag-kind-lookup";
export const TAG_KIND_LOOKUP_DEFAULT = true;
/** Between two requests of a run; the pace of the script's other requests. */
export const TAG_KIND_LOOKUP_PAUSE_MS = 1100;
/** How many tags one opening of a page may ask about. */
export const TAG_KIND_LOOKUP_PAGE_LIMIT = 30;
/** What a tag is taken for when the site names no kind, or does not list it. */
const KIND_GENERAL = "general";
/** `rating:safe`, `score:>=10`: not a tag. */
const FILTER_MARK = ":";
/** `cat*`: a pattern, not a tag. */
const WILDCARD = "*";

let queue: string[] = [];
let running = false;
let askedOnPage = 0;
const asked = new Set<string>();
const listeners = new Set<() => void>();

/** Called when the kind of some tag was learned; returns the way to stop listening. */
export function onTagKindsLearned(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function run(): Promise<void> {
  running = true;
  for (let key = queue.shift(); key !== undefined; key = queue.shift()) {
    const items = await fetchAutocompleteResult(key);
    if (items === null) {
      // The site did not answer: the rest are not asked now, and none is
      // taken for asked, so another page tries them.
      for (const left of [key, ...queue]) {
        asked.delete(left);
      }
      queue = [];
      break;
    }
    const tag = key;
    const exact = items.find((item) => tagKey(item.value) === tag);
    rememberTagKinds([[tag, exact?.type ?? KIND_GENERAL]], { general: true });
    for (const listener of listeners) {
      listener();
    }
    if (queue.length > 0) {
      await wait(TAG_KIND_LOOKUP_PAUSE_MS);
    }
  }
  running = false;
}

/** Asks the site, in its turn, about each of these tags that is not known yet. */
export function lookUpTagKinds(tags: readonly string[]): void {
  try {
    if (!getFeatureEnabled(TAG_KIND_LOOKUP_SETTING_ID, TAG_KIND_LOOKUP_DEFAULT)) {
      return;
    }
  } catch {
    // Without the storage the answer could not be kept: nothing is asked.
    return;
  }
  for (const tag of tags) {
    const key = tagKey(tag);
    if (
      key.length < AUTOCOMPLETE_MIN_CHARS ||
      key.includes(FILTER_MARK) ||
      key.includes(WILDCARD) ||
      asked.has(key) ||
      tagSeen(key) ||
      askedOnPage >= TAG_KIND_LOOKUP_PAGE_LIMIT
    ) {
      continue;
    }
    asked.add(key);
    askedOnPage += 1;
    queue.push(key);
  }
  if (!running && queue.length > 0) {
    void run();
  }
}

/** For the tests: as on a page just opened. */
export function resetTagKindLookup(): void {
  queue = [];
  running = false;
  askedOnPage = 0;
  asked.clear();
  listeners.clear();
}
