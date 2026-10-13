import { describe, expect, it } from "vitest";
import { ALLOWED_HOSTS_SET } from "../../../src/main/config/allowed-hosts";
import { PROVIDER_IDS } from "@shared/constants";
import { buildSiteTagSearchUrl } from "@shared/utils/site-urls";
import { tryParseHttpsUrlHostname } from "@shared/utils/url-host";

describe("buildSiteTagSearchUrl", () => {
  it("builds a Rule34 tag-list URL", () => {
    expect(buildSiteTagSearchUrl("rule34", ["solo"])).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=solo"
    );
  });

  it("builds a Gelbooru tag-list URL", () => {
    expect(buildSiteTagSearchUrl("gelbooru", ["solo"])).toBe(
      "https://gelbooru.com/index.php?page=post&s=list&tags=solo"
    );
  });

  it("encodes special characters per tag", () => {
    expect(buildSiteTagSearchUrl("rule34", ["tag:foo", "a b", "100%"])).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=tag%3Afoo+a%20b+100%25"
    );
  });

  it("joins multiple tags with a literal + (not %2B)", () => {
    const url = buildSiteTagSearchUrl("gelbooru", ["blue_hair", "solo"]);
    expect(url).toBe(
      "https://gelbooru.com/index.php?page=post&s=list&tags=blue_hair+solo"
    );
    expect(url).not.toContain("%2B");
  });

  it("preserves exclude-style -tag tokens", () => {
    expect(buildSiteTagSearchUrl("rule34", ["solo", "-ai_generated"])).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=solo+-ai_generated"
    );
  });

  it("uses a host present in ALLOWED_HOSTS for every ProviderId", () => {
    for (const providerId of PROVIDER_IDS) {
      const url = buildSiteTagSearchUrl(providerId, ["test"]);
      const hostname = tryParseHttpsUrlHostname(url);
      expect(hostname, `hostname for ${providerId}`).not.toBeNull();
      expect(
        ALLOWED_HOSTS_SET.has(hostname ?? ""),
        `${hostname} must be in ALLOWED_HOSTS`
      ).toBe(true);
    }
  });
});
