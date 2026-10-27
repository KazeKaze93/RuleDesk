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

/**
 * Build absolute URL from follow-redirects request options (spread before `beforeRedirect`).
 * Prefers `href`; falls back to protocol + hostname + path.
 */
export function buildRedirectUrlFromFollowRedirectsOptions(
  options: unknown
): string {
  if (typeof options !== "object" || options === null) {
    return "";
  }

  if ("href" in options && typeof options.href === "string" && options.href.length > 0) {
    return options.href;
  }

  const protocol =
    "protocol" in options && typeof options.protocol === "string"
      ? options.protocol
      : "";
  const hostname =
    "hostname" in options && typeof options.hostname === "string"
      ? options.hostname
      : "";
  if (protocol.length === 0 || hostname.length === 0) {
    return "";
  }

  let portSuffix = "";
  if ("port" in options) {
    const port = options.port;
    if (typeof port === "number" && Number.isFinite(port) && port > 0) {
      portSuffix = `:${port}`;
    } else if (typeof port === "string" && port.length > 0) {
      portSuffix = `:${port}`;
    }
  }

  const path =
    "path" in options && typeof options.path === "string"
      ? options.path
      : "pathname" in options && typeof options.pathname === "string"
        ? options.pathname
        : "/";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${protocol}//${hostname}${portSuffix}${normalizedPath}`;
}

/**
 * Abort a follow-redirects hop when the redirect target is outside the CDN allowlist.
 * Throw cancels the redirect chain (follow-redirects calls beforeRedirect without catch).
 */
export function assertCdnUrlAllowedForRedirect(options: unknown): void {
  const url = buildRedirectUrlFromFollowRedirectsOptions(options);
  if (!isAllowedCdnUrl(url)) {
    throw new Error(DOWNLOAD_URL_NOT_ALLOWED_MESSAGE);
  }
}
