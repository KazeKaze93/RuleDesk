import { ipcMain, shell } from "electron";
import { URL } from "url";
import { logger } from "../../lib/logger";
import { IPC_CHANNELS } from "../channels";

export const registerViewerHandlers = () => {
  ipcMain.handle(
    IPC_CHANNELS.APP.OPEN_EXTERNAL,
    async (_, urlString: string) => {
      try {
        const parsedUrl = new URL(urlString);
        const isSafeProtocol = parsedUrl.protocol === 'https:';

        if (isSafeProtocol) {
          await shell.openExternal(urlString);
        } else {
          logger.warn(`IPC: Blocked unsafe protocol: ${urlString}`);
        }
      } catch (error) {
        logger.error(`IPC: Invalid URL passed to open-external`, error);
      }
    }
  );
};
