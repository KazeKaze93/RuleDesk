import log from "electron-log";
import path from "path";
import { app } from "electron";

let userDataPath = "";

try {
  if (process.type === "browser") {
    userDataPath = app.getPath("userData");
  } else {
    userDataPath = process.env.USER_DATA_PATH || process.cwd();
  }
} catch (_) {
  userDataPath = process.cwd();
}

// Disable separate main.log and renderer.log files (they're useless duplicates)
// electron-log creates these by default, but we want a single unified app.log
// This configuration applies to both main and renderer processes
if (log.transports.main) {
  log.transports.main.level = false; // Disable main.log (only contains DI init message)
}
if (log.transports.renderer) {
  log.transports.renderer.level = false; // Disable renderer.log (duplicate of app.log)
}

// Configure unified app.log for all processes (main + renderer)
// All logs from both processes will go to this single file, preserving chronological order
// 
// SAFETY: electron-log handles concurrent writes safely:
// - Renderer process logs are sent to main process via IPC (log.transports.ipc)
// - Main process writes all logs (its own + received from renderer) to file sequentially
// - This prevents race conditions and file corruption from concurrent writes
// - electron-log uses internal queue for IPC log messages, ensuring order preservation
log.transports.file.resolvePathFn = () =>
  path.join(userDataPath, "logs", "app.log");

log.transports.file.level = "info";
log.transports.console.format = "[{h}:{i}:{s}.{ms}] [{level}] {text}";

// Перехват глобальных ошибок
log.errorHandler.startCatching();

export const logger = log;
