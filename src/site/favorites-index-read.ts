import type { FavoriteIndexEntry } from "../storage/favorites-index";
import { isSiteUrl } from "./urls";

/**
 * Reads the index entries of one favorites page of the site.
 *
 * Favorites grid: `div.image-list > span > span.thumb > a#p{ID} > img`; the
 * image `title` is the tag list (the site cuts its first and last character),
 * `src` is the preview address.
 */

const THUMB_LINK_SELECTOR = 'span.thumb > a[id^="p"]';
const LINK_ID_PATTERN = /^p(\d+)$/;
const IMAGE_SELECTOR = ":scope > img";

/**
 * @param run when the sync run started, ms since epoch
 * @param firstPos place of the first post of this page in the site's list
 */
export function readFavoriteIndexEntries(
  page: ParentNode,
  run: number,
  firstPos: number,
  base: string = window.location.href,
): FavoriteIndexEntry[] {
  const entries: FavoriteIndexEntry[] = [];
  const seen = new Set<number>();
  let pos = firstPos;
  for (const link of page.querySelectorAll(THUMB_LINK_SELECTOR)) {
    const match = LINK_ID_PATTERN.exec(link.id);
    const img = link.querySelector(IMAGE_SELECTOR);
    if (match?.[1] === undefined || !(img instanceof HTMLImageElement)) {
      continue;
    }
    const id = Number(match[1]);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    let thumb = "";
    try {
      thumb = new URL(img.getAttribute("src") ?? "", base).href;
    } catch {
      thumb = "";
    }
    entries.push({
      id,
      tags: img.title.trim(),
      // Only the site's own addresses are kept.
      thumb: isSiteUrl(thumb) ? thumb : "",
      run,
      pos,
    });
    pos += 1;
  }
  return entries;
}
