import { describe, expect, it } from "vitest";
import {
  DOWNLOAD_URL_NOT_ALLOWED_MESSAGE,
  assertCdnUrlAllowedForRedirectOnHosts,
  isUrlAllowedOnCdnHosts,
} from "../../../src/shared/utils/cdn-url-allowlist";

const HOSTS = new Set(["img.rule34.xxx", "wimg.rule34.xxx"]);

describe("cdn-url-allowlist (pure)", () => {
  it("accepts HTTPS URLs on the provided host set", () => {
    expect(isUrlAllowedOnCdnHosts("https://img.rule34.xxx/a.jpg", HOSTS)).toBe(
      true
    );
  });

  it("rejects hosts outside the set and non-HTTPS", () => {
    expect(isUrlAllowedOnCdnHosts("https://evil.com/x", HOSTS)).toBe(false);
    expect(isUrlAllowedOnCdnHosts("http://img.rule34.xxx/a.jpg", HOSTS)).toBe(
      false
    );
  });

  it("rejects redirect hops outside the set without listing hosts", () => {
    expect(() =>
      assertCdnUrlAllowedForRedirectOnHosts(
        { href: "https://evil.com/next" },
        HOSTS
      )
    ).toThrow(DOWNLOAD_URL_NOT_ALLOWED_MESSAGE);
    expect(DOWNLOAD_URL_NOT_ALLOWED_MESSAGE.includes("img.rule34.xxx")).toBe(
      false
    );
  });
});
