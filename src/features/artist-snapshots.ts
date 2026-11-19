import { SEARCH_PARAM_PID, SEARCH_PARAM_TAGS } from "../config/constants";
import { queryHasSortRandom } from "../search/query";
import { readArtistSnapshot } from "../site/artist-snapshot";
import { readSingleTag, readThumbTags } from "../site/result-page";
import { SITE_SELECTORS, extractPostIdFromThumb } from "../site/selectors";
import {
  listArtistTags,
  rememberArtistLastPosts,
  rememberArtistSnapshot,
} from "../storage/store";
import { onThumbsAdded, type ThumbRoot } from "../site/thumbs-bus";

/**
 * Keeps what the Following page shows about each followed artist (cover, post
 * count, newest post) up to date from pages the user opens anyway.
 * Nothing here makes a request.
 */

const FIRST_PAGE_PID = "0";

let unsubscribe: (() => void) | undefined;

/** Clears the thumbs subscription (tests). */
export function resetArtistSnapshotsState(): void {
  if (unsubscribe !== undefined) {
    unsubscribe();
    unsubscribe = undefined;
  }
}

/**
 * Newest post per followed artist among the thumbs under `root`.
 * A thumb's tags come from its preview title, so any results page counts:
 * the feed, a search, pages appended while scrolling.
 */
function rememberFromThumbs(root: ThumbRoot, followed: ReadonlySet<string>): void {
  const newest = new Map<string, number>();
  for (const thumb of root.querySelectorAll(SITE_SELECTORS.thumb)) {
    const raw = extractPostIdFromThumb(thumb);
    const id = raw === null ? Number.NaN : Number(raw);
    if (!Number.isFinite(id)) {
      continue;
    }
    for (const tag of readThumbTags(thumb)) {
      if (followed.has(tag) && id > (newest.get(tag) ?? 0)) {
        newest.set(tag, id);
      }
    }
  }
  if (newest.size > 0) {
    rememberArtistLastPosts(newest);
  }
}

function isFirstPage(search: string): boolean {
  const pid = new URLSearchParams(search).get(SEARCH_PARAM_PID);
  return pid === null || pid.length === 0 || pid === FIRST_PAGE_PID;
}

/** Call once per results page. Does nothing while no artist is followed. */
export function rememberArtistsFromPage(search: string): void {
  const followed = new Set(listArtistTags());
  if (followed.size === 0) {
    return;
  }
  const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS) ?? "";
  const single = readSingleTag(tagsParam);
  if (
    single !== null &&
    followed.has(single) &&
    isFirstPage(search) &&
    !queryHasSortRandom(tagsParam)
  ) {
    // The artist's own first page: cover and exact count as well.
    rememberArtistSnapshot(single, readArtistSnapshot(document, single));
  }
  rememberFromThumbs(document, followed);
  if (unsubscribe === undefined) {
    unsubscribe = onThumbsAdded((root) => {
      rememberFromThumbs(root, new Set(listArtistTags()));
    });
  }
}
