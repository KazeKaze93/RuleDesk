import { z } from "zod";

/**
 * Shadow Insert Request Schema
 *
 * Renderer should only pass minimal data (postId + provider).
 * Main process will fetch full post data from API to ensure data integrity.
 */
export const ShadowInsertRequestSchema = z.object({
  postId: z.number().int().positive(),
  provider: z.enum(["rule34", "gelbooru"]),
}).strict();

/**
 * Shadow Insert Request Type
 */
export type ShadowInsertRequest = z.infer<typeof ShadowInsertRequestSchema>;
