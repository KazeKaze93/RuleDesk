import { z } from "zod";

/**
 * Smart Playlist Query Schema
 *
 * Defines the structure for smart playlist queries.
 * Supports logical operators (AND, OR) and various filters.
 */
export const SmartPlaylistQuerySchema = z.object({
  operator: z.enum(["AND", "OR"]).default("AND"),
  filters: z.array(
    z.object({
      type: z.enum(["tags", "rating", "media_type", "viewed"]),
      operator: z.enum(["include", "exclude", "equals", "not_equals"]),
      value: z.union([
        z.string(), // For tags
        z.array(z.enum(["s", "q", "e"])), // For ratings
        z.enum(["image", "video"]), // For media_type
        z.boolean(), // For viewed
      ]),
    })
  ),
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
  description: z.string().trim().max(1000, "Description too long").optional().default(""),
  isSmart: z.boolean().default(false),
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
  description: z.string().trim().max(1000, "Description too long").optional(),
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
  limit: z.number().int().min(1).max(100).default(50),
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
 */
export const ResolvePlaylistPostsSchema = z.object({
  playlistId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

/**
 * Resolve Playlist Posts Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type ResolvePlaylistPostsRequest = z.infer<typeof ResolvePlaylistPostsSchema>;
