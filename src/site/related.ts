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

export type RelatedSourceKind = "similar" | "character" | "copyright" | "favorites";

export type RelatedSource = {
  readonly key: string;
  readonly kind: RelatedSourceKind;
  /** What the tab reads: the tag with spaces, or the name of the source. */
  readonly name: string;
  /**
   * The tags the search is by; empty for the favorites. For "Similar" these
   * are the rare tags a mix is made from, the rarest first: a mix takes some
   * of them, any of which a post may have.
   */
  readonly tags: readonly string[];
  /** The artists of the post: their posts are left out of the search. */
  readonly without: readonly string[];
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
/** How many of the rare tags of a post one mix of "Similar" is made from. */
export const SIMILAR_MIX_TAGS = 5;
/** How many of the rarest tags a mix may be drawn from: "Another mix" takes others of them. */
export const SIMILAR_POOL_TAGS = 8;
/** A mix is taken from one of this many first pages of its search, not always the first. */
export const MIX_PAGES_MAX = 20;
/** A post that has this many of the tags of a mix stands before those with fewer. */
const MIX_CLOSE_TAGS = 2;
const OR_OPEN = "(";
const OR_CLOSE = ")";
const OR_JOIN = "~";
const SEARCH_PARAM_PID = "pid";
/** A tag on fewer posts than this is the mark of one artist or one set, not of a scene. */
const SIMILAR_MIN_COUNT = 20;
/** Before the first page is asked for, when the page taken at random was empty. */
export const MIX_RETRY_PAUSE_MS = 1100;
const EXCLUDE_MARK = "-";
/**
 * Tags that say how a picture was made or signed, not what is in it. They are
 * not searched by: a post is not like another for being large or signed.
 */
const SERVICE_TAGS: ReadonlySet<string> = new Set([
  "highres",
  "hi_res",
  "absurdres",
  "absurd_res",
  "lowres",
  "text",
  "english_text",
  "japanese_text",
  "dialogue",
  "speech_bubble",
  "watermark",
  "signature",
  "artist_name",
  "artist_signature",
  "patreon_username",
  "twitter_username",
  "web_address",
  "url",
  "dated",
  "logo",
  "ai_generated",
  "ai_assisted",
  "stable_diffusion",
  "novelai",
  "commentary",
  "tagme",
  "translated",
  "translation_request",
  "sound",
  "animated",
  "video",
  "1girls",
  "1boy",
  // How many are in the picture and of what sex, and what kind of pair: on
  // millions of posts each (the site's list of tags by count, from Kaze,
  // 19.11.2026). A mix by them would be a mix of everything.
  "1girl",
  "2girls",
  "2boys",
  "3girls",
  "solo",
  "duo",
  "female",
  "male",
  "female_only",
  "male_only",
  "solo_female",
  "solo_male",
  "solo_focus",
  "female_focus",
  "male_focus",
  "male/female",
  "straight",
  "human",
  "simple_background",
  "looking_at_viewer",
  // The rating and words of praise, written as tags: they are on any post.
  "explicit",
  "questionable",
  "safe",
  "nsfw",
  "adult",
  "mature",
  "perfect_body",
  "beautiful",
  "sexy",
  "hot",
  "cute",
  "pretty",
]);
/**
 * Copyrights that name where a picture was sold or posted, or that it is of
 * no series at all: not what it is of. They are no source (Kaze, 19.11.2026:
 * "patreon? seriously?").
 */
const SERVICE_COPYRIGHTS: ReadonlySet<string> = new Set([
  "patreon",
  "patreon_reward",
  "fanbox",
  "pixiv",
  "pixiv_fanbox",
  "fantia",
  "twitter",
  "x_(twitter)",
  "subscribestar",
  "gumroad",
  "ko-fi",
  "boosty",
  "skeb",
  "onlyfans",
  "fansly",
  "deviantart",
  "newgrounds",
  "tumblr",
  "discord",
  "itch.io",
  "original",
  "original_character",
  "commission",
]);
/** Characters that are nobody in particular. */
const SERVICE_CHARACTERS: ReadonlySet<string> = new Set(["original_character", "oc"]);
/**
 * A tag of a mix is an established one: on at least this many posts. The very
 * rarest tags of a post were its oddities ("explicit", "perfect body"), not
 * its scene.
 */
const SIMILAR_USUAL_COUNT = 1000;
/** With fewer established tags than this, rarer ones are taken too. */
const SIMILAR_ENOUGH_TAGS = 3;
/** How many of them a favorite has to share to be like such a post. */
const SHARED_FAVORITE_MIN = 2;
/** The rarest tags a favorite is tried against when the post names nobody. */
const SHARED_FAVORITE_POOL = 4;
/** A page of a search of the site. */
export const RELATED_PAGE_SIZE = 42;
export const SOURCE_KEY_FAVORITES = "favorites";
export const SOURCE_KEY_SIMILAR = "similar";
const NAME_FAVORITES = "In your favorites";
const NAME_SIMILAR = "Similar";

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

const NUMERIC_ENTITY = /&#(\d+);/g;
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
};
const NAMED_ENTITY = /&(?:amp|quot|lt|gt);/g;

