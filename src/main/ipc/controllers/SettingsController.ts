import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID, type Settings } from "../../db/schema";
import { encrypt } from "../../lib/crypto";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * Enhanced Zod schema for saving settings with strict validation.
 * Rule34 user IDs are numeric strings (e.g., "12345").
 * API keys must meet minimum security requirements.
 */
const SaveSettingsSchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, "User ID must be a numeric string")
    .min(1, "User ID cannot be empty")
    .max(20, "User ID is too long"),
  apiKey: z
    .string()
    .min(10, "API key must be at least 10 characters")
    .max(200, "API key is too long")
    .refine((val) => val.trim().length > 0, "API key cannot be whitespace only"),
});

/**
 * Zod schema for IPC settings response validation.
 * Ensures data integrity before sending to renderer process.
 * Maps database representation to safe IPC format (no sensitive data).
 * 
 * Note: We use Drizzle's $inferSelect type for DB records, avoiding duplicate schema definitions.
 */
const IpcSettingsSchema = z.object({
  userId: z.string(),
  hasApiKey: z.boolean(),
  isSafeMode: z.boolean(),
  isAdultConfirmed: z.boolean(),
  isAdultVerified: z.boolean(),
  tosAcceptedAt: z.number().nullable(), // Timestamp in milliseconds
});

/**
 * Maps Drizzle Settings type to safe IPC format.
 * Uses Drizzle's inferred types directly, avoiding redundant validation.
 * 
 * @param dbSettings - Settings record from database (typed by Drizzle)
 * @returns IPC-safe settings object
 */
function mapSettingsToIpc(dbSettings: Settings): z.infer<typeof IpcSettingsSchema> {
  return {
    userId: dbSettings.userId ?? "",
    hasApiKey: !!(
      dbSettings.encryptedApiKey &&
      dbSettings.encryptedApiKey.trim().length > 0
    ),
    isSafeMode: dbSettings.isSafeMode ?? true,
    isAdultConfirmed: dbSettings.isAdultConfirmed ?? false,
    isAdultVerified: dbSettings.isAdultVerified,
    tosAcceptedAt: dbSettings.tosAcceptedAt
      ? dbSettings.tosAcceptedAt.getTime()
      : null,
  };
}

/**
 * Settings Controller
 *
 * Handles IPC operations for application settings:
 * - Get settings status (check if API key is configured)
 * - Get settings (returns settings object)
 * - Save settings (upsert settings in database)
 * - Confirm legal (Age Gate & ToS acceptance)
 */
