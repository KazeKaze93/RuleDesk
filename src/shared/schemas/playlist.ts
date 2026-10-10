import { z } from "zod";
import { PROVIDER_IDS, type ProviderId } from "../constants";
import {
  IdSchema,
  PageSchema,
  LimitSchema,
  PostFiltersSchema,
  RandomSeedSchema,
} from "./ipc";
import {
  SmartQueryTagSchema,
  type SmartQueryV1,
  parseSmartQuery,
  CURRENT_SMART_QUERY_SCHEMA_VERSION,
} from "./smart-playlist-query";

/**
 * Caps for playlist IPC id arrays. Exceeding these fails Zod with a typed
 * ValidationError (ErrorCode.VALIDATION_ERROR via BaseController), not an
 * untyped generic throw from the controller body.
 */
export const MAX_PLAYLIST_POST_IDS = 10_000;
export const MAX_PLAYLIST_TARGET_IDS = 100;
/** Max playlistIds × postIds pairs accepted by addPostsToPlaylist. */
export const MAX_PLAYLIST_ADD_ENTRY_PRODUCT = 10_000;
/** Max entries allowed in a playlist import file. */
export const MAX_PLAYLIST_IMPORT_ENTRIES = 50_000;
/**
 * SQLite default SQLITE_MAX_VARIABLE_NUMBER is 999.
 * playlist_entries rows bind up to 4 columns → stay well under the limit.
 */
export const PLAYLIST_ENTRIES_WRITE_CHUNK_SIZE = 200;
/** inArray(postId) lookup chunk — 1 bind per id. */
export const PLAYLIST_IMPORT_LOOKUP_CHUNK_SIZE = 400;

const playlistPostIdsArraySchema = z
  .array(IdSchema)
  .min(1, "At least one post required")
  .max(
    MAX_PLAYLIST_POST_IDS,
    `At most ${MAX_PLAYLIST_POST_IDS} post ids allowed`
  );

const playlistTargetIdsArraySchema = z
  .array(IdSchema)
  .min(1, "At least one playlist required")
  .max(
    MAX_PLAYLIST_TARGET_IDS,
    `At most ${MAX_PLAYLIST_TARGET_IDS} playlist ids allowed`
  );

/**
 * Non-empty queryJson must parse as the current smart-query schema.
 * Empty string is allowed (manual playlists / unfinished smart drafts).
 */
export const PlaylistQueryJsonWriteSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (value.trim() === "") {
      return;
    }
    const parsed = parseSmartQuery(
      value,
      CURRENT_SMART_QUERY_SCHEMA_VERSION
    );
    if (!parsed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid smart playlist queryJson",
      });
    }
  });

/**
 * Smart Playlist Tag Schema
 *
 * Tag-centric structure for smart playlists.
 * Tags can be included (AND logic) or excluded (OR logic).
 */
export const SmartPlaylistTagSchema = SmartQueryTagSchema;

export type SmartPlaylistTag = z.infer<typeof SmartPlaylistTagSchema>;

/**
 * Smart Playlist Query Schema
 *
 * Tag-centric structure: only tags with include/exclude logic.
 * Include tags are combined with AND, exclude tags with OR (standard booru search).
 * Hybrid search: always queries both local DB and remote API, then merges results.
 * 
 * Provider field: Specifies which Booru provider to use for remote API queries.
 * This is critical for shadow insert operations - wrong provider = 404 or invalid data.
 */
export const SmartPlaylistQuerySchema = z.object({
  tags: z.array(SmartQueryTagSchema).min(1, "At least one tag is required"),
  provider: z.enum(PROVIDER_IDS).optional().default("rule34"),
});

export type SmartPlaylistQuery = SmartQueryV1;

/**
 * Create Playlist Schema
 *
 * Single source of truth for CreatePlaylist validation and typing.
 * Shared between Main and Renderer processes for type safety and validation.
 *
 * This schema validates incoming data from Renderer before saving to database.
 * Use this schema in Renderer for form validation before sending to Main process.
 */
export const CreatePlaylistSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(200, "Name too long"),
  isSmart: z.boolean().default(true), // Default to Smart Collection
  queryJson: PlaylistQueryJsonWriteSchema.optional().default(""),
  iconName: z.string().max(50).optional().default(""),
});

/**
 * Create Playlist Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts) instead of duplicating interface.
 */
export type CreatePlaylistRequest = z.infer<typeof CreatePlaylistSchema>;

/**
 * Update Playlist Schema
 *
 * Single source of truth for UpdatePlaylist validation and typing.
 * All fields are optional for partial updates.
 */
export const UpdatePlaylistSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(200, "Name too long").optional(),
  queryJson: PlaylistQueryJsonWriteSchema.optional(),
  iconName: z.string().max(50).optional(),
});

/**
 * Update Playlist Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type UpdatePlaylistRequest = z.infer<typeof UpdatePlaylistSchema>;

/**
 * Add Posts to Playlist Schema
 *
 * Single source of truth for adding posts to playlists validation and typing.
 * Supports adding multiple posts to multiple playlists simultaneously.
 * Caps array lengths and the cartesian product (playlistIds × postIds).
 */
