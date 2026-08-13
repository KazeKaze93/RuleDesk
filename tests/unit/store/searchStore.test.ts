import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOORU_AI_FILTER_OR_GROUP,
  BOORU_AI_FILTER_TAGS,
  BOORU_VIDEO_FILTER_TAG,
  buildBooruTagListForIpc,
  buildRemoteAiFilterTagInjection,
  buildRemoteBooruTagListForIpc,
  buildRemoteMediaTypeTagInjection,
  parseSearchQuery,
  useSearchStore,
} from "@/renderer/store/searchStore";

vi.mock("electron-log/renderer", () => ({
  default: {
    warn: vi.fn(),
  },
}));

describe("searchStore parseSearchQuery", () => {
  it("splits include and exclude tags", () => {
    const parsed = parseSearchQuery("cat -dog wolf -bird");
    expect(parsed.includeTags).toEqual(["cat", "wolf"]);
    expect(parsed.excludeTags).toEqual(["dog", "bird"]);
  });

  it("ignores standalone minus token", () => {
    const parsed = parseSearchQuery("cat - dog");
    expect(parsed.includeTags).toEqual(["cat", "dog"]);
    expect(parsed.excludeTags).toEqual([]);
  });
});

describe("searchStore addIncludeTag", () => {
  beforeEach(() => {
    useSearchStore.setState({
      includeTags: [],
      excludeTags: [],
    });
  });

  it("routes -tag to excludeTags", () => {
    useSearchStore.getState().addIncludeTag("-night");

    const state = useSearchStore.getState();
    expect(state.includeTags).toEqual([]);
    expect(state.excludeTags).toEqual(["night"]);
  });
});

describe("buildBooruTagListForIpc", () => {
  it("prefixes exclude tags with -", () => {
    expect(buildBooruTagListForIpc(["1girl"], ["ai_generated"])).toEqual([
      "1girl",
      "-ai_generated",
    ]);
  });
});

describe("buildRemoteAiFilterTagInjection", () => {
  it("injects exclude AI tags for rule34 hide", () => {
    const result = buildRemoteAiFilterTagInjection({
      provider: "rule34",
      aiFilter: "hide",
      includeTags: ["1girl"],
      excludeTags: [],
    });
    expect(result.aiInjected).toBe(true);
    expect(result.injectedTags).toEqual(
      BOORU_AI_FILTER_TAGS.map((tag) => `-${tag}`)
    );
  });

  it("injects OR-group for rule34 only", () => {
    const result = buildRemoteAiFilterTagInjection({
      provider: "rule34",
      aiFilter: "only",
      includeTags: ["1girl"],
      excludeTags: [],
    });
    expect(result.aiInjected).toBe(true);
    expect(result.injectedTags).toEqual([BOORU_AI_FILTER_OR_GROUP]);
  });

  it("skips hide injection when user include already has an AI token (conflict)", () => {
    const result = buildRemoteAiFilterTagInjection({
      provider: "rule34",
      aiFilter: "hide",
      includeTags: ["ai_generated"],
      excludeTags: [],
    });
    expect(result).toEqual({ injectedTags: [], aiInjected: false });
  });

  it("skips only injection when user include already has an AI token", () => {
    const result = buildRemoteAiFilterTagInjection({
      provider: "rule34",
      aiFilter: "only",
      includeTags: ["ai-generated"],
      excludeTags: [],
    });
    expect(result).toEqual({ injectedTags: [], aiInjected: false });
  });

  it("skips only injection when user exclude has an AI token", () => {
    const result = buildRemoteAiFilterTagInjection({
      provider: "rule34",
      aiFilter: "only",
      includeTags: ["1girl"],
      excludeTags: ["ai_generation"],
    });
    expect(result).toEqual({ injectedTags: [], aiInjected: false });
  });

  it("does not inject for gelbooru", () => {
    expect(
      buildRemoteAiFilterTagInjection({
        provider: "gelbooru",
        aiFilter: "hide",
        includeTags: [],
        excludeTags: [],
      })
    ).toEqual({ injectedTags: [], aiInjected: false });
  });

  it("does not inject when aiFilter is all", () => {
    expect(
      buildRemoteAiFilterTagInjection({
        provider: "rule34",
        aiFilter: "all",
        includeTags: [],
        excludeTags: [],
      })
    ).toEqual({ injectedTags: [], aiInjected: false });
  });
});

