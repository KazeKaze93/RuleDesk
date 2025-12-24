import { ipcMain, shell } from "electron";
import { URL } from "url";
import { logger } from "../../lib/logger";
import { IPC_CHANNELS } from "../channels";

const ALLOWED_HOSTS = new Set([
  "rule34.xxx",
  "www.rule34.xxx",
]);

// Dangerous protocols that should never be allowed
const DANGEROUS_PROTOCOLS = [
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "about:",
  "chrome:",
  "chrome-extension:",
  "moz-extension:",
  "ms-browser-extension:",
];

/**
 * Validates and sanitizes URL before opening externally.
 * Returns null if URL is invalid or unsafe.
 */
function validateAndSanitizeUrl(urlString: string): string | null {
  if (!urlString || typeof urlString !== "string") {
    logger.warn("IPC: Invalid URL type passed to open-external");
    return null;
  }

  // Step 1: Reject dangerous protocols before parsing
  const lowerUrl = urlString.toLowerCase().trim();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      logger.warn(`IPC: Blocked dangerous protocol: ${urlString}`);
      return null;
    }
  }

  // Step 2: Parse URL (will throw if invalid)
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch (error) {
    logger.warn(`IPC: Invalid URL format: ${urlString}`, error);
    return null;
  }

  // Step 3: Strictly verify protocol is HTTPS (case-sensitive check)
  if (parsedUrl.protocol !== "https:") {
    logger.warn(`IPC: Blocked unsafe protocol: ${parsedUrl.protocol} (URL: ${urlString})`);
    return null;
  }

  // Step 4: Verify hostname is in whitelist (exact match, no subdomains)
  const hostname = parsedUrl.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    logger.warn(`IPC: Blocked request to unauthorized hostname: ${hostname} (URL: ${urlString})`);
    return null;
  }

  // Step 5: Additional security checks
  // Reject IP addresses (even if they resolve to allowed domains)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(":")) {
    logger.warn(`IPC: Blocked IP address or IPv6: ${hostname} (URL: ${urlString})`);
    return null;
  }

  // Reject non-standard ports (only allow default HTTPS port 443 or no port)
  // parsedUrl.port is empty string if not specified, which is fine (defaults to 443)
  if (parsedUrl.port !== "" && parsedUrl.port !== "443") {
    logger.warn(`IPC: Blocked non-standard port: ${parsedUrl.port} (URL: ${urlString})`);
    return null;
  }

  // Step 6: Reconstruct URL to ensure it's clean (prevent injection via URL components)
  const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

  return sanitizedUrl;
}

export const registerViewerHandlers = () => {
  ipcMain.handle(
    IPC_CHANNELS.APP.OPEN_EXTERNAL,
    async (_, urlString: string) => {
      try {
        const sanitizedUrl = validateAndSanitizeUrl(urlString);

        if (!sanitizedUrl) {
          // URL was rejected by validation
          return;
        }

        await shell.openExternal(sanitizedUrl);
      } catch (error) {
        logger.error(`IPC: Error opening external URL: ${urlString}`, error);
      }
    }
  );
};
