import { ipcMain, shell } from "electron";
import { URL } from "url";
import { logger } from "../../lib/logger";
import { IPC_CHANNELS } from "../channels";

const ALLOWED_HOSTS = new Set([
  "rule34.xxx",
  "www.rule34.xxx",
]);

export const registerViewerHandlers = () => {
  ipcMain.handle(
    IPC_CHANNELS.APP.OPEN_EXTERNAL,
    async (_, urlString: string) => {
      try {
        const parsedUrl = new URL(urlString);

        // Verify protocol is HTTPS
        if (parsedUrl.protocol !== "https:") {
          logger.warn(`IPC: Blocked unsafe protocol: ${urlString}`);
          return;
        }

        // Verify hostname is in whitelist
        if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
          logger.warn(`IPC: Blocked request to unauthorized hostname: ${parsedUrl.hostname} (URL: ${urlString})`);
          return;
        }

        await shell.openExternal(urlString);
      } catch (error) {
        logger.error(`IPC: Invalid URL passed to open-external`, error);
      }
    }
  );
};
