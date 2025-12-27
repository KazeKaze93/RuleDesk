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
    tosAcceptedAt: Date | null;
  }> {
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
          isAdultVerified: false,
          tosAcceptedAt: null,
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
        isAdultVerified: currentSettings.isAdultVerified ?? false,
        tosAcceptedAt: currentSettings.tosAcceptedAt ?? null,
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
   * Uses atomic UPSERT to eliminate race conditions.
   * Returns updated settings to avoid extra IPC round-trip.
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
    tosAcceptedAt: Date | null;
  }> {
    try {
      const db = this.getDb();
      const now = new Date();

      // Atomic UPSERT: Single query eliminates race condition
      await db
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
        });

      // Fetch updated settings to return (avoid extra query by reading from DB)
      const updatedSettings = await db.query.settings.findFirst({
        where: (settings, { eq }) => eq(settings.id, SETTINGS_ID),
      });

      if (!updatedSettings) {
        throw new Error("Failed to retrieve updated settings after confirmation");
      }

      // Security: Do NOT return encryptedApiKey to renderer
      // Map it to boolean hasApiKey instead
      return {
        userId: updatedSettings.userId ?? "",
        hasApiKey: !!(
          updatedSettings.encryptedApiKey &&
          updatedSettings.encryptedApiKey.trim().length > 0
        ),
        isSafeMode: updatedSettings.isSafeMode ?? true,
        isAdultConfirmed: updatedSettings.isAdultConfirmed ?? false,
        isAdultVerified: updatedSettings.isAdultVerified ?? false,
        tosAcceptedAt: updatedSettings.tosAcceptedAt ?? null,
      };
    } catch (error) {
      log.error("[SettingsController] Failed to confirm legal:", error);
      throw error;
    }
  }
}

