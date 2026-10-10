/**
 * Vitest runs in Node without bootstrap-user-data / logger path config.
 * Bare `electron-log` would otherwise write to
 * `%APPDATA%\\RuleDesk\\logs\\main.log` (default processType fileName).
 * Disable file transport so unit/integration tests never create a second log tree.
 */
import log from "electron-log";

if (log.transports.file) {
  log.transports.file.level = false;
}
