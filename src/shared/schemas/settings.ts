import { z } from "zod";

/**
 * Validation constants for settings input.
 * These values are based on observed API behavior and reasonable security limits.
 * 
 * NOTE: If API service changes key formats, update these constants accordingly.
 * There is no official documentation specifying exact limits for Rule34/Gelbooru API keys.
 */
export const VALIDATION_LIMITS = {
  /**
   * Maximum length for Rule34 user ID.
   * Based on observed user IDs (typically 1-8 digits, but allow buffer for future growth).
   * If API introduces longer IDs, increase this value.
   */
  USER_ID_MAX_LENGTH: 20,
  
  /**
   * Minimum length for API key.
   * Prevents obviously invalid keys (empty strings, single characters, etc.).
   * Most API keys are 32+ characters, but we use 10 as a reasonable minimum.
   */
  API_KEY_MIN_LENGTH: 10,
  
  /**
   * Maximum length for API key.
   * 
   * WARNING: This is an ESTIMATED limit based on typical API key lengths (32-128 chars).
   * There is NO official documentation specifying the exact maximum length.
   * If API service updates key format to 256+ characters, this will break validation.
   * 
   * Consider: If API keys become longer, users will see "API key is too long" error
   * without understanding why. Monitor API changes and update this value accordingly.
   * 
   * Current value (200) provides buffer for:
   * - Typical API keys: 32-64 characters
   * - Potential future expansion: up to 200 characters
   * - Database storage: encrypted keys may be longer than original
   */
  API_KEY_MAX_LENGTH: 200,
} as const;

/**
 * Zod schema for saving settings (input from Renderer).
 * Shared between Main and Renderer processes for type safety and validation.
 * 
 * This schema validates incoming data from Renderer before saving to database.
 * Use this schema in Renderer for form validation before sending to Main process.
 * 
 * This schema is the single source of truth for settings input format.
 * Both Main (validation) and Renderer (form validation) use this schema.
 */
export const SaveSettingsSchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, "User ID must be a numeric string")
    .min(1, "User ID cannot be empty")
    .max(
      VALIDATION_LIMITS.USER_ID_MAX_LENGTH,
      `User ID must not exceed ${VALIDATION_LIMITS.USER_ID_MAX_LENGTH} characters`
    ),
  apiKey: z
    .string()
    .min(
      VALIDATION_LIMITS.API_KEY_MIN_LENGTH,
      `API key must be at least ${VALIDATION_LIMITS.API_KEY_MIN_LENGTH} characters`
    )
    .max(
      VALIDATION_LIMITS.API_KEY_MAX_LENGTH,
      `API key must not exceed ${VALIDATION_LIMITS.API_KEY_MAX_LENGTH} characters`
    )
    .refine((val) => val.trim().length > 0, "API key cannot be whitespace only"),
});

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
 * TypeScript types inferred from schemas.
 * Use these types in Renderer process for type-safe IPC communication.
 */
export type IpcSettings = z.infer<typeof IpcSettingsSchema>;
export type SaveSettings = z.infer<typeof SaveSettingsSchema>;

