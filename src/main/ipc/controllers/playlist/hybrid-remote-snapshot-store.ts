import log from "electron-log";
import type { InferSelectModel } from "drizzle-orm";
import type { posts } from "../../../db/schema";
import type {
  BooruPost,
  IBooruProvider,
  ProviderSettings,
} from "../../../providers/types";
import {
  EXTERNAL_ARTIST_ID,
  HYBRID_SNAPSHOT_IDLE_TTL_MS,
  MAX_HYBRID_SNAPSHOTS,
  type ProviderId,
} from "../../../../shared/constants";
import { ErrorCode } from "../../../../shared/types/error-codes";
import type { IpcSafe } from "../../../../shared/types/ipc";
import { createCodedError } from "../../../../shared/utils/coded-error";
import { isVideoUrl } from "../../../../shared/utils/media";
import type { RemoteWalkCompleteness } from "../../../../shared/playlist-resolve-total";

/** Max API pages scanned while filling a hybrid remote window after filters. */
export const HYBRID_REMOTE_MAX_PAGES_TO_SCAN = 20;
/** Matches provider `fetchPosts` page-size cap (Rule34/Gelbooru). */
export const HYBRID_REMOTE_API_PAGE_CAP = 1000;

/** Row shape shared by local SQL rows and remote rows (remote rows use `id: 0`). */
export type HybridPost = IpcSafe<InferSelectModel<typeof posts>>;

export type HybridSnapshotCompleteness = "running" | RemoteWalkCompleteness;

export type HybridWalkMediaType = "all" | "images" | "videos";

type HybridWalkProvider = Pick<IBooruProvider, "fetchPosts">;

export type HybridRemoteSnapshotStoreDeps = {
  getProvider: (providerId: ProviderId) => HybridWalkProvider;
  /** Wall clock in ms; injected so idle-TTL / LRU eviction is testable. */
  now: () => number;
};

/** Everything the remote walk needs; the store never reads the DB. */
export type HybridWalkParams = {
  playlistId: number;
  providerId: ProviderId;
  providerSettings: ProviderSettings;
  /** Booru query string, already including the optional `id:<=N` bound. */
  booruQuery: string;
  fetchLimit: number;
  /** Lower-cased, trimmed blacklist tags. */
  blacklistedTags: ReadonlySet<string>;
  mediaType: HybridWalkMediaType | undefined;
  /** Frozen feed bound requested by the client on page 1 (ordered walks only). */
  upperBoundPostId: number | undefined;
  /** Local-leg ordering inputs, kept so the total can re-run the same local SQL. */
  isRandom: boolean;
  seed: number;
  sortOrder: "asc" | "desc";
};

/**
 * One remote feed walk plus the ordered-sequence state of the pages served from it.
 * Mutated only by the store (walk fields) and by the controller (`keysByPage`).
 */
export type HybridSnapshot = {
  readonly key: string;
  readonly playlistId: number;
  readonly isRandom: boolean;
  readonly seed: number;
  readonly sortOrder: "asc" | "desc";
  readonly upperBoundPostId: number | undefined;
  /** Accumulated after blacklist/media filters, in feed order. */
  readonly remotePosts: HybridPost[];
  /** Min postId among `remotePosts`; every unfetched feed post has a lower id (id-desc feed). */
  lowestFetchedPostId: number | undefined;
  completeness: HybridSnapshotCompleteness;
  /** Set when `completeness === "failed"`. */
  error: Error | undefined;
  /** Keys returned per page number; union of pages `< N` is the safety-net filter for page N. */
  readonly keysByPage: Map<number, string[]>;
  lastAccessAt: number;
  walkPromise: Promise<void>;
  readonly abortController: AbortController;
  /** Callers parked in `ensureCoverage` / `awaitComplete`. */
  readonly waiters: Set<() => void>;
};

/** Missing / evicted / superseded snapshot — one typed error for every caller. */
export function createSnapshotSupersededError(): Error {
  return createCodedError(
    "Playlist snapshot is no longer available",
    ErrorCode.SNAPSHOT_SUPERSEDED
  );
}

function buildRemoteHybridPost(
  post: BooruPost,
  providerId: ProviderId
): HybridPost {
  const isVideo = isVideoUrl(post.fileUrl);
  return {
    id: 0,
    postId: post.id,
    artistId: EXTERNAL_ARTIST_ID,
    provider: providerId,
    fileUrl: post.fileUrl,
    previewUrl: post.previewUrl,
    sampleUrl: post.sampleUrl,
    title: "",
    rating: post.rating,
    tags: post.tags.join(" "),
    mediaType: isVideo ? "video" : "image",
    publishedAt: post.createdAt.getTime(),
    createdAt: post.createdAt.getTime(),
    isViewed: false,
    isFavorited: false,
    lastViewedAt: null,
    viewCount: 0,
  };
}

