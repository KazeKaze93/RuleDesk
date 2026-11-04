import { dialog, type BrowserWindow, type IpcMainInvokeEvent } from "electron";
import fs from "fs";
import log from "electron-log";
import { z } from "zod";
import { eq, desc, and, inArray, sql, or, not, asc, type SQL } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { playlists, playlistEntries, posts } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import { toIpcSafe } from "../../utils/ipc-serialization";
import type { InferSelectModel } from "drizzle-orm";
import type { IpcSafe } from "../../../shared/types/ipc";
import { ErrorCode } from "../../../shared/types/error-codes";
import { createCodedError } from "../../../shared/utils/coded-error";
import {
  CreatePlaylistSchema,
  UpdatePlaylistSchema,
  RemovePostsFromPlaylistSchema,
  GetPlaylistPostsSchema,
  ResolvePlaylistPostsSchema,
  ReorderPlaylistEntriesSchema,
  GetPlaylistResolveTotalSchema,
  ReleasePlaylistSnapshotSchema,
  MAX_PLAYLIST_IMPORT_ENTRIES,
  PLAYLIST_ENTRIES_WRITE_CHUNK_SIZE,
  PLAYLIST_IMPORT_LOOKUP_CHUNK_SIZE,
  PlaylistQueryJsonWriteSchema,
  type CreatePlaylistRequest,
  type UpdatePlaylistRequest,
  type RemovePostsFromPlaylistRequest,
  type GetPlaylistPostsRequest,
  type ResolvePlaylistPostsRequest,
  type ReorderPlaylistEntriesRequest,
  type GetPlaylistResolveTotalRequest,
  type ReleasePlaylistSnapshotRequest,
  type PlaylistResolveTotalValue,
  type SmartPlaylistQuery,
  type PlaylistExport,
  GetManualPlaylistMembershipForPostsSchema,
  type GetManualPlaylistMembershipForPostsRequest,
  SyncManualPlaylistMembershipSchema,
  type SyncManualPlaylistMembershipRequest,
  ClearManualPlaylistSchema,
  type ClearManualPlaylistRequest,
  MovePostsBetweenManualPlaylistsSchema,
  type MovePostsBetweenManualPlaylistsRequest,
} from "../../../shared/schemas/playlist";
import {
  CURRENT_SMART_QUERY_SCHEMA_VERSION,
  parseSmartQuery,
} from "../../../shared/schemas/smart-playlist-query";
import { hasAiGeneratedTag } from "../../../shared/ai-tags";
import { buildPlaylistResolveTotal } from "../../../shared/playlist-resolve-total";
import {
  EXTERNAL_ARTIST_ID,
  isProviderId,
  type ProviderId,
  type StoredProviderId,
} from "../../../shared/constants";
import { getDb, getSqliteInstance } from "../../db/client";
import { onDatabaseReopened } from "../../core/di/databaseRegistration";
import { postsFtsTableExists } from "../../db/fts-table-check";
import {
  areRuntimeDroppableFtsTriggersPresent,
  quoteFts5TagPhrase,
} from "../../db/fts-triggers";
import { escapeLikePattern } from "../../db/utils";
import {
  resolveRandomSeed,
  seededOrderBy,
} from "../../db/seeded-ordering";
import { getProvider } from "../../providers";
import { getDecryptedApiSettings } from "../../services/credentials";
import { IdSchema, OptionalIdSchema } from "../../../shared/schemas/ipc";
import { formatRule34UpperBoundPostIdTag } from "../../../shared/schemas/search";
import { sanitizeProviderTagToken } from "../../../shared/utils/provider-tag-sanitize";
import {
  getManualPlaylistsWithStats,
  getSmartPlaylists,
  getSmartPlaylistPostCount,
} from "../../db/queries/playlists";
import { getAllBlacklistedTags } from "../../db/queries/blacklist";
import { buildPostsBlacklistFilterCondition } from "../../db/queries/post-tag-filter";
import type { PlaylistResolveTotal } from "../../../shared/schemas/playlist";
import {
  HybridRemoteSnapshotStore,
  createSnapshotSupersededError,
  type HybridPost,
  type HybridSnapshot,
} from "./playlist/hybrid-remote-snapshot-store";

