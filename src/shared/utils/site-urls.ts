import { type ProviderId } from "../constants";

/**
 * Base URLs for user-facing site tag-search pages (shell.openExternal).
 * Exhaustive over ProviderId — adding a provider forces a compile error here.
 * Hosts must stay in sync with `src/main/config/allowed-hosts.ts`.
 */
const SITE_TAG_SEARCH_BASE_BY_PROVIDER: Record<ProviderId, string> = {
  rule34: "https://rule34.xxx/index.php?page=post&s=list&tags=",
  gelbooru: "https://gelbooru.com/index.php?page=post&s=list&tags=",
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
  const base = SITE_TAG_SEARCH_BASE_BY_PROVIDER[providerId];
  const encodedTags = tags.map((tag) => encodeURIComponent(tag)).join("+");
  return `${base}${encodedTags}`;
}
