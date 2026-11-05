import { tryParseHttpsUrlHostname } from "./url-host";

/** Zod / worker failure copy — must not list allowlist hosts. */
export const DOWNLOAD_URL_NOT_ALLOWED_MESSAGE =
  "Download URL is not allowed.";

/**
 * True when `urlString` is HTTPS and its hostname is an exact member of `hosts`.
 * Pure: no Electron, no provider registry — safe for worker threads.
 */
export function isUrlAllowedOnCdnHosts(
  urlString: string,
  hosts: ReadonlySet<string>
): boolean {
  const host = tryParseHttpsUrlHostname(urlString);
  if (host === null) {
    return false;
  }
  return hosts.has(host);
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

  if (
    "href" in options &&
    typeof options.href === "string" &&
    options.href.length > 0
  ) {
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

  const pathPart =
    "path" in options && typeof options.path === "string"
      ? options.path
      : "pathname" in options && typeof options.pathname === "string"
        ? options.pathname
        : "/";
  const normalizedPath = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;

  return `${protocol}//${hostname}${portSuffix}${normalizedPath}`;
}

/**
 * Abort a follow-redirects hop when the redirect target is outside `hosts`.
 * Throw cancels the redirect chain (follow-redirects calls beforeRedirect without catch).
 */
export function assertCdnUrlAllowedForRedirectOnHosts(
  options: unknown,
  hosts: ReadonlySet<string>
): void {
  const url = buildRedirectUrlFromFollowRedirectsOptions(options);
  if (!isUrlAllowedOnCdnHosts(url, hosts)) {
    throw new Error(DOWNLOAD_URL_NOT_ALLOWED_MESSAGE);
  }
}