describe("buildRemoteBooruTagListForIpc", () => {
  it("appends hide excludes after user tags", () => {
    const result = buildRemoteBooruTagListForIpc({
      includeTags: ["1girl"],
      excludeTags: ["solo"],
      provider: "rule34",
      aiFilter: "hide",
      mediaType: "all",
    });
    expect(result.aiInjected).toBe(true);
    expect(result.mediaInjected).toBe(false);
    expect(result.tags).toEqual([
      "1girl",
      "-solo",
      ...BOORU_AI_FILTER_TAGS.map((tag) => `-${tag}`),
    ]);
  });

  it("keeps user tags only on gelbooru hide", () => {
    const result = buildRemoteBooruTagListForIpc({
      includeTags: ["1girl"],
      excludeTags: [],
      provider: "gelbooru",
      aiFilter: "hide",
      mediaType: "all",
    });
    expect(result).toEqual({
      tags: ["1girl"],
      aiInjected: false,
      mediaInjected: false,
    });
  });

  it("appends video tag for rule34 videos filter", () => {
    const result = buildRemoteBooruTagListForIpc({
      includeTags: ["1girl"],
      excludeTags: [],
      provider: "rule34",
      aiFilter: "all",
      mediaType: "videos",
    });
    expect(result).toEqual({
      tags: ["1girl", BOORU_VIDEO_FILTER_TAG],
      aiInjected: false,
      mediaInjected: true,
    });
  });

  it("appends video tag for gelbooru videos filter", () => {
    const result = buildRemoteBooruTagListForIpc({
      includeTags: [],
      excludeTags: [],
      provider: "gelbooru",
      aiFilter: "all",
      mediaType: "videos",
    });
    expect(result).toEqual({
      tags: [BOORU_VIDEO_FILTER_TAG],
      aiInjected: false,
      mediaInjected: true,
    });
  });

  it("combines AI hide excludes with video injection", () => {
    const result = buildRemoteBooruTagListForIpc({
      includeTags: ["1girl"],
      excludeTags: [],
      provider: "rule34",
      aiFilter: "hide",
      mediaType: "videos",
    });
    expect(result.aiInjected).toBe(true);
    expect(result.mediaInjected).toBe(true);
    expect(result.tags).toEqual([
      "1girl",
      ...BOORU_AI_FILTER_TAGS.map((tag) => `-${tag}`),
      BOORU_VIDEO_FILTER_TAG,
    ]);
  });
});

describe("buildRemoteMediaTypeTagInjection", () => {
  it("injects video for videos filter", () => {
    expect(
      buildRemoteMediaTypeTagInjection({
        provider: "rule34",
        mediaType: "videos",
        includeTags: ["1girl"],
        excludeTags: [],
      })
    ).toEqual({ injectedTags: [BOORU_VIDEO_FILTER_TAG], mediaInjected: true });
  });

  it("injects -video for images filter", () => {
    expect(
      buildRemoteMediaTypeTagInjection({
        provider: "gelbooru",
        mediaType: "images",
        includeTags: [],
        excludeTags: [],
      })
    ).toEqual({ injectedTags: [`-${BOORU_VIDEO_FILTER_TAG}`], mediaInjected: true });
  });

  it("skips extra inject when user already included video (still marks injected)", () => {
    expect(
      buildRemoteMediaTypeTagInjection({
        provider: "rule34",
        mediaType: "videos",
        includeTags: ["video"],
        excludeTags: [],
      })
    ).toEqual({ injectedTags: [], mediaInjected: true });
  });

  it("skips videos injection when user excluded video (conflict)", () => {
    expect(
      buildRemoteMediaTypeTagInjection({
        provider: "rule34",
        mediaType: "videos",
        includeTags: ["1girl"],
        excludeTags: ["video"],
      })
    ).toEqual({ injectedTags: [], mediaInjected: false });
  });

  it("skips images injection when user included video (conflict)", () => {
    expect(
      buildRemoteMediaTypeTagInjection({
        provider: "rule34",
        mediaType: "images",
        includeTags: ["video"],
        excludeTags: [],
      })
    ).toEqual({ injectedTags: [], mediaInjected: false });
  });

  it("does not inject when mediaType is all", () => {
    expect(
      buildRemoteMediaTypeTagInjection({
        provider: "rule34",
        mediaType: "all",
        includeTags: [],
        excludeTags: [],
      })
    ).toEqual({ injectedTags: [], mediaInjected: false });
  });
});
