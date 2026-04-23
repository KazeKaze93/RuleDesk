import { ipcMain } from "electron";
import log from "electron-log";
import { getSqliteInstance } from "../../db/client";

const GET_UNREAD_COUNT_CHANNEL = "updates:getUnreadCount";
const MARK_ALL_SEEN_CHANNEL = "updates:markAllSeen";

type CountRow = {
  count: number;
};

export function registerUpdatesHandlers(): void {
  ipcMain.handle(GET_UNREAD_COUNT_CHANNEL, () => {
    try {
      const sqlite = getSqliteInstance();
      const statement = sqlite.prepare<[], CountRow>(
        "SELECT COUNT(*) AS count FROM posts WHERE is_viewed = 0"
      );
      const row = statement.get();
      return row?.count ?? 0;
    } catch (error) {
      log.error("[UpdatesHandlers] Failed to get unread count:", error);
      return 0;
    }
  });

  ipcMain.handle(MARK_ALL_SEEN_CHANNEL, () => {
    try {
      const sqlite = getSqliteInstance();
      sqlite.prepare("UPDATE posts SET is_viewed = 1").run();
      return true;
    } catch (error) {
      log.error("[UpdatesHandlers] Failed to mark all seen:", error);
      return false;
    }
  });

  log.info("[UpdatesHandlers] All handlers registered");
}
