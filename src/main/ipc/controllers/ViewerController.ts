import { type IpcMainInvokeEvent } from "electron";
import { shell } from "electron";
import { URL } from "url";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { IPC_CHANNELS } from "../channels";
import { ALLOWED_HOSTS_SET } from "../../config/allowed-hosts";

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
] as const;

/**
 * Viewer Controller
 *
 * Handles viewer-related IPC operations:
 * - Opening external URLs with security validation
 */
export class ViewerController extends BaseController {
  /**
   * Setup IPC handlers for viewer operations
   */
  public setup(): void {
    this.handle(
      IPC_CHANNELS.APP.OPEN_EXTERNAL,
      z.string().url().min(1), // Single argument schema
      this.openExternal.bind(this) as (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    );

    log.info("[ViewerController] All handlers registered");
  }

  /**
   * Validates and sanitizes URL before opening externally.
   * Returns null if URL is invalid or unsafe.
   *
   * @param urlString - URL string to validate
   * @returns Sanitized URL or null if invalid
   */
  private validateAndSanitizeUrl(urlString: string): string | null {
    if (!urlString || typeof urlString !== "string") {
      log.warn("[ViewerController] Invalid URL type passed to open-external");
      return null;
    }

    // Step 1: Reject dangerous protocols before parsing
    const lowerUrl = urlString.toLowerCase().trim();
    for (const protocol of DANGEROUS_PROTOCOLS) {
      if (lowerUrl.startsWith(protocol)) {
        log.warn(`[ViewerController] Blocked dangerous protocol: ${urlString}`);
        return null;
      }
    }

    // Step 2: Parse URL (will throw if invalid)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlString);
    } catch (error) {
      log.warn(`[ViewerController] Invalid URL format: ${urlString}`, error);
      return null;
    }

    // Step 3: Strictly verify protocol is HTTPS (case-sensitive check)
    if (parsedUrl.protocol !== "https:") {
      log.warn(`[ViewerController] Blocked unsafe protocol: ${parsedUrl.protocol} (URL: ${urlString})`);
      return null;
    }

    // Step 4: Verify hostname is in whitelist (exact match, no subdomains)
    const hostname = parsedUrl.hostname.toLowerCase();
    if (!ALLOWED_HOSTS_SET.has(hostname)) {
      log.warn(`[ViewerController] Blocked request to unauthorized hostname: ${hostname} (URL: ${urlString})`);
      return null;
    }

    // Step 5: Additional security checks
    // Reject IP addresses (even if they resolve to allowed domains)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(":")) {
      log.warn(`[ViewerController] Blocked IP address or IPv6: ${hostname} (URL: ${urlString})`);
      return null;
    }

    // Reject non-standard ports (only allow default HTTPS port 443 or no port)
    // parsedUrl.port is empty string if not specified, which is fine (defaults to 443)
    if (parsedUrl.port !== "" && parsedUrl.port !== "443") {
      log.warn(`[ViewerController] Blocked non-standard port: ${parsedUrl.port} (URL: ${urlString})`);
      return null;
    }

    // Step 6: Reconstruct URL to ensure it's clean (prevent injection via URL components)
    const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    return sanitizedUrl;
  }

  /**
   * Open external URL in default browser with security validation
   *
   * @param _event - IPC event (unused)
   * @param urlString - URL to open
   * @returns void
   */
  private async openExternal(
    _event: IpcMainInvokeEvent,
    urlString: string
  ): Promise<void> {
    try {
      const sanitizedUrl = this.validateAndSanitizeUrl(urlString);

      if (!sanitizedUrl) {
        // URL was rejected by validation
        log.warn(`[ViewerController] URL validation failed: ${urlString}`);
        return;
      }

      await shell.openExternal(sanitizedUrl);
      log.info(`[ViewerController] Opened external URL: ${sanitizedUrl}`);
    } catch (error) {
      log.error(`[ViewerController] Error opening external URL: ${urlString}`, error);
      throw error; // Re-throw for BaseController to serialize
    }
  }
}

