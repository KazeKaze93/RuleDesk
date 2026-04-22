import { eq } from "drizzle-orm";
import log from "electron-log";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getDb } from "../db/client";
import { settings, SETTINGS_ID } from "../db/schema";

let cachedAgent: HttpsProxyAgent<string> | undefined;
let cachedProxyUrl: string | null = null;

/**
 * Returns an HttpsProxyAgent if proxy is configured, undefined otherwise.
 * Agent is cached in memory and reloaded via reloadProxyFromSettings().
 */
export function getProxyAgent(): HttpsProxyAgent<string> | undefined {
  return cachedAgent;
}

/**
 * Load proxy URL from settings and rebuild cache.
 * Call at app startup and after settings changes.
 */
export function reloadProxyFromSettings(): void {
  try {
    const db = getDb();
    const row = db
      .select({ proxyUrl: settings.proxyUrl })
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .limit(1)
      .get();
    const proxyUrl = row?.proxyUrl ?? null;

    if (proxyUrl === cachedProxyUrl) {
      return;
    }

    cachedProxyUrl = proxyUrl;
    if (proxyUrl) {
      cachedAgent = new HttpsProxyAgent(proxyUrl);
      log.info(`[Proxy] Agent configured: ${proxyUrl}`);
      return;
    }

    cachedAgent = undefined;
    log.info("[Proxy] No proxy configured");
  } catch (error) {
    log.error("[Proxy] Failed to load proxy settings:", error);
    cachedAgent = undefined;
    cachedProxyUrl = null;
  }
}
