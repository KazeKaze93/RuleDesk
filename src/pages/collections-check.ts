import { COLLECTION_KIND_SEARCH } from "../config/constants";
import { buildSearchUrl, isUnfilteredQuery } from "../search/query";
import { fetchNextPage } from "../site/next-page";
import { readFirstThumbUrls, readResultCount } from "../site/result-page";
import { extractPostIdFromThumb } from "../site/selectors";
import type { Collection } from "../storage/schema";
import { setDynamicCover, setDynamicNewest, setDynamicPostCount } from "../storage/store";

/**
 * "Check for new" on the Collections page: reads the first results page of
 * every saved search. From it the card gets its cover and post count (as on a
 * visit to the search), and the newest post is remembered, so a card can say
 * that there is something new since you last opened it.
 *
 * One request per saved search, one at a time with a pause, and only when the
 * button is pressed. The run stops at the first failure: the site answers 429
 * when asked too often, and going on would only make that worse.
 */

/** Pause between two requests of a run. A shorter one got the site's 429. */
export const CHECK_INTERVAL_MS = 1500;
/** After a refusal the run waits this long and asks once more before it stops. */
export const CHECK_RETRY_MS = 8000;
/** How many previews a card cover takes. */
const COVER_SIZE = 4;
const SORT_TOKEN_PREFIX = "sort:";

/** The saved searches a check reads: every one with a query. */
export function checkableCollections(collections: readonly Collection[]): Collection[] {
  return collections.filter(
    (collection) =>
      collection.kind === COLLECTION_KIND_SEARCH &&
      !isUnfilteredQuery((collection.query ?? "").trim()),
  );
}

/**
 * True for a search in the site's default order. Under another order the
 * first page does not hold the newest post, so its top says nothing about
 * what is new.
 */
export function hasDefaultOrder(collection: Collection): boolean {
  return !(collection.query ?? "")
    .toLowerCase()
    .split(/\s+/)
    .some((token) => token.startsWith(SORT_TOKEN_PREFIX));
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
      const url = buildSearchUrl(collection.tags);
      const page = await fetchNextPage(url).catch(async () => {
        await pause(CHECK_RETRY_MS);
        return fetchNextPage(url);
      });
      const list = page.thumbs[0]?.parentElement ?? null;
      const doc = page.thumbs[0]?.ownerDocument ?? null;
      if (list !== null) {
        setDynamicCover(collection.id, readFirstThumbUrls(list, COVER_SIZE));
      }
      if (doc !== null) {
        const count = readResultCount(doc, (collection.query ?? "").trim());
        if (count !== null) {
          setDynamicPostCount(collection.id, count);
        }
      }
      if (hasDefaultOrder(collection)) {
        // A search never opened since marks exist has nothing to compare with:
        // what it shows now becomes the point later checks are measured from.
        setDynamicNewest(
          collection.id,
          newestPostIdOf(page.thumbs),
          collection.openedPostId === undefined,
        );
      }
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
