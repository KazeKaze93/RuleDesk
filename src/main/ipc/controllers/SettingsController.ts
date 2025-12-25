import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_KEYS } from "../../core/di/Container";
import { settings } from "../../db/schema";
import { encrypt } from "../../lib/crypto";
import { IPC_CHANNELS } from "../channels";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;

const SaveSettingsSchema = z.object({
  userId: z.string(), // Rule34 user ID is usually numeric string, strict it if needed
  apiKey: z.string().min(10), // Basic length check
});

/**
 * Settings Controller
 *
 * Handles IPC operations for application settings:
 * - Get settings status (check if API key is configured)
 * - Get settings (returns settings object)
 * - Save settings (upsert settings in database)
 */
export class SettingsController extends BaseController {
  private getDb(): AppDatabase {
    return container.resolve<AppDatabase>(DI_KEYS.DB);
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
      this.saveSettings.bind(this)
    );

    log.info("[SettingsController] All handlers registered");
  }

  /**
   * Get settings object
   *
   * @param _event - IPC event (unused)
   * @returns Settings object or null if not found
   */
  private async getSettings(
    _event: IpcMainInvokeEvent
  ): Promise<{
    userId: string;
    hasApiKey: boolean;
    isSafeMode: boolean;
    isAdultConfirmed: boolean;
  } | null> {
    try {
      const db = this.getDb();
      const currentSettings = await db.query.settings.findFirst();

      if (!currentSettings) {
        // Return default values if no settings found (triggers Onboarding)
        return {
          userId: "",
          hasApiKey: false,
          isSafeMode: true,
          isAdultConfirmed: false,
        };
      }

      // Security: Do NOT return encryptedApiKey to renderer
      // Map it to boolean hasApiKey instead
      // Do NOT expose internal DB id to frontend (implementation detail)
      return {
        userId: currentSettings.userId ?? "",
        hasApiKey: !!(
          currentSettings.encryptedApiKey &&
          currentSettings.encryptedApiKey.trim().length > 0
        ),
        isSafeMode: currentSettings.isSafeMode ?? true,
        isAdultConfirmed: currentSettings.isAdultConfirmed ?? false,
      };
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

      // Handle Encryption
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

      // Atomic upsert: Single query eliminates race condition
      // Fixed ID=1 for single profile design (refactor if multi-profile needed)
      // Only update fields that are explicitly provided (userId and apiKey are required in schema)
      await db
        .insert(settings)
        .values({
          id: 1,
          userId,
          encryptedApiKey: encryptedKey ?? "",
          isSafeMode: true,
          isAdultConfirmed: false,
        })
        .onConflictDoUpdate({
          target: settings.id,
          set: {
            userId,
            ...(encryptedKey !== undefined && { encryptedApiKey: encryptedKey }),
            // Note: isSafeMode and isAdultConfirmed are not updated here
            // They should be updated via separate endpoint if needed
          },
        });

      log.info("[SettingsController] Settings saved successfully");
      return true;
    } catch (error) {
      log.error("[SettingsController] Failed to save settings:", error);
      throw error;
    }
  }
}

