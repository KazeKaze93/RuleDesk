import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios, { AxiosError } from "axios";
import { RULE34_MISSING_AUTHENTICATION_MARKER } from "@/shared/constants/rule34-api";
import { Rule34Provider } from "@/main/providers/rule34-provider";
import { ProviderThrottle } from "@/main/providers/provider-throttle";

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

const axiosGetMock = vi.spyOn(axios, "get");

describe("Rule34Provider.fetchPosts error classification", () => {
  const provider = new Rule34Provider();
  const settings = { userId: "1", apiKey: "test-key" };

  it("keeps API host in CSP allowlist but out of video-proxy CDN list", () => {
    expect(provider.allowedDomains).toContain("api.rule34.xxx");
    expect(provider.cdnDomains).not.toContain("api.rule34.xxx");
    expect(provider.cdnDomains).toEqual([
      "rule34.xxx",
      "img.rule34.xxx",
      "wimg.rule34.xxx",
      "us.rule34.xxx",
      "api-cdn.rule34.xxx",
    ]);
  });

  beforeEach(() => {
    axiosGetMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws auth error for Missing authentication body without XML fallback", async () => {
    axiosGetMock.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: `${RULE34_MISSING_AUTHENTICATION_MARKER}. Register for an account.`,
    });

    await expect(provider.fetchPosts("test_tag", 1, settings, false, 50)).rejects.toMatchObject({
      kind: "auth",
    });

    expect(axiosGetMock).toHaveBeenCalledTimes(1);
  });

  it("throws rate_limit error on HTTP 429 without XML fallback", async () => {
    const notifySpy = vi.spyOn(ProviderThrottle.prototype, "notifyRateLimited");
    axiosGetMock.mockResolvedValueOnce({
      status: 429,
      headers: { "retry-after": "12" },
      data: "",
    });

    await expect(provider.fetchPosts("test_tag", 1, settings, false, 50)).rejects.toMatchObject({
      kind: "rate_limit",
      retryAfterMs: 12_000,
    });

    expect(notifySpy).toHaveBeenCalledWith(12_000);
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
    notifySpy.mockRestore();
  });

  it("throws parse error for garbage body after XML fallback fails", async () => {
    axiosGetMock
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: "<html>cloudflare</html>",
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: "<html>still cloudflare</html>",
      });

    await expect(provider.fetchPosts("test_tag", 1, settings, false, 50)).rejects.toMatchObject({
      kind: "parse",
    });

    expect(axiosGetMock).toHaveBeenCalledTimes(2);
  });

  it("returns [] for a genuine well-formed empty JSON array", async () => {
    axiosGetMock.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: "[]",
    });

    await expect(provider.fetchPosts("missing_tag", 1, settings, false, 50)).resolves.toEqual(
      []
    );

    expect(axiosGetMock).toHaveBeenCalledTimes(1);
  });

  it("throws network error on transport failure without XML fallback", async () => {
    const timeoutError = new AxiosError("timeout of 15000ms exceeded");
    timeoutError.code = "ECONNABORTED";
    axiosGetMock.mockRejectedValueOnce(timeoutError);

    await expect(provider.fetchPosts("test_tag", 1, settings, false, 50)).rejects.toMatchObject({
      kind: "network",
    });

    expect(axiosGetMock).toHaveBeenCalledTimes(1);
  });
});
