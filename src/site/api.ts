import * as z from "zod/mini";

import { buildPlaylistQueries } from "../search/query";
import type { ApiCredentials } from "../storage/api-credentials";

/**
 * The site API, used for one thing only: finding the original files of posts
 * for the download manager. It works with the user's own key from settings
 * and is never called without one. One request returns up to 1000 posts with
 * the addresses of their files, so no post page has to be read.
 */

const API_URL = "https://api.rule34.xxx/index.php";
const POSTS_PER_REQUEST = 1000;
/** Post ids per `( id:1 ~ id:2 … )` request; well under the site's group limit. */
const IDS_PER_REQUEST = 100;
/** Pause between two API requests of one collection run. */
export const API_REQUEST_INTERVAL_MS = 1000;
const HTTP_OK = 200;
const ERROR_TEXT_LIMIT = 120;
const SORT_TOKEN_PREFIX = "sort:";
const ID_BELOW_PREFIX = "id:<";
const TOKEN_SPLIT = /\s+/;
const ALL_QUERY = "all";

const ApiPostSchema = z.object({
  id: z.int(),
  file_url: z.string().check(z.minLength(1)),
});

export type PostFile = {
  readonly postId: number;
  readonly url: string;
};

/** What to download: a search, or an explicit list of post ids. */
export type DownloadSource =
  | { readonly kind: "query"; readonly tags: string }
  | { readonly kind: "ids"; readonly ids: readonly number[] };

function buildApiUrl(tags: string, credentials: ApiCredentials): string {
  const params = new URLSearchParams();
  params.set("page", "dapi");
  params.set("s", "post");
  params.set("q", "index");
  params.set("json", "1");
  params.set("limit", String(POSTS_PER_REQUEST));
  params.set("pid", "0");
  if (tags.length > 0 && tags !== ALL_QUERY) {
    params.set("tags", tags);
  }
  params.set("user_id", credentials.userId);
  params.set("api_key", credentials.apiKey);
  return `${API_URL}?${params.toString()}`;
}

const NO_BODY_ERROR = "API answer has no readable body";

/**
 * The body of an answer as text. Script managers differ: the text may be in
 * `responseText`, or only in `response` (as text, or already parsed).
 */
export function readResponseText(response: {
  readonly responseText?: unknown;
  readonly response?: unknown;
}): string | null {
  if (typeof response.responseText === "string") {
    return response.responseText;
  }
  const body = response.response;
  if (typeof body === "string") {
    return body;
  }
  if (body !== null && typeof body === "object") {
    return JSON.stringify(body);
  }
  return null;
}

function requestText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url,
      responseType: "text",
      onload: (response) => {
        if (response.status !== HTTP_OK) {
          reject(new Error(`API HTTP ${String(response.status)}`));
          return;
        }
        const text = readResponseText(response);
        if (text === null) {
          reject(new Error(NO_BODY_ERROR));
          return;
        }
        resolve(text);
      },
      onerror: () => {
        reject(new Error("API request failed"));
      },
      ontimeout: () => {
        reject(new Error("API request timed out"));
      },
    });
  });
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
  if (!Array.isArray(raw)) {
    throw new Error(`API: ${text.slice(0, ERROR_TEXT_LIMIT)}`);
  }
  const files: PostFile[] = [];
  for (const item of raw) {
    const parsed = ApiPostSchema.safeParse(item);
    if (parsed.success) {
      files.push({ postId: parsed.data.id, url: parsed.data.file_url });
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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
      await requestText(buildApiUrl(query, options.credentials)),
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

/** The given posts, asked for in groups of ids, in the order of `ids`. */
async function collectIds(
  ids: readonly number[],
  options: CollectOptions,
): Promise<PostFile[]> {
  const byId = new Map<number, string>();
  const queries = buildPlaylistQueries([...ids], IDS_PER_REQUEST);
  for (let index = 0; index < queries.length; index += 1) {
    if (options.isCancelled()) {
      break;
    }
    if (index > 0) {
      await sleep(API_REQUEST_INTERVAL_MS);
    }
    const query = queries[index] ?? "";
    for (const file of parseApiPosts(
      await requestText(buildApiUrl(query, options.credentials)),
    )) {
      byId.set(file.postId, file.url);
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

/** Finds the original files of everything a source names. */
export function collectPostFiles(
  source: DownloadSource,
  options: CollectOptions,
): Promise<PostFile[]> {
  return source.kind === "query"
    ? collectQuery(source.tags, options)
    : collectIds(source.ids, options);
}
