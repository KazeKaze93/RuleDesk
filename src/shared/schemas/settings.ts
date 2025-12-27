import { z } from "zod";

/**
 * Zod schema for IPC settings response validation.
 * Shared between Main and Renderer processes for type safety.
 * 
 * Ensures data integrity before sending to renderer process.
 * Maps database representation to safe IPC format (no sensitive data).
 * 
 * This schema is the single source of truth for IPC settings format.
 * Both Main (validation) and Renderer (typing) use this schema.
 */
export const IpcSettingsSchema = z.object({
  userId: z.string(),
  hasApiKey: z.boolean(),
  isSafeMode: z.boolean(),
  isAdultConfirmed: z.boolean(),
  isAdultVerified: z.boolean(),
  tosAcceptedAt: z.number().nullable(), // Timestamp in milliseconds
});

/**
 * TypeScript type inferred from IpcSettingsSchema.
 * Use this type in Renderer process for type-safe IPC communication.
 */
export type IpcSettings = z.infer<typeof IpcSettingsSchema>;

