import { createRedactionContext, redactString } from "@shared/utils/log-redaction";
import type { AppInfo } from "@shared/schemas/system";

/**
 * Re-redacts a log tail at read time (historical lines may predate electron-log hooks).
 */
export function redactDiagnosticsLogTail(rawTail: string, homeDir: string): string {
  return redactString(rawTail, createRedactionContext(homeDir));
}

export function redactDiagnosticsPath(filePath: string, homeDir: string): string {
  return redactString(filePath, createRedactionContext(homeDir));
}

/**
 * Builds the clipboard / bug-report diagnostic block in Main (never in renderer).
 */
export function formatDiagnosticsClipboardText(options: {
  appInfo: AppInfo;
  logPath: string;
  logTail: string;
}): string {
  const { appInfo, logPath, logTail } = options;
  const lines = [
    "RuleDesk diagnostics",
    `App: ${appInfo.appVersion}`,
    `Electron: ${appInfo.electronVersion}`,
    `Chromium: ${appInfo.chromeVersion}`,
    `Node: ${appInfo.nodeVersion}`,
    `OS: ${appInfo.osPlatform} ${appInfo.osRelease} (${appInfo.osArch})`,
    `Log: ${logPath}`,
    "",
    "--- log tail (redacted) ---",
    logTail.length > 0 ? logTail : "(empty)",
  ];
  return lines.join("\n");
}

/**
 * When the byte window starts mid-file, leading bytes may be UTF-8 continuation
 * bytes (10xxxxxx). Skip them so decoding does not invent replacement garbage.
 */
export function skipLeadingUtf8Continuation(buffer: Buffer): Buffer {
  let index = 0;
  while (index < buffer.length && (buffer[index] & 0xc0) === 0x80) {
    index += 1;
  }
  return buffer.subarray(index);
}

/**
 * Drops a partial first line when the read window did not start at byte 0.
 * If there is no newline, the whole window is treated as a partial line and
 * discarded (may contain a sliced secret or path fragment).
 */
export function trimPartialFirstLine(text: string, startedMidFile: boolean): string {
  if (!startedMidFile) {
    return text;
  }
  const newlineIndex = text.indexOf("\n");
  if (newlineIndex === -1) {
    return "";
  }
  return text.slice(newlineIndex + 1);
}

/**
 * Decode a raw tail buffer read from disk.
 * `startedMidFile` must be true when the read offset was > 0.
 */
export function decodeLogTailBuffer(
  buffer: Buffer,
  startedMidFile: boolean
): string {
  const slice = startedMidFile
    ? skipLeadingUtf8Continuation(buffer)
    : buffer;
  const text = slice.toString("utf8");
  return trimPartialFirstLine(text, startedMidFile);
}

/**
 * Drop whole lines from the start of `logTail` until header + tail fit under
 * `maxChars` (GitHub issue body limit).
 */
export function fitDiagnosticsToMaxChars(options: {
  appInfo: AppInfo;
  logPath: string;
  logTail: string;
  maxChars: number;
}): { logTail: string; clipboardText: string } {
  let fittedTail = options.logTail;
  let clipboardText = formatDiagnosticsClipboardText({
    appInfo: options.appInfo,
    logPath: options.logPath,
    logTail: fittedTail,
  });

  while (clipboardText.length > options.maxChars && fittedTail.length > 0) {
    const newlineIndex = fittedTail.indexOf("\n");
    if (newlineIndex === -1) {
      fittedTail = "";
    } else {
      fittedTail = fittedTail.slice(newlineIndex + 1);
    }
    clipboardText = formatDiagnosticsClipboardText({
      appInfo: options.appInfo,
      logPath: options.logPath,
      logTail: fittedTail,
    });
  }

  if (clipboardText.length > options.maxChars) {
    clipboardText = clipboardText.slice(0, options.maxChars);
  }

  return { logTail: fittedTail, clipboardText };
}
