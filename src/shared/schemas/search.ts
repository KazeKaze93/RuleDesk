import { z } from "zod";
import { PageSchema, LimitSchema } from "./ipc";

/**
 * Search Posts Schema
 *
 * Single source of truth for external Booru API search validation and typing.
 * Used in Main process (SearchController) and Renderer process (type safety).
 */
const SearchTagTokenSchema = z.string().trim().min(1).max(200);

export const SearchPostsSchema = z.object({
  tags: z.array(SearchTagTokenSchema).max(100),
  // Empty array is allowed - means show all posts (API omits tags parameter)
  page: PageSchema,
  limit: LimitSchema.max(100).optional(),
  isRandom: z.boolean().optional().default(false),
  /** Rule34 cursor: fetch posts with id strictly less than this (pid stays 0). */
  beforePostId: z.number().int().positive().optional(),
});

export type BrowseSearchPageParam = number | { beforePostId: number };

/** Rule34 meta-tag for cursor pagination (posts with id strictly less than N). */
export function formatRule34BeforePostIdTag(beforePostId: number): string {
  return `id:<${beforePostId}`;
}

/**
 * Search Posts Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts) instead of duplicating interface.
 */
export type SearchPostsRequest = z.infer<typeof SearchPostsSchema>;

export const SearchBooruPageResultSchema = z.object({
  posts: z.array(z.unknown()),
  hasMore: z.boolean(),
  apiFetchedCount: z.number().int().nonnegative().optional(),
  /** Minimum Rule34 post id in this API batch; pass as beforePostId for the next page. */
  nextBeforePostId: z.number().int().positive().optional(),
});

export type SearchBooruPageResult<TPost = unknown> = {
  posts: TPost[];
  hasMore: boolean;
  /** Raw API row count before blacklist filtering; drives pagination. */
  apiFetchedCount?: number;
  nextBeforePostId?: number;
};

