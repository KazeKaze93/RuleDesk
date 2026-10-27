import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../src/main/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../src/main/lib/proxy", () => ({
  getProxyAgent: vi.fn(() => undefined),
}));

import {
  DOWNLOAD_URL_NOT_ALLOWED_MESSAGE,
  isAllowedCdnUrl,
} from "../../../src/main/providers/cdn-allowlist";
import { getAllProviderCdnDomains } from "../../../src/main/providers";

/** Mirrors FileController DownloadFileSchema URL rules (CDN refine). */
const DownloadUrlSchema = z
  .string()
  .url()
  .refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
    message: "Only HTTP/HTTPS protocols are allowed for downloads.",
  })
  .refine((val) => isAllowedCdnUrl(val), {
    message: DOWNLOAD_URL_NOT_ALLOWED_MESSAGE,
  });

describe("isAllowedCdnUrl", () => {
  it("accepts HTTPS URLs on provider CDN hosts", () => {
    const hosts = getAllProviderCdnDomains();
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts) {
      expect(isAllowedCdnUrl(`https://${host}/file.mp4`)).toBe(true);
    }
  });

  it("rejects loopback, unknown hosts, and non-HTTPS", () => {
    expect(isAllowedCdnUrl("https://127.0.0.1/x")).toBe(false);
    expect(isAllowedCdnUrl("http://127.0.0.1/x")).toBe(false);
    expect(isAllowedCdnUrl("https://evil.com/steal")).toBe(false);
    expect(isAllowedCdnUrl("http://img.rule34.xxx/a.jpg")).toBe(false);
    expect(isAllowedCdnUrl("https://api.rule34.xxx/index.php")).toBe(false);
  });

  it("does not expose allowlist hosts in the rejection message constant", () => {
    for (const host of getAllProviderCdnDomains()) {
      expect(DOWNLOAD_URL_NOT_ALLOWED_MESSAGE.includes(host)).toBe(false);
    }
  });
});

describe("DownloadFileSchema URL refine (CDN)", () => {
  it("passes an allowed CDN HTTPS URL", () => {
    const host = getAllProviderCdnDomains()[0];
    const parsed = DownloadUrlSchema.safeParse(`https://${host}/ok.jpg`);
    expect(parsed.success).toBe(true);
  });

  it("rejects disallowed hosts without listing the allowlist", () => {
    for (const url of [
      "https://127.0.0.1/x",
      "https://evil.com/x",
      "http://169.254.169.254/latest/meta-data/",
    ]) {
      const parsed = DownloadUrlSchema.safeParse(url);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((issue) => issue.message);
        expect(messages).toContain(DOWNLOAD_URL_NOT_ALLOWED_MESSAGE);
        for (const host of getAllProviderCdnDomains()) {
          expect(messages.some((m) => m.includes(host))).toBe(false);
        }
      }
    }
  });
});
