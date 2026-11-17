import * as z from "zod/mini";

import { FETCH_METHOD_GET } from "../config/constants";
import { buildPlaylistQueries } from "../search/query";
import type { ApiCredentials } from "../storage/api-credentials";
import { isSiteUrl } from "./urls";

/**
 * The site API. It works with the user's own key from settings and is never
 * called without one. It is used for two things, both started by the user:
 *
 * - the download manager: finding the original files of posts. One request
 *   returns up to 1000 posts with the addresses of their files, so no post
 *   page has to be read;
 * - the favorites search (Kaze, 17.11.2026): the rating, score and size of
 *   the favorites, which the favorites page does not give. Asked for by
 *   "Read ratings and sizes" and after a "Full resync", a hundred posts a
 *   request.
 */

const API_URL = "https://api.rule34.xxx/index.php";
const POSTS_PER_REQUEST = 1000;
/** Post ids per `( id:1 ~ id:2 … )` request; well under the site's group limit. */
const IDS_PER_REQUEST = 100;
/** Pause between two API requests of one collection run. */
export const API_REQUEST_INTERVAL_MS = 1000;
/**
 * Pause between two requests for the details of favorites. The API allows a
 * key 60 requests in 60 seconds (its own page says so; Kaze, 17.11.2026);
 * this run is long, so it keeps clear of that: 50 a minute.
 */
export const API_DETAILS_INTERVAL_MS = 1200;
const FETCH_NO_CREDENTIALS = "omit";
const ERROR_TEXT_LIMIT = 120;
const SORT_TOKEN_PREFIX = "sort:";
const ID_BELOW_PREFIX = "id:<";
const TOKEN_SPLIT = /\s+/;
const ALL_QUERY = "all";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

const ApiPostSchema = z.object({
  id: z.int(),
  file_url: z.string().check(z.minLength(1)),
  // For the file name mask only; a post without them still downloads.
  rating: z.optional(z.unknown()),
  score: z.optional(z.unknown()),
  width: z.optional(z.unknown()),
  height: z.optional(z.unknown()),
  owner: z.optional(z.unknown()),
});

export type PostFile = {
  readonly postId: number;
  readonly url: string;
  readonly rating?: string | undefined;
  readonly score?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly owner?: string | undefined;
};

