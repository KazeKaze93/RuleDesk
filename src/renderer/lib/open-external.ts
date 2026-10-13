import log from "electron-log/renderer";
import { toast } from "sonner";

const OPEN_EXTERNAL_ERROR_TOAST = "Couldn't open link";

/**
 * Strips query string (and hash) before logging so credentials in URLs stay out of logs.
 */
function urlForLog(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    const queryIndex = url.indexOf("?");
    const hashIndex = url.indexOf("#");
    let end = url.length;
    if (queryIndex !== -1) {
      end = Math.min(end, queryIndex);
    }
    if (hashIndex !== -1) {
      end = Math.min(end, hashIndex);
    }
    return url.slice(0, end);
  }
}

/**
 * Opens a URL via the Main-process allowlisted bridge. Surfaces failures to the user.
 */
export async function openExternalSafe(url: string): Promise<void> {
  try {
    await window.api.openExternal(url);
  } catch (error: unknown) {
    log.warn(
      `[openExternalSafe] Failed to open external URL (${urlForLog(url)}):`,
      error
    );
    toast.error(OPEN_EXTERNAL_ERROR_TOAST);
  }
}
