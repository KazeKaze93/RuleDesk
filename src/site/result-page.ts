import { SEARCH_PARAM_PID, SEARCH_PARAM_TAGS } from "../config/constants";
import { withoutSortRandom } from "../search/query";
import type { PostCount } from "../storage/schema";
import { SITE_SELECTORS, extractPostIdFromThumb } from "./selectors";

/**
 * Readers for a results page (`page=post&s=list`): the live document or one
 * parsed from a fetched page. They only read; nothing here makes a request.
 */

const QUERY_MARK = "?";
const PID_PATTERN = /^\d+$/;
const EXCLUDE_MARK = "-";
const FILTER_MARK = ":";
const OR_MARKS: readonly string[] = ["(", ")", "~"];
const NON_DIGITS = /\D/g;
const TOKEN_SPLIT = /\s+/;
const SCORE_TOKEN_PREFIX = "score:";
const RATING_TOKEN_PREFIX = "rating:";

/** Thumb URLs of the first `limit` posts in the grid, in page order. */
export function readFirstThumbUrls(root: ParentNode, limit: number): string[] {
  const imageList = root.querySelector(SITE_SELECTORS.imageList);
  if (imageList === null) {
    return [];
  }
  const urls: string[] = [];
  const images = imageList.querySelectorAll(
    `${SITE_SELECTORS.thumb} ${SITE_SELECTORS.previewImage}`,
  );
  for (const image of images) {
    const src = image.getAttribute("src");
    if (src === null || src.trim().length === 0) {
      continue;
    }
    urls.push(src.trim());
    if (urls.length === limit) {
      break;
    }
  }
  return urls;
}

/** Largest post id among the thumbs of the grid, or 0 without thumbs. */
export function readNewestPostId(root: ParentNode): number {
  let newest = 0;
  for (const thumb of root.querySelectorAll(SITE_SELECTORS.thumb)) {
    const raw = extractPostIdFromThumb(thumb);
    const id = raw === null ? Number.NaN : Number(raw);
    if (Number.isFinite(id) && id > newest) {
      newest = id;
    }
  }
  return newest;
}

/** Tags of a thumb, from its preview image title, without score and rating. */
export function readThumbTags(thumb: Element): string[] {
  const image = thumb.querySelector(SITE_SELECTORS.previewImage);
  const title = image?.getAttribute("title")?.trim() ?? "";
  const text = title.length > 0 ? title : (image?.getAttribute("alt")?.trim() ?? "");
  const tags: string[] = [];
  for (const token of text.split(TOKEN_SPLIT)) {
    const lower = token.toLowerCase();
    if (
      token.length === 0 ||
      lower.startsWith(SCORE_TOKEN_PREFIX) ||
      lower.startsWith(RATING_TOKEN_PREFIX)
    ) {
      continue;
    }
    tags.push(lower);
  }
  return tags;
}

function readPidFromLink(link: Element): number | null {
  const href = link.getAttribute("href");
  if (href === null) {
    return null;
  }
  const query = href.slice(href.indexOf(QUERY_MARK) + QUERY_MARK.length);
  const raw = new URLSearchParams(query).get(SEARCH_PARAM_PID);
  if (raw === null || !PID_PATTERN.test(raw)) {
    return null;
  }
  return Number(raw);
}

/** The tag of a search that is exactly one plain tag, else null. */
export function readSingleTag(tagsParam: string): string | null {
  const tokens = withoutSortRandom(tagsParam).split(" ");
  const tag = tokens[0];
  if (tokens.length !== 1 || tag === undefined || tag.length === 0) {
    return null;
  }
  if (
    tag.startsWith(EXCLUDE_MARK) ||
    tag.includes(FILTER_MARK) ||
    OR_MARKS.includes(tag)
  ) {
    return null;
  }
  return tag.toLowerCase();
}

function rowLinksToTag(row: Element, tag: string): boolean {
  for (const link of row.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") ?? "";
    const mark = href.indexOf(QUERY_MARK);
    if (mark < 0) {
      continue;
    }
    const linked = new URLSearchParams(href.slice(mark + QUERY_MARK.length)).get(
      SEARCH_PARAM_TAGS,
    );
    if (linked !== null && linked.trim().toLowerCase() === tag) {
      return true;
    }
  }
  return false;
}

/**
 * For a search of one tag the sidebar row of that tag shows the site's own
 * total, which is exact. Null when the row or its number is not on the page.
 */
function readSingleTagCount(root: ParentNode, tagsParam: string): PostCount | null {
  const tag = readSingleTag(tagsParam);
  if (tag === null) {
    return null;
  }
  for (const row of root.querySelectorAll(SITE_SELECTORS.tagSidebarRow)) {
    if (!rowLinksToTag(row, tag)) {
      continue;
    }
    const digits = (
      row.querySelector(SITE_SELECTORS.tagCount)?.textContent ?? ""
    ).replace(NON_DIGITS, "");
    if (digits.length === 0) {
      return null;
    }
    return { value: Number(digits), exact: true };
  }
  return null;
}

/**
 * Size of the search a first results page shows.
 * A search of one tag takes the exact total from the tag's sidebar row.
 * With a last-page link: at least its offset (`pid`), so the count is a lower
 * bound. With other page links only: the largest offset among them. With no
 * page links: the number of thumbs on the page, exact. No grid: null.
 */
export function readResultCount(root: ParentNode, tagsParam: string): PostCount | null {
  const tagCount = readSingleTagCount(root, tagsParam);
  if (tagCount !== null) {
    return tagCount;
  }
  const last = root.querySelector(SITE_SELECTORS.paginationLastPage);
  if (last !== null) {
    const pid = readPidFromLink(last);
    if (pid !== null) {
      return { value: pid, exact: false };
    }
  }
  let largest: number | null = null;
  for (const link of root.querySelectorAll(SITE_SELECTORS.paginationPageLink)) {
    const pid = readPidFromLink(link);
    if (pid !== null && (largest === null || pid > largest)) {
      largest = pid;
    }
  }
  if (largest !== null) {
    return { value: largest, exact: false };
  }
  const imageList = root.querySelector(SITE_SELECTORS.imageList);
  if (imageList === null) {
    return null;
  }
  return {
    value: imageList.querySelectorAll(SITE_SELECTORS.thumb).length,
    exact: true,
  };
}
