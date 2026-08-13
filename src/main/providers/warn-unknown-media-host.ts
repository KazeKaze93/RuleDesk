import { isVideoUrl } from "../../shared/utils/media";
import { tryParseHttpsUrlHostname } from "../../shared/utils/url-host";
import { logger } from "../lib/logger";

type ProviderMediaAllowlists = {
  id: string;
  allowedDomains: readonly string[];
  cdnDomains: readonly string[];
};

export const UNKNOWN_ALLOWED_HOST_LOG =
  "[Providers] Unknown media host not in allowedDomains";
export const UNKNOWN_CDN_VIDEO_HOST_LOG =
  "[Providers] Video host not in cdnDomains";

const warnedUnknownAllowedHosts = new Set<string>();
const warnedUnknownCdnVideoHosts = new Set<string>();

function warningKey(providerId: string, host: string): string {
  return `${providerId}:${host}`;
}

/**
 * Exact-hostname checks against the provider allowlists (not CSP `*.domain`).
 * Warns once per (provider, host, check). Never throws — a new CDN must not
 * fail Browse.
 */
export function warnIfUnknownMediaHost(
  fileUrl: string,
  provider: ProviderMediaAllowlists
): void {
  const host = tryParseHttpsUrlHostname(fileUrl);
  if (host === null) {
    return;
  }

  if (!provider.allowedDomains.includes(host)) {
    const key = warningKey(provider.id, host);
    if (!warnedUnknownAllowedHosts.has(key)) {
      warnedUnknownAllowedHosts.add(key);
      logger.warn(UNKNOWN_ALLOWED_HOST_LOG, {
        provider: provider.id,
        host,
      });
    }
  }

  if (isVideoUrl(fileUrl) && !provider.cdnDomains.includes(host)) {
    const key = warningKey(provider.id, host);
    if (!warnedUnknownCdnVideoHosts.has(key)) {
      warnedUnknownCdnVideoHosts.add(key);
      logger.warn(UNKNOWN_CDN_VIDEO_HOST_LOG, {
        provider: provider.id,
        host,
      });
    }
  }
}

export function resetUnknownMediaHostWarningDedup(): void {
  warnedUnknownAllowedHosts.clear();
  warnedUnknownCdnVideoHosts.clear();
}
