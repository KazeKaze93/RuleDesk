import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_LAST_REQUEST_KEY,
  API_LIMIT_PAUSE_MS,
  API_LIMIT_RETRIES,
  API_MIN_INTERVAL_MS,
  API_REQUEST_INTERVAL_MS,
  collectPostFiles,
  resetApiPace,
  parseApiPosts,
  queryForWalk,
} from "../../src/site/api";

const CREDENTIALS = { userId: "42", apiKey: "secret-key" };

function post(id: number): { id: number; file_url: string } {
  return { id, file_url: `https://wimg.rule34.xxx//images/1/${String(id)}.jpg` };
}

type ManagerRequest = {
  readonly method?: string;
  readonly url: string;
  readonly anonymous?: boolean;
  readonly onload?: (response: { status: number; responseText: string }) => void;
  readonly onerror?: () => void;
};

/**
 * The script manager's request, which the API is asked through. `fetch` is
 * made to fail the test: a request of the page would show the key to the page.
 */
function stubManager(answer: (details: ManagerRequest) => { status: number; body: string }): void {
  vi.stubGlobal("fetch", () => {
    throw new Error("the API must not be asked with fetch");
  });
  vi.stubGlobal("GM_xmlhttpRequest", (details: ManagerRequest) => {
    const { status, body } = answer(details);
    queueMicrotask(() => {
      details.onload?.({ status, responseText: body });
    });
  });
}

/** Answers API requests in order; records the `tags` (or `id=N`) of each. */
function stubApi(answers: string[]): string[] {
  const seen: string[] = [];
  stubManager((details) => {
    const url = new URL(details.url);
    const id = url.searchParams.get("id");
    seen.push(id === null ? (url.searchParams.get("tags") ?? "") : `id=${id}`);
    expect(url.origin).toBe("https://api.rule34.xxx");
    expect(url.searchParams.get("user_id")).toBe("42");
    expect(url.searchParams.get("api_key")).toBe("secret-key");
    expect(url.searchParams.get("json")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("1000");
    expect(details.method).toBe("GET");
    // No cookies go to the API: the key is the whole authentication.
    expect(details.anonymous).toBe(true);
    return { status: 200, body: answers.shift() ?? "" };
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

  it("asks for posts named by id one at a time: the API has no list of ids", async () => {
    const seen = stubApi([JSON.stringify([post(7)]), "", JSON.stringify([post(9)])]);
    const files = await settle(
      collectPostFiles(
        { kind: "ids", ids: [7, 8, 9] },
        { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false },
      ),
    );
    expect(seen).toEqual(["id=7", "id=8", "id=9"]);
    // Post 8 is gone from the site: it is left out.
    expect(files.map((file) => file.postId)).toEqual([7, 9]);
  });

  it("reports a failed request by its status", async () => {
    stubManager(() => ({ status: 500, body: "" }));
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
    stubManager(() => {
      calls += 1;
      return calls <= 2
        ? { status: 429, body: "" }
        : { status: 200, body: JSON.stringify([post(5)]) };
    });
    const run = collectPostFiles({ kind: "ids", ids: [5] }, { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false });
    await vi.advanceTimersByTimeAsync((API_LIMIT_PAUSE_MS + API_MIN_INTERVAL_MS) * 3);
    expect((await run).map((file) => file.postId)).toEqual([5]);
    expect(calls).toBe(3);

    calls = 0;
    stubManager(() => {
      calls += 1;
      return { status: 429, body: "" };
    });
    const stuck = collectPostFiles({ kind: "ids", ids: [5] }, { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false });
    const failed = expect(stuck).rejects.toThrow("API HTTP 429");
    await vi.advanceTimersByTimeAsync((API_LIMIT_PAUSE_MS + API_MIN_INTERVAL_MS) * 5);
    await failed;
    expect(calls).toBe(API_LIMIT_RETRIES + 1);
  });

  it("starts no request sooner than the pace allows, whoever asks", async () => {
    const starts: number[] = [];
    stubManager(() => {
      starts.push(Date.now());
      return { status: 200, body: "[]" };
    });
    // Two runs at once, as two downloads would be.
    const both = Promise.all([
      collectPostFiles({ kind: "ids", ids: [1] }, { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false }),
      collectPostFiles({ kind: "ids", ids: [2] }, { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false }),
    ]);
    await vi.advanceTimersByTimeAsync(API_MIN_INTERVAL_MS * 4);
    await both;
    expect(starts).toHaveLength(2);
    expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(API_MIN_INTERVAL_MS);
  });

  it("keeps the pace across tabs through the shared time", async () => {
    const starts: number[] = [];
    stubManager(() => {
      starts.push(Date.now());
      return { status: 200, body: "[]" };
    });
    // Another tab has just made a request.
    const before = Date.now();
    window.localStorage.setItem(API_LAST_REQUEST_KEY, String(before));
    const run = collectPostFiles({ kind: "ids", ids: [1] }, { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false });
    await vi.advanceTimersByTimeAsync(API_MIN_INTERVAL_MS * 2);
    await run;
    expect((starts[0] ?? 0) - before).toBeGreaterThanOrEqual(API_MIN_INTERVAL_MS);
  });

  it("does not ask at all, and says why, when the script manager cannot make the request", async () => {
    const fetched = vi.fn();
    vi.stubGlobal("fetch", fetched);
    vi.stubGlobal("GM_xmlhttpRequest", undefined);
    const run = collectPostFiles(
      { kind: "ids", ids: [5] },
      { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false },
    );
    const failed = expect(run).rejects.toThrow("GM_xmlhttpRequest is missing");
    await vi.advanceTimersByTimeAsync(API_MIN_INTERVAL_MS);
    await failed;
    // The key is never put into a request the page can see.
    expect(fetched).not.toHaveBeenCalled();
  });

  it("says so when the script manager gives an answer with no text", async () => {
    vi.stubGlobal(
      "GM_xmlhttpRequest",
      (details: { onload?: (response: { status: number }) => void }) => {
        queueMicrotask(() => {
          details.onload?.({ status: 200 });
        });
      },
    );
    const run = collectPostFiles(
      { kind: "ids", ids: [5] },
      { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false },
    );
    const failed = expect(run).rejects.toThrow("without its text");
    await vi.advanceTimersByTimeAsync(API_MIN_INTERVAL_MS);
    await failed;
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

  it("keeps the given order of explicit posts and leaves out a post the API does not have", async () => {
    const seen = stubApi([JSON.stringify([post(3)]), JSON.stringify([post(150)]), JSON.stringify([post(1)]), ""]);

    const files = await settle(
      collectPostFiles(
        { kind: "ids", ids: [3, 150, 1, 9999] },
        { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false },
      ),
    );

    expect(seen).toEqual(["id=3", "id=150", "id=1", "id=9999"]);
    // 9999 got an empty answer: a deleted post is simply left out.
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
