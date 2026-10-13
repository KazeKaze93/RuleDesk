import { type ProviderId } from "../constants";

/**
 * Origin roots for user-facing site pages (shell.openExternal).
 * Exhaustive over ProviderId — adding a provider forces a compile error here.
 * Hosts must stay in sync with `src/main/config/allowed-hosts.ts`.
 */
const SITE_ORIGIN_BY_PROVIDER: Record<ProviderId, string> = {
  rule34: "https://rule34.xxx",
  gelbooru: "https://gelbooru.com",
};

/**
 * Build a booru website tag-list URL for opening in an external browser.
 * Each tag is `encodeURIComponent`'d, then joined with a literal `+`
 * (do not join first then encode — that turns `+` into `%2B`).
 */
export function buildSiteTagSearchUrl(
  providerId: ProviderId,
  tags: string[]
): string {
  const origin = SITE_ORIGIN_BY_PROVIDER[providerId];
  const encodedTags = tags.map((tag) => encodeURIComponent(tag)).join("+");
  return `${origin}/index.php?page=post&s=list&tags=${encodedTags}`;
}

/**
 * Build a booru website post-view URL for opening in an external browser.
 */
export function buildSitePostViewUrl(
  providerId: ProviderId,
  postId: number
): string {
  const origin = SITE_ORIGIN_BY_PROVIDER[providerId];
  return `${origin}/index.php?page=post&s=view&id=${postId}`;
}
