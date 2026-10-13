import { describe, expect, it } from "vitest";
import { AI_TAGS } from "@shared/ai-tags";

/**
 * Pre-unify worker AI_TAG_PATTERNS composition (P0-C: identical to other copies).
 * Worker imports AI_TAGS via relative path; this locks filter parity.
 */
const PREVIOUS_WORKER_AI_TAG_PATTERNS = [
  "ai_generated",
  "ai-generated",
  "ai_generation",
  "ai-generated_content",
] as const;

type AiFilter = "hide" | "only";

function hasAiGeneratedTagWithList(
  tags: string | undefined | null,
  list: readonly string[]
): boolean {
  if (!tags) return false;
  const tagArray = tags
    .toLowerCase()
    .split(/\s+/)
    .filter((tag) => tag.length > 0);
  return list.some((aiTag) => tagArray.includes(aiTag));
}

function filterPostsByAi(
  posts: ReadonlyArray<{ id: number; tags: string }>,
  aiFilter: AiFilter,
  list: readonly string[]
): number[] {
  return posts
    .filter((post) => {
      const hasAi = hasAiGeneratedTagWithList(post.tags, list);
      if (aiFilter === "hide" && hasAi) return false;
      if (aiFilter === "only" && !hasAi) return false;
      return true;
    })
    .map((post) => post.id);
}

describe("data-processor worker AI_TAGS wiring", () => {
  it("shared AI_TAGS matches pre-unify worker list", () => {
    expect([...AI_TAGS]).toEqual([...PREVIOUS_WORKER_AI_TAG_PATTERNS]);
  });

  it("hide/only on a fixture match pre-unify list results", () => {
    const fixture = [
      { id: 1, tags: "solo 1girl" },
      { id: 2, tags: "ai_generated rating_safe" },
      { id: 3, tags: "tag1 ai-generated tag2" },
      { id: 4, tags: "ai_generation landscape" },
      { id: 5, tags: "ai-generated_content" },
      { id: 6, tags: "ai generated" },
      { id: 7, tags: "prefix_ai_generated_suffix" },
    ];

    expect(filterPostsByAi(fixture, "hide", AI_TAGS)).toEqual(
      filterPostsByAi(fixture, "hide", PREVIOUS_WORKER_AI_TAG_PATTERNS)
    );
    expect(filterPostsByAi(fixture, "only", AI_TAGS)).toEqual(
      filterPostsByAi(fixture, "only", PREVIOUS_WORKER_AI_TAG_PATTERNS)
    );

    expect(filterPostsByAi(fixture, "hide", AI_TAGS)).toEqual([1, 6, 7]);
    expect(filterPostsByAi(fixture, "only", AI_TAGS)).toEqual([2, 3, 4, 5]);
  });
});
