import { describe, expect, it, vi } from "vitest";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/main/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/main/lib/proxy", () => ({
  getProxyAgent: vi.fn(() => undefined),
}));

import { assertCdnDomainsAreSubsetOfAllowed } from "@/main/providers/assert-cdn-domains-subset";
import { getProvider } from "@/main/providers";

describe("assertCdnDomainsAreSubsetOfAllowed", () => {
  it("throws when a cdn host is missing from allowedDomains", () => {
    expect(() =>
      assertCdnDomainsAreSubsetOfAllowed([
        {
          id: "fake",
          allowedDomains: ["cdn.example"],
          cdnDomains: ["cdn.example", "orphan.example"],
        },
      ])
    ).toThrow(
      "[Providers] fake: cdnDomains must be a subset of allowedDomains; extra: orphan.example"
    );
  });

  it("does not throw when cdnDomains is a subset (API host only in allowedDomains is ok)", () => {
    expect(() =>
      assertCdnDomainsAreSubsetOfAllowed([
        {
          id: "fake",
          allowedDomains: ["api.example", "cdn.example"],
          cdnDomains: ["cdn.example"],
        },
      ])
    ).not.toThrow();
  });

  it("live registry satisfies the subset invariant", () => {
    expect(() =>
      assertCdnDomainsAreSubsetOfAllowed([
        getProvider("rule34"),
        getProvider("gelbooru"),
      ])
    ).not.toThrow();
  });
});
