/** Hosts we may rewrite FROM. Includes the MP4 CDN so a fileUrl there still gets image mirrors. */
const RULE34_IMAGE_HOSTS = new Set([
  "rule34.xxx",
  "wimg.rule34.xxx",
  "us.rule34.xxx",
  "img.rule34.xxx",
  "api-cdn.rule34.xxx",
  "api-cdn-mp4.rule34.xxx",
]);

/** Image CDN rewrite targets — not `api-cdn-mp4` (video host, not an image mirror). */
const RULE34_CDN_FALLBACK_HOSTS = [
  "wimg.rule34.xxx",
  "img.rule34.xxx",
  "us.rule34.xxx",
  "api-cdn.rule34.xxx",
] as const;

const withRule34Host = (urlString: string, targetHost: string): string | null => {
  try {
    const url = new URL(urlString);
    if (!RULE34_IMAGE_HOSTS.has(url.hostname)) {
      return null;
    }
    if (url.hostname === targetHost) {
      return null;
    }
    url.hostname = targetHost;
    return url.toString();
  } catch {
    return null;
  }
};

const appendUrlWithCdnMirrors = (
  chain: string[],
  seen: Set<string>,
  url: string | undefined
): void => {
  const trimmed = url?.trim();
  if (!trimmed || seen.has(trimmed)) {
    return;
  }
  seen.add(trimmed);
  chain.push(trimmed);
  for (const host of RULE34_CDN_FALLBACK_HOSTS) {
    const fallbackUrl = withRule34Host(trimmed, host);
    if (fallbackUrl && !seen.has(fallbackUrl)) {
      seen.add(fallbackUrl);
      chain.push(fallbackUrl);
    }
  }
};

/** Full-resolution file_url variants only — never sample/preview (those are cropped thumbnails). */
export const buildViewerFullImageChain = (post: { fileUrl: string }): string[] => {
  const chain: string[] = [];
  const seen = new Set<string>();
  appendUrlWithCdnMirrors(chain, seen, post.fileUrl);
  return chain;
};