/**
 * Bounded owner of hybrid smart-playlist remote walks (one active snapshot per
 * playlist, at most `MAX_HYBRID_SNAPSHOTS`, idle ones dropped after
 * `HYBRID_SNAPSHOT_IDLE_TTL_MS`). Pages are served from the snapshot instead of
 * re-walking the provider feed; removing a snapshot aborts its walk.
 */
export class HybridRemoteSnapshotStore {
  private readonly snapshots = new Map<string, HybridSnapshot>();
  private readonly getProvider: HybridRemoteSnapshotStoreDeps["getProvider"];
  private readonly now: HybridRemoteSnapshotStoreDeps["now"];

  constructor(deps: HybridRemoteSnapshotStoreDeps) {
    this.getProvider = deps.getProvider;
    this.now = deps.now;
  }

  /**
   * Begin a walk for `key`, superseding (abort + remove) every earlier snapshot of
   * the same playlist, then enforce the idle TTL and the global cap.
   */
  public start(key: string, params: HybridWalkParams): HybridSnapshot {
    this.release(params.playlistId);

    const snapshot: HybridSnapshot = {
      key,
      playlistId: params.playlistId,
      isRandom: params.isRandom,
      seed: params.seed,
      sortOrder: params.sortOrder,
      upperBoundPostId: params.upperBoundPostId,
      remotePosts: [],
      lowestFetchedPostId: undefined,
      completeness: "running",
      error: undefined,
      keysByPage: new Map<number, string[]>(),
      lastAccessAt: this.now(),
      walkPromise: Promise.resolve(),
      abortController: new AbortController(),
      waiters: new Set<() => void>(),
    };
    this.snapshots.set(key, snapshot);
    this.evictIdle();
    snapshot.walkPromise = this.runWalk(snapshot, params);
    return snapshot;
  }

  /** Live snapshot for `key`, or undefined. Counts as an access (idle TTL / LRU). */
  public get(key: string): HybridSnapshot | undefined {
    const snapshot = this.snapshots.get(key);
    if (snapshot !== undefined) {
      snapshot.lastAccessAt = this.now();
    }
    return snapshot;
  }

  /** Live snapshot for `key`; missing / evicted / superseded → SNAPSHOT_SUPERSEDED. */
  public require(key: string): HybridSnapshot {
    const snapshot = this.get(key);
    if (snapshot === undefined) {
      throw createSnapshotSupersededError();
    }
    return snapshot;
  }

  /**
   * Resolve once `predicate(snapshot)` holds, the walk finished (`exact` /
   * `lowerBound`), or it failed. A failed walk rejects with its error unless the
   * predicate already holds. A removed snapshot rejects with SNAPSHOT_SUPERSEDED.
   */
  public async ensureCoverage(
    key: string,
    predicate: (snapshot: HybridSnapshot) => boolean
  ): Promise<HybridSnapshot> {
    const snapshot = this.require(key);
    for (;;) {
      if (snapshot.abortController.signal.aborted) {
        throw createSnapshotSupersededError();
      }
      snapshot.lastAccessAt = this.now();
      if (snapshot.completeness === "exact" || snapshot.completeness === "lowerBound") {
        return snapshot;
      }
      if (predicate(snapshot)) {
        return snapshot;
      }
      if (snapshot.completeness === "failed") {
        throw (
          snapshot.error ??
          createCodedError("Hybrid remote walk failed", ErrorCode.UNKNOWN_ERROR)
        );
      }
      await new Promise<void>((resolve) => {
        snapshot.waiters.add(resolve);
      });
    }
  }

  /** Wait for the walk to end; rejects on failure or removal. */
  public async awaitComplete(key: string): Promise<HybridSnapshot> {
    return await this.ensureCoverage(key, () => false);
  }

  /** Abort and drop every snapshot of `playlistId` (gallery unmount, playlist switch, edit). */
  public release(playlistId: number): void {
    for (const snapshot of [...this.snapshots.values()]) {
      if (snapshot.playlistId === playlistId) {
        this.remove(snapshot, "released");
      }
    }
  }

  /** Abort and drop everything (DB reopen / schema refresh). */
  public clear(): void {
    for (const snapshot of [...this.snapshots.values()]) {
      this.remove(snapshot, "cleared");
    }
  }

  /**
   * Drop snapshots idle for `HYBRID_SNAPSHOT_IDLE_TTL_MS` (unless a caller is
   * waiting on them), then LRU-evict by `lastAccessAt` down to `MAX_HYBRID_SNAPSHOTS`.
   * Eviction aborts the walk.
   */
  public evictIdle(): void {
    const nowMs = this.now();
    for (const snapshot of [...this.snapshots.values()]) {
      if (
        snapshot.waiters.size === 0 &&
        nowMs - snapshot.lastAccessAt >= HYBRID_SNAPSHOT_IDLE_TTL_MS
      ) {
        this.remove(snapshot, "idle");
      }
    }
    while (this.snapshots.size > MAX_HYBRID_SNAPSHOTS) {
      let oldest: HybridSnapshot | undefined;
      for (const snapshot of this.snapshots.values()) {
        if (oldest === undefined || snapshot.lastAccessAt < oldest.lastAccessAt) {
          oldest = snapshot;
        }
      }
      if (oldest === undefined) {
        break;
      }
      this.remove(oldest, "lru");
    }
  }

