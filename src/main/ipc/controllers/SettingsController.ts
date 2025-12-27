import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import type { InferSelectModel } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID } from "../../db/schema";
import { encrypt } from "../../lib/crypto";
import { IPC_CHANNELS } from "../channels";
import { SaveSettingsSchema, type IpcSettings, type SaveSettings } from "../../../shared/schemas/settings";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { z } from "zod";

type AppDatabase = BetterSQLite3Database<typeof schema>;

/**
 * Default IPC settings used as fallback when no settings exist in database.
 */
const DEFAULT_IPC_SETTINGS: IpcSettings = {
  userId: "",
  hasApiKey: false,
  isSafeMode: true,
  isAdultConfirmed: false,
  isAdultVerified: false,
  tosAcceptedAt: null,
};

/**
 * Maps Drizzle Settings type to safe IPC format.
 * Uses Drizzle's InferSelectModel for type safety and resilience to schema changes.
 * Explicitly converts SQLite integer booleans (0/1) to JavaScript booleans.
 * 
 * Performance: No Zod validation - we trust Drizzle types and TypeScript type system.
 * Validation is only needed for incoming data from Renderer, not for our own database queries.
 * 
 * @param dbSettings - Settings record from database (typed by Drizzle InferSelectModel)
 * @returns IPC-safe settings object (typed as IpcSettings)
 */
function mapSettingsToIpc(
  dbSettings: InferSelectModel<typeof settings>
): IpcSettings {
  // Map database representation to IPC format
  // TypeScript ensures type safety - no runtime validation needed
  return {
    userId: dbSettings.userId ?? "",
    hasApiKey: !!(
      dbSettings.encryptedApiKey &&
      dbSettings.encryptedApiKey.trim().length > 0
    ),
      // Convert SQLite integer booleans (0/1) to JavaScript booleans
      // Drizzle with mode: "boolean" already returns boolean, but ensure type safety
      // Schema: isSafeMode has .default(true), isAdultConfirmed has .default(false), isAdultVerified is .notNull()
      // Drizzle ensures defaults are applied, so no ?? needed for fields with defaults
      isSafeMode: !!dbSettings.isSafeMode, // .default(true) in schema - Drizzle ensures value exists
      isAdultConfirmed: !!dbSettings.isAdultConfirmed, // .default(false) in schema - Drizzle ensures value exists
      isAdultVerified: !!dbSettings.isAdultVerified, // .notNull() in schema - always present
      // Convert Date to number for IPC serialization
      // Uses toIpcSafe utility for consistency with other controllers
      tosAcceptedAt: dbSettings.tosAcceptedAt instanceof Date
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
    // CRITICAL: SaveSettingsSchema validates input from Renderer (userId regex, apiKey length, etc.)
    // BaseController.handle() automatically calls .parse() on incoming arguments before calling saveSettings
    // This prevents script injection, oversized data, and invalid formats from reaching the database
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE,
      z.tuple([SaveSettingsSchema]), // Validates: userId is numeric string (1-20 chars), apiKey is 10-200 chars, no whitespace
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
  private async getSettings(_event: IpcMainInvokeEvent): Promise<IpcSettings> {
    try {
      const db = this.getDb();
      const currentSettings = await db.query.settings.findFirst();

      if (!currentSettings) {
        // Return default values if no settings found (triggers Onboarding)
        // Use DEFAULT_IPC_SETTINGS constant (already validated, no need to parse)
        return DEFAULT_IPC_SETTINGS;
      }

      // Use Drizzle's inferred type directly (no redundant validation)
      // mapSettingsToIpc handles mapping and validation internally
      return mapSettingsToIpc(currentSettings);
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
    data: SaveSettings
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
  private async confirmLegal(_event: IpcMainInvokeEvent): Promise<IpcSettings> {
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
      // mapSettingsToIpc handles mapping and validation internally
      return mapSettingsToIpc(result);
    } catch (error) {
      log.error("[SettingsController] Failed to confirm legal:", error);
      throw error;
    }
  }
}

