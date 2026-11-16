import { COLLECTION_KIND_SEARCH } from "../config/constants";
import { buildSearchUrl, isUnfilteredQuery } from "../search/query";
import { fetchNextPage } from "../site/next-page";
import { extractPostIdFromThumb } from "../site/selectors";
import type { Collection } from "../storage/schema";
import { setDynamicNewest } from "../storage/store";

/**
 * "Check for new" on the Collections page: reads the first results page of
 * every saved search and remembers its newest post, so a card can say that
 * there is something new since you last opened it.
 *
 * One request per saved search, one at a time with a pause, and only when the
 * button is pressed. The run stops at the first failure: the site answers 429
 * when asked too often, and going on would only make that worse.
 */

/** Pause between two requests of a run. */
export const CHECK_INTERVAL_MS = 1500;
const SORT_TOKEN_PREFIX = "sort:";

/**
 * The saved searches a check makes sense for: ones with a query, in the site's
 * default order. Under another order the first page does not hold the newest
 * post, so its top would say nothing.
 */
export function checkableCollections(collections: readonly Collection[]): Collection[] {
  return collections.filter((collection) => {
    if (collection.kind !== COLLECTION_KIND_SEARCH) {
      return false;
    }
    const query = (collection.query ?? "").trim();
    if (isUnfilteredQuery(query)) {
      return false;
    }
    return !query
      .toLowerCase()
      .split(/\s+/)
      .some((token) => token.startsWith(SORT_TOKEN_PREFIX));
  });
}

/** The largest post id among the thumbs, 0 when there are none. */
export function newestPostIdOf(thumbs: readonly Element[]): number {
  let newest = 0;
  for (const thumb of thumbs) {
    const raw = extractPostIdFromThumb(thumb);
    const id = raw === null ? Number.NaN : Number(raw);
    if (Number.isFinite(id) && id > newest) {
      newest = id;
    }
  }
  return newest;
}

export type CheckProgress = {
  readonly done: number;
  readonly total: number;
};

export type CheckResult =
  | { readonly ok: true; readonly checked: number }
  | { readonly ok: false; readonly checked: number; readonly name: string; readonly reason: string };

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function runCollectionsCheck(
  collections: readonly Collection[],
  onProgress: (progress: CheckProgress) => void,
  isCancelled: () => boolean,
): Promise<CheckResult> {
  const total = collections.length;
  let done = 0;
  for (const collection of collections) {
    if (isCancelled()) {
      break;
    }
    try {
      const page = await fetchNextPage(buildSearchUrl(collection.tags));
      setDynamicNewest(collection.id, newestPostIdOf(page.thumbs), false);
    } catch (error) {
      return {
        ok: false,
        checked: done,
        name: collection.name,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
    done += 1;
    onProgress({ done, total });
    if (done < total) {
      await pause(CHECK_INTERVAL_MS);
    }
  }
  return { ok: true, checked: done };
}
