import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_LAST_REQUEST_KEY,
  API_LIMIT_PAUSE_MS,
  API_LIMIT_RETRIES,
  API_MIN_INTERVAL_MS,
  API_REQUEST_INTERVAL_MS,
  collectPostDetails,
  collectPostFiles,
  resetApiPace,
  parseApiPosts,
  queryForWalk,
} from "../../src/site/api";

const CREDENTIALS = { userId: "42", apiKey: "secret-key" };

function post(id: number): { id: number; file_url: string } {
  return { id, file_url: `https://wimg.rule34.xxx//images/1/${String(id)}.jpg` };
}

/** Answers API requests in order; records the `tags` (or `id=N`) of each. */
function stubApi(answers: string[]): string[] {
  const seen: string[] = [];
  vi.stubGlobal("fetch", (input: string, init?: RequestInit) => {
    const url = new URL(input);
    const id = url.searchParams.get("id");
    seen.push(id === null ? (url.searchParams.get("tags") ?? "") : `id=${id}`);
    expect(url.origin).toBe("https://api.rule34.xxx");
    expect(url.searchParams.get("user_id")).toBe("42");
    expect(url.searchParams.get("api_key")).toBe("secret-key");
    expect(url.searchParams.get("json")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("1000");
    // No cookies go to the API: the key is the whole authentication.
    expect(init?.credentials).toBe("omit");
    return Promise.resolve(new Response(answers.shift() ?? "", { status: 200 }));
  });
  return seen;
}

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(API_REQUEST_INTERVAL_MS * 10);
  return promise;
}

