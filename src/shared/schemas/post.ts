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

