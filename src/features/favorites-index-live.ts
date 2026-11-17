import { SEARCH_PARAM_TAGS } from "../config/constants";
import { readThumbTags } from "../site/result-page";
import { SITE_SELECTORS } from "../site/selectors";
import { deriveThumbUrlFromMedia } from "../site/thumb";
import { isSiteUrl } from "../site/urls";
import {
  putFavoriteIndexEntriesQuietly,
  type FavoriteIndexEntry,
} from "../storage/favorites-index";

/**
 * Puts a post into the favorites search index at the moment it is made a
 * favorite, from what the page already shows. Without this a new favorite
 * would be missing from the search on the Favorites page until the next
 * "Sync favorites". No requests.
 */

const POST_IMAGE_SELECTOR = "img#image";
const POST_VIDEO_SELECTOR = "video#gelcomVideoPlayer";
const VIDEO_SOURCE_SELECTOR = "source";
const TAG_LINK_SELECTOR = "a[href*='tags=']";
const TAG_JOIN = " ";

/** The entry of a favorite made now: it sorts before everything indexed earlier. */
export function buildLiveEntry(
  postId: string,
  tags: readonly string[],
  thumb: string | null,
  now: number,
): FavoriteIndexEntry | null {
  const id = Number(postId);
  if (!Number.isInteger(id) || id <= 0 || tags.length === 0) {
    return null;
  }
  return {
    id,
    tags: tags.join(TAG_JOIN),
    thumb: thumb !== null && isSiteUrl(thumb) ? thumb : "",
    run: now,
    pos: 0,
    cut: false,
  };
}

function store(entry: FavoriteIndexEntry | null): void {
  if (entry !== null) {
    putFavoriteIndexEntriesQuietly([entry]);
  }
}

/** A favorite made by the star of a grid thumb: tags and preview are on the thumb. */
export function indexFavoriteFromThumb(postId: string, starButton: Element): void {
  const thumb = starButton.closest(SITE_SELECTORS.thumb);
  if (thumb === null) {
    return;
  }
  const image = thumb.querySelector(SITE_SELECTORS.previewImage);
  const src = image instanceof HTMLImageElement ? image.currentSrc || image.src : null;
  store(buildLiveEntry(postId, readThumbTags(thumb), src, Date.now()));
}

/** The tags of a post page, from the links of its tag sidebar. */
export function readPostPageTags(root: ParentNode = document): string[] {
  const tags: string[] = [];
  for (const row of root.querySelectorAll(SITE_SELECTORS.tagSidebarRow)) {
    const links = row.querySelectorAll(TAG_LINK_SELECTOR);
    const href = links[links.length - 1]?.getAttribute("href");
    if (href === null || href === undefined) {
      continue;
    }
    let tag: string | null = null;
    try {
      tag = new URL(href, window.location.href).searchParams.get(SEARCH_PARAM_TAGS);
    } catch {
      tag = null;
    }
    if (tag !== null && tag.trim().length > 0) {
      tags.push(tag.trim().toLowerCase());
    }
  }
  return tags;
}

function readPostMediaUrl(): string | null {
  const image = document.querySelector(POST_IMAGE_SELECTOR);
  if (image instanceof HTMLImageElement && image.src.length > 0) {
    return image.src;
  }
  const video = document.querySelector(POST_VIDEO_SELECTOR);
  if (!(video instanceof HTMLVideoElement)) {
    return null;
  }
  const source = video.querySelector(VIDEO_SOURCE_SELECTOR);
  const url = video.currentSrc || video.src || (source instanceof HTMLSourceElement ? source.src : "");
  return url.length > 0 ? url : null;
}

/** A favorite made on the post page: tags from the sidebar, preview from the media address. */
export function indexFavoriteFromPostPage(postId: string): void {
  const media = readPostMediaUrl();
  const thumb = media === null ? null : deriveThumbUrlFromMedia(media, Number(postId));
  store(buildLiveEntry(postId, readPostPageTags(), thumb, Date.now()));
}
