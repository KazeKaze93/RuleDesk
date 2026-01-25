import { z } from "zod";

/**
 * Smart Playlist Tag Schema
 *
 * Tag-centric structure for smart playlists.
 * Tags can be included (AND logic) or excluded (OR logic).
 */
export const SmartPlaylistTagSchema = z.object({
  tag: z.string().min(1, "Tag cannot be empty"),
  type: z.enum(["include", "exclude"]),
});

export type SmartPlaylistTag = z.infer<typeof SmartPlaylistTagSchema>;

/**
 * Smart Playlist Query Schema
 *
 * Tag-centric structure: only tags with include/exclude logic.
 * Include tags are combined with AND, exclude tags with OR (standard booru search).
 * Hybrid search: always queries both local DB and remote API, then merges results.
 */
export const SmartPlaylistQuerySchema = z.object({
  tags: z.array(SmartPlaylistTagSchema).min(1, "At least one tag is required"),
});

export type SmartPlaylistQuery = z.infer<typeof SmartPlaylistQuerySchema>;

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
  queryJson: z.string().optional().default(""),
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
  queryJson: z.string().optional(),
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
 */
export const AddPostsToPlaylistSchema = z.object({
  playlistIds: z.array(z.number().int().positive()).min(1, "At least one playlist required"),
  postIds: z.array(z.number().int()).min(1, "At least one post required"),
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
  playlistId: z.number().int().positive(),
  postIds: z.array(z.number().int()).min(1, "At least one post required"),
});

/**
 * Remove Posts from Playlist Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type RemovePostsFromPlaylistRequest = z.infer<typeof RemovePostsFromPlaylistSchema>;

/**
 * Get Playlist Posts Schema
 *
 * Single source of truth for GetPlaylistPosts validation and typing.
 * Supports filtering by rating and media type (same filters as regular post queries).
 */
export const GetPlaylistPostsSchema = z.object({
  playlistId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  filters: z.object({
    rating: z.enum(["s", "q", "e"]).optional(),
    mediaType: z.enum(["all", "images", "videos"]).optional(),
  }).optional(),
  limit: z.number().int().min(1).max(1000).default(50), // Increased max limit to 1000 for larger gallery views
  isRandom: z.boolean().optional().default(false),
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
 * Includes global filters (rating, mediaType) for integration with GlobalTopBar.
 */
export const ResolvePlaylistPostsSchema = z.object({
  playlistId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(50), // Increased max limit to 1000 for larger gallery views
  filters: z.object({
    rating: z.enum(["s", "q", "e"]).optional(),
    mediaType: z.enum(["all", "images", "videos"]).optional(),
  }).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  isRandom: z.boolean().optional().default(false),
});

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
export function parsePlaylistQuery(queryJson: string | null | undefined): SmartPlaylistQuery | null {
  if (!queryJson || queryJson.trim() === "") {
    return null;
  }
  
  try {
    return JSON.parse(queryJson) as SmartPlaylistQuery;
  } catch (_error) {
    // Invalid JSON - return null instead of throwing
    // This allows graceful handling in UI
    return null;
  }
}
