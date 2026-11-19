import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TAG_KIND_LOOKUP_PAGE_LIMIT,
  TAG_KIND_LOOKUP_PAUSE_MS,
  TAG_KIND_LOOKUP_SETTING_ID,
  lookUpTagKinds,
  onTagKindsLearned,
  resetTagKindLookup,
} from "../../src/site/tag-type-lookup";
import { rememberTagKinds, resetTagTypesCache, tagKindOf, tagSeen } from "../../src/site/tag-types";
import { clearStorageCache, setFeatureEnabled } from "../../src/storage/store";

const memory = new Map<string, unknown>();
let asked: string[] = [];
/** What the site answers for a query; null is a failure. */
let answers: Record<string, { label: string; value: string; type?: string }[] | null> = {};

beforeEach(() => {
  vi.useFakeTimers();
  memory.clear();
  clearStorageCache();
  resetTagTypesCache();
  resetTagKindLookup();
  asked = [];
  answers = {};
  vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : defaultValue,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
  vi.stubGlobal(
    "fetch",
    vi.fn((input: unknown) => {
      const query = new URL(String(input)).searchParams.get("q") ?? "";
      asked.push(query);
      const answer = answers[query];
      if (answer === null) {
        return Promise.resolve(new Response("", { status: 429 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify(answer ?? []), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function settle(ms: number = TAG_KIND_LOOKUP_PAUSE_MS): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

describe("asking the site what kind an unknown tag is", () => {
  it("asks once for each tag not known, one at a time, and remembers the answer", async () => {
    answers = {
      minecraft: [
        { label: "minecraft (1)", value: "minecraft", type: "copyright" },
        { label: "minecraft_steve (1)", value: "minecraft_steve", type: "character" },
      ],
      gay: [{ label: "gay (1)", value: "gay", type: "general" }],
    };
    rememberTagKinds([["known_artist", "artist"]]);
    const learned = vi.fn();
    onTagKindsLearned(learned);

    lookUpTagKinds(["minecraft", "known_artist", "gay", "rating:safe", "ca*", "x"]);
    await settle(0);
    // The first is asked at once, the second only after the pause.
    expect(asked).toEqual(["minecraft"]);
    expect(tagKindOf("minecraft")).toBe("copyright");
    await settle();
    expect(asked).toEqual(["minecraft", "gay"]);
    expect(learned).toHaveBeenCalledTimes(2);
    // A general tag has no colour, and is not asked about again.
    expect(tagKindOf("gay")).toBeNull();
    expect(tagSeen("gay")).toBe(true);

    lookUpTagKinds(["minecraft", "gay"]);
    await settle();
    expect(asked).toHaveLength(2);
    // Nor on the next page: the answers are in the storage.
    resetTagKindLookup();
    resetTagTypesCache();
    clearStorageCache();
    lookUpTagKinds(["minecraft", "gay"]);
    await settle();
    expect(asked).toHaveLength(2);
  });

  it("takes a tag the site does not list for a general one", async () => {
    answers = { zzzz: [{ label: "zzzz_other (1)", value: "zzzz_other", type: "artist" }] };
    lookUpTagKinds(["zzzz"]);
    await settle(0);
    expect(tagKindOf("zzzz")).toBeNull();
    expect(tagSeen("zzzz")).toBe(true);
  });

  it("stops at a failure and keeps nothing of what was not answered", async () => {
    answers = { first: null };
    lookUpTagKinds(["first", "second"]);
    await settle(0);
    await settle();
    expect(asked).toEqual(["first"]);
    expect(tagSeen("first")).toBe(false);
    expect(tagSeen("second")).toBe(false);
    // Asked again when chips are drawn anew.
    answers = { first: [{ label: "first", value: "first", type: "artist" }] };
    lookUpTagKinds(["first"]);
    await settle(0);
    expect(tagKindOf("first")).toBe("artist");
  });

  it("asks about no more than its limit on a page, and about nothing when switched off", async () => {
    lookUpTagKinds(
      Array.from({ length: TAG_KIND_LOOKUP_PAGE_LIMIT + 5 }, (_unused, index) => `tag_${String(index)}`),
    );
    await settle(TAG_KIND_LOOKUP_PAUSE_MS * (TAG_KIND_LOOKUP_PAGE_LIMIT + 6));
    expect(asked).toHaveLength(TAG_KIND_LOOKUP_PAGE_LIMIT);

    resetTagKindLookup();
    asked = [];
    setFeatureEnabled(TAG_KIND_LOOKUP_SETTING_ID, false);
    lookUpTagKinds(["another_tag"]);
    await settle();
    expect(asked).toEqual([]);
  });
});
