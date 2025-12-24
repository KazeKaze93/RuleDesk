import { ipcMain, safeStorage } from "electron";
import { eq } from "drizzle-orm";
import { IPC_CHANNELS } from "../channels";
import { getDb } from "../../db/client";
import { settings } from "../../db/schema";
import { z } from "zod";
import { logger } from "../../lib/logger";

const SettingsPayloadSchema = z.object({
  userId: z.string().optional(),
  apiKey: z.string().optional(),
  isSafeMode: z.boolean().optional(),
  isAdultConfirmed: z.boolean().optional(),
});

interface SettingsResponse {
  userId: string;
  hasApiKey: boolean;
  isSafeMode: boolean;
  isAdultConfirmed: boolean;
}

export const registerSettingsHandlers = () => {
  // GET Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS.GET, async () => {
    try {
      const db = getDb();
      const result = await db.query.settings.findFirst({
        where: eq(settings.id, 1),
      });

      if (!result) {
        // Return default settings if none exist
        return {
          userId: "",
          hasApiKey: false,
          isSafeMode: true,
          isAdultConfirmed: false,
        } as SettingsResponse;
      }

      return {
        userId: result.userId || "",
        hasApiKey: !!result.encryptedApiKey,
        isSafeMode: result.isSafeMode ?? true,
        isAdultConfirmed: result.isAdultConfirmed ?? false,
      } as SettingsResponse;
    } catch (error) {
      logger.error("IPC: Error fetching settings:", error);
      // Return defaults on error
      return {
        userId: "",
        hasApiKey: false,
        isSafeMode: true,
        isAdultConfirmed: false,
      } as SettingsResponse;
    }
  });

  // SAVE Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS.SAVE, async (_, payload: unknown) => {
    const validation = SettingsPayloadSchema.safeParse(payload);

    if (!validation.success) {
      logger.error("Settings validation failed:", validation.error.issues);
      return false;
    }

    const { userId, apiKey, isSafeMode, isAdultConfirmed } = validation.data;

    let encryptedApiKey: string | undefined;

    if (apiKey) {
      if (!safeStorage.isEncryptionAvailable()) {
        logger.error("safeStorage is not available.");
        return false;
      }
      try {
        encryptedApiKey = safeStorage.encryptString(apiKey).toString("base64");
      } catch (e) {
        logger.error("Encryption failed:", e);
        return false;
      }
    }

    try {
      const db = getDb();
      
      const updateData: Partial<typeof settings.$inferInsert> = {};
      if (userId !== undefined) updateData.userId = userId;
      if (encryptedApiKey !== undefined) updateData.encryptedApiKey = encryptedApiKey;
      if (isSafeMode !== undefined) updateData.isSafeMode = isSafeMode;
      if (isAdultConfirmed !== undefined) updateData.isAdultConfirmed = isAdultConfirmed;

      // Upsert: Insert default values if not exists, or update provided fields if exists
      await db
        .insert(settings)
        .values({
          id: 1,
          userId: userId ?? "",
          encryptedApiKey: encryptedApiKey ?? "",
          isSafeMode: isSafeMode ?? true,
          isAdultConfirmed: isAdultConfirmed ?? false,
        })
        .onConflictDoUpdate({
          target: settings.id,
          set: updateData,
        });

      logger.info("IPC: Settings saved.");
      return true;
    } catch (e) {
      logger.error("IPC: Error saving settings:", e);
      return false;
    }
  });
};
