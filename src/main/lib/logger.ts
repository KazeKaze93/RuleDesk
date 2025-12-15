import log from "electron-log";
import path from "path";

let userDataPath = "";

try {
  if (process.type === "browser") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require("electron");
    userDataPath = app.getPath("userData");
  } else {
    userDataPath = process.env.USER_DATA_PATH || process.cwd();
  }
} catch (_) {
  userDataPath = process.cwd();
}

// Настройка путей и формата
log.transports.file.resolvePathFn = () =>
  path.join(userDataPath, "logs", "app.log");

log.transports.file.level = "info";
log.transports.console.format = "[{h}:{i}:{s}.{ms}] [{level}] {text}";

// Перехват глобальных ошибок
log.errorHandler.startCatching();

export const logger = log;
