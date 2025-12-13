import log from "electron-log";
import path from "path";
import { app } from "electron";

// Настройка путей и формата
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath("userData"), "logs/app.log");
log.transports.file.level = "info";
log.transports.console.format = "[{h}:{i}:{s}.{ms}] [{level}] {text}";

// Перехват глобальных ошибок
log.errorHandler.startCatching();

export const logger = log;
