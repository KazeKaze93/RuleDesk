import { z } from "zod";

/**
 * Post Data Schema
 *
 * Single source of truth for post data validation and typing.
 * Used when creating/updating posts from external sources (Browse tab).
 *
 * This schema defines the structure for optional post data that can be passed
 * to markPostAsViewed and togglePostFavorite IPC methods for external posts.
 */
export const PostDataSchema = z.object({
  postId: z.number().int().positive(),
  artistId: z.number().int().nonnegative(),
  fileUrl: z.string().min(1),
  previewUrl: z.string().min(1),
  sampleUrl: z.string().optional(),
  rating: z.enum(["s", "q", "e"]).optional(),
  tags: z.string().optional(),
  publishedAt: z.number().int().nonnegative().optional(),
}).strict(); // Strict mode: reject unknown properties

/**
 * Post Data Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts, PostsController.ts)
 * instead of duplicating interface.
 */
export type PostData = z.infer<typeof PostDataSchema>;

/**
 * Post Filter Schema
 *
 * Single source of truth for post filtering validation and typing.
 * Shared between Main and Renderer processes for type safety and validation.
 *
 * This schema validates filter parameters for post queries.
 * Use this schema in Renderer for filter validation before sending to Main process.
 */
export const PostFilterSchema = z
  .object({
    tags: z.string().optional(),
    rating: z.enum(["s", "q", "e"]).optional(),
    isFavorited: z.boolean().optional(),
    isViewed: z.boolean().optional(),
    sinceTracking: z.boolean().optional(),
    aiFilter: z.enum(["all", "hide", "only"]).optional(),
    mediaType: z.enum(["all", "images", "videos"]).optional(),
  })
  .partial();

/**
 * Post Filter Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 */
export type PostFilterRequest = z.infer<typeof PostFilterSchema>;

/**
 * Get Posts Schema
 *
 * Single source of truth for GetPosts validation and typing.
 * Shared between Main and Renderer processes for type safety and validation.
 *
 * This schema validates incoming data from Renderer before querying database.
 * Use this schema in Renderer for form validation before sending to Main process.
 */
export const GetPostsSchema = z.object({
  artistId: z.number().int().positive().optional(),
  page: z.number().int().min(1).default(1),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  filters: PostFilterSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  isRandom: z.boolean().optional().default(false),
});

/**
 * Get Posts Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts) instead of duplicating interface.
 */
export type GetPostsRequest = z.infer<typeof GetPostsSchema>;

export const GetPostsCountSchema = z.object({
  artistId: z.number().int().positive().optional(),
  filters: PostFilterSchema.optional(),
});

export type GetPostsCountRequest = z.infer<typeof GetPostsCountSchema>;

