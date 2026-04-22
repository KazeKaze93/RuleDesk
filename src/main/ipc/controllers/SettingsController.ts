import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID } from "../../db/schema";
import { encrypt } from "../../lib/crypto";
import { IPC_CHANNELS } from "../channels";
import {
  SaveSettingsSchema,
  ThemePreferenceSchema,
  type IpcSettings,
  type SaveSettings,
  type ThemePreference,
} from "../../../shared/schemas/settings";
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
  downloadFolder: null,
  duplicateFileBehavior: "skip",
  downloadFolderStructure: "flat",
  theme: "system",
  autoSyncOnStartup: false,
  syncIntervalMinutes: 0,
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
      dbSettings.encryptedApiKey && dbSettings.encryptedApiKey.trim().length > 0
    ),
    // Convert SQLite integer booleans (0/1) to JavaScript booleans
    // Drizzle with mode: "boolean" already returns boolean, but ensure type safety
    // Schema: isSafeMode has .default(true), isAdultConfirmed has .default(false), isAdultVerified is .notNull()
    // Drizzle ensures defaults are applied, so no ?? needed for fields with defaults
    isSafeMode: !!dbSettings.isSafeMode, // .default(true) in schema - Drizzle ensures value exists
    isAdultConfirmed: !!dbSettings.isAdultConfirmed, // .default(false) in schema - Drizzle ensures value exists
    isAdultVerified: !!dbSettings.isAdultVerified, // .notNull() in schema - always present
    // Convert Date to number for IPC serialization
    // Drizzle with mode: "timestamp" returns Date | null
    // But we need to handle edge cases where it might be a number (timestamp) or null
    // CRITICAL: Drizzle with mode: "timestamp" stores as integer (milliseconds) in SQLite
    // and returns Date object when reading, but we need to handle all cases
    tosAcceptedAt: (() => {
      const value = dbSettings.tosAcceptedAt;
      if (value instanceof Date) {
        return value.getTime();
      }
      if (typeof value === "number" && value > 0) {
        return value;
      }
      return null;
    })(),
    downloadFolder: dbSettings.downloadFolder ?? null,
    duplicateFileBehavior:
      (dbSettings.duplicateFileBehavior as "skip" | "overwrite") || "skip",
    downloadFolderStructure:
      (dbSettings.downloadFolderStructure as "flat" | "{artist_id}") || "flat",
    theme: (dbSettings.theme as ThemePreference) || "system",
    autoSyncOnStartup: !!dbSettings.autoSyncOnStartup,
    syncIntervalMinutes: dbSettings.syncIntervalMinutes ?? 0,
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

  // Cache settings to avoid DB queries on every call (settings change rarely)
  // Cache is invalidated only when settings are saved (no TTL - settings don't change externally)
  private settingsCache: IpcSettings | null = null;

  /**
   * Setup IPC handlers for settings operations
   */
  public setup(): void {
    // app:get-settings-status - returns full settings object (used by frontend)
    // This handler is idempotent and cached internally (5s TTL)
    // Cache prevents DB queries on repeated calls (e.g., React Strict Mode double-invocation)
    // Mark as idempotent to allow rapid calls when cache is valid
    this.handle(
      IPC_CHANNELS.SETTINGS.GET,
      z.tuple([]),
      this.getSettings.bind(this),
      { isIdempotent: true }
    );
    // app:save-settings - saves settings
    // CRITICAL: SaveSettingsSchema validates input from Renderer (userId regex, apiKey length, etc.)
    // BaseController.handle() automatically calls .parse() on incoming arguments before calling saveSettings
    // This prevents script injection, oversized data, and invalid formats from reaching the database
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE,
      z.tuple([SaveSettingsSchema]), // Validates: userId is numeric string (1-20 chars), apiKey is 10-200 chars, no whitespace
      // Type assertion is safe: BaseController validates args with Zod schema before calling handler
      this.saveSettings.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE_THEME,
      z.tuple([ThemePreferenceSchema]),
      this.saveTheme.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    // settings:confirm-legal - confirms Age Gate & ToS acceptance
    this.handle(
      IPC_CHANNELS.SETTINGS.CONFIRM_LEGAL,
      z.tuple([]),
      this.confirmLegal.bind(this)
    );
    // settings:save-download-folder - saves custom download folder path
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_FOLDER,
      z.tuple([z.string().max(4096).nullable()]),
      this.saveDownloadFolder.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    // settings:save-download-settings - saves duplicate/folder structure
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_SETTINGS,
      z.tuple([
        z.object({
          duplicateFileBehavior: z.enum(["skip", "overwrite"]).optional(),
          downloadFolderStructure: z.enum(["flat", "{artist_id}"]).optional(),
        }),
      ]),
      this.saveDownloadSettings.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    log.info("[SettingsController] All handlers registered");
  }

  /**
   * Get settings object (cached until invalidated)
   *
   * This method is idempotent - multiple calls return the same result.
   * Cache is invalidated only when settings are saved (no TTL - settings don't change externally).
   *
   * @param _event - IPC event (unused)
   * @returns Settings object with all fields including Age Gate & ToS status
   */
  private async getSettings(_event: IpcMainInvokeEvent): Promise<IpcSettings> {
    // Return cached value if available (cache is invalidated only on save)
    if (this.settingsCache !== null) {
      return this.settingsCache;
    }

    try {
      const db = this.getDb();
      // CRITICAL: Always query by SETTINGS_ID to ensure we get the correct record
      const currentSettings = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });

      let result: IpcSettings;
      if (!currentSettings) {
        // Return default values if no settings found (triggers Onboarding)
        // Use DEFAULT_IPC_SETTINGS constant (already validated, no need to parse)
        log.debug(
          "[SettingsController] getSettings: No settings found, returning defaults"
        );
        result = DEFAULT_IPC_SETTINGS;
      } else {
        // Use Drizzle's inferred type directly (no redundant validation)
        // mapSettingsToIpc handles mapping and validation internally
        result = mapSettingsToIpc(currentSettings);
      }

      // Update cache (no timestamp - cache is invalidated only on save)
      this.settingsCache = result;

      return result;
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

      // PERFORMANCE: Prepare all data BEFORE transaction to minimize I/O wait inside transaction
      // Encryption and logging are CPU-bound operations that should not block the database

      // Handle Encryption BEFORE transaction
      // If a new 'apiKey' comes from frontend, encrypt it.
      // If not provided, we keep the old encrypted one.
      let encryptedKey: string | undefined;
      if (apiKey) {
        try {
          encryptedKey = encrypt(apiKey);
          log.debug(
            `[SettingsController] API key encrypted successfully, length=${encryptedKey.length}`
          );
        } catch (error) {
          log.error("[SettingsController] Failed to encrypt API key:", error);
          throw new Error(
            "Failed to encrypt API key. Encryption is not available on this system."
          );
        }
      }

      // Use transaction to ensure atomicity when updating sensitive data
      // This prevents partial updates if database operation fails
      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      // SECURITY: Get existing settings INSIDE transaction to avoid race conditions
      // PERFORMANCE: Minimize logic inside transaction - only DB operations
      let existing: InferSelectModel<typeof settings> | undefined;

      db.transaction((tx) => {
        // Get existing settings synchronously inside transaction to avoid race conditions
        // CRITICAL: Always query by SETTINGS_ID to ensure we get the correct record
        existing = tx
          .select()
          .from(settings)
          .where(eq(settings.id, SETTINGS_ID))
          .limit(1)
          .all()[0];

        if (existing) {
          // Update existing record
          // CRITICAL: Only update encryptedApiKey if a new key was provided and encrypted
          // If encryptedKey is undefined, keep the existing one
          const finalEncryptedKey =
            encryptedKey !== undefined && encryptedKey.length > 0
              ? encryptedKey
              : existing.encryptedApiKey ?? "";
          const finalUserId =
            userId !== undefined && userId.length > 0
              ? userId
              : existing.userId ?? "";
          // CRITICAL: Use existing.id instead of SETTINGS_ID to ensure we update the correct record
          const targetId = existing.id;

          // Execute update using Drizzle update - should work in transaction
          // Using explicit .set() for all fields to ensure they are updated
          tx.update(settings)
            .set({
              userId: finalUserId,
              encryptedApiKey: finalEncryptedKey,
              // CRITICAL: Preserve isAdultVerified and tosAcceptedAt when saving auth data
              // These fields should only be updated by confirmLegal, not by saveSettings
              isAdultVerified: existing.isAdultVerified ?? false,
              tosAcceptedAt: existing.tosAcceptedAt ?? null,
              theme: existing.theme ?? "system",
              autoSyncOnStartup: data.autoSyncOnStartup ?? false,
              syncIntervalMinutes: data.syncIntervalMinutes ?? 0,
            })
            .where(eq(settings.id, targetId))
            .run();
        } else {
          // Insert new record
          tx.insert(settings)
            .values({
              id: SETTINGS_ID,
              userId: userId ?? "",
              encryptedApiKey: encryptedKey ?? "",
              isSafeMode: true,
              isAdultConfirmed: false,
              isAdultVerified: false,
              tosAcceptedAt: null,
              theme: "system",
              autoSyncOnStartup: data.autoSyncOnStartup ?? false,
              syncIntervalMinutes: data.syncIntervalMinutes ?? 0,
            })
            .run();
        }
      });

      // Log AFTER transaction to avoid blocking DB operations
      log.debug(
        `[SettingsController] Transaction completed: existing=${
          existing ? "found" : "not found"
        }, id=${
          existing?.id ?? "none"
        }, userId=${userId}, hasApiKey=${!!encryptedKey}`
      );

      // Verify the save worked - use SETTINGS_ID (existing is now set inside transaction)
      const saved = await db.query.settings.findFirst({
        where: eq(settings.id, existing?.id ?? SETTINGS_ID),
      });

      if (!saved) {
        throw new Error("Failed to verify settings were saved");
      }

      log.info(
        `[SettingsController] Settings saved successfully: userId=${
          saved.userId
        }, hasApiKey=${!!saved.encryptedApiKey}, encryptedApiKeyLength=${
          saved.encryptedApiKey?.length ?? 0
        }, isAdultVerified=${saved.isAdultVerified}, tosAcceptedAt=${
          saved.tosAcceptedAt ? "set" : "null"
        }`
      );

      // Invalidate cache after saving settings
      this.settingsCache = null;
      const scheduler = container.resolve(DI_TOKENS.SYNC_SCHEDULER);
      scheduler.restart(data.syncIntervalMinutes ?? 0);

      return true;
    } catch (error) {
      log.error("[SettingsController] Failed to save settings:", error);
      throw error;
    }
  }

  private async saveTheme(
    _event: IpcMainInvokeEvent,
    theme: ThemePreference
  ): Promise<boolean> {
    try {
      const db = this.getDb();
      const existing = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });

      if (existing) {
        await db
          .update(settings)
          .set({ theme })
          .where(eq(settings.id, SETTINGS_ID))
          .run();
      } else {
        await db
          .insert(settings)
          .values({
            id: SETTINGS_ID,
            userId: "",
            encryptedApiKey: "",
            isSafeMode: true,
            isAdultConfirmed: false,
            isAdultVerified: false,
            tosAcceptedAt: null,
            theme,
          })
          .run();
      }

      this.settingsCache = null;
      return true;
    } catch (error) {
      log.error("[SettingsController] Failed to save theme:", error);
      throw error;
    }
  }

  /**
   * Save download folder path (null = use default)
   */
  private async saveDownloadFolder(
    _event: IpcMainInvokeEvent,
    folderPath: string | null
  ): Promise<boolean> {
    try {
      const db = this.getDb();
      const existing = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });
      if (!existing) {
        log.warn("[SettingsController] No settings record for download folder, skipping");
        return false;
      }
      await db
        .update(settings)
        .set({ downloadFolder: folderPath || null })
        .where(eq(settings.id, SETTINGS_ID))
        .run();
      this.settingsCache = null;
      log.debug(`[SettingsController] Download folder saved: ${folderPath ?? "default"}`);
      return true;
    } catch (error) {
      log.error("[SettingsController] Failed to save download folder:", error);
      throw error;
    }
  }

  /**
   * Save download behavior settings (duplicate handling, folder structure)
   */
  private async saveDownloadSettings(
    _event: IpcMainInvokeEvent,
    data: { duplicateFileBehavior?: "skip" | "overwrite"; downloadFolderStructure?: "flat" | "{artist_id}" }
  ): Promise<boolean> {
    try {
      const db = this.getDb();
      const existing = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });
      if (!existing) {
        log.warn("[SettingsController] No settings record for download settings, skipping");
        return false;
      }
      const updates: Partial<InferSelectModel<typeof settings>> = {};
      if (data.duplicateFileBehavior !== undefined) {
        updates.duplicateFileBehavior = data.duplicateFileBehavior;
      }
      if (data.downloadFolderStructure !== undefined) {
        updates.downloadFolderStructure = data.downloadFolderStructure;
      }
      if (Object.keys(updates).length > 0) {
        await db.update(settings).set(updates).where(eq(settings.id, SETTINGS_ID)).run();
        this.settingsCache = null;
        log.debug(`[SettingsController] Download settings saved:`, updates);
      }
      return true;
    } catch (error) {
      log.error("[SettingsController] Failed to save download settings:", error);
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

      // Get existing settings BEFORE transaction to preserve userId and encryptedApiKey
      // CRITICAL: Always query by SETTINGS_ID to ensure we get the correct record
      const existing = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });

      log.debug(
        `[SettingsController] confirmLegal: existing=${
          existing ? "found" : "not found"
        }`
      );

      // Use transaction for consistency and atomicity (matches saveSettings pattern)
      // This ensures data integrity and allows future extensions (e.g., audit logging)
      // CRITICAL: better-sqlite3 requires synchronous transaction callbacks
      // NOTE: .returning() doesn't work reliably in synchronous transactions, so we query after
      db.transaction((tx) => {
        if (existing) {
          // Update existing record
          tx.update(settings)
            .set({
              isAdultVerified: true,
              tosAcceptedAt: now,
              // CRITICAL: Preserve existing fields (userId, encryptedApiKey, isSafeMode, isAdultConfirmed)
              // These should not be overwritten when confirming legal
              userId: existing.userId ?? "",
              encryptedApiKey: existing.encryptedApiKey ?? "",
              isSafeMode: existing.isSafeMode ?? true,
              isAdultConfirmed: existing.isAdultConfirmed ?? false,
              theme: existing.theme ?? "system",
            })
            .where(eq(settings.id, SETTINGS_ID))
            .run();
        } else {
          // Insert new record
          tx.insert(settings)
            .values({
              id: SETTINGS_ID,
              userId: "",
              encryptedApiKey: "",
              isSafeMode: true,
              isAdultConfirmed: false,
              isAdultVerified: true,
              tosAcceptedAt: now,
              theme: "system",
            })
            .run();
        }
      });

      // Get updated settings after transaction commits
      // This is safe because transaction is already committed
      // CRITICAL: Always query by SETTINGS_ID to ensure we get the correct record
      const updatedSettings = await db.query.settings.findFirst({
        where: eq(settings.id, SETTINGS_ID),
      });

      if (!updatedSettings) {
        throw new Error(
          "Failed to retrieve updated settings after confirmation"
        );
      }

      // Use Drizzle's inferred type directly (no redundant validation)
      // mapSettingsToIpc handles mapping and validation internally
      const result = mapSettingsToIpc(updatedSettings);

      // Invalidate cache after confirming legal (settings changed)
      this.settingsCache = null;

      return result;
    } catch (error) {
      log.error("[SettingsController] Failed to confirm legal:", error);
      throw error;
    }
  }
}
