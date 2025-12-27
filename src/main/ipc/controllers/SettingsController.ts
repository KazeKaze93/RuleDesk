import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID } from "../../db/schema";
import { encrypt } from "../../lib/crypto";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;

const SaveSettingsSchema = z.object({
  userId: z.string(), // Rule34 user ID is usually numeric string, strict it if needed
  apiKey: z.string().min(10), // Basic length check
});

// Zod schema for IpcSettings response validation
// Ensures data integrity before sending to renderer process
const IpcSettingsSchema = z.object({
  userId: z.string(),
  hasApiKey: z.boolean(),
  isSafeMode: z.boolean(),
  isAdultConfirmed: z.boolean(),
  isAdultVerified: z.boolean(),
  tosAcceptedAt: z.number().nullable(), // Timestamp in milliseconds
});

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

      // Security: Do NOT return encryptedApiKey to renderer
      // Map it to boolean hasApiKey instead
      // Do NOT expose internal DB id to frontend (implementation detail)
      // Serialize Date to timestamp for IPC (Date objects become ISO strings in IPC)
      // Note: Drizzle with mode: "timestamp" automatically converts integer to Date object
      const ipcSettings = {
        userId: currentSettings.userId ?? "",
        hasApiKey: !!(
          currentSettings.encryptedApiKey &&
          currentSettings.encryptedApiKey.trim().length > 0
        ),
        isSafeMode: currentSettings.isSafeMode ?? true,
        isAdultConfirmed: currentSettings.isAdultConfirmed ?? false,
        isAdultVerified: currentSettings.isAdultVerified ?? false,
        tosAcceptedAt: currentSettings.tosAcceptedAt instanceof Date
          ? currentSettings.tosAcceptedAt.getTime()
          : currentSettings.tosAcceptedAt
          ? new Date(currentSettings.tosAcceptedAt).getTime()
          : null,
      };

      // Validate with Zod before sending to renderer (fail fast if data is corrupted)
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

      // Security: Do NOT return encryptedApiKey to renderer
      // Map it to boolean hasApiKey instead
      // Serialize Date to timestamp for IPC (Date objects become ISO strings in IPC)
      // Note: Drizzle with mode: "timestamp" automatically converts integer to Date object
      const ipcSettings = {
        userId: result.userId ?? "",
        hasApiKey: !!(
          result.encryptedApiKey &&
          result.encryptedApiKey.trim().length > 0
        ),
        isSafeMode: result.isSafeMode ?? true,
        isAdultConfirmed: result.isAdultConfirmed ?? false,
        isAdultVerified: result.isAdultVerified ?? false,
        tosAcceptedAt: result.tosAcceptedAt instanceof Date
          ? result.tosAcceptedAt.getTime()
          : result.tosAcceptedAt
          ? new Date(result.tosAcceptedAt).getTime()
          : null,
      };

      // Validate with Zod before sending to renderer (fail fast if data is corrupted)
      return IpcSettingsSchema.parse(ipcSettings);
    } catch (error) {
      log.error("[SettingsController] Failed to confirm legal:", error);
      throw error;
    }
  }
}

