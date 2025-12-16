import { ipcMain, shell } from "electron";
import { URL } from "url";
import { logger } from "../../lib/logger";
import { IPC_CHANNELS } from "../channels";

export const registerViewerHandlers = () => {
  // Open External
  ipcMain.handle(
    IPC_CHANNELS.APP.OPEN_EXTERNAL,
    async (_, urlString: string) => {
      try {
        const parsedUrl = new URL(urlString);
        if (
          parsedUrl.protocol === "https:" &&
          (parsedUrl.hostname === "rule34.xxx" ||
            parsedUrl.hostname === "www.rule34.xxx")
        ) {
          await shell.openExternal(urlString);
        } else {
          logger.warn(`IPC: Blocked unauthorized URL: ${urlString}`);
        }
      } catch (error) {
        logger.error(`IPC: Invalid URL passed to open-external`, error);
      }
    }
  );
};