type UnknownRecord = Record<string, unknown>;
const CreatePlaylistArgsSchema = z.tuple([CreatePlaylistSchema]);
const IdArgsSchema = z.tuple([IdSchema]);
const UpdatePlaylistArgsSchema = z.tuple([IdSchema, UpdatePlaylistSchema]);
const RemovePostsFromPlaylistArgsSchema = z.tuple([RemovePostsFromPlaylistSchema]);
const GetPlaylistPostsArgsSchema = z.tuple([GetPlaylistPostsSchema]);
const ReorderPlaylistEntriesArgsSchema = z.tuple([ReorderPlaylistEntriesSchema]);
const ResolvePlaylistPostsArgsSchema = z.tuple([ResolvePlaylistPostsSchema]);
const GetPlaylistResolveTotalArgsSchema = z.tuple([GetPlaylistResolveTotalSchema]);
const ReleasePlaylistSnapshotArgsSchema = z.tuple([ReleasePlaylistSnapshotSchema]);
const GetPlaylistsContainingPostArgsSchema = z.tuple([
  z.number().int(),
  OptionalIdSchema,
  z.string().min(1).optional(),
]);
const ImportPlaylistArgsSchema = z.tuple([]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isStoredProviderId(value: unknown): value is StoredProviderId {
  return typeof value === "string" && value.length > 0;
}

function isPlaylistExport(value: unknown): value is PlaylistExport {
  if (
    !isRecord(value) ||
    (value.version !== 1 && value.version !== 2) ||
    typeof value.exportedAt !== "string"
  ) {
    return false;
  }

  const playlistValue = value.playlist;
  if (!isRecord(playlistValue)) {
    return false;
  }

  if (
    typeof playlistValue.name !== "string" ||
    typeof playlistValue.isSmart !== "boolean" ||
    typeof playlistValue.queryJson !== "string" ||
    typeof playlistValue.iconName !== "string"
  ) {
    return false;
  }

  const entriesValue = value.entries;
  if (!Array.isArray(entriesValue)) {
    return false;
  }

  return entriesValue.every((entry) => {
    if (!isRecord(entry)) {
      return false;
    }
    const hasPostId =
      typeof entry.postId === "number" &&
      Number.isFinite(entry.postId) &&
      Number.isInteger(entry.postId);
    const hasAddedAt =
      typeof entry.addedAt === "number" && Number.isFinite(entry.addedAt);
    if (!hasPostId || !hasAddedAt) {
      return false;
    }
    if (value.version === 2) {
      return (
        typeof entry.artistId === "number" &&
        Number.isFinite(entry.artistId) &&
        Number.isInteger(entry.artistId) &&
        isStoredProviderId(entry.provider)
      );
    }
    // v1: artistId/provider optional (legacy files)
    if (entry.artistId !== undefined) {
      if (
        typeof entry.artistId !== "number" ||
        !Number.isFinite(entry.artistId) ||
        !Number.isInteger(entry.artistId)
      ) {
        return false;
      }
    }
    if (entry.provider !== undefined && !isStoredProviderId(entry.provider)) {
      return false;
    }
    return true;
  });
}

/**
 * IPC-safe Playlist type with Date fields converted to numbers (timestamps in milliseconds).
 * Required for Electron 39+ IPC serialization compatibility.
 * 
 * Uses shared IpcSafe utility type for automatic Date -> number conversion.
 */
type IpcPlaylist = IpcSafe<InferSelectModel<typeof playlists>>;
type IpcPlaylistWithStats = IpcPlaylist & {
  postCount: number;
};

/**
 * IPC-safe Post type with Date fields converted to numbers (timestamps in milliseconds).
 * 
 * Uses shared IpcSafe utility type for automatic Date -> number conversion.
 */
type IpcPost = HybridPost;

/** Same Knuth constant as `seeded-ordering` — hybrid random ranks must match SQL order. */
const HYBRID_SEED_HASH_MULTIPLIER = 2654435761;
/** 32-bit mask for hybrid seed ranks (uint32). */
const HYBRID_SEED_HASH_MASK = 4294967295;
/**
 * Cap for hybrid local (+ remote window) materialization.
 * Local may materialize wholly in DB so remote twins past a page prefix are
 * recognized. Remote uses the same fixed window size on every page (provider
 * feed order ≠ publishedAt); live inserts are frozen via upperBoundPostId
 * rather than caching a rematerialized stream. Random ranks also need both
 * legs because rank order ≠ feed order.
 */
const HYBRID_RANDOM_MATERIALIZE_CAP = 50_000;
/** Safety-net issued `provider:postId` keys retained per ordered sequence. */
const HYBRID_ORDERED_ISSUED_KEY_CAP = 50_000;

type ResolvePlaylistPostsIpcResult = {
  posts: IpcPost[];
  total: PlaylistResolveTotal;
};

function hybridPostMergeKey(post: { provider: string; postId: number }): string {
  return `${post.provider}:${post.postId}`;
}

/** Deterministic rank matching `seededOrderBy(postId, seed)` primary key. */
function hybridSeedRank(postId: number, seed: number): number {
  return (((postId + seed) * HYBRID_SEED_HASH_MULTIPLIER) & HYBRID_SEED_HASH_MASK) >>> 0;
}

/**
 * Compare two hybrid candidates.
 * Random: seed rank on postId, then postId ASC.
 * Ordered: postId only (same direction as sortOrder).
 * smart collection is provider-scoped by query.provider → order by postId, same as site
 */
function compareHybridPlaylistPosts(
  a: IpcPost,
  b: IpcPost,
  sortOrder: "asc" | "desc",
  isRandom: boolean,
  seed: number
): number {
  if (isRandom) {
    const rankDiff = hybridSeedRank(a.postId, seed) - hybridSeedRank(b.postId, seed);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return a.postId - b.postId;
  }
  const idDiff = a.postId - b.postId;
  return sortOrder === "asc" ? idDiff : -idDiff;
}

/** Snapshot identity: one remote walk per (playlist, query, media filter, sort). */
function buildHybridSnapshotKey(params: {
  playlistId: number;
  queryJson: string;
  querySchemaVersion: number;
  mediaType: string | undefined;
  sortOrder: string;
}): string {
  return [
    params.playlistId,
    params.querySchemaVersion,
    params.queryJson,
    params.mediaType ?? "all",
    params.sortOrder,
  ].join("\u0001");
}

/**
 * Gallery identity is (provider, postId). The same booru post may exist under
 * multiple artistId rows; keep one local winner (favorited → viewed → higher id).
 */
function preferLocalHybridRow(a: IpcPost, b: IpcPost): IpcPost {
  if (a.isFavorited !== b.isFavorited) {
    return a.isFavorited ? a : b;
  }
  if (a.isViewed !== b.isViewed) {
    return a.isViewed ? a : b;
  }
  return a.id >= b.id ? a : b;
}

/**
 * Collapse to one row per (provider, postId), preserving first-seen order of winners.
 */
function collapseHybridPostsByIdentity(
  sourcePosts: IpcPost[],
  prefer: (a: IpcPost, b: IpcPost) => IpcPost
): IpcPost[] {
  const bestByKey = new Map<string, IpcPost>();
  for (const post of sourcePosts) {
    const key = hybridPostMergeKey(post);
    const existing = bestByKey.get(key);
    bestByKey.set(key, existing === undefined ? post : prefer(existing, post));
  }
  const collapsed: IpcPost[] = [];
  const emitted = new Set<string>();
  for (const post of sourcePosts) {
    const key = hybridPostMergeKey(post);
    if (emitted.has(key)) {
      continue;
    }
    emitted.add(key);
    const winner = bestByKey.get(key);
    if (winner !== undefined) {
      collapsed.push(winner);
    }
  }
  return collapsed;
}

/**
 * Prefer local rows, then append remote-only rows (same provider:postId dropped).
 */
function dedupeHybridPostsPreferLocal(
  localPosts: IpcPost[],
  remotePosts: IpcPost[]
): IpcPost[] {
  const localKeys = new Set(localPosts.map(hybridPostMergeKey));
  const remoteOnly: IpcPost[] = [];
  for (const post of remotePosts) {
    if (!localKeys.has(hybridPostMergeKey(post))) {
      remoteOnly.push(post);
    }
  }
  return remoteOnly;
}

/**
 * Deterministic merge of two source windows with per-source cursors.
 * Identity is (provider, postId): collapse multi-artist local copies and drop
 * remote twins that exist anywhere in the local materialization (not only the
 * page-sized prefix). Re-sort after collapse so cursor-merge stays valid.
 */
function mergeHybridPlaylistPage(
  localPosts: IpcPost[],
  remotePosts: IpcPost[],
  page: number,
  limit: number,
  sortOrder: "asc" | "desc",
  isRandom: boolean,
  seed: number
): { pagePosts: IpcPost[]; localTaken: number; remoteTaken: number; mergedCount: number } {
  const localUnique = collapseHybridPostsByIdentity(localPosts, preferLocalHybridRow);
  const remoteUnique = collapseHybridPostsByIdentity(remotePosts, (a) => a);
  const remoteOnly = dedupeHybridPostsPreferLocal(localUnique, remoteUnique);
  const pageStart = (page - 1) * limit;

  const compare = (left: IpcPost, right: IpcPost): number =>
    compareHybridPlaylistPosts(left, right, sortOrder, isRandom, seed);

  localUnique.sort(compare);
  remoteOnly.sort(compare);

  // Seeded random cannot use API-feed prefixes: rank order ≠ feed order, so
  // materialize the deduped union, seed-sort, then slice the page.
  if (isRandom) {
    const merged = [...localUnique, ...remoteOnly];
    merged.sort(compare);
    return {
      pagePosts: merged.slice(pageStart, pageStart + limit),
      localTaken: localUnique.length,
      remoteTaken: remoteOnly.length,
      mergedCount: merged.length,
    };
  }

  let localIdx = 0;
  let remoteIdx = 0;
  const merged: IpcPost[] = [];
  const neededEnd = page * limit;

  while (
    merged.length < neededEnd &&
    (localIdx < localUnique.length || remoteIdx < remoteOnly.length)
  ) {
    const localPost = localIdx < localUnique.length ? localUnique[localIdx] : undefined;
    const remotePost = remoteIdx < remoteOnly.length ? remoteOnly[remoteIdx] : undefined;

    if (localPost !== undefined && remotePost === undefined) {
      merged.push(localPost);
      localIdx += 1;
      continue;
    }
    if (remotePost !== undefined && localPost === undefined) {
      merged.push(remotePost);
      remoteIdx += 1;
      continue;
    }
    if (localPost === undefined || remotePost === undefined) {
      break;
    }
    if (compare(localPost, remotePost) <= 0) {
      merged.push(localPost);
      localIdx += 1;
    } else {
      merged.push(remotePost);
      remoteIdx += 1;
    }
  }

  return {
    pagePosts: merged.slice(pageStart, pageStart + limit),
    localTaken: localIdx,
    remoteTaken: remoteIdx,
    mergedCount: merged.length,
  };
}

/**
 * Full local∪remote window after identity collapse + local-prefer dedupe.
 * Unlike mergeHybridPlaylistPage.mergedCount (ordered prefix up to page*limit),
 * this is the complete snapshot window used for the header total (+ aiCount).
 * Pages are not AI-filtered; aiCount is for the client header only.
 */
function summarizeHybridMergedWindow(
  localPosts: IpcPost[],
  remotePosts: IpcPost[]
): { count: number; aiCount: number } {
  const localUnique = collapseHybridPostsByIdentity(localPosts, preferLocalHybridRow);
  const remoteUnique = collapseHybridPostsByIdentity(remotePosts, (a) => a);
  const remoteOnly = dedupeHybridPostsPreferLocal(localUnique, remoteUnique);
  const merged = [...localUnique, ...remoteOnly];
  let aiCount = 0;
  for (const post of merged) {
    if (hasAiGeneratedTag(post.tags)) {
      aiCount += 1;
    }
  }
  return { count: merged.length, aiCount };
}

/**
 * Ordered desc: page N is final while the walk runs once the first `page * limit`
 * merged items all sit at or above the lowest id fetched so far (the feed is id-desc,
 * so every unfetched remote post has a lower id and cannot enter that prefix).
 */
function isHybridDescPageCovered(
  localPosts: IpcPost[],
  snapshot: HybridSnapshot,
  page: number,
  limit: number
): boolean {
  const lowestFetched = snapshot.lowestFetchedPostId;
  if (lowestFetched === undefined) {
    return false;
  }
  const neededCount = page * limit;
  const { pagePosts: prefix } = mergeHybridPlaylistPage(
    localPosts,
    snapshot.remotePosts,
    1,
    neededCount,
    "desc",
    false,
    0
  );
  let coveredCount = 0;
  for (const post of prefix) {
    if (post.postId >= lowestFetched) {
      coveredCount += 1;
    }
  }
  return coveredCount >= neededCount;
}

/**
 * Safety net on ordered pages: drop keys already issued on earlier pages of this
 * snapshot, then record this page's keys.
 */
function dropPriorIssuedHybridPosts(
  snapshot: HybridSnapshot,
  page: number,
  pagePosts: IpcPost[]
): IpcPost[] {
  const priorIssued = new Set<string>();
  let priorCount = 0;
  for (const [priorPage, keys] of snapshot.keysByPage) {
    if (priorPage >= page) {
      continue;
    }
    for (const key of keys) {
      if (priorCount >= HYBRID_ORDERED_ISSUED_KEY_CAP) {
        break;
      }
      priorIssued.add(key);
      priorCount += 1;
    }
  }
  const freshPosts = pagePosts.filter(
    (post) => !priorIssued.has(hybridPostMergeKey(post))
  );
  snapshot.keysByPage.set(
    page,
    freshPosts.map((post) => hybridPostMergeKey(post))
  );
  return freshPosts;
}

/** Header total of a finished walk; null while it is running or after it failed. */
function buildHybridSnapshotTotal(
  localPosts: IpcPost[],
  snapshot: HybridSnapshot,
  localFetchLimit: number
): PlaylistResolveTotal {
  if (snapshot.completeness !== "exact" && snapshot.completeness !== "lowerBound") {
    return null;
  }
  const windowSummary = summarizeHybridMergedWindow(
    localPosts,
    snapshot.remotePosts
  );
  return buildPlaylistResolveTotal({
    isSmart: true,
    remoteCompleteness: snapshot.completeness,
    mergedWindowCount: windowSummary.count,
    aiCount: windowSummary.aiCount,
    localHitMaterializeCap: localPosts.length >= localFetchLimit,
  });
}

/**
 * Playlist Controller
 *
 * Handles IPC operations for playlist management:
 * - Create playlist
 * - Get all playlists
 * - Get playlist by ID
 * - Update playlist
 * - Delete playlist
 * - Add posts to playlist(s)
 * - Remove posts from playlist
 * - Get posts in playlist with filters
 */
export class PlaylistController extends BaseController {
  // Query style: Drizzle Builder API only in this controller.
  private mainWindow: BrowserWindow | null = null;

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  // Schema existence cache — refreshed on restore/VACUUM reopen
  private ftsTableExistsCache: boolean = false;

  /**
   * Hybrid smart-playlist remote walks. Page 1 starts a snapshot (and supersedes
   * the playlist's previous one); later pages read it instead of re-walking the
   * feed. Bounded by snapshot count and idle TTL, so no per-sequence Map grows here.
   */
  private readonly hybridSnapshots = new HybridRemoteSnapshotStore({
    getProvider,
    now: Date.now,
  });

  private refreshSchemaCaches(): void {
    this.ftsTableExistsCache = postsFtsTableExists(getSqliteInstance());
    this.hybridSnapshots.clear();
    log.info(
      `[PlaylistController] Schema caches refreshed (fts=${this.ftsTableExistsCache})`
    );
  }

  /**
   * Build booru query string from smart playlist tags
   * 
   * Format: include tags joined with spaces (AND logic), exclude tags prefixed with minus (NOT logic)
   * Example: "bioshock blowjob -futa -loli"
   * 
   * @param query - Smart playlist query with tags
   * @returns Booru query string
   */
  private buildBooruQueryString(
    query: SmartPlaylistQuery,
    upperBoundPostId?: number
  ): string {
    const includeTags = query.tags
      .filter((t) => t.type === "include")
      .map((t) => sanitizeProviderTagToken(t.tag).trim().toLowerCase())
      .filter(Boolean);
    
    const excludeTags = query.tags
      .filter((t) => t.type === "exclude")
      .map((t) => `-${sanitizeProviderTagToken(t.tag).trim().toLowerCase()}`)
      .filter(Boolean);
    
    const allTags = [...includeTags, ...excludeTags];
    if (upperBoundPostId !== undefined) {
      allTags.push(formatRule34UpperBoundPostIdTag(upperBoundPostId));
    }
    return allTags.join(" ");
  }

  /**
   * Setup IPC handlers for playlist operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.CREATE_PLAYLIST,
      CreatePlaylistArgsSchema,
      (event, data) => this.createPlaylist(event, data)
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLISTS,
      z.tuple([]),
      this.getPlaylists.bind(this),
      { isIdempotent: true } // Mark as idempotent for better rate limiting and request collapsing
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLIST,
      IdArgsSchema,
      (event, playlistId) => this.getPlaylist(event, playlistId)
    );

    this.handle(
      IPC_CHANNELS.DB.UPDATE_PLAYLIST,
      UpdatePlaylistArgsSchema,
      (event, playlistId, data) => this.updatePlaylist(event, playlistId, data)
    );

    this.handle(
      IPC_CHANNELS.DB.DELETE_PLAYLIST,
      IdArgsSchema,
      (event, playlistId) => this.deletePlaylist(event, playlistId)
    );

    this.handle(
      IPC_CHANNELS.DB.REMOVE_POSTS_FROM_PLAYLIST,
      RemovePostsFromPlaylistArgsSchema,
      (event, data) => this.removePostsFromPlaylist(event, data)
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLIST_POSTS,
      GetPlaylistPostsArgsSchema,
      (event, params) => this.getPlaylistPosts(event, params)
    );

    this.handle(
      IPC_CHANNELS.DB.REORDER_PLAYLIST_ENTRIES,
      ReorderPlaylistEntriesArgsSchema,
      (event, params) => this.reorderPlaylistEntries(event, params)
    );

    this.handle(
      IPC_CHANNELS.DB.RESOLVE_PLAYLIST_POSTS,
      ResolvePlaylistPostsArgsSchema,
      (event, params) => this.resolvePlaylistPosts(event, params)
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLIST_RESOLVE_TOTAL,
      GetPlaylistResolveTotalArgsSchema,
      (event, params) => this.getPlaylistResolveTotal(event, params)
    );

    this.handle(
      IPC_CHANNELS.DB.RELEASE_PLAYLIST_SNAPSHOT,
      ReleasePlaylistSnapshotArgsSchema,
      (event, params) => this.releasePlaylistSnapshot(event, params)
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLISTS_CONTAINING_POST,
      GetPlaylistsContainingPostArgsSchema,
      (event, postId, externalPostId, provider) => this.getPlaylistsContainingPost(event, postId, externalPostId, provider)
    );

    this.handle(
      IPC_CHANNELS.DB.GET_MANUAL_PLAYLIST_MEMBERSHIP_FOR_POSTS,
      GetManualPlaylistMembershipForPostsSchema,
      (event, data) => this.getManualPlaylistMembershipForPosts(event, data)
    );

    this.handle(
      IPC_CHANNELS.DB.SYNC_MANUAL_PLAYLIST_MEMBERSHIP,
      SyncManualPlaylistMembershipSchema,
      (event, data) => this.syncManualPlaylistMembership(event, data)
    );

    this.handle(
      IPC_CHANNELS.DB.CLEAR_MANUAL_PLAYLIST,
      ClearManualPlaylistSchema,
      (event, data) => this.clearManualPlaylist(event, data)
    );

    this.handle(
      IPC_CHANNELS.DB.MOVE_POSTS_BETWEEN_MANUAL_PLAYLISTS,
      MovePostsBetweenManualPlaylistsSchema,
      (event, data) => this.movePostsBetweenManualPlaylists(event, data)
    );

    this.handle(
      IPC_CHANNELS.DB.EXPORT_PLAYLIST,
      IdArgsSchema,
      (event, playlistId) => this.exportPlaylist(event, playlistId)
    );

    this.handle(
      IPC_CHANNELS.DB.IMPORT_PLAYLIST,
      ImportPlaylistArgsSchema,
      (event) => this.importPlaylist(event)
    );

    // Cache at setup; refresh again when restore/VACUUM reopens the DB.
    this.refreshSchemaCaches();
    onDatabaseReopened(() => this.refreshSchemaCaches());

    log.info("[PlaylistController] All handlers registered");
  }

  /**
   * Exact-token or prefix match on posts.tags (content table).
   * Used when FTS MATCH is not trustworthy: bulk-sync window with
   * posts_fts_insert / posts_fts_update dropped.
   *
   * Trailing `*` (allowed by the FTS sanitizer as prefix search) becomes a
   * token-prefix LIKE on space-wrapped tags. Mid-tag `*` is rejected — same
   * rule as the FTS combined-query check. This is not the AI-filter sanitizer.
   */
  private createSmartPlaylistContentTagCondition(sanitizedTag: string): SQL {
    const starIndex = sanitizedTag.indexOf("*");
    if (starIndex !== -1 && starIndex !== sanitizedTag.length - 1) {
      throw new Error(
        `Invalid FTS5 query: wildcard (*) can only appear at the end of tags`
      );
    }

    if (starIndex !== -1) {
      const prefix = sanitizedTag.slice(0, -1);
      if (prefix.length === 0) {
        throw new Error(
          `Invalid tag: "*". Wildcard (*) can only appear at the end of tags, not as a standalone tag.`
        );
      }
      const likePattern = `% ${escapeLikePattern(prefix)}%`;
      return sql`(' ' || lower(${posts.tags}) || ' ') LIKE ${likePattern} ESCAPE '\\'`;
    }

    return sql`instr(' ' || lower(${posts.tags}) || ' ', ' ' || ${sanitizedTag} || ' ') > 0`;
  }

  private combineSmartPlaylistContentConditions(
    tags: string[],
    mode: "and" | "or"
  ): SQL | undefined {
    const parts = tags.map((tag) =>
      this.createSmartPlaylistContentTagCondition(tag)
    );
    if (parts.length === 0) {
      return undefined;
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return mode === "and" ? and(...parts) : or(...parts);
  }

  /**
   * Check if FTS5 table exists (cached check)
   * @returns true if FTS5 table exists, false otherwise
   */
  private checkFtsTableExists(): boolean {
    return this.ftsTableExistsCache;
  }

  /**
   * Build SQL conditions from smart playlist tag query
   *
   * Include tags are combined with AND logic.
   * Exclude tags are combined with OR logic (standard booru search).
   * Uses FTS5 for optimal performance.
   *
   * For include tags: Use a single FTS5 query with AND operator inside FTS5
   * For exclude tags: Use OR operator inside FTS5, then wrap in NOT
   *
   * @param query - Smart playlist query object (tag-centric)
   * @returns Object with includeConditions and excludeConditions arrays
   */
  private buildSmartPlaylistTagConditions(query: SmartPlaylistQuery): {
    includeConditions: SQL[];
    excludeConditions: SQL[];
  } {
    const includeConditions: SQL[] = [];
    const excludeConditions: SQL[] = [];
    const ftsTableExists = this.checkFtsTableExists();

    if (!ftsTableExists) {
      log.error(
        "[PlaylistController] FTS5 table does not exist for tag filtering in smart playlist"
      );
      return { includeConditions: [sql`1 = 0`], excludeConditions: [] };
    }

    // MATCH only while insert/update triggers exist (index is live).
    // Same sqlite_master probe as PostsController AI filter — not a content SELECT.
    const useFtsMatch = areRuntimeDroppableFtsTriggersPresent(
      getSqliteInstance()
    );

    if (!useFtsMatch) {
      log.debug(
        "[PlaylistController] FTS bulk-insert triggers absent; using posts.tags for smart playlist"
      );
    }

    // Build include tags query: combine all include tags with AND inside FTS5
    const includeTags = query.tags.filter((t) => t.type === "include").map((t) => t.tag);
    if (includeTags.length > 0) {
      try {
        // Sanitize each tag individually (validate format and normalize)
        const sanitizedTags = includeTags.map((tag) => {
          log.debug(`[PlaylistController] Processing include tag: ${tag}`);
          
          // Validate tag format and normalize (trim, lowercase for consistency with unicode61 tokenizer)
          const trimmed = tag.trim().toLowerCase();
          if (trimmed.length === 0) {
            throw new Error("Tag cannot be empty");
          }
          
          // SECURITY: Block single asterisk (*) - it can cause unpredictable FTS5 parser behavior
          // FTS5 wildcard (*) must be at the end of a tag, not standalone
          if (trimmed === "*") {
            throw new Error(`Invalid tag: "*". Wildcard (*) can only appear at the end of tags, not as a standalone tag.`);
          }
          
          const strictWhitelistRegex = /^[a-zA-Z0-9_* -]+$/;
          if (!strictWhitelistRegex.test(trimmed)) {
            throw new Error(`Invalid tag: "${tag}". Only alphanumeric characters, spaces, hyphens, underscores, and trailing asterisks are allowed.`);
          }

          // Content-fallback path uses this raw token; MATCH path phrase-quotes below.
          return trimmed;
        });

        if (useFtsMatch) {
          // Phrase-quote every tag so hyphen/underscore are not FTS5 operators.
          const combinedQuery = sanitizedTags
            .map((tag) => quoteFts5TagPhrase(tag))
            .join(" AND ");

          // DEFENSE IN DEPTH: phrase-quoted tags only; optional trailing * per tag ("tag"*).
          if (
            combinedQuery.includes("*") &&
            !/^"[^"]+"\*?(\s+AND\s+"[^"]+"\*?)*$/i.test(combinedQuery)
          ) {
            throw new Error(
              `Invalid FTS5 query: wildcard (*) can only appear at the end of tags`
            );
          }
          if ((combinedQuery.match(/"/g) || []).length % 2 !== 0) {
            throw new Error(`Invalid FTS5 query: unbalanced quotes`);
          }

          log.debug(`[PlaylistController] Combined FTS5 include query: ${combinedQuery}`);

          // CRITICAL SECURITY: Use Drizzle sql template with parameterization instead of sql.raw()
          // Drizzle will properly escape the FTS5 query string, preventing SQL injection
          // Even though tags are validated, we use parameterization as defense in depth
          // FTS5 MATCH accepts string literals, and Drizzle handles the escaping correctly
          includeConditions.push(sql`EXISTS (
            SELECT 1 FROM posts_fts
            WHERE posts_fts.rowid = ${posts.id}
              AND posts_fts MATCH ${combinedQuery}
          )`);
        } else {
          const includeCondition = this.combineSmartPlaylistContentConditions(
            sanitizedTags,
            "and"
          );
          if (includeCondition) {
            includeConditions.push(includeCondition);
          }
        }
      } catch (error) {
        log.error(
          `[PlaylistController] Failed to build include tags condition:`,
          error
        );
        throw createCodedError(
          "Failed to build include tag condition",
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    // Build exclude tags query: combine all exclude tags with OR inside FTS5
    const excludeTags = query.tags.filter((t) => t.type === "exclude").map((t) => t.tag);
    if (excludeTags.length > 0) {
      try {
        // Sanitize each tag individually (validate format and normalize)
        const sanitizedTags = excludeTags.map((tag) => {
          log.debug(`[PlaylistController] Processing exclude tag: ${tag}`);
          
          // Validate tag format and normalize (trim, lowercase for consistency with unicode61 tokenizer)
          const trimmed = tag.trim().toLowerCase();
          if (trimmed.length === 0) {
            throw new Error("Tag cannot be empty");
          }
          
          // SECURITY: Block single asterisk (*) - it can cause unpredictable FTS5 parser behavior
          // FTS5 wildcard (*) must be at the end of a tag, not standalone
          if (trimmed === "*") {
            throw new Error(`Invalid tag: "*". Wildcard (*) can only appear at the end of tags, not as a standalone tag.`);
          }
          
          const strictWhitelistRegex = /^[a-zA-Z0-9_* -]+$/;
          if (!strictWhitelistRegex.test(trimmed)) {
            throw new Error(`Invalid tag: "${tag}". Only alphanumeric characters, spaces, hyphens, underscores, and trailing asterisks are allowed.`);
          }

          // Content-fallback path uses this raw token; MATCH path phrase-quotes below.
          return trimmed;
        });

        if (useFtsMatch) {
          // Phrase-quote every tag so hyphen/underscore are not FTS5 operators.
          const combinedQuery = sanitizedTags
            .map((tag) => quoteFts5TagPhrase(tag))
            .join(" OR ");

          log.debug(`[PlaylistController] Combined FTS5 exclude query: ${combinedQuery}`);

          // CRITICAL SECURITY: Use Drizzle sql template with parameterization instead of sql.raw()
          // Drizzle will properly escape the FTS5 query string, preventing SQL injection
          // Even though tags are validated, we use parameterization as defense in depth
          // FTS5 MATCH accepts string literals, and Drizzle handles the escaping correctly
          excludeConditions.push(sql`EXISTS (
            SELECT 1 FROM posts_fts
            WHERE posts_fts.rowid = ${posts.id}
              AND posts_fts MATCH ${combinedQuery}
          )`);
        } else {
          const excludeCondition = this.combineSmartPlaylistContentConditions(
            sanitizedTags,
            "or"
          );
          if (excludeCondition) {
            excludeConditions.push(excludeCondition);
          }
        }
      } catch (error) {
        log.error(
          `[PlaylistController] Failed to build exclude tags condition:`,
          error
        );
        throw createCodedError(
          "Failed to build exclude tag condition",
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    return { includeConditions, excludeConditions };
  }

  /**
   * Create a new playlist
   *
   * @param _event - IPC event (unused)
   * @param data - Playlist data (name, isSmart, queryJson, iconName)
   * @returns Created playlist
   */
  private async createPlaylist(
    _event: IpcMainInvokeEvent,
    data: CreatePlaylistRequest
  ): Promise<IpcPlaylist> {
    try {
      const db = getDb();
      // Defense in depth: Zod already validates at the IPC boundary.
      PlaylistQueryJsonWriteSchema.parse(data.queryJson ?? "");

      const result = db
        .insert(playlists)
        .values({
          name: data.name,
          isSmart: data.isSmart ?? true, // Default to Smart Collection
          queryJson: data.queryJson ?? "",
          querySchemaVersion: CURRENT_SMART_QUERY_SCHEMA_VERSION,
          iconName: data.iconName ?? "",
          updatedAt: new Date(),
        })
        .returning()
        .get();

      if (!result) {
        throw new Error("Failed to create playlist");
      }

      const playlist = result;
      log.info(
        `[PlaylistController] Created playlist: ${playlist.id} (${playlist.name}, smart: ${playlist.isSmart})`
      );
      
      // Log queryJson for smart playlists to help debug empty collections
      // SECURITY: Never trust JSON.parse without try-catch, even for logging
      // Use Zod schema validation to ensure data integrity
      if (playlist.isSmart && playlist.queryJson) {
        try {
          const parsedQuery = parseSmartQuery(
            playlist.queryJson,
            playlist.querySchemaVersion
          );
          if (parsedQuery) {
            // SECURITY: Wrap JSON.stringify in try-catch to prevent crashes from circular references or invalid data
            try {
              log.info(
                `[PlaylistController] Smart playlist ${playlist.id} query_json:`,
                JSON.stringify(parsedQuery, null, 2)
              );
            } catch (stringifyError) {
              // If JSON.stringify fails (circular reference, etc.), log a safe message
              log.warn(
                `[PlaylistController] Failed to stringify query_json for playlist ${playlist.id}:`,
                stringifyError instanceof Error ? stringifyError.message : String(stringifyError)
              );
              // Log raw queryJson length as fallback
              log.info(
                `[PlaylistController] Smart playlist ${playlist.id} query_json length: ${playlist.queryJson.length} chars`
              );
            }
          } else {
            log.warn(
              `[PlaylistController] Invalid query_json schema for playlist ${playlist.id} (version ${playlist.querySchemaVersion})`
            );
          }
        } catch (parseError) {
          log.warn(
            `[PlaylistController] Failed to parse query_json for newly created playlist ${playlist.id}:`,
            parseError instanceof Error ? parseError.message : String(parseError)
          );
        }
      }

      return toIpcSafe(playlist);
    } catch (error) {
      log.error("[PlaylistController] Failed to create playlist:", error);
      throw error;
    }
  }

  /**
   * Get all playlists
   *
   * @param _event - IPC event (unused)
   * @returns Array of playlists
   */
  private async getPlaylists(_event: IpcMainInvokeEvent): Promise<IpcPlaylistWithStats[]> {
    try {
      const db = getDb();
      const manualPlaylists = getManualPlaylistsWithStats(db);
      const smartPlaylists = getSmartPlaylists(db);

      const smartPlaylistsWithStats = smartPlaylists.map((playlist) => {
        if (!playlist.queryJson || playlist.queryJson.trim() === "") {
          return { ...playlist, postCount: 0 };
        }

        const parsedQuery = parseSmartQuery(
          playlist.queryJson,
          playlist.querySchemaVersion
        );
        if (!parsedQuery) {
          return { ...playlist, postCount: 0 };
        }

        const { includeConditions, excludeConditions } =
          this.buildSmartPlaylistTagConditions(parsedQuery);

        const allConditions: SQL[] = [];

        if (includeConditions.length > 0) {
          if (includeConditions.length === 1) {
            allConditions.push(includeConditions[0]);
          } else {
            const combined = and(...includeConditions);
            if (combined) allConditions.push(combined);
          }
        }

        if (excludeConditions.length > 0) {
          const excludeOr = or(...excludeConditions);
          if (excludeOr) {
            allConditions.push(not(excludeOr));
          }
        }

        const blacklistCondition = buildPostsBlacklistFilterCondition(
          getAllBlacklistedTags()
        );
        if (blacklistCondition) {
          allConditions.push(blacklistCondition);
        }

        const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined;
        const postCount = getSmartPlaylistPostCount(db, whereClause);

        return {
          ...playlist,
          postCount,
        };
      });

      const result = [...manualPlaylists, ...smartPlaylistsWithStats].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      log.info(`[PlaylistController] Retrieved ${result.length} playlists with stats`);

      return toIpcSafe(result);
    } catch (error) {
      log.error("[PlaylistController] Failed to get playlists:", error);
      throw error;
    }
  }

  /**
   * Get playlist by ID
   *
   * @param _event - IPC event (unused)
   * @param playlistId - Playlist ID
   * @returns Playlist or null if not found
   */
  private async getPlaylist(
    _event: IpcMainInvokeEvent,
    playlistId: number
  ): Promise<IpcPlaylist | null> {
    try {
      const db = getDb();

      const result = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all()[0];

      if (!result) {
        return null;
      }

      return toIpcSafe(result);
    } catch (error) {
      log.error(`[PlaylistController] Failed to get playlist ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Update playlist
   *
   * @param _event - IPC event (unused)
   * @param playlistId - Playlist ID
   * @param data - Update data (name, queryJson, iconName - all optional)
   * @returns Updated playlist
   */
  private async updatePlaylist(
    _event: IpcMainInvokeEvent,
    playlistId: number,
    data: UpdatePlaylistRequest
  ): Promise<IpcPlaylist> {
    try {
      const db = getDb();

      const updateData: Partial<typeof playlists.$inferInsert> = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.queryJson !== undefined) {
        // Defense in depth: Zod already validates at the IPC boundary.
        PlaylistQueryJsonWriteSchema.parse(data.queryJson);
        updateData.queryJson = data.queryJson;
        updateData.querySchemaVersion = CURRENT_SMART_QUERY_SCHEMA_VERSION;
      }
      if (data.iconName !== undefined) {
        updateData.iconName = data.iconName;
      }
      updateData.updatedAt = new Date();

      if (Object.keys(updateData).length === 0) {
        // No changes, return existing playlist
        const existing = await this.getPlaylist(_event, playlistId);
        if (!existing) {
          throw new Error(`Playlist ${playlistId} not found`);
        }
        return existing;
      }

      const result = db
        .update(playlists)
        .set(updateData)
        .where(eq(playlists.id, playlistId))
        .returning()
        .all();

      if (!result || result.length === 0) {
        throw new Error(`Playlist ${playlistId} not found`);
      }

      if (data.queryJson !== undefined) {
        this.hybridSnapshots.release(playlistId);
      }
      log.info(`[PlaylistController] Updated playlist: ${playlistId}`);

      return toIpcSafe(result[0]);
    } catch (error) {
      log.error(`[PlaylistController] Failed to update playlist ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Delete playlist
   *
   * @param _event - IPC event (unused)
   * @param playlistId - Playlist ID
   * @returns true if deleted successfully
   */
  private async deletePlaylist(
    _event: IpcMainInvokeEvent,
    playlistId: number
  ): Promise<boolean> {
    try {
      const db = getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      // Cascade delete will automatically remove playlist_entries due to foreign key constraint
      db.transaction((tx) => {
        tx.delete(playlists)
          .where(eq(playlists.id, playlistId))
          .run();
      });

      this.hybridSnapshots.release(playlistId);
      log.info(`[PlaylistController] Deleted playlist: ${playlistId}`);
      return true;
    } catch (error) {
      log.error(`[PlaylistController] Failed to delete playlist ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Remove posts from a playlist
   *
   * @param _event - IPC event (unused)
   * @param data - Request data (playlistId, postIds array)
   * @returns Number of entries removed
   */
  private async removePostsFromPlaylist(
    _event: IpcMainInvokeEvent,
    data: RemovePostsFromPlaylistRequest
  ): Promise<number> {
    try {
      const db = getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      let entriesRemoved = 0;

      db.transaction((tx) => {
        const result = tx
          .delete(playlistEntries)
          .where(
            and(
              eq(playlistEntries.playlistId, data.playlistId),
              inArray(playlistEntries.postId, data.postIds)
            )
          )
          .run();

        entriesRemoved = result.changes;
        tx.update(playlists)
          .set({ updatedAt: new Date() })
          .where(eq(playlists.id, data.playlistId))
          .run();
      });

      log.info(
        `[PlaylistController] Removed ${entriesRemoved} post(s) from playlist ${data.playlistId}`
      );

      return entriesRemoved;
    } catch (error) {
      log.error("[PlaylistController] Failed to remove posts from playlist:", error);
      throw error;
    }
  }

  /**
   * Returns per–manual-playlist counts of how many of the given posts appear in each playlist.
   */
  private async getManualPlaylistMembershipForPosts(
    _event: IpcMainInvokeEvent,
    data: GetManualPlaylistMembershipForPostsRequest
  ): Promise<{ playlistId: number; matchCount: number }[]> {
    try {
      const db = getDb();
      const rows = db
        .select({
          playlistId: playlistEntries.playlistId,
          matchCount: sql<number>`count(*)`.mapWith(Number),
        })
        .from(playlistEntries)
        .innerJoin(playlists, eq(playlistEntries.playlistId, playlists.id))
        .where(
          and(eq(playlists.isSmart, false), inArray(playlistEntries.postId, data.postIds))
        )
        .groupBy(playlistEntries.playlistId)
        .all();

      return rows.map((r) => ({
        playlistId: r.playlistId,
        matchCount: r.matchCount,
      }));
    } catch (error) {
      log.error("[PlaylistController] getManualPlaylistMembershipForPosts failed:", error);
      throw error;
    }
  }

  /**
   * Set manual playlist membership for one or more posts: each post appears in exactly the
   * chosen manual playlists and in no other manual playlist.
   */
  private async syncManualPlaylistMembership(
    _event: IpcMainInvokeEvent,
    data: SyncManualPlaylistMembershipRequest
  ): Promise<void> {
    const db = getDb();
    const desired = new Set(data.manualPlaylistIds);
    if (desired.size !== data.manualPlaylistIds.length) {
      throw new Error("Duplicate playlist ids in manualPlaylistIds");
    }

    const allManualRows = db
      .select({ id: playlists.id })
      .from(playlists)
      .where(eq(playlists.isSmart, false))
      .all();
    const allManualIds = allManualRows.map((r) => r.id);
    const allManualSet = new Set(allManualIds);

    for (const pid of data.manualPlaylistIds) {
      if (!allManualSet.has(pid)) {
        throw new Error(`Not a manual playlist: ${pid}`);
      }
    }

    const postIdList = [...new Set(data.postIds)];
    if (postIdList.length !== data.postIds.length) {
      throw new Error("Duplicate post ids");
    }

    if (allManualIds.length === 0) {
      return;
    }

    const toAdd: { playlistId: number; postId: number }[] = [];
    const toRemovePlaylistIds: number[] = [];

    for (const playlistId of allManualIds) {
      if (desired.has(playlistId)) {
        for (const postId of postIdList) {
          toAdd.push({ playlistId, postId });
        }
      } else {
        toRemovePlaylistIds.push(playlistId);
      }
    }

    db.transaction((tx) => {
      if (toAdd.length > 0) {
        tx.insert(playlistEntries)
          .values(
            toAdd.map((row) => ({
              playlistId: row.playlistId,
              postId: row.postId,
            }))
          )
          .onConflictDoNothing({
            target: [playlistEntries.playlistId, playlistEntries.postId],
          })
          .run();
      }

      if (toRemovePlaylistIds.length > 0) {
        tx.delete(playlistEntries)
          .where(
            and(
              inArray(playlistEntries.playlistId, toRemovePlaylistIds),
              inArray(playlistEntries.postId, postIdList)
            )
          )
          .run();
      }

      const now = new Date();
      tx.update(playlists)
        .set({ updatedAt: now })
        .where(inArray(playlists.id, allManualIds))
        .run();
    });

    log.info(
      `[PlaylistController] syncManualPlaylistMembership: ${postIdList.length} post(s), ${desired.size} desired playlist(s)`
    );
  }

  /**
   * Remove all post entries from a manual playlist (does not delete the playlist row).
   */
  private async clearManualPlaylist(
    _event: IpcMainInvokeEvent,
    data: ClearManualPlaylistRequest
  ): Promise<void> {
    const db = getDb();
    const [row] = db
      .select({ id: playlists.id, isSmart: playlists.isSmart })
      .from(playlists)
      .where(eq(playlists.id, data.playlistId))
      .limit(1)
      .all();

    if (!row) {
      throw new Error("Playlist not found");
    }
    if (row.isSmart) {
      throw new Error("Clear is only supported for manual playlists");
    }

    db.transaction((tx) => {
      tx.delete(playlistEntries)
        .where(eq(playlistEntries.playlistId, data.playlistId))
        .run();
      tx.update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, data.playlistId))
        .run();
    });

    log.info(`[PlaylistController] Cleared all posts from manual playlist ${data.playlistId}`);
  }

  /**
   * Move posts from one manual playlist to another in one transaction.
   */
  private async movePostsBetweenManualPlaylists(
    _event: IpcMainInvokeEvent,
    data: MovePostsBetweenManualPlaylistsRequest
  ): Promise<void> {
    if (data.fromPlaylistId === data.toPlaylistId) {
      throw new Error("Source and target playlist must differ");
    }

    const db = getDb();
    const pair = db
      .select({ id: playlists.id, isSmart: playlists.isSmart })
      .from(playlists)
      .where(inArray(playlists.id, [data.fromPlaylistId, data.toPlaylistId]))
      .all();

    if (pair.length !== 2) {
      throw new Error("One or both playlists were not found");
    }
    for (const p of pair) {
      if (p.isSmart) {
        throw new Error("Move is only supported between manual playlists");
      }
    }

    const postIds = [...new Set(data.postIds)];
    if (postIds.length !== data.postIds.length) {
      throw new Error("Duplicate post ids");
    }

    const now = new Date();

    db.transaction((tx) => {
      const rows = postIds.map((postId) => ({
        playlistId: data.toPlaylistId,
        postId,
      }));
      tx.insert(playlistEntries)
        .values(rows)
        .onConflictDoNothing({
          target: [playlistEntries.playlistId, playlistEntries.postId],
        })
        .run();

      tx.delete(playlistEntries)
        .where(
          and(
            eq(playlistEntries.playlistId, data.fromPlaylistId),
            inArray(playlistEntries.postId, postIds)
          )
        )
        .run();

      tx.update(playlists)
        .set({ updatedAt: now })
        .where(inArray(playlists.id, [data.fromPlaylistId, data.toPlaylistId]))
        .run();
    });

    log.info(
      `[PlaylistController] Moved ${postIds.length} post(s) from ${data.fromPlaylistId} to ${data.toPlaylistId}`
    );
  }

  /**
   * Get posts in a playlist with filters (media type)
   *
   * Uses JOIN to efficiently retrieve posts with their playlist entries.
   * Supports playlist-scoped filtering by media type.
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters (playlistId, page, filters, limit)
   * @returns Array of posts
   */
  private async getPlaylistPosts(
    _event: IpcMainInvokeEvent,
    params: GetPlaylistPostsRequest
  ): Promise<IpcPost[]> {
    const {
      playlistId,
      page,
      filters,
      limit,
      sortOrder = "desc",
      isRandom,
      seed,
    } = params;
    const offset = (page - 1) * limit;

    try {
      const db = getDb();

      // Build WHERE conditions array
      const conditions = [eq(playlistEntries.playlistId, playlistId)];

      // Add media type filter if provided
      if (filters?.mediaType === "videos") {
        conditions.push(eq(posts.mediaType, "video"));
      } else if (filters?.mediaType === "images") {
        // Images OR NULL (NULL treated as image during backfill)
        const imageOrNull = or(eq(posts.mediaType, "image"), sql`${posts.mediaType} IS NULL`);
        if (imageOrNull) conditions.push(imageOrNull);
      }

      const blacklistCondition = buildPostsBlacklistFilterCondition(
        getAllBlacklistedTags()
      );
      if (blacklistCondition) {
        conditions.push(blacklistCondition);
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Use JOIN to efficiently retrieve posts with their playlist entries
      const queryBuilder = db
        .select({
          id: posts.id,
          postId: posts.postId,
          artistId: posts.artistId,
          provider: posts.provider,
          fileUrl: posts.fileUrl,
          previewUrl: posts.previewUrl,
          sampleUrl: posts.sampleUrl,
          title: posts.title,
          rating: posts.rating,
          tags: posts.tags,
          mediaType: posts.mediaType,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          isViewed: posts.isViewed,
          isFavorited: posts.isFavorited,
          lastViewedAt: posts.lastViewedAt,
          viewCount: posts.viewCount,
        })
        .from(playlistEntries)
        .innerJoin(posts, eq(playlistEntries.postId, posts.id))
        .where(whereClause);

      // Manual playlists mix artists/providers → no provider filter.
      // position path unchanged; else publishedAt then postId (provider ASC secondary).
      // cross-provider safe: post_id spaces differ per provider; published_at frozen at first-seen (see sync upsert)
      const result = isRandom
        ? queryBuilder
            .orderBy(...seededOrderBy(posts.id, resolveRandomSeed(seed)))
            .limit(limit)
            .offset(offset)
            .all()
        : queryBuilder
            .orderBy(
              ...(sortOrder === "position"
                ? [asc(playlistEntries.position)]
                : [
                    sortOrder === "asc"
                      ? asc(posts.publishedAt)
                      : desc(posts.publishedAt),
                    asc(posts.provider),
                    sortOrder === "asc" ? asc(posts.postId) : desc(posts.postId),
                  ])
            )
            .limit(limit)
            .offset(offset)
            .all();

      log.info(
        `[PlaylistController] Retrieved ${result.length} posts from playlist ${playlistId} (page ${page})`
      );

      return toIpcSafe(result);
    } catch (error) {
      log.error(`[PlaylistController] Failed to get playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }

  private async reorderPlaylistEntries(
    _event: IpcMainInvokeEvent,
    params: ReorderPlaylistEntriesRequest
  ): Promise<void> {
    const { playlistId, orderedPostIds } = params;
    const db = getDb();

    const reorderedEntries = orderedPostIds.map((postId, index) => ({
      playlistId,
      postId,
      position: index,
    }));

    db.transaction((tx) => {
      tx.insert(playlistEntries)
        .values(reorderedEntries)
        .onConflictDoUpdate({
          target: [playlistEntries.playlistId, playlistEntries.postId],
          set: {
            position: sql`excluded.position`,
          },
        })
        .run();
      tx.update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, playlistId))
        .run();
    });
    log.info(
      `[PlaylistController] Reordered ${orderedPostIds.length} entries in playlist ${playlistId}`
    );
  }

  /**
   * Get all playlists that contain a specific post
   * 
   * Uses Drizzle Query API for cleaner code and automatic type inference.
   * This eliminates N+1 query problem when checking post membership across multiple playlists.
   * 
   * PERFORMANCE: Uses direct query on playlist_entries with WHERE clause.
   * No JOIN needed - we only need playlistId, which is already in playlist_entries table.
   * This is more efficient than JOIN because we don't need any data from playlists table.
   * 
   * @param _event - IPC event (unused)
   * @param postId - Post ID (database ID)
   * @returns Array of playlist IDs that contain this post
   */
  private async getPlaylistsContainingPost(
    _event: IpcMainInvokeEvent,
    postId: number,
    externalPostId?: number,
    provider?: StoredProviderId
  ): Promise<number[]> {
    try {
      const db = getDb();

      let result: { playlistId: number }[];
      if (postId <= 0 && externalPostId != null && externalPostId > 0 && provider) {
        // External post from Browse: (EXTERNAL_ARTIST_ID, provider, postId)
        // sql equality: StoredProviderId may be legacy "gelbooru" (drizzle enum is rule34-only)
        const rows = db
          .select({ playlistId: playlistEntries.playlistId })
          .from(playlistEntries)
          .innerJoin(posts, eq(playlistEntries.postId, posts.id))
          .where(
            and(
              eq(posts.postId, externalPostId),
              eq(posts.artistId, EXTERNAL_ARTIST_ID),
              sql`${posts.provider} = ${provider}`
            )
          )
          .all();
        result = rows;
      } else {
        result = db
          .select({ playlistId: playlistEntries.playlistId })
          .from(playlistEntries)
          .where(eq(playlistEntries.postId, postId))
          .all();
      }

      const playlistIds = result.map((r) => r.playlistId);
      
      log.debug(
        `[PlaylistController] Post ${postId} is in ${playlistIds.length} playlist(s)`
      );

      return playlistIds;
    } catch (error) {
      log.error(`[PlaylistController] Failed to get playlists containing post ${postId}:`, error);
      throw error;
    }
  }

  private async exportPlaylist(
    _event: IpcMainInvokeEvent,
    playlistId: number
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const db = getDb();
      const playlist = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all()[0];

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      const entries = db
        .select({
          addedAt: playlistEntries.addedAt,
          postId: posts.postId,
          artistId: posts.artistId,
          provider: posts.provider,
        })
        .from(playlistEntries)
        .innerJoin(posts, eq(posts.id, playlistEntries.postId))
        .where(eq(playlistEntries.playlistId, playlistId))
        .orderBy(asc(playlistEntries.position), asc(playlistEntries.addedAt))
        .all();

      const exportData: PlaylistExport = {
        version: 2,
        exportedAt: new Date().toISOString(),
        playlist: {
          name: playlist.name,
          isSmart: playlist.isSmart,
          queryJson: playlist.queryJson ?? "",
          iconName: playlist.iconName ?? "",
        },
        entries: entries.map((entry) => ({
          postId: entry.postId,
          artistId: entry.artistId,
          provider: entry.provider,
          addedAt: entry.addedAt.getTime(),
        })),
      };

      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        throw new Error("No window reference");
      }

      const defaultFileName = `${playlist.name.replace(/[^a-z0-9]/gi, "_")}.ruledesk-playlist.json`;
      const { canceled, filePath } = await dialog.showSaveDialog(this.mainWindow, {
        title: "Export Playlist",
        defaultPath: defaultFileName,
        filters: [{ name: "RuleDesk Playlist", extensions: ["json"] }],
      });

      if (canceled || !filePath) {
        return { success: false, error: "Cancelled" };
      }

      await fs.promises.writeFile(filePath, JSON.stringify(exportData, null, 2), "utf-8");
      log.info(`[PlaylistController] Exported playlist ${playlistId} to ${filePath}`);
      return { success: true, path: filePath };
    } catch (error) {
      log.error("[PlaylistController] Export failed:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async importPlaylist(
    _event: IpcMainInvokeEvent
  ): Promise<{
    success: boolean;
    playlistId?: number;
    error?: string;
    code?: ErrorCode;
  }> {
    try {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        throw new Error("No window reference");
      }

      const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
        title: "Import Playlist",
        filters: [{ name: "RuleDesk Playlist", extensions: ["json"] }],
        properties: ["openFile"],
      });

      const selectedFilePath = filePaths[0];
      if (canceled || !selectedFilePath) {
        return {
          success: false,
          error: "Cancelled",
          code: ErrorCode.CANCELLED,
        };
      }

      const raw = await fs.promises.readFile(selectedFilePath, "utf-8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return {
          success: false,
          error: "Invalid playlist file format",
          code: ErrorCode.PARSE_ERROR,
        };
      }

      if (!isPlaylistExport(parsed)) {
        return {
          success: false,
          error: "Invalid playlist file format",
          code: ErrorCode.PARSE_ERROR,
        };
      }

      const exportData = parsed;

      if (exportData.entries.length > MAX_PLAYLIST_IMPORT_ENTRIES) {
        return {
          success: false,
          error: `Too many playlist entries (${exportData.entries.length}). Maximum is ${MAX_PLAYLIST_IMPORT_ENTRIES}.`,
          code: ErrorCode.VALIDATION_ERROR,
        };
      }

      const queryJsonParse = PlaylistQueryJsonWriteSchema.safeParse(
        exportData.playlist.queryJson
      );
      if (!queryJsonParse.success) {
        return {
          success: false,
          error: "Invalid smart playlist queryJson",
          code: ErrorCode.VALIDATION_ERROR,
        };
      }

      const db = getDb();

      // Resolve local post ids OUTSIDE the write transaction (reads only).
      // Match by (artistId, provider, postId); v1 falls back to unambiguous postId.
      type ImportEntryRow = {
        playlistId: number;
        postId: number;
        addedAt: Date;
        position: number;
      };
      let resolvedEntries: ImportEntryRow[] = [];

      if (!exportData.playlist.isSmart && exportData.entries.length > 0) {
        const importedPostIds = [
          ...new Set(exportData.entries.map((entry) => entry.postId)),
        ];
        const localPosts: Array<{
          id: number;
          postId: number;
          artistId: number;
          provider: StoredProviderId;
        }> = [];

        for (
          let offset = 0;
          offset < importedPostIds.length;
          offset += PLAYLIST_IMPORT_LOOKUP_CHUNK_SIZE
        ) {
          const chunk = importedPostIds.slice(
            offset,
            offset + PLAYLIST_IMPORT_LOOKUP_CHUNK_SIZE
          );
          const rows = db
            .select({
              id: posts.id,
              postId: posts.postId,
              artistId: posts.artistId,
              provider: posts.provider,
            })
            .from(posts)
            .where(inArray(posts.postId, chunk))
            .all();
          localPosts.push(...rows);
        }

        const localPostIdMap = new Map(
          localPosts.map((p) => [
            `${p.artistId}:${p.provider}:${p.postId}`,
            p.id,
          ])
        );
        // Legacy v1 fallback: bare postId only when unambiguous
        const postIdOnlyCounts = new Map<number, number>();
        for (const p of localPosts) {
          postIdOnlyCounts.set(
            p.postId,
            (postIdOnlyCounts.get(p.postId) ?? 0) + 1
          );
        }
        const unambiguousPostIdMap = new Map(
          localPosts
            .filter((p) => postIdOnlyCounts.get(p.postId) === 1)
            .map((p) => [p.postId, p.id])
        );

        resolvedEntries = exportData.entries
          .map((entry, index) => {
            let localPostId: number | undefined;
            if (
              entry.artistId !== undefined &&
              entry.provider !== undefined
            ) {
              localPostId = localPostIdMap.get(
                `${entry.artistId}:${entry.provider}:${entry.postId}`
              );
            } else {
              localPostId = unambiguousPostIdMap.get(entry.postId);
            }
            if (localPostId === undefined) {
              return null;
            }
            return {
              playlistId: 0, // filled inside the transaction after insert
              postId: localPostId,
              addedAt: new Date(entry.addedAt),
              position: index,
            };
          })
          .filter((entry): entry is ImportEntryRow => entry !== null);
      }

      // ONE transaction: playlist row + chunked entry inserts. Failure rolls back all.
      const newPlaylistId = db.transaction((tx) => {
        const newPlaylist = tx
          .insert(playlists)
          .values({
            name: exportData.playlist.name,
            isSmart: exportData.playlist.isSmart,
            queryJson: exportData.playlist.queryJson,
            querySchemaVersion: CURRENT_SMART_QUERY_SCHEMA_VERSION,
            iconName: exportData.playlist.iconName,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
          .get();

        if (!newPlaylist) {
          throw createCodedError(
            "Failed to create playlist",
            ErrorCode.DATABASE_ERROR
          );
        }

        if (resolvedEntries.length > 0) {
          for (
            let offset = 0;
            offset < resolvedEntries.length;
            offset += PLAYLIST_ENTRIES_WRITE_CHUNK_SIZE
          ) {
            const chunk = resolvedEntries
              .slice(offset, offset + PLAYLIST_ENTRIES_WRITE_CHUNK_SIZE)
              .map((entry) => ({
                playlistId: newPlaylist.id,
                postId: entry.postId,
                addedAt: entry.addedAt,
                position: entry.position,
              }));
            tx.insert(playlistEntries)
              .values(chunk)
              .onConflictDoNothing({
                target: [playlistEntries.playlistId, playlistEntries.postId],
              })
              .run();
          }
        }

        return newPlaylist.id;
      });

      log.info(`[PlaylistController] Imported playlist as id=${newPlaylistId}`);
      return { success: true, playlistId: newPlaylistId };
    } catch (error) {
      log.error("[PlaylistController] Import failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        code: ErrorCode.DATABASE_ERROR,
      };
    }
  }

  /**
   * Resolve posts for a playlist (static or smart)
   *
   * For static playlists: Uses JOIN with playlist_entries.
   * For smart playlists: Parses query_json and builds dynamic Drizzle query with tag filters.
   * Integrates with global filters (mediaType) from GlobalTopBar.
   *
   * @param _event - IPC event (unused)
   * @param params - Request parameters (playlistId, page, limit, filters)
   * @returns Array of posts
   */
  private async resolvePlaylistPosts(
    _event: IpcMainInvokeEvent,
    params: ResolvePlaylistPostsRequest
  ): Promise<ResolvePlaylistPostsIpcResult> {
    const {
      playlistId,
      page,
      limit,
      filters,
      sortOrder = "desc",
      isRandom,
      seed,
      upperBoundPostId: requestUpperBoundPostId,
    } = params;
    const offset = (page - 1) * limit;

    try {
      const db = getDb();

      // Get playlist to check if it's smart
      const playlist = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all()[0];

      if (!playlist) {
        throw new Error(`Playlist ${playlistId} not found`);
      }

      const globalConditions = this.buildGlobalFilterConditions(filters);

      // Static playlist: use JOIN with playlist_entries + global filters
      if (!playlist.isSmart) {
        const conditions = [eq(playlistEntries.playlistId, playlistId)];
        if (globalConditions.length > 0) {
          conditions.push(...globalConditions);
        }

        const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

        const queryBuilder = db
          .select({
            id: posts.id,
            postId: posts.postId,
            artistId: posts.artistId,
            provider: posts.provider,
            fileUrl: posts.fileUrl,
            previewUrl: posts.previewUrl,
            sampleUrl: posts.sampleUrl,
            title: posts.title,
            rating: posts.rating,
            tags: posts.tags,
            mediaType: posts.mediaType,
            publishedAt: posts.publishedAt,
            createdAt: posts.createdAt,
            isViewed: posts.isViewed,
            isFavorited: posts.isFavorited,
            lastViewedAt: posts.lastViewedAt,
            viewCount: posts.viewCount,
          })
          .from(playlistEntries)
          .innerJoin(posts, eq(playlistEntries.postId, posts.id))
          .where(whereClause);

        // Manual playlist date sort = date added to playlist (addedAt), not post date.
        // Tiebreaker: playlist_entries.post_id (PK with playlist_id), same direction.
        const result = isRandom
          ? queryBuilder
              .orderBy(...seededOrderBy(posts.id, resolveRandomSeed(seed)))
              .limit(limit)
              .offset(offset)
              .all()
          : queryBuilder
              .orderBy(
                ...(sortOrder === "position"
                  ? [asc(playlistEntries.position)]
                  : [
                      sortOrder === "asc"
                        ? asc(playlistEntries.addedAt)
                        : desc(playlistEntries.addedAt),
                      sortOrder === "asc"
                        ? asc(playlistEntries.postId)
                        : desc(playlistEntries.postId),
                    ])
              )
              .limit(limit)
              .offset(offset)
              .all();

        log.info(
          `[PlaylistController] Resolved ${result.length} posts from static playlist ${playlistId} (page ${page})`
        );

        // Manual totals come from getPlaylists postCount (entry COUNT), not here.
        return { posts: toIpcSafe(result), total: null };
      }

      // Smart playlist: parse query_json and build dynamic query
      if (!playlist.queryJson || playlist.queryJson.trim() === "") {
        log.warn(`[PlaylistController] Smart playlist ${playlistId} has no query_json, returning empty result`);
        return { posts: [], total: null };
      }
      const smartSortOrder = sortOrder === "position" ? "desc" : sortOrder;

      // Smart playlist hybrid search:
      // 1) Local matches are read from the DB on every request (never cached).
      // 2) Remote: one feed walk per snapshot (HybridRemoteSnapshotStore). Page 1
      //    starts it; later pages read it. Ordered desc pages are served as soon as
      //    the walked prefix covers them; asc / random wait for the whole walk.
      // 3) Collapse (provider, postId), cursor-merge with local-preferred dedupe
      // 4) Slice the page; issued-key set is a size-capped uniqueness safety net
      const scope = this.buildSmartPlaylistScope(playlist, globalConditions);
      if (scope === null) {
        return { posts: [], total: null };
      }
      const { query, providerId, whereClause } = scope;

      // Local may materialize wholly in DB. Remote keeps a fixed window size (not an
      // expanding page*limit prefix).
      const localFetchLimit = HYBRID_RANDOM_MATERIALIZE_CAP;
      const remoteFetchLimit = HYBRID_RANDOM_MATERIALIZE_CAP;
      const resolvedSeed = resolveRandomSeed(seed);

      const snapshotKey = buildHybridSnapshotKey({
        playlistId,
        queryJson: playlist.queryJson,
        querySchemaVersion: playlist.querySchemaVersion,
        mediaType: filters?.mediaType,
        sortOrder: smartSortOrder,
      });

      this.hybridSnapshots.evictIdle();

      // Page 1 = new snapshot (like a new seed); it supersedes the playlist's
      // previous one. Later pages must find it — missing/evicted → SNAPSHOT_SUPERSEDED.
      let snapshot: HybridSnapshot;
      if (page === 1) {
        const apiSettings = await getDecryptedApiSettings(db);
        if (!apiSettings) {
          throw createCodedError(
            "Cannot fetch remote playlist posts: credentials missing or unavailable",
            ErrorCode.AUTH_ERROR
          );
        }
        const upperBoundPostId = !isRandom ? requestUpperBoundPostId : undefined;
        snapshot = this.hybridSnapshots.start(snapshotKey, {
          playlistId,
          providerId,
          providerSettings: {
            userId: apiSettings.userId,
            apiKey: apiSettings.apiKey,
          },
          booruQuery: this.buildBooruQueryString(query, upperBoundPostId),
          fetchLimit: remoteFetchLimit,
          blacklistedTags: new Set(
            getAllBlacklistedTags()
              .map((tag) => tag.trim().toLowerCase())
              .filter(Boolean)
          ),
          mediaType: filters?.mediaType,
          upperBoundPostId,
          isRandom,
          seed: resolvedSeed,
          sortOrder: smartSortOrder,
        });
      } else {
        const existing = this.hybridSnapshots.require(snapshotKey);
        if (existing.isRandom !== isRandom) {
          throw createSnapshotSupersededError();
        }
        snapshot = existing;
      }

      const localPosts = this.queryHybridLocalPosts(
        whereClause,
        { isRandom, seed: resolvedSeed, sortOrder: smartSortOrder },
        localFetchLimit,
        playlistId
      );

      // Provider/creds failures surface here (never an empty-success page).
      const readySnapshot =
        isRandom || smartSortOrder === "asc"
          ? await this.hybridSnapshots.awaitComplete(snapshotKey)
          : await this.hybridSnapshots.ensureCoverage(snapshotKey, (candidate) =>
              isHybridDescPageCovered(localPosts, candidate, page, limit)
            );
      if (readySnapshot !== snapshot) {
        throw createSnapshotSupersededError();
      }

      // Pages are not AI-filtered (client filters after flatten). aiCount is for the header.
      const { pagePosts: mergedPagePosts, localTaken, remoteTaken, mergedCount } =
        mergeHybridPlaylistPage(
          localPosts,
          snapshot.remotePosts,
          page,
          limit,
          smartSortOrder,
          isRandom,
          resolvedSeed
        );

      const pagePosts = isRandom
        ? mergedPagePosts
        : dropPriorIssuedHybridPosts(snapshot, page, mergedPagePosts);

      // null while the walk is still running (or failed): getPlaylistResolveTotal awaits it.
      const total = buildHybridSnapshotTotal(
        localPosts,
        snapshot,
        localFetchLimit
      );

      log.info(
        `[PlaylistController] Hybrid search resolved ${pagePosts.length} posts for smart playlist ${playlistId} ` +
          `(localWindow: ${localPosts.length}, remoteWindow: ${snapshot.remotePosts.length}, ` +
          `walk: ${snapshot.completeness}, mergedPrefix: ${mergedCount}, ` +
          `total: ${total === null ? "null" : `${total.kind}:${total.count}`}, ` +
          `localTaken: ${localTaken}, remoteTaken: ${remoteTaken}, page ${page})`
      );

      return { posts: pagePosts, total };
    } catch (error) {
      log.error(`[PlaylistController] Failed to resolve playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Window total of a smart playlist's current snapshot. Waits for the snapshot's
   * remote walk (never starts one), re-reads the local leg, and rejects instead of
   * returning null: SNAPSHOT_SUPERSEDED when the snapshot is gone, the walk's own
   * error when it failed.
   */
  private async getPlaylistResolveTotal(
    _event: IpcMainInvokeEvent,
    params: GetPlaylistResolveTotalRequest
  ): Promise<PlaylistResolveTotalValue> {
    const { playlistId, filters, sortOrder } = params;
    try {
      const db = getDb();
      const playlist = db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1)
        .all()[0];
      if (!playlist) {
        throw new Error(`Playlist ${playlistId} not found`);
      }
      // Manual / empty-query playlists never own a hybrid snapshot.
      if (!playlist.isSmart || !playlist.queryJson || playlist.queryJson.trim() === "") {
        throw createSnapshotSupersededError();
      }

      const snapshotKey = buildHybridSnapshotKey({
        playlistId,
        queryJson: playlist.queryJson,
        querySchemaVersion: playlist.querySchemaVersion,
        mediaType: filters?.mediaType,
        sortOrder: sortOrder === "position" ? "desc" : sortOrder,
      });
      this.hybridSnapshots.evictIdle();
      const snapshot = await this.hybridSnapshots.awaitComplete(snapshotKey);

      const scope = this.buildSmartPlaylistScope(
        playlist,
        this.buildGlobalFilterConditions(filters)
      );
      if (scope === null) {
        throw createSnapshotSupersededError();
      }
      const localFetchLimit = HYBRID_RANDOM_MATERIALIZE_CAP;
      const localPosts = this.queryHybridLocalPosts(
        scope.whereClause,
        { isRandom: snapshot.isRandom, seed: snapshot.seed, sortOrder: snapshot.sortOrder },
        localFetchLimit,
        playlistId
      );

      const total = buildHybridSnapshotTotal(localPosts, snapshot, localFetchLimit);
      if (total === null) {
        throw createCodedError(
          `Playlist ${playlistId} total is unavailable`,
          ErrorCode.UNKNOWN_ERROR
        );
      }
      return total;
    } catch (error) {
      log.error(`[PlaylistController] Failed to get playlist resolve total for ${playlistId}:`, error);
      throw error;
    }
  }

  private async releasePlaylistSnapshot(
    _event: IpcMainInvokeEvent,
    params: ReleasePlaylistSnapshotRequest
  ): Promise<void> {
    this.hybridSnapshots.release(params.playlistId);
  }

  /** Media-type + blacklist conditions shared by every resolve path (from GlobalTopBar). */
  private buildGlobalFilterConditions(
    filters: ResolvePlaylistPostsRequest["filters"] | undefined
  ): SQL[] {
    const globalConditions: SQL[] = [];
    if (filters?.mediaType === "videos") {
      globalConditions.push(eq(posts.mediaType, "video"));
    } else if (filters?.mediaType === "images") {
      const imageOrNull = or(eq(posts.mediaType, "image"), sql`${posts.mediaType} IS NULL`);
      if (imageOrNull) globalConditions.push(imageOrNull);
    }

    const blacklistCondition = buildPostsBlacklistFilterCondition(
      getAllBlacklistedTags()
    );
    if (blacklistCondition) {
      globalConditions.push(blacklistCondition);
    }
    return globalConditions;
  }

  /**
   * Parse a smart playlist and build its local WHERE (tags + global filters +
   * provider scope). Returns null when the query has no usable tags.
   */
  private buildSmartPlaylistScope(
    playlist: InferSelectModel<typeof playlists>,
    globalConditions: SQL[]
  ): { query: SmartPlaylistQuery; providerId: ProviderId; whereClause: SQL | undefined } | null {
    const playlistId = playlist.id;

    // Parse and validate queryJson via versioned smart-query resolver
    const parsedQuery = parseSmartQuery(
      playlist.queryJson,
      playlist.querySchemaVersion
    );
    if (!parsedQuery) {
      log.error(
        `[PlaylistController] Failed to parse query_json for smart playlist ${playlistId}:`,
        `version=${playlist.querySchemaVersion}`
      );
      throw new Error(
        `Invalid query_json for smart playlist ${playlistId} (version ${playlist.querySchemaVersion})`
      );
    }
    const query: SmartPlaylistQuery = parsedQuery;
    log.info(
      `[PlaylistController] Parsed query_json for smart playlist ${playlistId}:`,
      JSON.stringify(query)
    );

    // Build tag conditions from smart playlist query
    const { includeConditions, excludeConditions } = this.buildSmartPlaylistTagConditions(query);

    log.info(
      `[PlaylistController] Built conditions for smart playlist ${playlistId}: ` +
      `${includeConditions.length} include, ${excludeConditions.length} exclude`
    );

    if (includeConditions.length === 0 && excludeConditions.length === 0) {
      log.warn(`[PlaylistController] Smart playlist ${playlistId} has no valid tags, returning empty result`);
      return null;
    }

    // Combine conditions for local DB query
    const allConditions: SQL[] = [];

    if (includeConditions.length > 0) {
      if (includeConditions.length === 1) {
        allConditions.push(includeConditions[0]);
      } else {
        const combined = and(...includeConditions);
        if (combined) allConditions.push(combined);
      }
    }

    if (excludeConditions.length > 0) {
      if (excludeConditions.length === 1) {
        allConditions.push(not(excludeConditions[0]));
      } else {
        const orCondition = or(...excludeConditions);
        if (orCondition) {
          allConditions.push(not(orCondition));
        }
      }
    }

    // Add global filters
    if (globalConditions.length > 0) {
      allConditions.push(...globalConditions);
    }

    // Provider scope: one default for local WHERE + remote fetch.
    // parseSmartQuery accepts StoredProviderId strings; reject unsupported at execute.
    const rawProvider = query.provider ?? "rule34";
    if (!isProviderId(rawProvider)) {
      throw createCodedError(
        `Unsupported provider: ${rawProvider}`,
        ErrorCode.UNSUPPORTED_PROVIDER
      );
    }
    const providerId: ProviderId = rawProvider;
    allConditions.push(eq(posts.provider, providerId));

    const whereClause = allConditions.length > 1 ? and(...allConditions) : allConditions[0] ?? sql`1 = 1`;
    return { query, providerId, whereClause };
  }

  /** Local leg of the hybrid merge. Never cached: read on every request. */
  private queryHybridLocalPosts(
    whereClause: SQL | undefined,
    order: { isRandom: boolean; seed: number; sortOrder: "asc" | "desc" },
    localFetchLimit: number,
    playlistId: number
  ): IpcPost[] {
    const queryBuilder = getDb()
      .select({
        id: posts.id,
        postId: posts.postId,
        artistId: posts.artistId,
        provider: posts.provider,
        fileUrl: posts.fileUrl,
        previewUrl: posts.previewUrl,
        sampleUrl: posts.sampleUrl,
        title: posts.title,
        rating: posts.rating,
        tags: posts.tags,
        mediaType: posts.mediaType,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        isViewed: posts.isViewed,
        isFavorited: posts.isFavorited,
        lastViewedAt: posts.lastViewedAt,
        viewCount: posts.viewCount,
      })
      .from(posts)
      .where(whereClause);

    // Hybrid random orders by postId so the rank matches remote-only rows.
    // Ordered: postId only — smart collection is provider-scoped by
    // query.provider → order by postId, same as site.
    const result = order.isRandom
      ? queryBuilder
          .orderBy(...seededOrderBy(posts.postId, order.seed))
          .limit(localFetchLimit)
          .offset(0)
          .all()
      : queryBuilder
          .orderBy(
            order.sortOrder === "asc" ? asc(posts.postId) : desc(posts.postId)
          )
          .limit(localFetchLimit)
          .offset(0)
          .all();
    log.info(
      `[PlaylistController] Local DB query returned ${result.length} posts for smart playlist ${playlistId}`
    );
    return toIpcSafe(result);
  }
}
