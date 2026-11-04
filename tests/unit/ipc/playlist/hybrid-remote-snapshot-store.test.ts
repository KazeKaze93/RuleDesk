import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HYBRID_REMOTE_API_PAGE_CAP,
  HYBRID_REMOTE_MAX_PAGES_TO_SCAN,
  HybridRemoteSnapshotStore,
  type HybridWalkParams,
} from "../../../../src/main/ipc/controllers/playlist/hybrid-remote-snapshot-store";
import { createAbortError } from "../../../../src/main/providers/provider-throttle";
import type {
  BooruPost,
  FetchPostsResult,
  IBooruProvider,
} from "../../../../src/main/providers/types";
import {
  HYBRID_SNAPSHOT_IDLE_TTL_MS,
  MAX_HYBRID_SNAPSHOTS,
} from "../../../../src/shared/constants";
import { ErrorCode } from "../../../../src/shared/types/error-codes";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

type FetchPosts = IBooruProvider["fetchPosts"];

const API_DELAY_MS = 100;
const START_CLOCK_MS = 1_000_000;
/** Same window cap as the controller: the walk ends on the feed / scan-page cap, not the limit. */
const FETCH_LIMIT = 50_000;
const FEED_HEAD_ID = 100_000;

function makePost(
  id: number,
  overrides: Partial<Pick<BooruPost, "tags" | "fileUrl">> = {}
): BooruPost {
  return {
    id,
    fileUrl: overrides.fileUrl ?? `https://cdn.example.com/${id}.jpg`,
    previewUrl: `https://cdn.example.com/${id}-p.jpg`,
    sampleUrl: `https://cdn.example.com/${id}-s.jpg`,
    tags: overrides.tags ?? ["solo"],
    rating: "s",
    score: 0,
    source: "",
    width: 100,
    height: 100,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  };
}

/** `count` posts, ids descending from `headId` (the feed is id-desc). */
function makeFeedPage(headId: number, count: number): BooruPost[] {
  return Array.from({ length: count }, (_, index) => makePost(headId - index));
}

function asResult(posts: BooruPost[]): FetchPostsResult {
  return { posts, rawItemCount: posts.length, rejectedPostIds: [] };
}

/**
 * Provider whose API pages answer after API_DELAY_MS (fake timers) and reject with an
 * AbortError when the walk signal fires — like the real axios/throttle path.
 */
function createFeedProvider(pages: BooruPost[][]) {
  const fetchPosts = vi.fn<FetchPosts>(
    async (_tags, apiPage, _settings, _isRandom, _limit, signal) => {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, API_DELAY_MS);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(createAbortError());
          },
          { once: true }
        );
      });
      return asResult(pages[apiPage] ?? []);
    }
  );
  return fetchPosts;
}

function walkParams(
  playlistId: number,
  overrides: Partial<HybridWalkParams> = {}
): HybridWalkParams {
  return {
    playlistId,
    providerId: "rule34",
    providerSettings: { userId: "1", apiKey: "k" },
    booruQuery: "solo",
    fetchLimit: FETCH_LIMIT,
    blacklistedTags: new Set<string>(),
    mediaType: undefined,
    upperBoundPostId: undefined,
    isRandom: false,
    seed: 0,
    sortOrder: "desc",
    ...overrides,
  };
}

/** Two full API pages then a short one → the walk ends `exact` on the third response. */
function makeThreePageFeed(): BooruPost[][] {
  return [
    makeFeedPage(FEED_HEAD_ID, HYBRID_REMOTE_API_PAGE_CAP),
    makeFeedPage(FEED_HEAD_ID - HYBRID_REMOTE_API_PAGE_CAP, HYBRID_REMOTE_API_PAGE_CAP),
    makeFeedPage(FEED_HEAD_ID - 2 * HYBRID_REMOTE_API_PAGE_CAP, 10),
  ];
}

