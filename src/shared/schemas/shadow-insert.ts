import { z } from "zod";
import { PROVIDER_IDS } from "../constants";
import { IdSchema } from "./ipc";

/**
 * Shadow Insert Request Schema
 *
 * Renderer should only pass minimal data (postId + provider).
 * Main process will fetch full post data from API to ensure data integrity.
 */
export const ShadowInsertRequestSchema = z.object({
  postId: IdSchema,
  provider: z.enum(PROVIDER_IDS),
}).strict();

/**
 * Shadow Insert Request Type
 */
export type ShadowInsertRequest = z.infer<typeof ShadowInsertRequestSchema>;
