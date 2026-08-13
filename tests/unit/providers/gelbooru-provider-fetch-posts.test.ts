import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios, { AxiosError } from "axios";
import { GelbooruProvider } from "@/main/providers/gelbooru-provider";
import { getAllProviderCdnDomains, getAllProviderDomains } from "@/main/providers";
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

const SAMPLE_GELBOORU_POST = {
  id: 42,
  file_url: "https://img4.gelbooru.com/images/ab/cd/abcd1234.jpg",
  sample_url: "https://img4.gelbooru.com/samples/ab/cd/sample_abcd1234.jpg",
  preview_url: "https://img4.gelbooru.com/thumbnails/ab/cd/thumbnail_abcd1234.jpg",
  tags: "solo 1girl",
  rating: "q",
  score: 10,
  width: 800,
  height: 600,
  created_at: "Mon Jan 01 12:00:00 +0000 2024",
};

describe("GelbooruProvider.fetchPosts rate-limit classification", () => {
  const provider = new GelbooruProvider();
  const settings = { userId: "1", apiKey: "test-key" };

  it("lists only the live API host and img4 CDN", () => {
    expect(provider.allowedDomains).toEqual([
      "gelbooru.com",
      "img4.gelbooru.com",
    ]);
    expect(provider.cdnDomains).toEqual(["img4.gelbooru.com"]);
    const domains = getAllProviderDomains();
    expect(domains).toContain("img4.gelbooru.com");
    expect(domains).toContain("gelbooru.com");
    expect(domains).not.toContain("img1.gelbooru.com");
    expect(domains).not.toContain("img2.gelbooru.com");
    expect(domains).not.toContain("img3.gelbooru.com");
    const cdnDomains = getAllProviderCdnDomains();
    expect(cdnDomains).toContain("img4.gelbooru.com");
    expect(cdnDomains).not.toContain("gelbooru.com");
    expect(cdnDomains).not.toContain("api.rule34.xxx");
  });

  beforeEach(() => {
    axiosGetMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped posts for HTTP 200 with valid JSON", async () => {
    axiosGetMock.mockResolvedValueOnce({
      status: 200,
      headers: { "content-type": "application/json" },
      data: [SAMPLE_GELBOORU_POST],
    });

    const posts = await provider.fetchPosts("solo", 1, settings, false, 50);

    expect(posts).toHaveLength(1);
    expect(posts[0]?.id).toBe(42);
    expect(posts[0]?.fileUrl).toBe(SAMPLE_GELBOORU_POST.file_url);
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
    expect(axiosGetMock.mock.calls[0]?.[1]).toMatchObject({
      validateStatus: expect.any(Function),
    });
    const validateStatus = axiosGetMock.mock.calls[0]?.[1]?.validateStatus;
    expect(typeof validateStatus).toBe("function");
    if (typeof validateStatus === "function") {
      expect(validateStatus(200)).toBe(true);
      expect(validateStatus(429)).toBe(true);
      expect(validateStatus(500)).toBe(false);
    }
  });

  it("throws rate_limit error on HTTP 429 and does not return []", async () => {
    const notifySpy = vi.spyOn(ProviderThrottle.prototype, "notifyRateLimited");
    axiosGetMock.mockResolvedValueOnce({
      status: 429,
      headers: { "retry-after": "12", "content-type": "text/plain" },
      data: "",
    });

    await expect(
      provider.fetchPosts("solo", 1, settings, false, 50)
    ).rejects.toMatchObject({
      kind: "rate_limit",
      retryAfterMs: 12_000,
    });

    expect(notifySpy).toHaveBeenCalledWith(12_000);
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
    notifySpy.mockRestore();
  });

  it("treats invalid Retry-After as undefined retryAfterMs on 429", async () => {
    const notifySpy = vi.spyOn(ProviderThrottle.prototype, "notifyRateLimited");
    axiosGetMock.mockResolvedValueOnce({
      status: 429,
      headers: { "retry-after": "not-a-number" },
      data: "",
    });

    await expect(
      provider.fetchPosts("solo", 1, settings, false, 50)
    ).rejects.toMatchObject({
      kind: "rate_limit",
      retryAfterMs: undefined,
    });

    expect(notifySpy).toHaveBeenCalledWith(undefined);
    notifySpy.mockRestore();
  });

  it("throws parse error for non-JSON content-type on HTTP 200", async () => {
    axiosGetMock.mockResolvedValueOnce({
      status: 200,
      headers: { "content-type": "text/xml; charset=utf-8" },
      data: "<posts></posts>",
    });

    await expect(
      provider.fetchPosts("solo", 1, settings, false, 50)
    ).rejects.toMatchObject({
      kind: "parse",
    });

    expect(axiosGetMock).toHaveBeenCalledTimes(1);
  });

  it("throws network error on transport failure", async () => {
    const timeoutError = new AxiosError("timeout of 15000ms exceeded");
    timeoutError.code = "ECONNABORTED";
    axiosGetMock.mockRejectedValueOnce(timeoutError);

    await expect(
      provider.fetchPosts("solo", 1, settings, false, 50)
    ).rejects.toMatchObject({
      kind: "network",
    });

    expect(axiosGetMock).toHaveBeenCalledTimes(1);
  });

  it("returns [] for a genuine well-formed empty JSON array", async () => {
    axiosGetMock.mockResolvedValueOnce({
      status: 200,
      headers: { "content-type": "application/json" },
      data: [],
    });

    await expect(
      provider.fetchPosts("missing_tag", 1, settings, false, 50)
    ).resolves.toEqual([]);

    expect(axiosGetMock).toHaveBeenCalledTimes(1);
  });
});

describe("GelbooruProvider.searchTags", () => {
  const provider = new GelbooruProvider();

  beforeEach(() => {
    axiosGetMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("maps category into SearchResults.type and keeps type=tag_query query param", async () => {
    axiosGetMock.mockResolvedValueOnce({
      status: 200,
      data: [
        {
          type: "tag",
          label: "wlop",
          value: "wlop",
          post_count: "397",
          category: "artist",
        },
        {
          type: "tag",
          label: "hatsune miku",
          value: "hatsune_miku",
          post_count: "149676",
          category: "character",
        },
      ],
    });

    await expect(provider.searchTags("wlop")).resolves.toEqual([
      { id: "wlop", label: "wlop", value: "wlop", type: "artist" },
      {
        id: "hatsune_miku",
        label: "hatsune miku",
        value: "hatsune_miku",
        type: "character",
      },
    ]);

    const calledUrl = String(axiosGetMock.mock.calls[0]?.[0]);
    expect(calledUrl).toContain("page=autocomplete2");
    expect(calledUrl).toContain("type=tag_query");
  });
});
