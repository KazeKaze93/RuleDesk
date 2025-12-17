import { ipcMain, safeStorage } from "electron";
import { DbWorkerClient } from "../../db/db-worker-client";
import { IPC_CHANNELS } from "../channels";
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

export const registerSettingsHandlers = (db: DbWorkerClient) => {
  // GET Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS.GET, async () => {
    return db.call<SettingsResponse>("getSettingsStatus");
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
      const result = await db.call("saveSettings", {
        userId,
        encryptedApiKey,
        isSafeMode,
        isAdultConfirmed,
      });

      logger.info("IPC: Settings saved.");
      return result;
    } catch (e) {
      logger.error("IPC: Error saving settings:", e);
      return false;
    }
  });
};
