import { tryParseHttpsUrlHostname } from "../../shared/utils/url-host";
import { getAllProviderCdnDomains } from "./index";

/**
 * Cached at module load — `isAllowedCdnUrl` is on the video-proxy / download hot path.
 * Host set must stay identical to the former video-proxy-server gate.
 */
const ALLOWED_CDN_HOSTS = new Set(getAllProviderCdnDomains());

/** Zod / worker failure copy — must not list allowlist hosts. */
export const DOWNLOAD_URL_NOT_ALLOWED_MESSAGE =
  "Download URL is not allowed.";

/**
 * True when `urlString` is HTTPS and its hostname is an exact member of provider CDN domains.
 * Match semantics: parse via `tryParseHttpsUrlHostname`, then `Set.has` (case-normalized host).
 */
export function isAllowedCdnUrl(urlString: string): boolean {
  const host = tryParseHttpsUrlHostname(urlString);
  if (!host) {
    return false;
  }
  return ALLOWED_CDN_HOSTS.has(host);
}
