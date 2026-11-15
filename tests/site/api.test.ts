import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_REQUEST_INTERVAL_MS,
  collectPostFiles,
  parseApiPosts,
  queryForWalk,
  readResponseText,
} from "../../src/site/api";

const CREDENTIALS = { userId: "42", apiKey: "secret-key" };

type Request = { url: string; onload: (response: { status: number; responseText: string }) => void };

function post(id: number): { id: number; file_url: string } {
  return { id, file_url: `https://wimg.rule34.xxx//images/1/${String(id)}.jpg` };
}

/** Answers API requests in order; records the `tags` of each request. */
function stubApi(answers: string[]): string[] {
  const seenTags: string[] = [];
  vi.stubGlobal("GM_xmlhttpRequest", (request: Request) => {
    const url = new URL(request.url);
    seenTags.push(url.searchParams.get("tags") ?? "");
    expect(url.origin).toBe("https://api.rule34.xxx");
    expect(url.searchParams.get("user_id")).toBe("42");
    expect(url.searchParams.get("api_key")).toBe("secret-key");
    expect(url.searchParams.get("json")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("1000");
    request.onload({ status: 200, responseText: answers.shift() ?? "" });
  });
  return seenTags;
}

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(API_REQUEST_INTERVAL_MS * 10);
  return promise;
}

describe("site API for downloads", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  it("finds the body of an answer wherever the script manager puts it", () => {
    expect(readResponseText({ responseText: "[1]" })).toBe("[1]");
    expect(readResponseText({ response: "[2]" })).toBe("[2]");
    expect(readResponseText({ response: [{ id: 5 }] })).toBe('[{"id":5}]');
    expect(readResponseText({ responseText: "", response: "x" })).toBe("");
    expect(readResponseText({})).toBeNull();
    expect(readResponseText({ response: null })).toBeNull();
  });

  it("reads posts when the manager gives only `response`, not `responseText`", async () => {
    vi.stubGlobal(
      "GM_xmlhttpRequest",
      (request: { onload: (response: { status: number; response: unknown }) => void }) => {
        request.onload({ status: 200, response: [post(5)] });
      },
    );
    const files = await settle(
      collectPostFiles(
        { kind: "ids", ids: [5] },
        { credentials: CREDENTIALS, onProgress: () => {}, isCancelled: () => false },
      ),
    );
    expect(files).toEqual([{ postId: 5, url: "https://wimg.rule34.xxx//images/1/5.jpg" }]);
  });

  it("turns a refusal in words into an error with those words", () => {
    expect(() => parseApiPosts("Missing authentication. Go to the account page.")).toThrow(
      "API: Missing authentication.",
    );
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