export const AddPostsToPlaylistSchema = z
  .object({
    playlistIds: playlistTargetIdsArraySchema,
    postIds: playlistPostIdsArraySchema,
  })
  .superRefine((data, ctx) => {
    const product = data.playlistIds.length * data.postIds.length;
    if (product > MAX_PLAYLIST_ADD_ENTRY_PRODUCT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Too many playlist×post pairs (${product}). Maximum is ${MAX_PLAYLIST_ADD_ENTRY_PRODUCT}.`,
        path: ["postIds"],
      });
    }
  });

/**
 * Add Posts to Playlist Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type AddPostsToPlaylistRequest = z.infer<typeof AddPostsToPlaylistSchema>;

/**
 * Remove Posts from Playlist Schema
 *
 * Single source of truth for removing posts from playlists validation and typing.
 */
export const RemovePostsFromPlaylistSchema = z.object({
  playlistId: IdSchema,
  postIds: playlistPostIdsArraySchema,
});

/**
 * Remove Posts from Playlist Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type RemovePostsFromPlaylistRequest = z.infer<typeof RemovePostsFromPlaylistSchema>;

/**
 * Sync which manual playlists contain the given post(s) in one transaction.
 * Adds to checked playlists, removes from all other manual playlists.
 */
export const SyncManualPlaylistMembershipSchema = z.object({
  postIds: playlistPostIdsArraySchema,
  manualPlaylistIds: z
    .array(IdSchema)
    .max(
      MAX_PLAYLIST_TARGET_IDS,
      `At most ${MAX_PLAYLIST_TARGET_IDS} playlist ids allowed`
    ),
});

export type SyncManualPlaylistMembershipRequest = z.infer<typeof SyncManualPlaylistMembershipSchema>;

/**
 * How many of the given posts are in each manual playlist (for bulk UI pre-check / indeterminate).
 */
export const GetManualPlaylistMembershipForPostsSchema = z.object({
  postIds: playlistPostIdsArraySchema,
});

export type GetManualPlaylistMembershipForPostsRequest = z.infer<
  typeof GetManualPlaylistMembershipForPostsSchema
>;

export const ClearManualPlaylistSchema = z.object({
  playlistId: IdSchema,
});

export type ClearManualPlaylistRequest = z.infer<typeof ClearManualPlaylistSchema>;

export const MovePostsBetweenManualPlaylistsSchema = z.object({
  fromPlaylistId: IdSchema,
  toPlaylistId: IdSchema,
  postIds: playlistPostIdsArraySchema,
});

export type MovePostsBetweenManualPlaylistsRequest = z.infer<
  typeof MovePostsBetweenManualPlaylistsSchema
>;

/**
 * Get Playlist Posts Schema
 *
 * Single source of truth for GetPlaylistPosts validation and typing.
 * Supports playlist-scoped filtering by media type.
 */
export const GetPlaylistPostsSchema = z.object({
  playlistId: IdSchema,
  page: PageSchema.default(1),
  filters: PostFiltersSchema.optional(),
  limit: LimitSchema.max(1000).default(50), // Increased max limit to 1000 for larger gallery views
  sortOrder: z.enum(["asc", "desc", "position"]).optional().default("desc"),
  isRandom: z.boolean().optional().default(false),
  /** Keep across pages for a stable shuffle; omit / change for a new shuffle. */
  seed: RandomSeedSchema,
});

/**
 * Get Playlist Posts Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type GetPlaylistPostsRequest = z.infer<typeof GetPlaylistPostsSchema>;

/**
 * Resolve Playlist Posts Schema
 *
 * Single source of truth for ResolvePlaylistPosts validation and typing.
 * Used to resolve posts for both static and smart playlists.
 * Includes optional mediaType filter from renderer state.
 */
export const ResolvePlaylistPostsSchema = z.object({
  playlistId: IdSchema,
  page: PageSchema.default(1),
  limit: LimitSchema.max(1000).default(50), // Increased max limit to 1000 for larger gallery views
  filters: PostFiltersSchema.optional(),
  sortOrder: z.enum(["asc", "desc", "position"]).optional().default("desc"),
  isRandom: z.boolean().optional().default(false),
  /** Keep across pages for a stable shuffle; omit / change for a new shuffle. */
  seed: RandomSeedSchema,
});

export const ReorderPlaylistEntriesSchema = z.object({
  playlistId: IdSchema,
  orderedPostIds: z
    .array(IdSchema)
    .min(1)
    .max(
      MAX_PLAYLIST_POST_IDS,
      `At most ${MAX_PLAYLIST_POST_IDS} post ids allowed`
    ),
});

export type ReorderPlaylistEntriesRequest = z.infer<typeof ReorderPlaylistEntriesSchema>;

export interface PlaylistExport {
  /** v1: postId only. v2: post identity includes artistId + provider. */
  version: 1 | 2;
  exportedAt: string;
  playlist: {
    name: string;
    isSmart: boolean;
    queryJson: string;
    iconName: string;
  };
  entries: Array<{
    postId: number;
    artistId?: number;
    provider?: ProviderId;
    addedAt: number;
  }>;
}

/**
 * Resolve Playlist Posts Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type ResolvePlaylistPostsRequest = z.infer<typeof ResolvePlaylistPostsSchema>;

/**
 * Parse playlist queryJson string into SmartPlaylistQuery object
 * 
 * This utility function centralizes queryJson parsing logic.
 * Renderer should not know about internal database storage format.
 * 
 * @param queryJson - JSON string from database (may be empty for manual playlists)
 * @returns Parsed SmartPlaylistQuery or null if invalid/empty
 */
export function parsePlaylistQuery(
  queryJson: string | null | undefined,
  querySchemaVersion = 1
): SmartPlaylistQuery | null {
  return parseSmartQuery(queryJson, querySchemaVersion);
}
