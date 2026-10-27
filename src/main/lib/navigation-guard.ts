import type { WebContents } from "electron";
import { logger } from "./logger";

/**
 * Marker used when the renderer is loaded via loadFile (production / packaged).
 * Node's URL API reports file: origins as the string "null", so we key off protocol.
 */
export const FILE_PROTOCOL_ORIGIN = "file://";

const WINDOW_OPEN_DENY = { action: "deny" } as const;

/**
 * Allowed navigation origin for the renderer webContents.
 * Mirrors loadRendererUrl: ELECTRON_RENDERER_URL in electron-vite dev, else file://.
 */
export function resolveAllowedRendererOrigin(
  electronRendererUrl: string | undefined = process.env["ELECTRON_RENDERER_URL"]
): string {
  if (electronRendererUrl !== undefined && electronRendererUrl.length > 0) {
    return new URL(electronRendererUrl).origin;
  }
  return FILE_PROTOCOL_ORIGIN;
}

/**
 * Host (or protocol name for file:) for logs — never includes path or query.
 */
export function hostForNavigationLog(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    if (parsed.host.length > 0) {
      return parsed.host;
    }
    return parsed.protocol.replace(/:$/, "");
  } catch {
    return "unparseable";
  }
}

export function isAllowedRendererNavigation(
  urlString: string,
  allowedOrigin: string
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }

  if (allowedOrigin === FILE_PROTOCOL_ORIGIN) {
    return parsed.protocol === "file:";
  }

  return parsed.origin === allowedOrigin;
}

/**
 * Deny window.open / target=_blank popups and block in-page navigations
 * off the app origin. Does not call shell.openExternal — external links
 * stay on the IPC openExternal path only.
 */
export function attachWebContentsNavigationGuards(
  contents: WebContents,
  allowedOrigin: string
): void {
  contents.setWindowOpenHandler(({ url }) => {
    logger.warn(
      `[Navigation] Denied window.open (host=${hostForNavigationLog(url)})`
    );
    return WINDOW_OPEN_DENY;
  });

  contents.on("will-navigate", (event, url) => {
    if (isAllowedRendererNavigation(url, allowedOrigin)) {
      return;
    }
    event.preventDefault();
    logger.warn(
      `[Navigation] Denied will-navigate (host=${hostForNavigationLog(url)})`
    );
  });
}
