import { type IpcMainInvokeEvent } from "electron";
import path from "node:path";
import log from "electron-log";
import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { BaseController } from "../../core/ipc/BaseController";
import { container, DI_TOKENS } from "../../core/di/Container";
import { settings, SETTINGS_ID } from "../../db/schema";
import { encrypt } from "../../lib/crypto";
import { reloadProxyFromSettings } from "../../lib/proxy";
import { IPC_CHANNELS } from "../channels";
import {
  DEFAULT_IPC_SETTINGS,
  SaveSettingsSchema,
  ThemePreferenceSchema,
  type IpcSettings,
  type SaveSettings,
  type ThemePreference,
} from "../../../shared/schemas/settings";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { z } from "zod";
import { PROVIDER_IDS } from "../../../shared/constants";
import { normalizeCredentialsInput } from "../../../shared/utils/parse-credentials";
import { getDecryptedCredentialsFromRecord, hasConfiguredApiKey } from "../../utils/decrypted-credentials";

type AppDatabase = BetterSQLite3Database<typeof schema>;

const SaveDownloadFolderArgSchema = z.union([
  z.null(),
  z
    .string()
    .min(1)
    .max(4096)
    .refine((p) => path.isAbsolute(p), {
      message: "Download folder must be an absolute path",
    })
    .refine((p) => !p.includes("\0"), { message: "Invalid path" }),
]);
const SaveSettingsArgsSchema = z.tuple([SaveSettingsSchema]);
const SaveThemeArgsSchema = z.tuple([ThemePreferenceSchema]);
const SaveDownloadFolderArgsSchema = z.tuple([SaveDownloadFolderArgSchema]);
const SaveDownloadSettingsPayloadSchema = z.object({
  duplicateFileBehavior: z.enum(["skip", "overwrite"]).optional(),
  downloadFolderStructure: z.enum(["flat", "{artist_id}"]).optional(),
});
const SaveDownloadSettingsArgsSchema = z.tuple([SaveDownloadSettingsPayloadSchema]);

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
  dbSettings: InferSelectModel<typeof settings>,
  hasSettingsRecord: boolean
): IpcSettings {
  // Map database representation to IPC format
  // TypeScript ensures type safety - no runtime validation needed
  const credentials = getDecryptedCredentialsFromRecord({
    userId: dbSettings.userId,
    encryptedApiKey: dbSettings.encryptedApiKey,
  });

  return {
    hasSettingsRecord,
    userId: dbSettings.userId ?? "",
    provider: z.enum(PROVIDER_IDS).safeParse(dbSettings.provider).data ?? "rule34",
    // True when a key is stored; decrypt must succeed for API calls, not for gate dismissal.
    hasApiKey: hasConfiguredApiKey({
      encryptedApiKey: dbSettings.encryptedApiKey,
      credentials,
    }),
    proxyUrl: dbSettings.proxyUrl ?? null,
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
      z.enum(["skip", "overwrite"]).safeParse(dbSettings.duplicateFileBehavior).data ?? "skip",
    downloadFolderStructure:
      z.enum(["flat", "{artist_id}"]).safeParse(dbSettings.downloadFolderStructure).data ?? "flat",
    theme: ThemePreferenceSchema.safeParse(dbSettings.theme).data ?? "system",
    autoSyncOnStartup: !!dbSettings.autoSyncOnStartup,
    syncIntervalMinutes: dbSettings.syncIntervalMinutes ?? 0,
    backupRetention: dbSettings.backupRetention ?? 5,
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
  // Query style: Drizzle Builder API only in this controller.
  private getDb(): AppDatabase {
    return container.resolve(DI_TOKENS.DB);
  }


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
      SaveSettingsArgsSchema, // Validates: userId is numeric string (1-20 chars), apiKey is 10-200 chars, no whitespace
      (event, ...args) => {
        const [payload] = SaveSettingsArgsSchema.parse(args);
        return this.saveSettings(event, payload);
      }
    );
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE_THEME,
      SaveThemeArgsSchema,
      (event, ...args) => {
        const [theme] = SaveThemeArgsSchema.parse(args);
        return this.saveTheme(event, theme);
      }
    );
    // settings:confirm-legal - confirms Age Gate & ToS acceptance
    this.handle(
      IPC_CHANNELS.SETTINGS.CONFIRM_LEGAL,
      z.tuple([]),
      this.confirmLegal.bind(this)
    );
    this.handle(
      IPC_CHANNELS.SETTINGS.RESET_ONBOARDING,
      z.tuple([]),
      this.resetOnboarding.bind(this)
    );
    // settings:save-download-folder - saves custom download folder path
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_FOLDER,
      SaveDownloadFolderArgsSchema,
      (event, ...args) => {
        const [folderPath] = SaveDownloadFolderArgsSchema.parse(args);
        return this.saveDownloadFolder(event, folderPath);
      }
    );
    // settings:save-download-settings - saves duplicate/folder structure
    this.handle(
      IPC_CHANNELS.SETTINGS.SAVE_DOWNLOAD_SETTINGS,
      SaveDownloadSettingsArgsSchema,
      (event, ...args) => {
        const [payload] = SaveDownloadSettingsArgsSchema.parse(args);
        return this.saveDownloadSettings(event, payload);
      }
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
    try {
      const db = this.getDb();
      // CRITICAL: Always query by SETTINGS_ID to ensure we get the correct record
      const currentSettings = db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];

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
        result = mapSettingsToIpc(currentSettings, true);
      }

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
    const normalized = normalizeCredentialsInput({
      userId: data.userId,
      apiKey: data.apiKey,
    });
    const userId = normalized.userId;
    const apiKey = normalized.apiKey;
    const { provider } = data;

    if (apiKey && !userId) {
      throw new Error(
        "User ID is required. Paste credentials as api_key=...&user_id=... or enter User ID separately."
      );
    }

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
          const finalProvider =
            provider !== undefined && PROVIDER_IDS.includes(provider)
              ? provider
              : (z.enum(PROVIDER_IDS).safeParse(existing.provider).data ?? "rule34");
          // CRITICAL: Use existing.id instead of SETTINGS_ID to ensure we update the correct record
          const targetId = existing.id;

          // Execute update using Drizzle update - should work in transaction
          // Using explicit .set() for all fields to ensure they are updated
          const finalAutoSyncOnStartup =
            data.autoSyncOnStartup ?? existing.autoSyncOnStartup ?? false;
          const finalSyncIntervalMinutes =
            data.syncIntervalMinutes ?? existing.syncIntervalMinutes ?? 0;
          const finalBackupRetention =
            data.backupRetention ?? existing.backupRetention ?? 5;

          tx.update(settings)
            .set({
              userId: finalUserId,
              provider: finalProvider,
              encryptedApiKey: finalEncryptedKey,
              proxyUrl: data.proxyUrl ?? null,
              // CRITICAL: Preserve isAdultVerified and tosAcceptedAt when saving auth data
              // These fields should only be updated by confirmLegal, not by saveSettings
              isAdultVerified: existing.isAdultVerified ?? false,
              tosAcceptedAt: existing.tosAcceptedAt ?? null,
              theme: existing.theme ?? "system",
              autoSyncOnStartup: finalAutoSyncOnStartup,
              syncIntervalMinutes: finalSyncIntervalMinutes,
              backupRetention: finalBackupRetention,
            })
            .where(eq(settings.id, targetId))
            .run();
        } else {
          // Insert new record
          tx.insert(settings)
            .values({
              id: SETTINGS_ID,
              userId: userId ?? "",
              provider: provider ?? "rule34",
              encryptedApiKey: encryptedKey ?? "",
              proxyUrl: data.proxyUrl ?? null,
              isSafeMode: true,
              isAdultConfirmed: false,
              isAdultVerified: false,
              tosAcceptedAt: null,
              theme: "system",
              autoSyncOnStartup: data.autoSyncOnStartup ?? false,
              syncIntervalMinutes: data.syncIntervalMinutes ?? 0,
              backupRetention: data.backupRetention ?? 5,
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
      const saved = db
        .select()
        .from(settings)
        .where(eq(settings.id, existing?.id ?? SETTINGS_ID))
        .limit(1)
        .all()[0];

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

      const scheduler = container.resolve(DI_TOKENS.SYNC_SCHEDULER);
      scheduler.restart(saved.syncIntervalMinutes ?? 0);
      reloadProxyFromSettings();

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
      const existing = db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];

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
      const existing = db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];
      if (!existing) {
        log.warn("[SettingsController] No settings record for download folder, skipping");
        return false;
      }
      await db
        .update(settings)
        .set({ downloadFolder: folderPath || null })
        .where(eq(settings.id, SETTINGS_ID))
        .run();
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
      const existing = db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];
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
      const existing = db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];

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
              provider: existing.provider ?? "rule34",
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
              provider: "rule34",
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
      const updatedSettings = db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1)
        .all()[0];

      if (!updatedSettings) {
        throw new Error(
          "Failed to retrieve updated settings after confirmation"
        );
      }

      // Use Drizzle's inferred type directly (no redundant validation)
      // mapSettingsToIpc handles mapping and validation internally
      const result = mapSettingsToIpc(updatedSettings, true);

      return result;
    } catch (error) {
      log.error("[SettingsController] Failed to confirm legal:", error);
      throw error;
    }
  }

  private async resetOnboarding(_event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      const db = this.getDb();
      db.delete(settings).where(eq(settings.id, SETTINGS_ID)).run();
      return true;
    } catch (error) {
      log.error("[SettingsController] Failed to reset onboarding:", error);
      throw error;
    }
  }
}
