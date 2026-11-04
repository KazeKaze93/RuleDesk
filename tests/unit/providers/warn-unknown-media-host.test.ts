import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

import { logger } from "../../../src/main/lib/logger";
import {
  UNKNOWN_ALLOWED_HOST_LOG,
  UNKNOWN_CDN_VIDEO_HOST_LOG,
  resetUnknownMediaHostWarningDedup,
  warnIfUnknownMediaHost,
} from "../../../src/main/providers/warn-unknown-media-host";
import { Rule34Provider } from "../../../src/main/providers/rule34-provider";

/** legacy: display of stored Gelbooru posts after Gelbooru support removal */
const LEGACY_GELBOORU_CDN_HOSTS = ["img4.gelbooru.com"] as const;

const UNKNOWN_HOST = "cdn-unknown.example";
const provider = {
  id: "fake",
  allowedDomains: ["cdn.example"],
  cdnDomains: ["cdn.example"],
};

describe("warnIfUnknownMediaHost", () => {
  beforeEach(() => {
    resetUnknownMediaHostWarningDedup();
    vi.mocked(logger.warn).mockClear();
  });

  afterEach(() => {
    resetUnknownMediaHostWarningDedup();
  });

  it("warns once per hostname for an unknown image host", () => {
    const fileUrl = `https://${UNKNOWN_HOST}/post.jpg`;
    warnIfUnknownMediaHost(fileUrl, provider);
    warnIfUnknownMediaHost(fileUrl, provider);

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(UNKNOWN_ALLOWED_HOST_LOG, {
      provider: "fake",
      host: UNKNOWN_HOST,
    });
  });

  it("emits both checks once for an unknown video host", () => {
    const fileUrl = `https://${UNKNOWN_HOST}/post.mp4`;
    warnIfUnknownMediaHost(fileUrl, provider);
    warnIfUnknownMediaHost(fileUrl, provider);

    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith(UNKNOWN_ALLOWED_HOST_LOG, {
      provider: "fake",
      host: UNKNOWN_HOST,
    });
    expect(logger.warn).toHaveBeenCalledWith(UNKNOWN_CDN_VIDEO_HOST_LOG, {
      provider: "fake",
      host: UNKNOWN_HOST,
    });
  });

  it("warns only the cdn check when a video host is in allowedDomains but not cdnDomains", () => {
    warnIfUnknownMediaHost("https://api.example/clip.mp4", {
      id: "fake",
      allowedDomains: ["api.example", "cdn.example"],
      cdnDomains: ["cdn.example"],
    });

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(UNKNOWN_CDN_VIDEO_HOST_LOG, {
      provider: "fake",
      host: "api.example",
    });
  });

  it("does not warn for live Rule34 CDN hosts (jpg and mp4)", () => {
    const rule34 = new Rule34Provider();

    for (const host of rule34.cdnDomains) {
      warnIfUnknownMediaHost(`https://${host}/file.jpg`, rule34);
      warnIfUnknownMediaHost(`https://${host}/file.mp4`, rule34);
    }

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("does not warn for legacy Gelbooru CDN hosts when listed on a fake provider", () => {
    // legacy: display of stored Gelbooru posts after Gelbooru support removal
    const legacyProvider = {
      id: "legacy-gelbooru-display",
      allowedDomains: [...LEGACY_GELBOORU_CDN_HOSTS],
      cdnDomains: [...LEGACY_GELBOORU_CDN_HOSTS],
    };
    for (const host of LEGACY_GELBOORU_CDN_HOSTS) {
      warnIfUnknownMediaHost(`https://${host}/file.jpg`, legacyProvider);
      warnIfUnknownMediaHost(`https://${host}/file.mp4`, legacyProvider);
    }
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("does not warn when the URL is not https", () => {
    warnIfUnknownMediaHost(`http://${UNKNOWN_HOST}/post.mp4`, provider);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe("provider mapping wires warnIfUnknownMediaHost", () => {
  it("rule34-provider calls warnIfUnknownMediaHost after file_url", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/main/providers/rule34-provider.ts"),
      "utf8"
    );
    expect(source).toContain("warnIfUnknownMediaHost(fileUrl, this)");
  });
});
