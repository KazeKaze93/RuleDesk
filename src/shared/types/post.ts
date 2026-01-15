import { z } from "zod";

/**
 * WorkerPost Schema
 *
 * Zod schema for validating Post data sent to Web Workers.
 * Workers cannot import from main/db/schema, so we define a compatible schema here.
 *
 * This schema ensures type safety and runtime validation for data passed via postMessage.
 * Structured Clone API handles Date serialization, so we accept both Date and number (timestamp).
 */
export const WorkerPostSchema = z
  .object({
    id: z.number().int(),
    postId: z.number().int(),
    artistId: z.number().int(),
    fileUrl: z.string().min(1),
    previewUrl: z.string().min(1),
    sampleUrl: z.string().min(1),
    title: z.string().nullable(),
    rating: z.string().nullable(),
    tags: z.string().min(1),
    mediaType: z.enum(["image", "video"]).nullable().optional(), // Optional: Post has it, Worker may not need it
    publishedAt: z.union([z.date(), z.number().int(), z.null()]),
    createdAt: z.union([z.date(), z.number().int(), z.null()]),
    isViewed: z.boolean(),
    isFavorited: z.boolean(),
  })
  .passthrough(); // Allow extra fields (like mediaType) that Worker doesn't use but Post has

/**
 * Post type for Web Worker context
 *
 * Type inferred from Zod schema for type safety.
 * This type matches the structure of Post from main/db/schema but is defined
 * in shared to be accessible from both Renderer and Worker contexts.
 */
export type WorkerPost = z.infer<typeof WorkerPostSchema>;

/**
 * WorkerPost Array Schema
 *
 * Validates arrays of WorkerPost for batch processing in workers.
 */
export const WorkerPostArraySchema = z.array(WorkerPostSchema);