function textOf(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberOf(value: unknown): number | undefined {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : undefined;
}

/** What to download: a search, or an explicit list of post ids. */
export type DownloadSource =
  | { readonly kind: "query"; readonly tags: string }
  | { readonly kind: "ids"; readonly ids: readonly number[] };

type ApiQuery = { readonly tags: string } | { readonly id: number };

function buildApiUrl(query: ApiQuery, credentials: ApiCredentials): string {
  const params = new URLSearchParams();
  params.set("page", "dapi");
  params.set("s", "post");
  params.set("q", "index");
  params.set("json", "1");
  params.set("limit", String(POSTS_PER_REQUEST));
  params.set("pid", "0");
  if ("id" in query) {
    params.set("id", String(query.id));
  } else if (query.tags.length > 0 && query.tags !== ALL_QUERY) {
    params.set("tags", query.tags);
  }
  params.set("user_id", credentials.userId);
  params.set("api_key", credentials.apiKey);
  return `${API_URL}?${params.toString()}`;
}

/**
 * The limit of the API is per key: 60 requests in 60 seconds (its own page
 * says so; Kaze, 17.11.2026). Every request of the script goes through
 * `requestText`, and that is where the limit is kept, whatever asks and from
 * whichever tab:
 *
 * - requests of one tab go one after another, never two at once;
 * - a request starts no sooner than {@link API_MIN_INTERVAL_MS} after the
 *   one before it, counted across the tabs of the browser through a time
 *   kept in localStorage (a download in one tab and "Read ratings and sizes"
 *   in another share the key);
 * - an answer of "too many requests" is waited out and asked again a few
 *   times before the run fails.
 */
export const API_MIN_INTERVAL_MS = 1100;
/** How long to wait after "too many requests" before asking again. */
export const API_LIMIT_PAUSE_MS = 15_000;
/** How many times one request is asked again after "too many requests". */
export const API_LIMIT_RETRIES = 3;
const HTTP_TOO_MANY_REQUESTS = 429;
/** When the last API request of any tab started, ms since epoch. */
export const API_LAST_REQUEST_KEY = "ruledesk-web.api-last";

let lastRequestAt = 0;
let turn: Promise<void> = Promise.resolve();

function readSharedLast(): number {
  try {
    const stored = Number(window.localStorage.getItem(API_LAST_REQUEST_KEY));
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    return 0;
  }
}

function writeSharedLast(at: number): void {
  try {
    window.localStorage.setItem(API_LAST_REQUEST_KEY, String(at));
  } catch {
    // Without localStorage the pace is kept for this tab only.
  }
}

/** Resolves when this request may start; the requests of the tab queue up here. */
function takeTurn(): Promise<void> {
  const mine = turn.then(async () => {
    const now = Date.now();
    // A time from the future (a clock set back) is not waited for.
    const shared = Math.min(readSharedLast(), now);
    const wait = Math.max(lastRequestAt, shared) + API_MIN_INTERVAL_MS - now;
    if (wait > 0) {
      await sleep(wait);
    }
    lastRequestAt = Date.now();
    writeSharedLast(lastRequestAt);
  });
  // A failed wait must not block the requests after it.
  turn = mine.catch(() => undefined);
  return mine;
}

/** Forgets the pace (tests). */
export function resetApiPace(): void {
  lastRequestAt = 0;
  turn = Promise.resolve();
  try {
    window.localStorage.removeItem(API_LAST_REQUEST_KEY);
  } catch {
    // Nothing to forget.
  }
}

/**
 * One API request. The API allows requests from any page
 * (`access-control-allow-origin: *`), so a plain `fetch` does it; no cookies
 * are sent, the key in the address is the whole authentication.
 */
async function requestText(query: ApiQuery, credentials: ApiCredentials): Promise<string> {
  for (let attempt = 0; ; attempt += 1) {
    await takeTurn();
    const response = await fetch(buildApiUrl(query, credentials), {
      method: FETCH_METHOD_GET,
      credentials: FETCH_NO_CREDENTIALS,
    });
    if (response.status === HTTP_TOO_MANY_REQUESTS && attempt < API_LIMIT_RETRIES) {
      // Something else is using the key (another browser, another tool): wait it out.
      await sleep(API_LIMIT_PAUSE_MS);
      continue;
    }
    if (!response.ok) {
      throw new Error(`API HTTP ${String(response.status)}`);
    }
    return response.text();
  }
}

/**
 * Posts of one API answer. An empty body is an empty result. A body that is
 * not a list (the API answers a wrong key with a sentence) is an error whose
 * text is shown to the user.
 */
export function parseApiPosts(body: string): PostFile[] {
  const text = body.trim();
  if (text.length === 0) {
    return [];
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`API: ${text.slice(0, ERROR_TEXT_LIMIT)}`);
  }
  if (typeof raw === "string") {
    // A refusal comes as a quoted sentence, e.g. "Missing authentication…".
    throw new Error(`API: ${raw.slice(0, ERROR_TEXT_LIMIT)}`);
  }
  if (!Array.isArray(raw)) {
    throw new Error(`API: ${text.slice(0, ERROR_TEXT_LIMIT)}`);
  }
  const files: PostFile[] = [];
  for (const item of raw) {
    const parsed = ApiPostSchema.safeParse(item);
    // A file is taken only from the site's own servers, whatever the answer says.
    if (parsed.success && isSiteUrl(parsed.data.file_url)) {
      files.push({
        postId: parsed.data.id,
        url: parsed.data.file_url,
        rating: textOf(parsed.data.rating),
        score: numberOf(parsed.data.score),
        width: numberOf(parsed.data.width),
        height: numberOf(parsed.data.height),
        owner: textOf(parsed.data.owner),
      });
    }
  }
  return files;
}

/** The search without sort tokens: the walk below needs newest-first order. */
export function queryForWalk(tags: string): string {
  return tags
    .trim()
    .split(TOKEN_SPLIT)
    .filter((token) => token.length > 0 && !token.startsWith(SORT_TOKEN_PREFIX))
    .join(" ");
}

export type CollectOptions = {
  readonly credentials: ApiCredentials;
  /** Called after every request with the number of files found so far. */
  readonly onProgress: (found: number) => void;
  readonly isCancelled: () => boolean;
};

