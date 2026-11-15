import { CSS_CLASS } from "../config/constants";

export const SITE_SELECTORS = {
  thumb: "span.thumb",
  thumbLink: 'a[href*="s=view"]',
  previewImage: "img.preview",
  cardFavButton: `button.${CSS_CLASS.cardFav}`,
  favoritesDeleteLink: "a[onclick]",
  tagSidebar: "ul#tag-sidebar",
  tagTypeArtist: "li.tag-type-artist",
  /** A tag row of the sidebar, any tag type. */
  tagSidebarRow: 'ul#tag-sidebar > li[class*="tag-type-"]',
  /** Number of posts with the tag, inside its sidebar row. */
  tagCount: "span.tag-count",
  imageList: "div.image-list",
  /** Comments page: the list of posts with their comments. */
  commentList: "div#comments div#comment-list",
  /** Comments page: the preview cell of a post, `div#p{ID}.post > div.col1.thumb > a > img.preview`. */
  commentThumb: "div#comments div#comment-list > div.post > div.col1.thumb",
  /** Comments page: the whole tag list of a post, one `span` per tag. */
  commentTags: "div#comments div#comment-list > div.post > div.col2 > div.header > div.tags",
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
export const THUMB_LINK_ID_PATTERN = /^p(\d+)$/;
export const FAVORITES_DELETE_ID_PATTERN = /s=delete&id=(\d+)/;

export function extractPostIdFromThumb(thumb: Element): string | null {
  const match = THUMB_ID_PATTERN.exec(thumb.id);
  if (match === null) {
    return null;
  }
  const postId = match[1];
  return postId === undefined ? null : postId;
}

/**
 * Post id from the thumb's link `a#p{ID}`. A favorites thumb has no `s{ID}`
 * id of its own, so this is the only place its post id is written.
 */
export function extractPostIdFromThumbLink(thumb: Element): string | null {
  const link = thumb.querySelector(SITE_SELECTORS.thumbLink);
  if (link === null) {
    return null;
  }
  const match = THUMB_LINK_ID_PATTERN.exec(link.id);
  if (match === null) {
    return null;
  }
  const postId = match[1];
  return postId === undefined ? null : postId;
}

/**
 * Post id of a Comments page preview: the cell has no id, the post around it
 * is `div#p{ID}.post`.
 */
export function extractPostIdFromCommentThumb(thumb: Element): string | null {
  const post = thumb.parentElement;
  if (post === null) {
    return null;
  }
  const match = THUMB_LINK_ID_PATTERN.exec(post.id);
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