  private remove(snapshot: HybridSnapshot, reason: string): void {
    if (this.snapshots.get(snapshot.key) === snapshot) {
      this.snapshots.delete(snapshot.key);
    }
    snapshot.abortController.abort();
    this.wake(snapshot);
    log.info(
      `[HybridSnapshotStore] Dropped snapshot for playlist ${snapshot.playlistId} (${reason})`
    );
  }

  private wake(snapshot: HybridSnapshot): void {
    const parked = [...snapshot.waiters];
    snapshot.waiters.clear();
    for (const resolve of parked) {
      resolve();
    }
  }

  /**
   * Feed walk from API page 0 until `fetchLimit` posts remain after
   * blacklist/media filters, the scan-page cap is hit, or the feed ends (short
   * raw page). Updates the snapshot and wakes waiters after every API page.
   */
  private async runWalk(
    snapshot: HybridSnapshot,
    params: HybridWalkParams
  ): Promise<void> {
    const { signal } = snapshot.abortController;
    const { playlistId, providerId, fetchLimit, upperBoundPostId } = params;
    try {
      log.info(
        `[HybridSnapshotStore] Fetching remote posts for playlist ${playlistId} with query: "${params.booruQuery}"`
      );
      const provider = this.getProvider(providerId);
      const seenPostIds = new Set<number>();
      let apiPage = 0;
      let pagesScanned = 0;
      let rawFetchedTotal = 0;
      const apiRequestLimit = Math.min(
        HYBRID_REMOTE_API_PAGE_CAP,
        Math.max(1, fetchLimit)
      );

      for (;;) {
        const { posts: booruPosts, rawItemCount } = await provider.fetchPosts(
          params.booruQuery,
          apiPage,
          params.providerSettings,
          false,
          apiRequestLimit,
          signal
        );
        if (signal.aborted) {
          return;
        }
        pagesScanned += 1;
        rawFetchedTotal += booruPosts.length;

        for (const post of booruPosts) {
          // Belt-and-suspenders: drop ids above the snapshot even if the meta-tag
          // is ignored by a provider quirk.
          if (upperBoundPostId !== undefined && post.id > upperBoundPostId) {
            continue;
          }

          if (
            params.blacklistedTags.size > 0 &&
            post.tags.some((tag) =>
              params.blacklistedTags.has(tag.trim().toLowerCase())
            )
          ) {
            continue;
          }

          if (params.mediaType) {
            const isVideo = isVideoUrl(post.fileUrl);
            if (params.mediaType === "videos" && !isVideo) {
              continue;
            }
            if (params.mediaType === "images" && isVideo) {
              continue;
            }
          }

          if (seenPostIds.has(post.id)) {
            continue;
          }
          seenPostIds.add(post.id);

          snapshot.remotePosts.push(buildRemoteHybridPost(post, providerId));
          if (
            snapshot.lowestFetchedPostId === undefined ||
            post.id < snapshot.lowestFetchedPostId
          ) {
            snapshot.lowestFetchedPostId = post.id;
          }

          if (snapshot.remotePosts.length >= fetchLimit) {
            break;
          }
        }

        // End of feed: short *API* page (not fetchLimit — random materialize uses a large cap).
        const feedExhausted =
          rawItemCount < apiRequestLimit || booruPosts.length === 0;
        const keepWalking =
          !feedExhausted &&
          snapshot.remotePosts.length < fetchLimit &&
          pagesScanned < HYBRID_REMOTE_MAX_PAGES_TO_SCAN;

        if (!keepWalking) {
          // exact = provider feed exhausted (short API page). Otherwise scan/fetch cap → lowerBound.
          snapshot.completeness = feedExhausted ? "exact" : "lowerBound";
          log.info(
            `[HybridSnapshotStore] Resolved ${snapshot.remotePosts.length} posts from remote API for playlist ${playlistId} ` +
              `(fetchLimit ${fetchLimit}, scanned ${pagesScanned} API page(s), raw ${rawFetchedTotal}, ` +
              `completeness ${snapshot.completeness})`
          );
        }
        this.wake(snapshot);
        if (!keepWalking) {
          return;
        }
        apiPage += 1;
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      snapshot.error =
        error instanceof Error ? error : new Error(String(error));
      snapshot.completeness = "failed";
      log.error(
        `[HybridSnapshotStore] Failed to resolve remote playlist posts for ${playlistId}:`,
        error
      );
      this.wake(snapshot);
    }
  }
}
