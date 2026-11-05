import { getAllProviderCdnDomains } from "./index";
import {
  DOWNLOAD_URL_NOT_ALLOWED_MESSAGE,
  assertCdnUrlAllowedForRedirectOnHosts,
  buildRedirectUrlFromFollowRedirectsOptions,
  isUrlAllowedOnCdnHosts,
} from "../../shared/utils/cdn-url-allowlist";

export {
  DOWNLOAD_URL_NOT_ALLOWED_MESSAGE,
  buildRedirectUrlFromFollowRedirectsOptions,
};

/**
 * Cached at module load — `isAllowedCdnUrl` is on the video-proxy / download hot path.
 * Host set must stay identical to the former video-proxy-server gate.
 */
// legacy: display of stored Gelbooru posts after Gelbooru support removal
const LEGACY_GELBOORU_CDN_HOSTS = ["img4.gelbooru.com"] as const;

const ALLOWED_CDN_HOST_LIST: readonly string[] = [
  ...getAllProviderCdnDomains(),
  ...LEGACY_GELBOORU_CDN_HOSTS,
];

const ALLOWED_CDN_HOSTS = new Set(ALLOWED_CDN_HOST_LIST);

/**
 * CDN hostnames for download workers (Main computes; workers must not import the registry).
 */
export function getAllowedCdnDomains(): readonly string[] {
  return ALLOWED_CDN_HOST_LIST;
}

/**
 * True when `urlString` is HTTPS and its hostname is an exact member of provider CDN domains.
 * Match semantics: parse via `tryParseHttpsUrlHostname`, then `Set.has` (case-normalized host).
 */
export function isAllowedCdnUrl(urlString: string): boolean {
  return isUrlAllowedOnCdnHosts(urlString, ALLOWED_CDN_HOSTS);
}

/**
 * Abort a follow-redirects hop when the redirect target is outside the CDN allowlist.
 * Throw cancels the redirect chain (follow-redirects calls beforeRedirect without catch).
 */
export function assertCdnUrlAllowedForRedirect(options: unknown): void {
  assertCdnUrlAllowedForRedirectOnHosts(options, ALLOWED_CDN_HOSTS);
}
