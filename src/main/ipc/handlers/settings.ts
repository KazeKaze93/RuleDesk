// Cursor: select file:src/main/ipc/handlers/settings.ts
import { ipcMain, safeStorage } from "electron";
import { DbWorkerClient } from "../../db/db-worker-client";
import { IPC_CHANNELS } from "../channels";
import { z } from "zod";
import { logger } from "../../lib/logger";

const SettingsPayloadSchema = z.object({
  userId: z.string(),
  apiKey: z.string(), // Это сырой ключ из Frontend
});

// Новый интерфейс для ответа воркера (Main Process не дешифрует)
interface SettingsResponse {
  userId: string;
  hasApiKey: boolean;
}

export const registerSettingsHandlers = (db: DbWorkerClient) => {
  // GET Settings (для App.tsx - проверка, авторизован ли пользователь)
  ipcMain.handle(IPC_CHANNELS.SETTINGS.GET, async () => {
    // Воркер возвращает userId и булево hasApiKey
    return db.call<SettingsResponse>("getSettingsStatus");
  });

  // SAVE Settings (принимает сырой ключ, шифрует его и отправляет в воркер)
  ipcMain.handle(IPC_CHANNELS.SETTINGS.SAVE, async (_, creds: unknown) => {
    const validation = SettingsPayloadSchema.safeParse(creds);

    if (!validation.success) {
      logger.error("Settings validation failed:", validation.error.issues);
      return false;
    }

    const { userId, apiKey } = validation.data;

    // 🔥 FIX 1: Проверка доступности safeStorage
    if (!safeStorage.isEncryptionAvailable()) {
      logger.error(
        "safeStorage is not available. Cannot securely store API key."
      );
      return false;
    }

    try {
      // 🔥 FIX 1: Шифруем сырой ключ в Main Process
      const encryptedApiKey = safeStorage
        .encryptString(apiKey)
        .toString("base64");

      // Отправляем в воркер уже зашифрованный ключ
      const result = await db.call("saveSettings", {
        userId,
        encryptedApiKey: encryptedApiKey,
      });

      logger.info("IPC: Settings saved and encrypted.");
      return result;
    } catch (e) {
      logger.error("IPC: Error saving settings:", e);
      return false;
    }
  });
};

// Чтобы функция logout из index.ts не дублировалась, предполагаем, что она регистрируется в index.ts