describe("HybridRemoteSnapshotStore", () => {
  let nowMs: number;
  let fetchPosts: ReturnType<typeof createFeedProvider>;
  let store: HybridRemoteSnapshotStore;

  function createStore(provider: ReturnType<typeof createFeedProvider>): HybridRemoteSnapshotStore {
    return new HybridRemoteSnapshotStore({
      getProvider: () => ({ fetchPosts: provider }),
      now: () => nowMs,
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    nowMs = START_CLOCK_MS;
    fetchPosts = createFeedProvider(makeThreePageFeed());
    store = createStore(fetchPosts);
  });

  afterEach(() => {
    store.clear();
    vi.useRealTimers();
  });

  it("updates remotePosts and lowestFetchedPostId after every API page and wakes waiters", async () => {
    store.start("k1", walkParams(1));

    const firstPage = store.ensureCoverage(
      "k1",
      (snapshot) => snapshot.remotePosts.length >= HYBRID_REMOTE_API_PAGE_CAP
    );
    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    const snapshot = await firstPage;

    // First response is enough: the second API page is requested but not delivered yet.
    expect(snapshot.completeness).toBe("running");
    expect(snapshot.remotePosts).toHaveLength(HYBRID_REMOTE_API_PAGE_CAP);
    expect(snapshot.lowestFetchedPostId).toBe(
      FEED_HEAD_ID - HYBRID_REMOTE_API_PAGE_CAP + 1
    );
    expect(fetchPosts).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(API_DELAY_MS);
    expect(snapshot.remotePosts).toHaveLength(2 * HYBRID_REMOTE_API_PAGE_CAP);
    expect(snapshot.lowestFetchedPostId).toBe(
      FEED_HEAD_ID - 2 * HYBRID_REMOTE_API_PAGE_CAP + 1
    );
  });

  it("awaitComplete waits for the short API page and ends exact", async () => {
    store.start("k1", walkParams(1));
    const complete = store.awaitComplete("k1");

    await vi.advanceTimersByTimeAsync(API_DELAY_MS * 3);
    const snapshot = await complete;

    expect(snapshot.completeness).toBe("exact");
    expect(snapshot.remotePosts).toHaveLength(2 * HYBRID_REMOTE_API_PAGE_CAP + 10);
    expect(fetchPosts).toHaveBeenCalledTimes(3);
  });

  it("passes the walk AbortSignal and the fixed request shape to fetchPosts", async () => {
    const snapshot = store.start("k1", walkParams(1, { booruQuery: "solo id:<=500" }));
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchPosts).toHaveBeenCalledWith(
      "solo id:<=500",
      0,
      { userId: "1", apiKey: "k" },
      false,
      HYBRID_REMOTE_API_PAGE_CAP,
      snapshot.abortController.signal
    );
  });

  it("ends lowerBound at the scan-page cap when the feed never ends", async () => {
    const endless = vi.fn<FetchPosts>(async (_tags, apiPage) =>
      asResult(
        makeFeedPage(
          FEED_HEAD_ID - apiPage * HYBRID_REMOTE_API_PAGE_CAP,
          HYBRID_REMOTE_API_PAGE_CAP
        )
      )
    );
    const endlessStore = createStore(endless);
    endlessStore.start("k1", walkParams(1));

    const snapshot = await endlessStore.awaitComplete("k1");

    expect(snapshot.completeness).toBe("lowerBound");
    expect(endless).toHaveBeenCalledTimes(HYBRID_REMOTE_MAX_PAGES_TO_SCAN);
    endlessStore.clear();
  });

  it("applies blacklist, media, upper-bound and duplicate filters like the old walk", async () => {
    const page = [
      makePost(500),
      makePost(499, { tags: ["solo", "Blocked_Tag"] }),
      makePost(498, { fileUrl: "https://cdn.example.com/498.mp4" }),
      makePost(497),
      makePost(497),
      makePost(900),
    ];
    const filtered = createStore(vi.fn<FetchPosts>(async () => asResult(page)));
    filtered.start(
      "k1",
      walkParams(1, {
        blacklistedTags: new Set(["blocked_tag"]),
        mediaType: "images",
        upperBoundPostId: 800,
      })
    );

    const snapshot = await filtered.awaitComplete("k1");

    expect(snapshot.remotePosts.map((post) => post.postId)).toEqual([500, 497]);
    expect(snapshot.lowestFetchedPostId).toBe(497);
    expect(snapshot.remotePosts.every((post) => post.id === 0 && post.provider === "rule34")).toBe(true);
    filtered.clear();
  });

  it("a failed walk rejects waiters with its error unless the predicate already holds", async () => {
    const failure = new Error("upstream down");
    let call = 0;
    const flaky = vi.fn<FetchPosts>(async () => {
      call += 1;
      if (call === 1) {
        return asResult(makeFeedPage(FEED_HEAD_ID, HYBRID_REMOTE_API_PAGE_CAP));
      }
      throw failure;
    });
    const flakyStore = createStore(flaky);
    flakyStore.start("k1", walkParams(1));

    await expect(flakyStore.awaitComplete("k1")).rejects.toBe(failure);

    const covered = await flakyStore.ensureCoverage("k1", (snapshot) => snapshot.remotePosts.length > 0);
    expect(covered.completeness).toBe("failed");
    await expect(
      flakyStore.ensureCoverage("k1", (snapshot) => snapshot.remotePosts.length > FETCH_LIMIT)
    ).rejects.toBe(failure);
    flakyStore.clear();
  });

  it("require / ensureCoverage on an unknown key throw SNAPSHOT_SUPERSEDED", async () => {
    let thrown: unknown;
    try {
      store.require("missing");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ code: ErrorCode.SNAPSHOT_SUPERSEDED });
    await expect(store.awaitComplete("missing")).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
  });

  it("starting a walk for the same playlist aborts the previous snapshot", async () => {
    const first = store.start("k-old", walkParams(1));
    const waiting = store.awaitComplete("k-old");
    const waitingAssertion = expect(waiting).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
    await vi.advanceTimersByTimeAsync(0);

    const second = store.start("k-new", walkParams(1));

    expect(first.abortController.signal.aborted).toBe(true);
    expect(second.abortController.signal.aborted).toBe(false);
    expect(store.get("k-old")).toBeUndefined();
    expect(store.get("k-new")).toBe(second);
    await waitingAssertion;
  });

  it("a page-1 refresh with the same key replaces the snapshot instance", async () => {
    const first = store.start("k1", walkParams(1));
    const second = store.start("k1", walkParams(1));

    expect(first.abortController.signal.aborted).toBe(true);
    expect(store.get("k1")).toBe(second);
  });

  it("release aborts and removes every snapshot of the playlist only", async () => {
    const released = store.start("k1", walkParams(1));
    const kept = store.start("k2", walkParams(2));
    const waiting = store.awaitComplete("k1");
    const waitingAssertion = expect(waiting).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });

    store.release(1);

    expect(released.abortController.signal.aborted).toBe(true);
    expect(store.get("k1")).toBeUndefined();
    expect(kept.abortController.signal.aborted).toBe(false);
    expect(store.get("k2")).toBe(kept);
    await waitingAssertion;
  });

  it("an aborted walk never turns into an empty success for the dropped snapshot", async () => {
    const snapshot = store.start("k1", walkParams(1));
    await vi.advanceTimersByTimeAsync(0);

    store.release(1);
    await vi.advanceTimersByTimeAsync(API_DELAY_MS * 3);

    expect(snapshot.completeness).toBe("running");
    expect(snapshot.error).toBeUndefined();
    expect(snapshot.remotePosts).toHaveLength(0);
    await expect(store.awaitComplete("k1")).rejects.toMatchObject({
      code: ErrorCode.SNAPSHOT_SUPERSEDED,
    });
  });

  it("clear aborts every snapshot", () => {
    const a = store.start("k1", walkParams(1));
    const b = store.start("k2", walkParams(2));

    store.clear();

    expect(a.abortController.signal.aborted).toBe(true);
    expect(b.abortController.signal.aborted).toBe(true);
    expect(store.get("k1")).toBeUndefined();
    expect(store.get("k2")).toBeUndefined();
  });

  it("evictIdle drops snapshots idle for the TTL and aborts their walk", () => {
    const stale = store.start("k1", walkParams(1));
    nowMs += HYBRID_SNAPSHOT_IDLE_TTL_MS - 1;
    const fresh = store.start("k2", walkParams(2));

    store.evictIdle();
    expect(stale.abortController.signal.aborted).toBe(false);

    nowMs += 1;
    store.evictIdle();

    expect(stale.abortController.signal.aborted).toBe(true);
    expect(store.get("k1")).toBeUndefined();
    expect(fresh.abortController.signal.aborted).toBe(false);
  });

  it("an access refreshes the idle TTL", () => {
    const snapshot = store.start("k1", walkParams(1));
    nowMs += HYBRID_SNAPSHOT_IDLE_TTL_MS - 1;
    store.get("k1");
    nowMs += HYBRID_SNAPSHOT_IDLE_TTL_MS - 1;

    store.evictIdle();

    expect(snapshot.abortController.signal.aborted).toBe(false);
  });

  it("LRU-evicts the least recently used snapshot above MAX_HYBRID_SNAPSHOTS", () => {
    const snapshots = Array.from({ length: MAX_HYBRID_SNAPSHOTS }, (_, index) => {
      nowMs += 1;
      return store.start(`k${index}`, walkParams(index));
    });
    nowMs += 1;
    store.get("k0"); // oldest by start, but now the most recently used

    nowMs += 1;
    const newest = store.start("k-newest", walkParams(MAX_HYBRID_SNAPSHOTS));

    const [first, second, third] = snapshots;
    expect(second.abortController.signal.aborted).toBe(true);
    expect(store.get("k1")).toBeUndefined();
    expect(first.abortController.signal.aborted).toBe(false);
    expect(third.abortController.signal.aborted).toBe(false);
    expect(newest.abortController.signal.aborted).toBe(false);
  });
});
