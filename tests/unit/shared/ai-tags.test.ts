import { describe, expect, it } from "vitest";
import { AI_TAGS } from "@/shared/ai-tags";

describe("AI_TAGS", () => {
  it("locks the exact token list composition and order", () => {
    expect([...AI_TAGS]).toEqual([
      "ai_generated",
      "ai-generated",
      "ai_generation",
      "ai-generated_content",
    ]);
  });

  it("has four distinct tokens", () => {
    expect(AI_TAGS).toHaveLength(4);
    expect(new Set(AI_TAGS).size).toBe(4);
  });
});
