import log from "electron-log";
import os from "os";
import path from "path";
import { app } from "electron";
import { redactLogData } from "@shared/utils/log-redaction";

/**
 * Single log file for the app.
 *
 * electron-log v5 only exposes `console` / `file` / `ipc` / `remote` (no
 * `transports.main` / `transports.renderer`). The file transport defaults to
 * `{processType}.log` under Electron's product userData
 * (`%APPDATA%\\RuleDesk\\logs\\main.log`). After bootstrap redirects userData
 * to `RuleDesk-Data`, we force `logs/app.log` there so Help → Open logs folder
 * and runtime writes share one path. Redaction hooks attach below.
 */
log.transports.file.fileName = "app.log";
log.transports.file.resolvePathFn = () => {
  const userDataDir =
    process.type === "browser"
      ? app.getPath("userData")
      : process.env.USER_DATA_PATH || process.cwd();
  return path.join(userDataDir, "logs", "app.log");
};

log.transports.file.level = "info";
log.transports.console.format = "[{h}:{i}:{s}.{ms}] [{level}] {text}";

const homeDir = (() => {
  try {
    return app.getPath("home");
  } catch {
    return os.homedir();
  }
})();

// Test mocks often stub electron-log without `hooks`; real runtime always has the array.
if (Array.isArray(log.hooks)) {
  const redactionAlreadyAttached = log.hooks.some(
    (hook) => hook.name === "ruleDeskLogRedaction"
  );
  if (!redactionAlreadyAttached) {
    function ruleDeskLogRedaction(
      message: Parameters<(typeof log.hooks)[number]>[0]
    ): typeof message {
      return {
        ...message,
        data: redactLogData(message.data, homeDir),
      };
    }
    log.hooks.push(ruleDeskLogRedaction);
  }
}

// Перехват глобальных ошибок
log.errorHandler.startCatching();

export const logger = log;
