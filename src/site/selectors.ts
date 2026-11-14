import { CSS_CLASS } from "../config/constants";

export const SITE_SELECTORS = {
  thumb: "span.thumb",
  thumbLink: 'a[href*="s=view"]',
  previewImage: "img.preview",
  cardFavButton: `button.${CSS_CLASS.cardFav}`,
  favoritesDeleteLink: "a[onclick]",
  tagSidebar: "ul#tag-sidebar",
  tagTypeArtist: "li.tag-type-artist",
  imageList: "div.image-list",
  postListContent: "#post-list div.content",
  contentRoot: "#content",
  artistFollowButton: `button.${CSS_CLASS.artistFollow}`,
  /** Native AI filter checkbox (site owns click/cookie logic). */
  filterAiCheckbox: "input.toggleSwitch#chkFilterAI",
  /** Row wrapping the native AI filter control — hide when search-tools mirrors it. */
  filterAiRow: "li:has(> label > span.switch > input.toggleSwitch#chkFilterAI)",
  /** Post page: site link to the previous post of the last search (href="#", site JS). */
  postPrevSearchLink: "a#prev_search_link",
  /** Post page: site link to the next post of the last search (href="#", site JS). */
  postNextSearchLink: "a#next_search_link",
  /** List page pager. */
  pagination: "div.pagination",
  /** Pager link to the last results page; its `pid` is the offset of that page. */
  paginationLastPage: 'div.pagination a[alt="last page"]',
  /** Any pager link to another results page. */
  paginationPageLink: "div.pagination > a[href]",
  /** Stray Tags heading between #rdw-search-tools and the tag list. */
  tagsHeadingAfterSearchTools: "#rdw-search-tools + h5",
} as const;

export const THUMB_ID_PATTERN = /^s(\d+)$/;
export const FAVORITES_DELETE_ID_PATTERN = /s=delete&id=(\d+)/;

export function extractPostIdFromThumb(thumb: Element): string | null {
  const match = THUMB_ID_PATTERN.exec(thumb.id);
  if (match === null) {
    return null;
  }
  const postId = match[1];
  return postId === undefined ? null : postId;
}

export function extractPostIdFromFavoritesDeleteOnclick(
  onclick: string,
): string | null {
  const match = FAVORITES_DELETE_ID_PATTERN.exec(onclick);
  if (match === null) {
    return null;
  }
  const postId = match[1];
  return postId === undefined ? null : postId;
}