/**
 * Every post of a search. The API stops answering deep page numbers, so the
 * walk asks for the first page again and again with `id:<N`, N being the
 * lowest id seen, until an answer is empty.
 */
async function collectQuery(tags: string, options: CollectOptions): Promise<PostFile[]> {
  const base = queryForWalk(tags);
  const files: PostFile[] = [];
  let below: number | null = null;
  for (;;) {
    if (options.isCancelled()) {
      return files;
    }
    const cursor: string = below === null ? "" : `${ID_BELOW_PREFIX}${String(below)}`;
    const query = [base === ALL_QUERY ? "" : base, cursor]
      .filter((part) => part.length > 0)
      .join(" ");
    const batch = parseApiPosts(
      await requestText({ tags: query }, options.credentials),
    );
    if (batch.length === 0) {
      return files;
    }
    let lowest: number = batch[0]?.postId ?? 0;
    for (const file of batch) {
      files.push(file);
      lowest = Math.min(lowest, file.postId);
    }
    options.onProgress(files.length);
    if (below !== null && lowest >= below) {
      // The cursor did not move: stop instead of asking forever.
      return files;
    }
    below = lowest;
    await sleep(API_REQUEST_INTERVAL_MS);
  }
}

/**
 * The given posts, in the order of `ids`. They are asked for in groups, as
 * one `( id:1 ~ id:2 … )` search per group. When a group's answer is empty
 * the group is asked again post by post through the `id` parameter, which is
 * slower but does not depend on the search accepting such a group.
 */
async function collectIds(
  ids: readonly number[],
  options: CollectOptions,
): Promise<PostFile[]> {
  const byId = new Map<number, string>();
  let requests = 0;
  const ask = async (query: ApiQuery): Promise<PostFile[]> => {
    if (requests > 0) {
      await sleep(API_REQUEST_INTERVAL_MS);
    }
    requests += 1;
    return parseApiPosts(await requestText(query, options.credentials));
  };

  for (let start = 0; start < ids.length; start += IDS_PER_REQUEST) {
    if (options.isCancelled()) {
      break;
    }
    const group = ids.slice(start, start + IDS_PER_REQUEST);
    const tags = buildPlaylistQueries([...group], 0)[0] ?? "";
    const found = await ask({ tags });
    if (found.length > 0) {
      for (const file of found) {
        byId.set(file.postId, file.url);
      }
    } else {
      for (const id of group) {
        if (options.isCancelled()) {
          break;
        }
        for (const file of await ask({ id })) {
          byId.set(file.postId, file.url);
        }
        options.onProgress(byId.size);
      }
    }
    options.onProgress(byId.size);
  }

  const files: PostFile[] = [];
  for (const id of ids) {
    const url = byId.get(id);
    if (url !== undefined) {
      files.push({ postId: id, url });
    }
  }
  return files;
}

export type DetailsOptions = {
  readonly credentials: ApiCredentials;
  /** Called with the posts of each answer and how many ids were asked for so far. */
  readonly onBatch: (posts: readonly PostFile[], asked: number) => Promise<void> | void;
  readonly isCancelled: () => boolean;
};

/**
 * What the API knows of the given posts (rating, score, size), a hundred ids
 * a request with a pause between requests. A post the API does not return
 * (deleted) is simply not in any batch. Returns how many ids were asked for.
 */
export async function collectPostDetails(
  ids: readonly number[],
  options: DetailsOptions,
): Promise<number> {
  let asked = 0;
  for (let start = 0; start < ids.length; start += IDS_PER_REQUEST) {
    if (options.isCancelled()) {
      break;
    }
    if (start > 0) {
      await sleep(API_DETAILS_INTERVAL_MS);
    }
    const group = ids.slice(start, start + IDS_PER_REQUEST);
    const tags = buildPlaylistQueries([...group], 0)[0] ?? "";
    const posts = parseApiPosts(await requestText({ tags }, options.credentials));
    asked += group.length;
    await options.onBatch(posts, asked);
  }
  return asked;
}

/** Finds the original files of everything a source names. */
export function collectPostFiles(
  source: DownloadSource,
  options: CollectOptions,
): Promise<PostFile[]> {
  return source.kind === "query"
    ? collectQuery(source.tags, options)
    : collectIds(source.ids, options);
}