describe("site API for downloads", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetApiPace();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reads posts from an answer and treats an empty body as no posts", () => {
    expect(parseApiPosts(JSON.stringify([post(5), { id: 6 }, post(7)]))).toEqual([
      { postId: 5, url: "https://wimg.rule34.xxx//images/1/5.jpg" },
      { postId: 7, url: "https://wimg.rule34.xxx//images/1/7.jpg" },
    ]);
    expect(parseApiPosts("")).toEqual([]);
    expect(parseApiPosts("  \n")).toEqual([]);
  });

  it("asks post by post when a group of ids gets an empty answer", async () => {
    const seen = stubApi(["", JSON.stringify([post(7)]), "", JSON.stringify([post(9)])]);
    const files = await settle(
      collectPostFiles(
        { kind: "ids", ids: [7, 8, 9] },
        { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false },
      ),
    );
    expect(seen).toEqual(["( id:9 ~ id:8 ~ id:7 )", "id=7", "id=8", "id=9"]);
    // Post 8 is gone from the site: it is left out.
    expect(files.map((file) => file.postId)).toEqual([7, 9]);
  });

  it("reports a failed request by its status", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("", { status: 500 })));
    const walk = collectPostFiles(
      { kind: "query", tags: "cat" },
      { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false },
    );
    const failed = expect(walk).rejects.toThrow("API HTTP 500");
    await vi.advanceTimersByTimeAsync(API_MIN_INTERVAL_MS);
    await failed;
  });

  it("waits out too many requests and asks again, then gives up", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", () => {
      calls += 1;
      return Promise.resolve(
        calls <= 2
          ? new Response("", { status: 429 })
          : new Response(JSON.stringify([post(5)]), { status: 200 }),
      );
    });
    let posts: number[] = [];
    const run = collectPostDetails([5], {
      credentials: CREDENTIALS,
      isCancelled: () => false,
      onBatch: (batch) => {
        posts = batch.map((item) => item.postId);
      },
    });
    await vi.advanceTimersByTimeAsync((API_LIMIT_PAUSE_MS + API_MIN_INTERVAL_MS) * 3);
    await run;
    expect(calls).toBe(3);
    expect(posts).toEqual([5]);

    calls = 0;
    vi.stubGlobal("fetch", () => {
      calls += 1;
      return Promise.resolve(new Response("", { status: 429 }));
    });
    const stuck = collectPostDetails([5], {
      credentials: CREDENTIALS,
      isCancelled: () => false,
      onBatch: () => {},
    });
    const failed = expect(stuck).rejects.toThrow("API HTTP 429");
    await vi.advanceTimersByTimeAsync((API_LIMIT_PAUSE_MS + API_MIN_INTERVAL_MS) * 5);
    await failed;
    expect(calls).toBe(API_LIMIT_RETRIES + 1);
  });

  it("starts no request sooner than the pace allows, whoever asks", async () => {
    const starts: number[] = [];
    vi.stubGlobal("fetch", () => {
      starts.push(Date.now());
      return Promise.resolve(new Response("[]", { status: 200 }));
    });
    const options = { credentials: CREDENTIALS, isCancelled: () => false, onBatch: () => {} };
    // Two runs at once, as a download and the reading of ratings would be.
    const both = Promise.all([collectPostDetails([1], options), collectPostDetails([2], options)]);
    await vi.advanceTimersByTimeAsync(API_MIN_INTERVAL_MS * 4);
    await both;
    expect(starts).toHaveLength(2);
    expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(API_MIN_INTERVAL_MS);
  });

  it("keeps the pace across tabs through the shared time", async () => {
    const starts: number[] = [];
    vi.stubGlobal("fetch", () => {
      starts.push(Date.now());
      return Promise.resolve(new Response("[]", { status: 200 }));
    });
    // Another tab has just made a request.
    const before = Date.now();
    window.localStorage.setItem(API_LAST_REQUEST_KEY, String(before));
    const run = collectPostDetails([1], {
      credentials: CREDENTIALS,
      isCancelled: () => false,
      onBatch: () => {},
    });
    await vi.advanceTimersByTimeAsync(API_MIN_INTERVAL_MS * 2);
    await run;
    expect((starts[0] ?? 0) - before).toBeGreaterThanOrEqual(API_MIN_INTERVAL_MS);
  });

  it("turns a refusal in words into an error with those words", () => {
    expect(() => parseApiPosts("Missing authentication. Go to the account page.")).toThrow(
      "API: Missing authentication.",
    );
    // What the API really sends without a key: the sentence as a JSON string.
    expect(() =>
      parseApiPosts('"Missing authentication. Go to api.rule34.xxx for more information"'),
    ).toThrow("API: Missing authentication. Go to api.rule34.xxx for more information");
    expect(() => parseApiPosts('{"success":false}')).toThrow("API:");
  });

  it("drops sort tokens from a search before walking it", () => {
    expect(queryForWalk("cat sort:score:desc  -dog sort:random")).toBe("cat -dog");
  });

  it("walks a search newest first with an id cursor until an answer is empty", async () => {
    const tags = stubApi([
      JSON.stringify([post(90), post(80)]),
      JSON.stringify([post(70)]),
      "",
    ]);
    const progress: number[] = [];

    const files = await settle(
      collectPostFiles(
        { kind: "query", tags: "cat sort:score:desc" },
        {
          credentials: CREDENTIALS,
          onProgress: (found) => {
            progress.push(found);
          },
          isCancelled: () => false,
        },
      ),
    );

    expect(files.map((file) => file.postId)).toEqual([90, 80, 70]);
    expect(tags).toEqual(["cat", "cat id:<80", "cat id:<70"]);
    expect(progress).toEqual([2, 3]);
  });

  it("asks for explicit posts in groups of ids and keeps the given order", async () => {
    const ids = Array.from({ length: 150 }, (_, index) => index + 1);
    const tags = stubApi([JSON.stringify(ids.map(post))]);

    const files = await settle(
      collectPostFiles(
        { kind: "ids", ids: [3, 150, 1, 9999] },
        { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false },
      ),
    );

    expect(tags).toHaveLength(1);
    expect(tags[0]).toContain("id:150");
    // 9999 is not in any answer: a deleted post is simply left out.
    expect(files.map((file) => file.postId)).toEqual([3, 150, 1]);
  });

  it("stops asking once cancelled", async () => {
    const tags = stubApi([JSON.stringify([post(90)]), JSON.stringify([post(80)])]);
    let cancelled = false;
    const files = await settle(
      collectPostFiles(
        { kind: "query", tags: "cat" },
        {
          credentials: CREDENTIALS,
          onProgress: () => {
            cancelled = true;
          },
          isCancelled: () => cancelled,
        },
      ),
    );
    expect(tags).toEqual(["cat"]);
    expect(files.map((file) => file.postId)).toEqual([90]);
  });
});
