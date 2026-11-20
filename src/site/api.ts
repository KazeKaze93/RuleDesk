import * as z from "zod/mini";

import { FETCH_METHOD_GET } from "../config/constants";
import type { ApiCredentials } from "../storage/api-credentials";
import { isSiteUrl } from "./urls";

/**
 * The site API, used for one thing only: finding the original files of posts
 * for the download manager. It works with the user's own key from settings
 * and is never called without one.
 *
 * A search is answered a thousand posts a request. A list of posts is not:
 * the API has no "or" for ids (docs/site.md has what was tried), so posts
 * named by id cost one request each.
 */

const API_URL = "https://api.rule34.xxx/index.php";
const POSTS_PER_REQUEST = 1000;
/** Pause between two API requests of one collection run. */
export const API_REQUEST_INTERVAL_MS = 1000;
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
 *   kept in localStorage (downloads in two tabs share the key);
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

type ApiAnswer = { readonly status: number; readonly text: string };

const ERROR_NO_REQUEST = "The script manager cannot ask the API (GM_xmlhttpRequest is missing)";
const ERROR_NETWORK = "API request failed";
const ERROR_NO_BODY = "The script manager gave the API answer without its text";
const ERROR_TIMEOUT = "API request timed out";
const HTTP_OK_FROM = 200;
const HTTP_OK_BELOW = 300;
/** A request with no answer for this long has failed. */
const API_TIMEOUT_MS = 30_000;

/** True when the script manager can make the request the API needs. */
export function canAskApi(): boolean {
  return typeof GM_xmlhttpRequest === "function";
}

/**
 * The request itself, made by the script manager and not by the page. The key
 * is in the address, and the address of a request made with `fetch` is seen
 * by every script of the page, the site's and its advertisers', in the page's
 * list of loaded resources (Kaze checked it during a download, 19.11.2026:
 * the key was there). A request of the manager is not in that list. There is
 * no falling back to `fetch`: that would show the key again without a word.
 * `anonymous` sends no cookies; the key is the whole authentication.
 */
function ask(url: string): Promise<ApiAnswer> {
  return new Promise((resolve, reject) => {
    if (!canAskApi()) {
      reject(new Error(ERROR_NO_REQUEST));
      return;
    }
    GM_xmlhttpRequest({
      method: FETCH_METHOD_GET,
      url,
      anonymous: true,
      timeout: API_TIMEOUT_MS,
      onload: (response) => {
        // A script manager has been seen to give an answer with no text in
        // it (Tampermonkey 5.5.1, 15.11.2026). That is said in words: taken
        // as an empty answer it would read as "the site has no such posts".
        const body: unknown = response.responseText ?? response.response;
        if (typeof body !== "string") {
          reject(new Error(ERROR_NO_BODY));
          return;
        }
        resolve({ status: response.status, text: body });
      },
      onerror: () => {
        reject(new Error(ERROR_NETWORK));
      },
      onabort: () => {
        reject(new Error(ERROR_NETWORK));
      },
      ontimeout: () => {
        reject(new Error(ERROR_TIMEOUT));
      },
    });
  });
}

/** One API request, in its turn, asked again a few times after "too many requests". */
async function requestText(query: ApiQuery, credentials: ApiCredentials): Promise<string> {
  for (let attempt = 0; ; attempt += 1) {
    await takeTurn();
    const answer = await ask(buildApiUrl(query, credentials));
    if (answer.status === HTTP_TOO_MANY_REQUESTS && attempt < API_LIMIT_RETRIES) {
      // Something else is using the key (another browser, another tool): wait it out.
      await sleep(API_LIMIT_PAUSE_MS);
      continue;
    }
    if (answer.status < HTTP_OK_FROM || answer.status >= HTTP_OK_BELOW) {
      throw new Error(`API HTTP ${String(answer.status)}`);
    }
    return answer.text;
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
 * The given posts, in the order of `ids`, one request a post through the `id`
 * parameter. (They used to be asked for a hundred at a time as one
 * `( id:1 ~ id:2 … )` search first; the API answers such a search with
 * nothing, so that was one wasted request in every hundred.) A post the API
 * does not return, a deleted one, is left out.
 */
async function collectIds(
  ids: readonly number[],
  options: CollectOptions,
): Promise<PostFile[]> {
  const files: PostFile[] = [];
  for (const id of ids) {
    if (options.isCancelled()) {
      break;
    }
    const found = parseApiPosts(await requestText({ id }, options.credentials));
    const file = found.find((item) => item.postId === id) ?? found[0];
    if (file !== undefined) {
      files.push(file);
    }
    options.onProgress(files.length);
  }
  return files;
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
