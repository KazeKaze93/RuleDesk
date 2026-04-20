import { z } from "zod";

/**
 * Search Posts Schema
 *
 * Single source of truth for external Booru API search validation and typing.
 * Used in Main process (SearchController) and Renderer process (type safety).
 */
export const SearchPostsSchema = z.object({
  tags: z.array(z.string().trim().min(1)),
  // Empty array is allowed - means show all posts (API omits tags parameter)
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100).optional(),
  isRandom: z.boolean().optional().default(false),
});

/**
 * Search Posts Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts) instead of duplicating interface.
 */
export type SearchPostsRequest = z.infer<typeof SearchPostsSchema>;

/** Batch tag lists for resolve-tag IPC (DoS limit). */
export const TagBatchSchema = z.array(z.string().min(1)).max(100);

export type TagBatch = z.infer<typeof TagBatchSchema>;

/**
 * Must match `tag_metadata.type` / `TAG_TYPES` in main DB schema (0,1,3,4,5).
 */
const TAG_METADATA_TYPE_IDS = [0, 1, 3, 4, 5] as const;

export const TagMetadataTypeIdSchema = z.number().int().refine(
  (val): val is (typeof TAG_METADATA_TYPE_IDS)[number] =>
    (TAG_METADATA_TYPE_IDS as readonly number[]).includes(val),
  { message: "Invalid tag type. Must be one of TAG_TYPES values." }
);

export const ResolveTagsIpcSchema = z.tuple([TagBatchSchema]);

export const ResolveTagsByTypeIpcSchema = z.tuple([
  TagBatchSchema,
  TagMetadataTypeIdSchema,
]);

export type ResolveTagsByTypeIpcArgs = z.infer<typeof ResolveTagsByTypeIpcSchema>;

/** Rule34 DAPI tag response (id/name/type); passthrough allows extra API fields. */
export const R34TagResponseSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().min(1),
    type: z.union([z.number(), z.string()]).transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : Number(val);
      if (isNaN(num) || num < 0) {
        throw new z.ZodError([
          {
            code: "custom",
            path: ["type"],
            message: "Invalid type value",
          },
        ]);
      }
      return num;
    }),
  })
  .passthrough();

export type R34TagResponse = z.infer<typeof R34TagResponseSchema>;

