import { SEARCH_PARAM_PID } from "../config/constants";
import { getSyncState, loadFavSet } from "../storage/favs";
import { FAVORITES_SYNC_PID_STEP } from "./favorites-sync";

/**
 * The pager of the site's Favorites page lists more pages than there are
 * favorites (an old site bug): the last ones are empty. This hides the links
 * that lead past the real last page.
 *
 * The real last page is counted from the local list of favorites, so nothing
 * is hidden until "Sync favorites" has finished at least once: an incomplete
 * list would hide pages that exist.
 *
 * Pager: `div#paginator` with links `a[onclick]` holding `pid=N`; the link to
 * the next page is `a[name="next"]`, to the last one `a[name="lastpage"]`.
 */

const PAGINATOR_LINK_SELECTOR = "#paginator a[onclick]";
const NEXT_NAME = "next";
const ONCLICK_PID_PATTERN = /[?&]pid=(\d+)/;
const DISPLAY_NONE = "none";

/** Offset of the last page that holds a favorite; null while there are none. */
export function lastRealPid(favoriteCount: number): number | null {
  if (favoriteCount <= 0) {
    return null;
  }
  return Math.floor((favoriteCount - 1) / FAVORITES_SYNC_PID_STEP) * FAVORITES_SYNC_PID_STEP;
}

function readPid(link: Element): number | null {
  const match = ONCLICK_PID_PATTERN.exec(link.getAttribute("onclick") ?? "");
  return match?.[1] === undefined ? null : Number(match[1]);
}

/**
 * Hides the pager links that lead past `lastPid`, and the "next" link on the
 * last page itself. Returns how many links it hid.
 */
export function trimFavoritesPager(
  root: ParentNode,
  lastPid: number,
  currentPid: number,
): number {
  let hidden = 0;
  for (const link of root.querySelectorAll(PAGINATOR_LINK_SELECTOR)) {
    if (!(link instanceof HTMLElement)) {
      continue;
    }
    const pid = readPid(link);
    const past = pid !== null && pid > lastPid;
    const uselessNext = link.getAttribute("name") === NEXT_NAME && currentPid >= lastPid;
    if (past || uselessNext) {
      link.style.display = DISPLAY_NONE;
      hidden += 1;
    }
  }
  return hidden;
}

/** True when the local list of favorites was read from the site to the end. */
function favoritesListIsComplete(): boolean {
  const sync = getSyncState();
  return sync?.finishedAt !== undefined && sync.running !== true;
}

/** Call once on the Favorites page. */
export function mountFavoritesPager(search: string = window.location.search): void {
  if (!favoritesListIsComplete()) {
    return;
  }
  const lastPid = lastRealPid(loadFavSet().size);
  if (lastPid === null) {
    return;
  }
  const raw = new URLSearchParams(search).get(SEARCH_PARAM_PID);
  const currentPid = raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0;
  trimFavoritesPager(document, lastPid, currentPid);
}
