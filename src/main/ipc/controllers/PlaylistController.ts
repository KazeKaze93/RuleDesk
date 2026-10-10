import { dialog, type BrowserWindow, type IpcMainInvokeEvent } from "electron";
import fs from "fs";
import log from "electron-log";
import { z } from "zod";
import { eq, desc, and, inArray, sql, or, not, asc, type SQL } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { playlists, playlistEntries, posts } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { toIpcSafe } from "../../utils/ipc-serialization";
import type { InferSelectModel } from "drizzle-orm";
import type { IpcSafe } from "../../../shared/types/ipc";
import { ErrorCode } from "../../../shared/types/error-codes";
import { createCodedError } from "../../../shared/utils/coded-error";
import {
  CreatePlaylistSchema,
  UpdatePlaylistSchema,
  AddPostsToPlaylistSchema,
  RemovePostsFromPlaylistSchema,
  GetPlaylistPostsSchema,
  ResolvePlaylistPostsSchema,
  ReorderPlaylistEntriesSchema,
  MAX_PLAYLIST_ADD_ENTRY_PRODUCT,
  MAX_PLAYLIST_IMPORT_ENTRIES,
  PLAYLIST_ENTRIES_WRITE_CHUNK_SIZE,
  PLAYLIST_IMPORT_LOOKUP_CHUNK_SIZE,
  PlaylistQueryJsonWriteSchema,
  type CreatePlaylistRequest,
  type UpdatePlaylistRequest,
  type AddPostsToPlaylistRequest,
  type RemovePostsFromPlaylistRequest,
  type GetPlaylistPostsRequest,
  type ResolvePlaylistPostsRequest,
  type ReorderPlaylistEntriesRequest,
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
import { isVideoUrl } from "@shared/utils/media";
import {
  EXTERNAL_ARTIST_ID,
  PROVIDER_IDS,
} from "../../../shared/constants";
import { getSqliteInstance } from "../../db/client";
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
import { sanitizeProviderTagToken } from "../../../shared/utils/provider-tag-sanitize";
import {
  getManualPlaylistsWithStats,
  getSmartPlaylists,
  getSmartPlaylistPostCount,
} from "../../db/queries/playlists";
import { getAllBlacklistedTags } from "../../db/queries/blacklist";
import { buildPostsBlacklistFilterCondition } from "../../db/queries/post-tag-filter";

type AppDatabase = BetterSQLite3Database<typeof schema>;
type UnknownRecord = Record<string, unknown>;
const CreatePlaylistArgsSchema = z.tuple([CreatePlaylistSchema]);
const IdArgsSchema = z.tuple([IdSchema]);
const UpdatePlaylistArgsSchema = z.tuple([IdSchema, UpdatePlaylistSchema]);
const AddPostsToPlaylistArgsSchema = z.tuple([AddPostsToPlaylistSchema]);
const RemovePostsFromPlaylistArgsSchema = z.tuple([RemovePostsFromPlaylistSchema]);
const GetPlaylistPostsArgsSchema = z.tuple([GetPlaylistPostsSchema]);
const ReorderPlaylistEntriesArgsSchema = z.tuple([ReorderPlaylistEntriesSchema]);
const ResolvePlaylistPostsArgsSchema = z.tuple([ResolvePlaylistPostsSchema]);
const GetPlaylistsContainingPostArgsSchema = z.tuple([
  z.number().int(),
  OptionalIdSchema,
  z.enum(PROVIDER_IDS).optional(),
]);
const ImportPlaylistArgsSchema = z.tuple([]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isProviderId(value: unknown): value is (typeof PROVIDER_IDS)[number] {
  if (typeof value !== "string") {
    return false;
  }
  for (const id of PROVIDER_IDS) {
    if (id === value) {
      return true;
    }
  }
  return false;
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
        isProviderId(entry.provider)
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
    if (entry.provider !== undefined && !isProviderId(entry.provider)) {
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
type IpcPost = IpcSafe<InferSelectModel<typeof posts>>;

/** Same Knuth constant as `seeded-ordering` — hybrid random ranks must match SQL order. */
const HYBRID_SEED_HASH_MULTIPLIER = 2654435761;
/** 32-bit mask for hybrid seed ranks (uint32). */
const HYBRID_SEED_HASH_MASK = 4294967295;
/** Max API pages scanned while filling a hybrid remote window after filters. */
const HYBRID_REMOTE_MAX_PAGES_TO_SCAN = 20;
/** Matches provider `fetchPosts` page-size cap (Rule34/Gelbooru). */
const HYBRID_REMOTE_API_PAGE_CAP = 1000;
/**
 * Cap for hybrid local + remote materialization.
 * Ordered hybrid must know the full local identity set so a remote twin that
 * ranks high on the API feed is not treated as remote-only on early pages.
 * Remote must use the same fixed window on every page: provider feed order ≠
 * publishedAt, so expanding `page * limit` then re-sorting lets later-feed
 * newer posts reshuffle the merge (R2 page1∩page2). Random ranks also need
 * both legs materialized because rank order ≠ feed order.
 */
const HYBRID_RANDOM_MATERIALIZE_CAP = 50_000;

function hybridPostMergeKey(post: { provider: string; postId: number }): string {
  return `${post.provider}:${post.postId}`;
}

/** Deterministic rank matching `seededOrderBy(postId, seed)` primary key. */
function hybridSeedRank(postId: number, seed: number): number {
  return (((postId + seed) * HYBRID_SEED_HASH_MULTIPLIER) & HYBRID_SEED_HASH_MASK) >>> 0;
}

/**
 * Compare two hybrid candidates. Random uses seed ranks on postId; otherwise publishedAt
 * with postId tie-break matching the local SQL ORDER BY (same direction as sortOrder).
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
  const timeDiff = a.publishedAt - b.publishedAt;
  if (timeDiff !== 0) {
    return sortOrder === "asc" ? timeDiff : -timeDiff;
  }
  const idDiff = a.postId - b.postId;
  return sortOrder === "asc" ? idDiff : -idDiff;
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

  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  // Schema existence cache — refreshed on restore/VACUUM reopen
  private ftsTableExistsCache: boolean = false;

  private refreshSchemaCaches(): void {
    this.ftsTableExistsCache = postsFtsTableExists(getSqliteInstance());
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
  private buildBooruQueryString(query: SmartPlaylistQuery): string {
    const includeTags = query.tags
      .filter((t) => t.type === "include")
      .map((t) => sanitizeProviderTagToken(t.tag).trim().toLowerCase())
      .filter(Boolean);
    
    const excludeTags = query.tags
      .filter((t) => t.type === "exclude")
      .map((t) => `-${sanitizeProviderTagToken(t.tag).trim().toLowerCase()}`)
      .filter(Boolean);
    
    const allTags = [...includeTags, ...excludeTags];
    return allTags.join(" ");
  }

  /**
   * Setup IPC handlers for playlist operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.DB.CREATE_PLAYLIST,
      CreatePlaylistArgsSchema,
      (event, ...args) => {
        const [data] = CreatePlaylistArgsSchema.parse(args);
        return this.createPlaylist(event, data);
      }
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
      (event, ...args) => {
        const [playlistId] = IdArgsSchema.parse(args);
        return this.getPlaylist(event, playlistId);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.UPDATE_PLAYLIST,
      UpdatePlaylistArgsSchema,
      (event, ...args) => {
        const [playlistId, data] = UpdatePlaylistArgsSchema.parse(args);
        return this.updatePlaylist(event, playlistId, data);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.DELETE_PLAYLIST,
      IdArgsSchema,
      (event, ...args) => {
        const [playlistId] = IdArgsSchema.parse(args);
        return this.deletePlaylist(event, playlistId);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.ADD_POSTS_TO_PLAYLIST,
      AddPostsToPlaylistArgsSchema,
      (event, ...args) => {
        const [data] = AddPostsToPlaylistArgsSchema.parse(args);
        return this.addPostsToPlaylist(event, data);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.REMOVE_POSTS_FROM_PLAYLIST,
      RemovePostsFromPlaylistArgsSchema,
      (event, ...args) => {
        const [data] = RemovePostsFromPlaylistArgsSchema.parse(args);
        return this.removePostsFromPlaylist(event, data);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLIST_POSTS,
      GetPlaylistPostsArgsSchema,
      (event, ...args) => {
        const [params] = GetPlaylistPostsArgsSchema.parse(args);
        return this.getPlaylistPosts(event, params);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.REORDER_PLAYLIST_ENTRIES,
      ReorderPlaylistEntriesArgsSchema,
      (event, ...args) => {
        const [params] = ReorderPlaylistEntriesArgsSchema.parse(args);
        return this.reorderPlaylistEntries(event, params);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.RESOLVE_PLAYLIST_POSTS,
      ResolvePlaylistPostsArgsSchema,
      (event, ...args) => {
        const [params] = ResolvePlaylistPostsArgsSchema.parse(args);
        return this.resolvePlaylistPosts(event, params);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.GET_PLAYLISTS_CONTAINING_POST,
      GetPlaylistsContainingPostArgsSchema,
      (event, ...args) => {
        const [postId, externalPostId, provider] =
          GetPlaylistsContainingPostArgsSchema.parse(args);
        return this.getPlaylistsContainingPost(
          event,
          postId,
          externalPostId,
          provider
        );
      }
    );

    this.handle(
      IPC_CHANNELS.DB.GET_MANUAL_PLAYLIST_MEMBERSHIP_FOR_POSTS,
      GetManualPlaylistMembershipForPostsSchema,
      (event, data) =>
        this.getManualPlaylistMembershipForPosts(
          event,
          GetManualPlaylistMembershipForPostsSchema.parse(data)
        )
    );

    this.handle(
      IPC_CHANNELS.DB.SYNC_MANUAL_PLAYLIST_MEMBERSHIP,
      SyncManualPlaylistMembershipSchema,
      (event, data) =>
        this.syncManualPlaylistMembership(
          event,
          SyncManualPlaylistMembershipSchema.parse(data)
        )
    );

    this.handle(
      IPC_CHANNELS.DB.CLEAR_MANUAL_PLAYLIST,
      ClearManualPlaylistSchema,
      (event, data) =>
        this.clearManualPlaylist(event, ClearManualPlaylistSchema.parse(data))
    );

    this.handle(
      IPC_CHANNELS.DB.MOVE_POSTS_BETWEEN_MANUAL_PLAYLISTS,
      MovePostsBetweenManualPlaylistsSchema,
      (event, data) =>
        this.movePostsBetweenManualPlaylists(
          event,
          MovePostsBetweenManualPlaylistsSchema.parse(data)
        )
    );

    this.handle(
      IPC_CHANNELS.DB.EXPORT_PLAYLIST,
      IdArgsSchema,
      (event, ...args) => {
        const [playlistId] = IdArgsSchema.parse(args);
        return this.exportPlaylist(event, playlistId);
      }
    );

    this.handle(
      IPC_CHANNELS.DB.IMPORT_PLAYLIST,
      ImportPlaylistArgsSchema,
      (event, ...args) => {
        ImportPlaylistArgsSchema.parse(args);
        return this.importPlaylist(event);
      }
    );

    // Cache at setup; refresh again when restore/VACUUM reopens the DB.
    this.refreshSchemaCaches();
    onDatabaseReopened(() => this.refreshSchemaCaches());

    log.info("[PlaylistController] All handlers registered");
  }

  /**
   * True when the posts content table has no rows (external-content FTS
   * SELECT without MATCH is a content passthrough).
   * Safe only while insert/update triggers are live — then content emptiness
   * equals index emptiness. Never use this as a bulk-sync-window probe.
   */
  private isFtsIndexEmpty(): boolean {
    const sqlite = getSqliteInstance();
    const row = sqlite.prepare("SELECT 1 FROM posts_fts LIMIT 1").get();
    return row === undefined;
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
    } else if (this.isFtsIndexEmpty()) {
      // Live triggers ⇒ content emptiness equals index emptiness.
      log.warn(
        "[PlaylistController] FTS5 table exists but is empty. " +
          "Returning empty smart-playlist result until posts_fts has rows."
      );
      return { includeConditions: [sql`1 = 0`], excludeConditions: [] };
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
      const db = this.getDb();
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
      const db = this.getDb();
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
      const db = this.getDb();

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
      const db = this.getDb();

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
      const db = this.getDb();

      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      // Cascade delete will automatically remove playlist_entries due to foreign key constraint
      db.transaction((tx) => {
        tx.delete(playlists)
          .where(eq(playlists.id, playlistId))
          .run();
      });

      log.info(`[PlaylistController] Deleted playlist: ${playlistId}`);
      return true;
    } catch (error) {
      log.error(`[PlaylistController] Failed to delete playlist ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Add posts to one or more playlists
   *
   * Supports adding a single post to multiple playlists simultaneously.
   * Duplicate entries are automatically prevented by unique constraint.
   *
   * @param _event - IPC event (unused)
   * @param data - Request data (playlistIds array, postIds array)
   * @returns Number of entries created
   */
  private async addPostsToPlaylist(
    _event: IpcMainInvokeEvent,
    data: AddPostsToPlaylistRequest
  ): Promise<number> {
    try {
      const product = data.playlistIds.length * data.postIds.length;
      if (product > MAX_PLAYLIST_ADD_ENTRY_PRODUCT) {
        throw createCodedError(
          `Too many playlist×post pairs (${product}). Maximum is ${MAX_PLAYLIST_ADD_ENTRY_PRODUCT}.`,
          ErrorCode.VALIDATION_ERROR,
          { name: "ValidationError" }
        );
      }

      const db = this.getDb();

      const entriesToInsert = data.playlistIds.flatMap((playlistId) =>
        data.postIds.map((postId) => ({ playlistId, postId }))
      );
      let entriesCreated = 0;

      db.transaction((tx) => {
        for (
          let offset = 0;
          offset < entriesToInsert.length;
          offset += PLAYLIST_ENTRIES_WRITE_CHUNK_SIZE
        ) {
          const chunk = entriesToInsert.slice(
            offset,
            offset + PLAYLIST_ENTRIES_WRITE_CHUNK_SIZE
          );
          const result = tx
            .insert(playlistEntries)
            .values(chunk)
            .onConflictDoNothing({
              target: [playlistEntries.playlistId, playlistEntries.postId],
            })
            .run();
          entriesCreated += result.changes;
        }
        tx.update(playlists)
          .set({ updatedAt: new Date() })
          .where(inArray(playlists.id, data.playlistIds))
          .run();
      });

      log.info(
        `[PlaylistController] Added ${entriesCreated} post(s) to ${data.playlistIds.length} playlist(s)`
      );

      return entriesCreated;
    } catch (error) {
      log.error("[PlaylistController] Failed to add posts to playlist:", error);
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
      const db = this.getDb();

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
      const db = this.getDb();
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
    const db = this.getDb();
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
    const db = this.getDb();
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

    const db = this.getDb();
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
      const db = this.getDb();

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

      const result = isRandom
        ? queryBuilder
            .orderBy(...seededOrderBy(posts.id, resolveRandomSeed(seed)))
            .limit(limit)
            .offset(offset)
            .all()
        : queryBuilder
            .orderBy(
              sortOrder === "position"
                ? asc(playlistEntries.position)
                : sortOrder === "asc"
                  ? asc(posts.publishedAt)
                  : desc(posts.publishedAt)
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
    const db = this.getDb();

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
    provider?: (typeof PROVIDER_IDS)[number]
  ): Promise<number[]> {
    try {
      const db = this.getDb();

      let result: { playlistId: number }[];
      if (postId <= 0 && externalPostId != null && externalPostId > 0 && provider) {
        // External post from Browse: (EXTERNAL_ARTIST_ID, provider, postId)
        const rows = db
          .select({ playlistId: playlistEntries.playlistId })
          .from(playlistEntries)
          .innerJoin(posts, eq(playlistEntries.postId, posts.id))
          .where(
            and(
              eq(posts.postId, externalPostId),
              eq(posts.artistId, EXTERNAL_ARTIST_ID),
              eq(posts.provider, provider)
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
      const db = this.getDb();
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

      const db = this.getDb();

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
          provider: (typeof PROVIDER_IDS)[number];
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
  ): Promise<IpcPost[]> {
    const {
      playlistId,
      page,
      limit,
      filters,
      sortOrder = "desc",
      isRandom,
      seed,
    } = params;
    const offset = (page - 1) * limit;

    try {
      const db = this.getDb();

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

      // Build global filter conditions (from GlobalTopBar)
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

        const result = isRandom
          ? queryBuilder
              .orderBy(...seededOrderBy(posts.id, resolveRandomSeed(seed)))
              .limit(limit)
              .offset(offset)
              .all()
          : queryBuilder
              .orderBy(
                sortOrder === "position"
                  ? asc(playlistEntries.position)
                  : sortOrder === "asc"
                    ? asc(playlistEntries.addedAt)
                    : desc(playlistEntries.addedAt)
              )
              .limit(limit)
              .offset(offset)
              .all();

        log.info(
          `[PlaylistController] Resolved ${result.length} posts from static playlist ${playlistId} (page ${page})`
        );

        return toIpcSafe(result);
      }

      // Smart playlist: parse query_json and build dynamic query
      if (!playlist.queryJson || playlist.queryJson.trim() === "") {
        log.warn(`[PlaylistController] Smart playlist ${playlistId} has no query_json, returning empty result`);
        return [];
      }
      const smartSortOrder = sortOrder === "position" ? "desc" : sortOrder;

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

      // Smart playlist hybrid search:
      // 1) Materialize local + remote matches (same capped window every page)
      // 2) Collapse (provider, postId), cursor-merge with local-preferred dedupe
      // 3) Return the page slice of the merged stream (never slice(0, limit) of a double page)

      // Build tag conditions from smart playlist query
      const { includeConditions, excludeConditions } = this.buildSmartPlaylistTagConditions(query);
      
      log.info(
        `[PlaylistController] Built conditions for smart playlist ${playlistId}: ` +
        `${includeConditions.length} include, ${excludeConditions.length} exclude`
      );

      if (includeConditions.length === 0 && excludeConditions.length === 0) {
        log.warn(`[PlaylistController] Smart playlist ${playlistId} has no valid tags, returning empty result`);
        return [];
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

      const whereClause = allConditions.length > 1 ? and(...allConditions) : allConditions[0] ?? sql`1 = 1`;

      // Both legs: always materialize up to the cap. Local must expose twins past
      // any page prefix; remote must be a fixed window so publishedAt re-sort after
      // an expanding page*limit feed prefix cannot reshuffle earlier pages.
      const localFetchLimit = HYBRID_RANDOM_MATERIALIZE_CAP;
      const remoteFetchLimit = HYBRID_RANDOM_MATERIALIZE_CAP;
      const resolvedSeed = resolveRandomSeed(seed);

      // Execute local DB query and remote API query concurrently.
      // Provider/creds failures must throw — never map to [] (silent empty success).
      const [localPosts, remotePosts] = await Promise.all([
        (async () => {
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
            .from(posts)
            .where(whereClause);

          // Hybrid random orders by postId so the rank matches remote-only rows.
          const result = isRandom
            ? queryBuilder
                .orderBy(...seededOrderBy(posts.postId, resolvedSeed))
                .limit(localFetchLimit)
                .offset(0)
                .all()
            : queryBuilder
                .orderBy(
                  smartSortOrder === "asc" ? asc(posts.publishedAt) : desc(posts.publishedAt),
                  smartSortOrder === "asc" ? asc(posts.postId) : desc(posts.postId)
                )
                .limit(localFetchLimit)
                .offset(0)
                .all();
          log.info(
            `[PlaylistController] Local DB query returned ${result.length} posts for smart playlist ${playlistId}`
          );
          return toIpcSafe(result);
        })(),
        this.resolveRemotePlaylistPosts(
          playlistId,
          query,
          remoteFetchLimit,
          filters,
          smartSortOrder,
          isRandom,
          resolvedSeed
        ),
      ]);

      const { pagePosts, localTaken, remoteTaken, mergedCount } = mergeHybridPlaylistPage(
        localPosts,
        remotePosts,
        page,
        limit,
        smartSortOrder,
        isRandom,
        resolvedSeed
      );

      log.info(
        `[PlaylistController] Hybrid search resolved ${pagePosts.length} posts for smart playlist ${playlistId} ` +
          `(localWindow: ${localPosts.length}, remoteWindow: ${remotePosts.length}, ` +
          `mergedPrefix: ${mergedCount}, localTaken: ${localTaken}, remoteTaken: ${remoteTaken}, page ${page})`
      );

      return pagePosts;
    } catch (error) {
      log.error(`[PlaylistController] Failed to resolve playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve a sorted remote window for hybrid smart-playlist merge.
   *
   * Always walks the provider feed from the start (deterministic) until
   * `fetchLimit` posts remain after blacklist/media filters, then sorts by the
   * same criterion the local leg uses so cursor-merge is valid.
   */
  private async resolveRemotePlaylistPosts(
    playlistId: number,
    query: SmartPlaylistQuery,
    fetchLimit: number,
    filters: ResolvePlaylistPostsRequest["filters"] | undefined,
    sortOrder: "asc" | "desc",
    isRandom: boolean,
    seed: number
  ): Promise<IpcPost[]> {
    try {
      // Build booru query string from tags
      const booruQuery = this.buildBooruQueryString(query);
      log.info(`[PlaylistController] Fetching remote posts for playlist ${playlistId} with query: "${booruQuery}"`);

      // Get provider from query (defaults to rule34 if not specified)
      // CRITICAL: Provider must match the actual source of posts to prevent 404 or invalid data
      const providerId = query.provider ?? "rule34";
      const provider = getProvider(providerId);
      const apiSettings = await getDecryptedApiSettings(this.getDb());
      
      if (!apiSettings) {
        throw createCodedError(
          "Cannot fetch remote playlist posts: credentials missing or unavailable",
          ErrorCode.AUTH_ERROR
        );
      }

      const providerSettings = {
        userId: apiSettings.userId,
        apiKey: apiSettings.apiKey,
      };

      const blacklistedTagSet = new Set(
        getAllBlacklistedTags().map((tag) => tag.trim().toLowerCase()).filter(Boolean)
      );

      const filteredPosts: IpcPost[] = [];
      const seenRemoteKeys = new Set<string>();
      // Deterministic feed walk from pid/page 0 — hybrid pagination replays from the start.
      let apiPage = 0;
      let pagesScanned = 0;
      let rawFetchedTotal = 0;
      const apiRequestLimit = Math.min(HYBRID_REMOTE_API_PAGE_CAP, Math.max(1, fetchLimit));

      while (
        filteredPosts.length < fetchLimit &&
        pagesScanned < HYBRID_REMOTE_MAX_PAGES_TO_SCAN
      ) {
        const { posts: booruPosts, rawItemCount } = await provider.fetchPosts(
          booruQuery,
          apiPage,
          providerSettings,
          false,
          apiRequestLimit
        );
        pagesScanned += 1;
        rawFetchedTotal += booruPosts.length;

        for (const post of booruPosts) {
          if (blacklistedTagSet.size > 0) {
            const hasBlacklistedTag = post.tags.some((tag) =>
              blacklistedTagSet.has(tag.trim().toLowerCase())
            );
            if (hasBlacklistedTag) {
              continue;
            }
          }

          if (filters?.mediaType) {
            const isVideo = isVideoUrl(post.fileUrl);
            if (filters.mediaType === "videos" && !isVideo) {
              continue;
            }
            if (filters.mediaType === "images" && isVideo) {
              continue;
            }
          }

          const mergeKey = hybridPostMergeKey({
            provider: providerId,
            postId: post.id,
          });
          if (seenRemoteKeys.has(mergeKey)) {
            continue;
          }
          seenRemoteKeys.add(mergeKey);

          const isVideo = isVideoUrl(post.fileUrl);
          filteredPosts.push({
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
          });

          if (filteredPosts.length >= fetchLimit) {
            break;
          }
        }

        // End of feed: short *API* page (not fetchLimit — random materialize uses a large cap).
        if (rawItemCount < apiRequestLimit || booruPosts.length === 0) {
          break;
        }
        apiPage += 1;
      }

      filteredPosts.sort((a, b) =>
        compareHybridPlaylistPosts(a, b, sortOrder, isRandom, seed)
      );

      const windowPosts = filteredPosts.slice(0, fetchLimit);

      log.info(
        `[PlaylistController] Resolved ${windowPosts.length} posts from remote API for smart playlist ${playlistId} ` +
          `(fetchLimit ${fetchLimit}, scanned ${pagesScanned} API page(s), raw ${rawFetchedTotal})`
      );

      return windowPosts;
    } catch (error) {
      log.error(`[PlaylistController] Failed to resolve remote playlist posts for ${playlistId}:`, error);
      throw error;
    }
  }
}
