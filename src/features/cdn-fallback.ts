import type { Feature, FeatureContext } from "./types";

/**
 * When the image of a post fails to load, tries the same file on the site's
 * other image servers, one after another.
 *
 * The host list comes from the desktop RuleDesk, where it served API file
 * addresses. A retry happens only after a real load error, at most once per
 * host, and only for an address on one of these hosts.
 */

const FEATURE_ID = "cdn-fallback";
const FEATURE_LABEL = "Retry a failed post image on other servers";
const FEATURE_PAGES = ["post"] as const;

const POST_IMAGE_SELECTOR = "img#image";
const EVENT_ERROR = "error";

/** Image servers, in the order they are tried. */
export const CDN_IMAGE_HOSTS: readonly string[] = [
  "wimg.rule34.xxx",
  "img.rule34.xxx",
  "us.rule34.xxx",
  "api-cdn.rule34.xxx",
];

/**
 * The same address on the next server that was not tried yet, or null when
 * the address is not on a known server or every server was tried.
 */
export function nextCdnUrl(current: string, tried: ReadonlySet<string>): string | null {
  let url: URL;
  try {
    url = new URL(current, window.location.href);
  } catch {
    return null;
  }
  if (!CDN_IMAGE_HOSTS.includes(url.hostname)) {
    return null;
  }
  for (const host of CDN_IMAGE_HOSTS) {
    if (host === url.hostname || tried.has(host)) {
      continue;
    }
    url.hostname = host;
    return url.href;
  }
  return null;
}

function hostOf(address: string): string {
  try {
    return new URL(address, window.location.href).hostname;
  } catch {
    return "";
  }
}

function mountCdnFallback(_ctx: FeatureContext): void {
  const image = document.querySelector(POST_IMAGE_SELECTOR);
  if (!(image instanceof HTMLImageElement)) {
    return;
  }
  const tried = new Set<string>();
  image.addEventListener(EVENT_ERROR, () => {
    const current = image.getAttribute("src") ?? "";
    tried.add(hostOf(current));
    const next = nextCdnUrl(current, tried);
    if (next !== null) {
      image.setAttribute("src", next);
    }
  });
}

export const cdnFallbackFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: "",
  mount: mountCdnFallback,
};
