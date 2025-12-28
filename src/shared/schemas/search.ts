import { z } from "zod";

/**
 * Search Posts Schema
 *
 * Single source of truth for external Booru API search validation and typing.
 * Used in Main process (SearchController) and Renderer process (type safety).
 */
export const SearchPostsSchema = z.object({
  tags: z
    .array(z.string().trim().min(1))
    .min(1, "At least one tag is required"),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100).optional(),
});

/**
 * Search Posts Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts) instead of duplicating interface.
 */
export type SearchPostsRequest = z.infer<typeof SearchPostsSchema>;

