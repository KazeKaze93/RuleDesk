import { ipcMain } from "electron";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { IPC_CHANNELS } from "../channels";
import { getDb } from "../../db/client";
import { settings, type Settings } from "../../db/schema";
import { encrypt } from "../../lib/crypto";
import { logger } from "../../lib/logger";

// Schema for validation
const settingsSchema = z.object({
  userId: z.string().optional(),
  apiKey: z.string().optional(),
  isSafeMode: z.boolean().optional(),
  isAdultConfirmed: z.boolean().optional(),
});

export function registerSettingsHandlers() {
  // --- GET SETTINGS ---
  ipcMain.handle(IPC_CHANNELS.SETTINGS.GET, async () => {
    try {
      const db = getDb();
      // FIX: Use findFirst to get ANY existing settings, regardless of ID
      const currentSettings = await db.query.settings.findFirst();

      if (!currentSettings) {
        // Return default values if no settings found (triggers Onboarding)
        return {
          id: 1,
          userId: "",
          encryptedApiKey: "",
          isSafeMode: true,
          isAdultConfirmed: false,
        } satisfies Settings;
      }

      return currentSettings;
    } catch (error) {
      logger.error("IPC: Failed to get settings", error);
      throw error;
    }
  });

  // --- SAVE SETTINGS ---
  ipcMain.handle(IPC_CHANNELS.SETTINGS.SAVE, async (_, params) => {
    try {
      // Validate input
      const validation = settingsSchema.safeParse(params);
      if (!validation.success) {
        logger.error("IPC: Invalid settings data", validation.error);
        throw new Error("Invalid settings data");
      }

      const { userId, apiKey, isSafeMode, isAdultConfirmed } = validation.data;
      const db = getDb();

      // FIX: Handle Encryption
      // If a new 'apiKey' comes from frontend, encrypt it.
      // If not provided, we keep the old encrypted one.
      let encryptedKey: string | undefined;
      if (apiKey) {
        try {
          encryptedKey = encrypt(apiKey);
        } catch (e) {
          logger.error("IPC: Failed to encrypt API key", e);
          throw new Error("Failed to encrypt API key. Encryption is not available on this system.");
        }
      }

      // 1. Find existing settings to get the correct ID (don't assume ID=1)
      const existing = await db.query.settings.findFirst();
      const targetId = existing?.id ?? 1;

      // 2. Prepare update object for onConflictDoUpdate
      const updateData: Partial<typeof settings.$inferInsert> = {};
      if (userId !== undefined) updateData.userId = userId;
      if (encryptedKey !== undefined) updateData.encryptedApiKey = encryptedKey;
      if (isSafeMode !== undefined) updateData.isSafeMode = isSafeMode;
      if (isAdultConfirmed !== undefined) updateData.isAdultConfirmed = isAdultConfirmed;

      // 3. Upsert
      await db
        .insert(settings)
        .values({
          id: targetId,
          userId: userId ?? "",
          encryptedApiKey: encryptedKey ?? (existing?.encryptedApiKey ?? ""),
          isSafeMode: isSafeMode ?? true,
          isAdultConfirmed: isAdultConfirmed ?? false,
        })
        .onConflictDoUpdate({
          target: settings.id,
          set: updateData,
        });

      logger.info("IPC: Settings saved successfully.");
      return true;

    } catch (error) {
      logger.error("IPC: Failed to save settings", error);
      throw error;
    }
  });
}