export class SettingsController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }

  /**
   * Setup IPC handlers for settings operations
   */
  public setup(): void {
    // app:get-settings-status - returns full settings object (used by frontend)
    this.handle(
      IPC_CHANNELS.SETTINGS.GET,
      z.tuple([]),
      this.getSettings.bind(this)
    );
    // app:save-settings - saves settings
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE,
      z.tuple([SaveSettingsSchema]),
      this.saveSettings.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );
    // settings:confirm-legal - confirms Age Gate & ToS acceptance
    this.handle(
      IPC_CHANNELS.SETTINGS.CONFIRM_LEGAL,
      z.tuple([]),
      this.confirmLegal.bind(this)
    );

    log.info("[SettingsController] All handlers registered");
  }

  /**
   * Get settings object
   *
   * @param _event - IPC event (unused)
   * @returns Settings object with all fields including Age Gate & ToS status
   */
  private async getSettings(
    _event: IpcMainInvokeEvent
  ): Promise<{
    userId: string;
    hasApiKey: boolean;
    isSafeMode: boolean;
    isAdultConfirmed: boolean;
    isAdultVerified: boolean;
    tosAcceptedAt: number | null; // Timestamp in milliseconds
  }> {
    try {
      const db = this.getDb();
      const currentSettings = await db.query.settings.findFirst();

      if (!currentSettings) {
        // Return default values if no settings found (triggers Onboarding)
        const defaultSettings = {
          userId: "",
          hasApiKey: false,
          isSafeMode: true,
          isAdultConfirmed: false,
          isAdultVerified: false,
          tosAcceptedAt: null,
        };
        // Validate with Zod before sending to renderer
        return IpcSettingsSchema.parse(defaultSettings);
      }

      // Use Drizzle's inferred type directly (no redundant validation)
      // Map to IPC format and validate only the output (single validation pass)
      const ipcSettings = mapSettingsToIpc(currentSettings);
      return IpcSettingsSchema.parse(ipcSettings);
    } catch (error) {
      log.error("[SettingsController] Failed to get settings:", error);
      throw error;
    }
  }

  /**
   * Save settings (upsert in database)
   *
   * @param _event - IPC event (unused)
   * @param data - Settings data to save (validated)
   * @returns true if save succeeded
   * @throws {Error} If save fails
   */
  private async saveSettings(
    _event: IpcMainInvokeEvent,
    data: z.infer<typeof SaveSettingsSchema>
  ): Promise<boolean> {
    const { userId, apiKey } = data;

    try {
      const db = this.getDb();

      // Use transaction to ensure atomicity when updating sensitive data
      // This prevents partial updates if encryption or database operation fails
      await db.transaction(async (tx) => {
        // Handle Encryption within transaction
        // If a new 'apiKey' comes from frontend, encrypt it.
        // If not provided, we keep the old encrypted one.
        let encryptedKey: string | undefined;
        if (apiKey) {
          try {
            encryptedKey = encrypt(apiKey);
          } catch (error) {
            log.error("[SettingsController] Failed to encrypt API key:", error);
            throw new Error(
              "Failed to encrypt API key. Encryption is not available on this system."
            );
          }
        }

        // Get existing settings to preserve optional fields
        const existing = await tx.query.settings.findFirst();

        // Atomic upsert: Single query eliminates race condition
        await tx
          .insert(settings)
          .values({
            id: SETTINGS_ID,
            userId,
            encryptedApiKey: encryptedKey ?? existing?.encryptedApiKey ?? "",
            isSafeMode: existing?.isSafeMode ?? true,
            isAdultConfirmed: existing?.isAdultConfirmed ?? false,
            isAdultVerified: existing?.isAdultVerified ?? false,
            tosAcceptedAt: existing?.tosAcceptedAt ?? null,
          })
          .onConflictDoUpdate({
            target: settings.id,
            set: {
              userId,
              ...(encryptedKey !== undefined && { encryptedApiKey: encryptedKey }),
              // Preserve existing optional fields if not explicitly updated
            },
          });
      });

      log.info("[SettingsController] Settings saved successfully");
      return true;
    } catch (error) {
      log.error("[SettingsController] Failed to save settings:", error);
      throw error;
    }
  }

  /**
   * Confirm legal (Age Gate & ToS acceptance)
   *
   * Updates settings to mark user as adult verified and record ToS acceptance timestamp.
   * Creates settings record if it doesn't exist.
   * Uses transaction for consistency and atomicity (matches saveSettings pattern).
   * Uses atomic UPSERT with RETURNING to get updated data in single query.
   *
   * @param _event - IPC event (unused)
   * @returns Updated settings object
   * @throws {Error} If update fails
   */
  private async confirmLegal(
    _event: IpcMainInvokeEvent
  ): Promise<{
    userId: string;
    hasApiKey: boolean;
    isSafeMode: boolean;
    isAdultConfirmed: boolean;
    isAdultVerified: boolean;
    tosAcceptedAt: number | null; // Timestamp in milliseconds
  }> {
    try {
      const db = this.getDb();
      const now = new Date();

      // Use transaction for consistency and atomicity (matches saveSettings pattern)
      // This ensures data integrity and allows future extensions (e.g., audit logging)
      const result = await db.transaction(async (tx) => {
        // Atomic UPSERT with RETURNING: Single query eliminates race condition and extra DB round-trip
        const upsertResult = await tx
          .insert(settings)
          .values({
            id: SETTINGS_ID,
            userId: "",
            encryptedApiKey: "",
            isSafeMode: true,
            isAdultConfirmed: false,
            isAdultVerified: true,
            tosAcceptedAt: now,
          })
          .onConflictDoUpdate({
            target: settings.id,
            set: {
              isAdultVerified: true,
              tosAcceptedAt: now,
              // Preserve existing fields (userId, encryptedApiKey, isSafeMode, isAdultConfirmed)
            },
          })
          .returning();

        return upsertResult[0];
      });

      if (!result) {
        throw new Error("Failed to retrieve updated settings after confirmation");
      }

      // Use Drizzle's inferred type directly (no redundant validation)
      // Map to IPC format and validate only the output (single validation pass)
      const ipcSettings = mapSettingsToIpc(result);
      return IpcSettingsSchema.parse(ipcSettings);
    } catch (error) {
      log.error("[SettingsController] Failed to confirm legal:", error);
      throw error;
    }
  }
}

