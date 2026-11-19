import { FETCH_CREDENTIALS, FETCH_METHOD_GET, SEARCH_PARAM_TAGS } from "../config/constants";
import { SITE_ORIGIN } from "../config/constants";
import type { FavoriteIndexEntry } from "../storage/favorites-index";
import { readThumbTags } from "./result-page";
import { SITE_SELECTORS, extractPostIdFromThumb } from "./selectors";

/**
 * "More like this" on a post page (the designer, 19.11.2026): posts that
 * share tags with the open one. The site has no such list. Candidates come
 * from one page of a search, by an artist or a character of the post, asked
 * for when the user picks that source; or from the user's favorites, whose
 * tags are in the browser already. They are put in order by the tags they
 * share with the post, a rare tag counting for more than a common one.
 *
 * Likeness is of tags, not of the pictures.
 */

export type PostTagKind = "artist" | "character" | "copyright" | "general" | "metadata";

export type PostTag = {
  readonly tag: string;
  readonly kind: PostTagKind;
  /** Posts on the site with the tag, as the tag list beside the post says; 0 when it does not. */
  readonly count: number;
};

export type Candidate = {
  readonly id: number;
  readonly thumb: string;
  readonly tags: readonly string[];
  readonly video: boolean;
};

export type RankedPost = Candidate & {
  /** How many tags it shares with the open post. */
  readonly shared: number;
  readonly score: number;
};

export type RelatedSourceKind = "artist" | "character" | "shared" | "favorites";

export type RelatedSource = {
  readonly key: string;
  readonly kind: RelatedSourceKind;
  /** What the tab reads: the tag with spaces, or the name of the source. */
  readonly name: string;
  /** The search asked of the site; empty for the favorites. */
  readonly query: string;
  /** The tags of the search, for the hint of the tab. */
  readonly tags: readonly string[];
};

/** Why a page of candidates did not come. */
export type RelatedFailure = "offline" | "limited" | "failed";

export class RelatedError extends Error {
  readonly failure: RelatedFailure;

  constructor(failure: RelatedFailure, message: string) {
    super(message);
    this.failure = failure;
  }
}

const TAG_TYPE_CLASS_PREFIX = "tag-type-";
const KINDS: readonly PostTagKind[] = ["artist", "character", "copyright", "general", "metadata"];
const NON_DIGITS = /\D/g;
const QUERY_MARK = "?";
const TAG_SEPARATOR = " ";
const VIDEO_THUMB_CLASS = "webm-thumb";
const HTTP_TOO_MANY_REQUESTS = 429;
/** A tag on every post tells nothing: the weight falls with the logarithm of its count. */
const WEIGHT_BASE = 2;
/** The weight of a tag whose count is not known: that of a tag of a thousand posts. */
const UNKNOWN_COUNT = 1000;
/** How many of the rarest tags make the search of a post with no artist and no character. */
export const SHARED_QUERY_TAGS = 2;
/** How many of them a favorite has to share to be like such a post. */
const SHARED_FAVORITE_MIN = 2;
/** The rarest tags a favorite is tried against when the post names nobody. */
const SHARED_FAVORITE_POOL = 4;
/** A page of a search of the site. */
export const RELATED_PAGE_SIZE = 42;
export const SOURCE_KEY_FAVORITES = "favorites";
export const SOURCE_KEY_SHARED = "shared";
const NAME_FAVORITES = "In your favorites";
const NAME_SHARED = "Shared tags";

function kindOfRow(row: Element): PostTagKind | null {
  for (const name of row.classList) {
    if (!name.startsWith(TAG_TYPE_CLASS_PREFIX)) {
      continue;
    }
    const kind = KINDS.find((entry) => entry === name.slice(TAG_TYPE_CLASS_PREFIX.length));
    if (kind !== undefined) {
      return kind;
    }
  }
  return null;
}

/** The tag a row of the tag list is of: its last link that searches for one tag. */
function tagOfRow(row: Element): string | null {
  const links = [...row.querySelectorAll("a[href]")].reverse();
  for (const link of links) {
    const href = link.getAttribute("href") ?? "";
    const mark = href.indexOf(QUERY_MARK);
    if (mark < 0) {
      continue;
    }
    const tags = new URLSearchParams(href.slice(mark + QUERY_MARK.length)).get(SEARCH_PARAM_TAGS);
    const tag = tags?.trim().toLowerCase() ?? "";
    if (tag.length > 0 && !tag.includes(TAG_SEPARATOR)) {
      return tag;
    }
  }
  return null;
}

