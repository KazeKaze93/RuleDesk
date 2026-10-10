import log from "electron-log/renderer";
import { redactLogData } from "@shared/utils/log-redaction";

/**
 * Attach redaction hook once for renderer console + IPC transports.
 * Home path is unavailable in the sandboxed renderer; OS user-path patterns
 * still apply. Main-process hooks also re-run on IPC-received messages for app.log.
 */
export function setupRendererLogRedaction(): void {
  const alreadyAttached = log.hooks.some(
    (hook) => hook.name === "ruleDeskLogRedaction"
  );
  if (alreadyAttached) {
    return;
  }

  function ruleDeskLogRedaction(
    message: Parameters<(typeof log.hooks)[number]>[0]
  ): typeof message {
    return {
      ...message,
      data: redactLogData(message.data),
    };
  }

  log.hooks.push(ruleDeskLogRedaction);
}
