import { ipcMain, app, shell } from "electron";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import { URL } from "url";
import { logger } from "../../lib/logger";
import { IPC_CHANNELS } from "../channels";

export const registerViewerHandlers = () => {
  // Download
  ipcMain.handle(
    IPC_CHANNELS.APP.DOWNLOAD_FILE,
    async (_, { url, filename }) => {
      try {
        const downloadPath = path.join(
          app.getPath("downloads"),
          "BooruClient",
          filename
        );
        const dir = path.dirname(downloadPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const response = await axios({
          url,
          method: "GET",
          responseType: "stream",
        });
        const writer = fs.createWriteStream(downloadPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on("finish", () =>
            resolve({ success: true, path: downloadPath })
          );
          writer.on("error", (e) =>
            reject({ success: false, error: e.message })
          );
        });
      } catch (e) {
        logger.error("Download failed", e);
        return { success: false, error: String(e) };
      }
    }
  );

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