/**
 * The site writes an apostrophe of a tag into the address of its link as the
 * text "&#039;", escaped once more than a link needs: read back from the
 * address, the tag was "baldur&#039;s_gate" (Kaze, 19.11.2026). The codes are
 * turned into the characters they stand for.
 */
export function decodeTagEntities(tag: string): string {
  return tag
    .replace(NUMERIC_ENTITY, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(NAMED_ENTITY, (match) => NAMED_ENTITIES[match] ?? match);
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
    const tag = decodeTagEntities(tags?.trim().toLowerCase() ?? "");
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
 * The tags "Similar" searches by: the rarest of the post that say what is in
 * the picture, the rarest first.
 */
export function similarTags(post: readonly PostTag[]): string[] {
  const fit = post.filter(
    (entry) =>
      entry.kind === "general" &&
      entry.count >= SIMILAR_MIN_COUNT &&
      !SERVICE_TAGS.has(entry.tag),
  );
  const usual = fit.filter((entry) => entry.count >= SIMILAR_USUAL_COUNT);
  return (usual.length >= SIMILAR_ENOUGH_TAGS ? usual : fit)
    .sort((a, b) => a.count - b.count)
    .slice(0, SIMILAR_POOL_TAGS)
    .map((entry) => entry.tag);
}

/** The same words in another order: "katsuragi shouko" and "shouko katsuragi" are one name. */
function nameKey(tag: string): string {
  return tag.split("_").sort().join("_");
}

/**
 * The characters or the copyrights of a post that are sources: none that says
 * nothing, and of two tags that are one name written both ways, the one with
 * more posts.
 */
function namedTags(post: readonly PostTag[], kind: "character" | "copyright"): PostTag[] {
  const skipped = kind === "copyright" ? SERVICE_COPYRIGHTS : SERVICE_CHARACTERS;
  const kept = new Map<string, PostTag>();
  for (const entry of post) {
    if (entry.kind !== kind || skipped.has(entry.tag)) {
      continue;
    }
    const key = nameKey(entry.tag);
    const have = kept.get(key);
    if (have === undefined || entry.count > have.count) {
      kept.set(key, entry);
    }
  }
  return [...kept.values()];
}

/**
 * The search for posts that have any of these tags, without the posts of
 * these artists: "( a ~ b ~ c ) -artist". The site reads the brackets and the
 * "~" only with spaces around them (docs/site.md).
 */
export function mixQuery(tags: readonly string[], without: readonly string[]): string {
  const any =
    tags.length > 1
      ? [OR_OPEN, tags.join(` ${OR_JOIN} `), OR_CLOSE].join(TAG_SEPARATOR)
      : (tags[0] ?? "");
  return [any, ...without.map((tag) => `${EXCLUDE_MARK}${tag}`)].join(TAG_SEPARATOR);
}

/**
 * How many posts a mix by these tags has at least: as many as its most common
 * tag has. Known from the tag list beside the post, with no request.
 */
export function mixSize(post: readonly PostTag[], tags: readonly string[]): number {
  let size = 0;
  for (const entry of post) {
    if (tags.includes(entry.tag) && entry.count > size) {
      size = entry.count;
    }
  }
  return size;
}

/**
 * The offset of the page a mix is taken from: one of the first pages of its
 * search, by chance, so that a mix is not always of the newest posts.
 */
export function mixPageOffset(size: number, random: () => number): number {
  const pages = Math.min(MIX_PAGES_MAX, Math.floor(size / RELATED_PAGE_SIZE));
  return pages > 1 ? Math.floor(random() * pages) * RELATED_PAGE_SIZE : 0;
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const list = [...items];
  for (let at = list.length - 1; at > 0; at -= 1) {
    const other = Math.floor(random() * (at + 1));
    const held = list[at];
    const swapped = list[other];
    if (held !== undefined && swapped !== undefined) {
      list[at] = swapped;
      list[other] = held;
    }
  }
  return list;
}

/** The tags of one mix: the rarest first time, others of the pool by chance after. */
export function mixTags(
  pool: readonly string[],
  first: boolean,
  random: () => number,
): string[] {
  return (first ? [...pool] : shuffled(pool, random)).slice(0, SIMILAR_MIX_TAGS);
}

/**
 * A mix in the order it is shown (the designer, 19.11.2026): shuffled, but
 * with weight. A search for any of several tags gives mostly the newest posts
 * of the most common of them; shuffled blindly, a post with one tag of the
 * mix would stand first as often as one with three. So the posts with two or
 * more of the tags come first, shuffled among themselves, then the rest,
 * shuffled too.
 */
export function mixOrder(
  posts: readonly RankedPost[],
  tags: readonly string[],
  random: () => number,
): RankedPost[] {
  const close: RankedPost[] = [];
  const far: RankedPost[] = [];
  for (const post of posts) {
    const have = tags.filter((tag) => post.tags.includes(tag)).length;
    (have >= MIX_CLOSE_TAGS ? close : far).push(post);
  }
  return [...shuffled(close, random), ...shuffled(far, random)];
}

/** The search by these tags that leaves out the posts of these artists. */
export function relatedQuery(tags: readonly string[], without: readonly string[]): string {
  return [...tags, ...without.map((tag) => `${EXCLUDE_MARK}${tag}`)].join(TAG_SEPARATOR);
}

/**
 * Where candidates can come from for this post (the designer with Kaze,
 * 19.11.2026): "Similar", a mix of posts by other artists that have any of
 * the rare tags of the post; then each character and each copyright of the
 * post, by other artists too; and the favorites, last. The artist is no
 * source: all of an artist's posts are one press on the tag beside the post.
 */
export function relatedSources(post: readonly PostTag[]): RelatedSource[] {
  const without = post.filter((entry) => entry.kind === "artist").map((entry) => entry.tag);
  const sources: RelatedSource[] = [];
  const similar = similarTags(post);
  if (similar.length > 0) {
    sources.push({
      key: SOURCE_KEY_SIMILAR,
      kind: "similar",
      name: NAME_SIMILAR,
      tags: similar,
      without,
    });
  }
  for (const kind of ["character", "copyright"] as const) {
    for (const entry of namedTags(post, kind)) {
      sources.push({
        key: `${kind}:${entry.tag}`,
        kind,
        name: displayName(entry.tag),
        tags: [entry.tag],
        without,
      });
    }
  }
  sources.push({
    key: SOURCE_KEY_FAVORITES,
    kind: "favorites",
    name: NAME_FAVORITES,
    tags: [],
    without: [],
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
export function relatedSearchUrl(query: string, offset: number = 0): string {
  const params = new URLSearchParams();
  params.set("page", "post");
  params.set("s", "list");
  params.set(SEARCH_PARAM_TAGS, query);
  if (offset > 0) {
    params.set(SEARCH_PARAM_PID, String(offset));
  }
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
export async function fetchCandidates(query: string, offset: number = 0): Promise<Candidate[]> {
  let response: Response;
  try {
    response = await fetch(relatedSearchUrl(query, offset), {
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
