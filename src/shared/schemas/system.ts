import { z } from "zod";

export const AppInfoSchema = z.object({
  appVersion: z.string().min(1),
  electronVersion: z.string().min(1),
  chromeVersion: z.string().min(1),
  nodeVersion: z.string().min(1),
  osPlatform: z.string().min(1),
  osRelease: z.string().min(1),
  osArch: z.string().min(1),
});

export const DiagnosticsSchema = z.object({
  appInfo: AppInfoSchema,
  /** Absolute log file path after path redaction (safe to show / copy). */
  logPath: z.string().min(1),
  /** Tail of app.log after credential/path redaction. */
  logTail: z.string(),
  /** Ready-to-paste diagnostic block for bug reports. */
  clipboardText: z.string().min(1),
});

/** Result of opening the logs folder via `shell.openPath` (error is a string, not thrown). */
export const OpenLogsFolderResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    error: z.string().min(1),
  }),
]);

export type AppInfo = z.infer<typeof AppInfoSchema>;
export type Diagnostics = z.infer<typeof DiagnosticsSchema>;
export type OpenLogsFolderResult = z.infer<typeof OpenLogsFolderResultSchema>;
