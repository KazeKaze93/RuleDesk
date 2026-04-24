import { ipcMain } from "electron";
import log from "electron-log";
import { count, eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { maintenanceQueue } from "../../db/maintenance-queue";
import { posts } from "../../db/schema";
import { IPC_CHANNELS } from "../channels";

export function registerUpdatesHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.UPDATES.GET_UNREAD_COUNT, () => {
    return maintenanceQueue.execute(async () => {
      try {
        const row = getDb()
          .select({ value: count() })
          .from(posts)
          .where(eq(posts.isViewed, false))
          .get();
        return row?.value ?? 0;
      } catch (error) {
        log.error("[UpdatesHandlers] Failed to get unread count:", error);
        return 0;
      }
    });
  });

  ipcMain.handle(IPC_CHANNELS.UPDATES.MARK_ALL_SEEN, () => {
    return maintenanceQueue.execute(async () => {
      try {
        getDb().update(posts).set({ isViewed: true }).run();
        return true;
      } catch (error) {
        log.error("[UpdatesHandlers] Failed to mark all seen:", error);
        return false;
      }
    });
  });

  log.info("[UpdatesHandlers] All handlers registered");
}
