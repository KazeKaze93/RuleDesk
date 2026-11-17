import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AI_SCOPE_COLLECTIONS,
  AI_SCOPE_FAVORITES,
  AI_SCOPE_FEED,
  AI_SCOPE_FOLLOWING,
  AI_SCOPE_POSTS,
  adoptSiteAiChoice,
  aiChoiceIn,
  aiHiddenIn,
  alignSiteAiFilter,
  listScope,
  setAiHiddenEverywhere,
  setAiHiddenIn,
  withSiteAiFilter,
} from "../../src/features/ai-scope";
import { readSiteAiFilter, writeSiteAiFilter } from "../../src/site/ai-filter";
import { clearStorageCache } from "../../src/storage/store";

const memory = new Map<string, unknown>();

function clearAiCookie(): void {
  document.cookie = "filter_ai=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

beforeEach(() => {
  memory.clear();
  clearStorageCache();
  clearAiCookie();
  vi.stubGlobal("GM_getValue", (key: string, fallback?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : fallback,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
});

afterEach(() => {
  clearAiCookie();
  vi.unstubAllGlobals();
});

describe("AI posts: the part of the site a list belongs to", () => {
  const data = {
    artistTags: ["lunoire", "jcm2", "nyl2"],
    groupSize: 400,
    savedQueries: ["zootopia -comic", "cat"],
  };

  it("is Posts for an ordinary search and for no search at all", () => {
    expect(listScope("", "", data)).toBe(AI_SCOPE_POSTS);
    expect(listScope("dog solo", "", data)).toBe(AI_SCOPE_POSTS);
    expect(listScope("lunoire solo", "", data)).toBe(AI_SCOPE_POSTS);
  });

  it("is Following for one followed tag, whatever the sidebar adds to it", () => {
    expect(listScope("lunoire", "", data)).toBe(AI_SCOPE_FOLLOWING);
    expect(listScope("Lunoire sort:score:desc score:>=10 -video", "", data)).toBe(
      AI_SCOPE_FOLLOWING,
    );
  });

  it("is Feed for the search of everyone followed", () => {
    expect(listScope("( lunoire ~ jcm2 ~ nyl2 )", "", data)).toBe(AI_SCOPE_FEED);
  });

  it("is Collections for a saved search, by its mark or by its query", () => {
    expect(listScope("anything", "#rdw-dc=abc", data)).toBe(AI_SCOPE_COLLECTIONS);
    expect(listScope("-comic zootopia sort:id:asc", "", data)).toBe(AI_SCOPE_COLLECTIONS);
  });
});

describe("AI posts: the choice of each part", () => {
  it("shows AI posts everywhere until told otherwise", () => {
    const scopes = [
      AI_SCOPE_FEED,
      AI_SCOPE_FOLLOWING,
      AI_SCOPE_COLLECTIONS,
      AI_SCOPE_FAVORITES,
    ] as const;
    for (const scope of scopes) {
      expect(aiHiddenIn(scope)).toBe(false);
    }
  });

  it("keeps what the site's switch was set to as the choice of Posts, once", () => {
    writeSiteAiFilter(true);
    adoptSiteAiChoice();
    expect(aiChoiceIn(AI_SCOPE_POSTS)).toBe(true);
    // The switch moved for another part does not change what Posts remembers.
    writeSiteAiFilter(false);
    adoptSiteAiChoice();
    expect(aiChoiceIn(AI_SCOPE_POSTS)).toBe(true);
  });

  it("remembers each part apart from the others", () => {
    setAiHiddenIn(AI_SCOPE_FOLLOWING, true);
    expect(aiHiddenIn(AI_SCOPE_FOLLOWING)).toBe(true);
    expect(aiHiddenIn(AI_SCOPE_FEED)).toBe(false);
    expect(aiHiddenIn(AI_SCOPE_POSTS)).toBe(false);
  });

  it("hides in every part while the settings say everywhere, and forgets no choice", () => {
    setAiHiddenIn(AI_SCOPE_FEED, false);
    setAiHiddenEverywhere(true);
    expect(aiHiddenIn(AI_SCOPE_FEED)).toBe(true);
    expect(aiHiddenIn(AI_SCOPE_FAVORITES)).toBe(true);
    expect(aiChoiceIn(AI_SCOPE_FEED)).toBe(false);
    setAiHiddenEverywhere(false);
    expect(aiHiddenIn(AI_SCOPE_FEED)).toBe(false);
  });
});

describe("AI posts: the site's switch", () => {
  it("is put the way the part wants it, and says whether it was changed", () => {
    setAiHiddenIn(AI_SCOPE_FOLLOWING, true);
    expect(alignSiteAiFilter(AI_SCOPE_FOLLOWING)).toBe(true);
    expect(readSiteAiFilter()).toBe(true);
    expect(alignSiteAiFilter(AI_SCOPE_FOLLOWING)).toBe(false);
    expect(alignSiteAiFilter(AI_SCOPE_POSTS)).toBe(true);
    expect(readSiteAiFilter()).toBe(false);
  });

  it("is not written when it was never set and nothing is to be hidden", () => {
    expect(alignSiteAiFilter(AI_SCOPE_POSTS)).toBe(false);
    expect(document.cookie).not.toContain("filter_ai");
  });

  it("is left alone for Favorites, which the site does not filter", () => {
    setAiHiddenIn(AI_SCOPE_FAVORITES, true);
    expect(alignSiteAiFilter(AI_SCOPE_FAVORITES)).toBe(false);
    expect(document.cookie).not.toContain("filter_ai");
  });

  it("is set for one request and put back after the answer", async () => {
    writeSiteAiFilter(false);
    setAiHiddenIn(AI_SCOPE_FEED, true);
    let during: boolean | null = null;
    const answer = await withSiteAiFilter(AI_SCOPE_FEED, async () => {
      during = readSiteAiFilter();
      return Promise.resolve("page");
    });
    expect(answer).toBe("page");
    expect(during).toBe(true);
    expect(readSiteAiFilter()).toBe(false);
  });
});
