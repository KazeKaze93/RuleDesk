import { type StoredProviderId } from "../constants";

/**
 * Origin roots for user-facing site pages (shell.openExternal).
 * Includes legacy Gelbooru for display of stored posts after Gelbooru support removal.
 * Hosts must stay in sync with `src/main/config/allowed-hosts.ts`.
 */
const SITE_ORIGIN_BY_PROVIDER: Record<string, string> = {
  rule34: "https://rule34.xxx",
  // legacy: display of stored Gelbooru posts after Gelbooru support removal
  gelbooru: "https://gelbooru.com",
};

const DEFAULT_SITE_ORIGIN = SITE_ORIGIN_BY_PROVIDER.rule34;

function resolveSiteOrigin(providerId: StoredProviderId): string {
  return SITE_ORIGIN_BY_PROVIDER[providerId] ?? DEFAULT_SITE_ORIGIN;
}

/**
 * Build a booru website tag-list URL for opening in an external browser.
 * Each tag is `encodeURIComponent`'d, then joined with a literal `+`
 * (do not join first then encode — that turns `+` into `%2B`).
 */
export function buildSiteTagSearchUrl(
  providerId: StoredProviderId,
  tags: string[]
): string {
  const origin = resolveSiteOrigin(providerId);
  const encodedTags = tags.map((tag) => encodeURIComponent(tag)).join("+");
  return `${origin}/index.php?page=post&s=list&tags=${encodedTags}`;
}

/**
 * Build a booru website post-view URL for opening in an external browser.
 */
export function buildSitePostViewUrl(
  providerId: StoredProviderId,
  postId: number
): string {
  const origin = resolveSiteOrigin(providerId);
  return `${origin}/index.php?page=post&s=view&id=${postId}`;
}
