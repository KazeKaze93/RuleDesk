import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WebContents } from "electron";
import { logger } from "./logger";

const WINDOW_OPEN_DENY = { action: "deny" } as const;

/**
 * Absolute path to the packaged renderer entry — same relative join as
 * `BrowserWindow.loadFile` in main (`__dirname` of the main bundle, not this file).
 */
export function resolveRendererIndexHtmlPath(mainProcessDirname: string): string {
  return path.join(mainProcessDirname, "../renderer/index.html");
}

export type NavigationAllowlist =
  | { kind: "dev-origin"; origin: string }
  | { kind: "prod-file"; filePath: string };

/**
 * Allowed navigation target for the renderer webContents.
 * Mirrors loadRendererUrl: ELECTRON_RENDERER_URL in electron-vite dev, else the
 * exact index.html path passed to loadFile.
 */
export function resolveNavigationAllowlist(
  electronRendererUrl: string | undefined = process.env["ELECTRON_RENDERER_URL"],
  mainProcessDirname: string
): NavigationAllowlist {
  if (electronRendererUrl !== undefined && electronRendererUrl.length > 0) {
    return {
      kind: "dev-origin",
      origin: new URL(electronRendererUrl).origin,
    };
  }
  return {
    kind: "prod-file",
    filePath: resolveRendererIndexHtmlPath(mainProcessDirname),
  };
}

export function describeNavigationAllowlist(allowlist: NavigationAllowlist): string {
  if (allowlist.kind === "dev-origin") {
    return allowlist.origin;
  }
  return `file:${allowlist.filePath}`;
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

function isSameProdRendererFile(urlString: string, allowedFilePath: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }
  if (parsed.protocol !== "file:") {
    return false;
  }
  // fileURLToPath ignores hash/query — hash routing (#/…) stays allowed.
  const navigatedPath = path.normalize(fileURLToPath(parsed));
  const allowedPath = path.normalize(path.resolve(allowedFilePath));
  return navigatedPath === allowedPath;
}

export function isAllowedRendererNavigation(
  urlString: string,
  allowlist: NavigationAllowlist
): boolean {
  if (allowlist.kind === "dev-origin") {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return false;
    }
    return parsed.origin === allowlist.origin;
  }

  return isSameProdRendererFile(urlString, allowlist.filePath);
}

/**
 * Deny window.open / target=_blank popups and block in-page navigations
 * off the app origin. Does not call shell.openExternal — external links
 * stay on the IPC openExternal path only.
 */
export function attachWebContentsNavigationGuards(
  contents: WebContents,
  allowlist: NavigationAllowlist
): void {
  contents.setWindowOpenHandler(({ url }) => {
    logger.warn(
      `[Navigation] Denied window.open (host=${hostForNavigationLog(url)})`
    );
    return WINDOW_OPEN_DENY;
  });

  contents.on("will-navigate", (event, url) => {
    if (isAllowedRendererNavigation(url, allowlist)) {
      return;
    }
    event.preventDefault();
    logger.warn(
      `[Navigation] Denied will-navigate (host=${hostForNavigationLog(url)})`
    );
  });
}
