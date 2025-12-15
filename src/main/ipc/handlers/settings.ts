import { ipcMain, app } from "electron";
import { IPC_CHANNELS } from "../channels";
import { DbWorkerClient } from "../../db/db-worker-client";
import { SecureStorage } from "../../services/secure-storage";

export const registerSettingsHandlers = (db: DbWorkerClient) => {
  // Settings: Version
  ipcMain.handle(IPC_CHANNELS.APP.GET_VERSION, () => app.getVersion());

  // Settings: Get
  ipcMain.handle(IPC_CHANNELS.SETTINGS.GET, async () => {
    const s = await db.call<{ userId: string; apiKey: string }>(
      "getApiKeyDecrypted"
    );
    return {
      userId: s?.userId || "",
      apiKey: s?.apiKey ? SecureStorage.decrypt(s.apiKey) : "",
    };
  });

  // Settings: Save
  ipcMain.handle(IPC_CHANNELS.SETTINGS.SAVE, async (_, { userId, apiKey }) => {
    const encrypted = apiKey ? SecureStorage.encrypt(apiKey) : "";
    await db.call("saveSettings", { userId, apiKey: encrypted });
    return { success: true };
  });

  // 🗑️ УДАЛЕНО: Sync, Repair, Backup (теперь они в index.ts)
};
