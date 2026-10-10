import { z } from "zod";
import { PROVIDER_IDS } from "../constants";
import {
  IdSchema,
  OptionalArtistScopeIdSchema,
  PageSchema,
  LimitSchema,
  RatingSchema,
  MediaTypeSchema,
  RandomSeedSchema,
} from "./ipc";

/**
 * Post Data Schema
 *
 * Single source of truth for post data validation and typing.
 * Used when creating/updating posts from external sources (Browse tab).
 *
 * This schema defines the structure for optional post data that can be passed
 * to markPostAsViewed and togglePostFavorite IPC methods for external posts.
 * `provider` is required: post identity is (artistId, provider, postId).
 */
export const PostDataSchema = z.object({
  postId: IdSchema,
  artistId: z.number().int().nonnegative(),
  provider: z.enum(PROVIDER_IDS),
  fileUrl: z.string().min(1).url(),
  previewUrl: z.string().min(1).url(),
  sampleUrl: z.string().optional(),
  rating: RatingSchema.optional(),
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
    isFavorited: z.boolean().optional(),
    isViewed: z.boolean().optional(),
    sinceTracking: z.boolean().optional(),
    aiFilter: z.enum(["all", "hide", "only"]).optional(),
    mediaType: MediaTypeSchema.optional(),
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
  artistId: OptionalArtistScopeIdSchema,
  page: PageSchema.default(1),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  filters: PostFilterSchema.optional(),
  limit: LimitSchema.max(100).default(50),
  isRandom: z.boolean().optional().default(false),
  /** Keep across pages for a stable shuffle; omit / change for a new shuffle. */
  seed: RandomSeedSchema,
});

/**
 * Parsed GetPosts shape (after Zod defaults: page/limit/isRandom present).
 * Controllers use this after BaseController validation.
 */
export type GetPostsRequest = z.infer<typeof GetPostsSchema>;

/**
 * Caller-facing GetPosts args (defaults may be omitted; Zod fills them on parse).
 * Use this on the IPC bridge / ``window.api`` surface.
 */
export type GetPostsRequestInput = z.input<typeof GetPostsSchema>;

export const GetPostsCountSchema = z.object({
  artistId: OptionalArtistScopeIdSchema,
  filters: PostFilterSchema.optional(),
});

export type GetPostsCountRequest = z.infer<typeof GetPostsCountSchema>;