/** The tags of the open post with their kinds and counts, from the tag list beside it. */
export function readPostTags(root: ParentNode = document): PostTag[] {
  const tags: PostTag[] = [];
  const seen = new Set<string>();
  for (const row of root.querySelectorAll(SITE_SELECTORS.tagSidebarRow)) {
    const kind = kindOfRow(row);
    const tag = tagOfRow(row);
    if (kind === null || tag === null || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    const digits = (row.querySelector(SITE_SELECTORS.tagCount)?.textContent ?? "").replace(
      NON_DIGITS,
      "",
    );
    tags.push({ tag, kind, count: digits.length === 0 ? 0 : Number(digits) });
  }
  return tags;
}

/** The posts of a page of a search, as its grid shows them. */
export function readCandidates(root: ParentNode): Candidate[] {
  const list = root.querySelector(SITE_SELECTORS.imageList);
  if (list === null) {
    return [];
  }
  const found: Candidate[] = [];
  for (const thumb of list.querySelectorAll(SITE_SELECTORS.thumb)) {
    const id = Number(extractPostIdFromThumb(thumb) ?? Number.NaN);
    const image = thumb.querySelector(SITE_SELECTORS.previewImage);
    const src = image?.getAttribute("src") ?? "";
    if (!Number.isFinite(id) || image === null || src.length === 0) {
      continue;
    }
    found.push({
      id,
      thumb: src,
      tags: readThumbTags(thumb),
      video: image.classList.contains(VIDEO_THUMB_CLASS),
    });
  }
  return found;
}

function weightOf(count: number): number {
  return 1 / Math.log(WEIGHT_BASE + (count > 0 ? count : UNKNOWN_COUNT));
}

/**
 * The candidates most like the post first: by the weight of the tags they
 * share with it, then by the number of those, then the newer first. The post
 * itself is left out.
 */
export function rankCandidates(
  post: readonly PostTag[],
  candidates: readonly Candidate[],
  selfId: number,
): RankedPost[] {
  const weights = new Map(post.map((entry) => [entry.tag, weightOf(entry.count)]));
  const ranked: RankedPost[] = [];
  for (const candidate of candidates) {
    if (candidate.id === selfId) {
      continue;
    }
    let shared = 0;
    let score = 0;
    for (const tag of new Set(candidate.tags)) {
      const weight = weights.get(tag);
      if (weight !== undefined) {
        shared += 1;
        score += weight;
      }
    }
    ranked.push({ ...candidate, shared, score });
  }
  return ranked.sort(
    (a, b) => b.score - a.score || b.shared - a.shared || b.id - a.id,
  );
}

function rarest(post: readonly PostTag[], limit: number): PostTag[] {
  return post
    .filter((entry) => entry.kind !== "metadata" && entry.count > 0)
    .sort((a, b) => a.count - b.count)
    .slice(0, limit);
}

function displayName(tag: string): string {
  return tag.replaceAll("_", " ");
}

/**
 * Where candidates can come from for this post: its artists, then its
 * characters, each by its own search; with neither, one search by the rarest
 * tags of the post; and the favorites, last.
 */
export function relatedSources(post: readonly PostTag[]): RelatedSource[] {
  const sources: RelatedSource[] = [];
  for (const kind of ["artist", "character"] as const) {
    for (const entry of post) {
      if (entry.kind === kind) {
        sources.push({
          key: `${kind}:${entry.tag}`,
          kind,
          name: displayName(entry.tag),
          query: entry.tag,
          tags: [entry.tag],
        });
      }
    }
  }
  if (sources.length === 0) {
    const tags = rarest(post, SHARED_QUERY_TAGS).map((entry) => entry.tag);
    if (tags.length > 0) {
      sources.push({
        key: SOURCE_KEY_SHARED,
        kind: "shared",
        name: NAME_SHARED,
        query: tags.join(TAG_SEPARATOR),
        tags,
      });
    }
  }
  sources.push({
    key: SOURCE_KEY_FAVORITES,
    kind: "favorites",
    name: NAME_FAVORITES,
    query: "",
    tags: [],
  });
  return sources;
}

/**
 * The favorites that are like the post, most like first: those that share an
 * artist or a character with it; for a post that names nobody, those that
 * share at least two of its rarest tags. Read from the index of the browser.
 */
export function favoriteCandidates(
  entries: readonly FavoriteIndexEntry[],
  post: readonly PostTag[],
  selfId: number,
): RankedPost[] {
  const named = new Set(
    post
      .filter((entry) => entry.kind === "artist" || entry.kind === "character")
      .map((entry) => entry.tag),
  );
  const rare = new Set(rarest(post, SHARED_FAVORITE_POOL).map((entry) => entry.tag));
  const like: Candidate[] = [];
  for (const entry of entries) {
    const tags = entry.tags
      .toLowerCase()
      .split(/\s+/)
      .filter((tag) => tag.length > 0);
    const matches =
      named.size > 0
        ? tags.some((tag) => named.has(tag))
        : tags.filter((tag) => rare.has(tag)).length >= SHARED_FAVORITE_MIN;
    if (matches && entry.thumb.length > 0) {
      like.push({ id: entry.id, thumb: entry.thumb, tags, video: false });
    }
  }
  return rankCandidates(post, like, selfId).slice(0, RELATED_PAGE_SIZE);
}

/** The address of the search a source asks for; also where "Search … →" leads. */
export function relatedSearchUrl(query: string): string {
  const params = new URLSearchParams();
  params.set("page", "post");
  params.set("s", "list");
  params.set(SEARCH_PARAM_TAGS, query);
  return `${SITE_ORIGIN}/index.php?${params.toString()}`;
}

/** The address of a post's page. */
export function relatedPostUrl(id: number): string {
  return `index.php?page=post&s=view&id=${String(id)}`;
}

/**
 * One page of a search, read into candidates. One request, made when the user
 * picks the source. Throws a RelatedError that says why nothing came.
 */
export async function fetchCandidates(query: string): Promise<Candidate[]> {
  let response: Response;
  try {
    response = await fetch(relatedSearchUrl(query), {
      method: FETCH_METHOD_GET,
      credentials: FETCH_CREDENTIALS,
    });
  } catch (error) {
    throw new RelatedError("offline", error instanceof Error ? error.message : "network");
  }
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    throw new RelatedError("limited", `HTTP ${String(response.status)}`);
  }
  if (!response.ok) {
    throw new RelatedError("failed", `HTTP ${String(response.status)}`);
  }
  const html = await response.text();
  return readCandidates(new DOMParser().parseFromString(html, "text/html"));
}
