import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOORU_AI_FILTER_OR_GROUP,
  BOORU_AI_FILTER_TAGS,
  buildBooruTagListForIpc,
  buildRemoteAiFilterTagInjection,
  buildRemoteBooruTagListForIpc,
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
    });
    expect(result.aiInjected).toBe(true);
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
    });
    expect(result).toEqual({ tags: ["1girl"], aiInjected: false });
  });
});
