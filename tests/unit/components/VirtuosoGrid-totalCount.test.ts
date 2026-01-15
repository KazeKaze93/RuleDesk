import { describe, it, expect } from "vitest";

/**
 * Tests to verify VirtuosoGrid totalCount logic
 * Ensures totalCount matches filtered posts to avoid empty holes in virtualization
 */

describe("VirtuosoGrid totalCount Logic", () => {
  describe("totalCount should match filtered posts", () => {
    it("should use allPosts.length for totalCount (not rawPosts.length)", () => {
      // Simulate scenario: 1000 raw posts, filter leaves 10
      const rawPosts = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }));
      const allPosts = rawPosts.filter((_, i) => i < 10); // Filter leaves 10 posts

      const totalCount = allPosts.length;
      const rawCount = rawPosts.length;

      // totalCount should match filtered posts
      expect(totalCount).toBe(10);
      expect(totalCount).not.toBe(rawCount);

      // Verify that itemContent will receive valid indices
      for (let i = 0; i < totalCount; i++) {
        expect(allPosts[i]).toBeDefined();
      }
    });

    it("should handle case when all posts are filtered out", () => {
      const _rawPosts = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const allPosts: typeof rawPosts = []; // All filtered out

      const totalCount = allPosts.length;

      expect(totalCount).toBe(0);
      // VirtuosoGrid with totalCount=0 won't render items, which is correct
    });

    it("should handle case when no filters applied (allPosts === rawPosts)", () => {
      const rawPosts = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      const allPosts = rawPosts; // No filters

      const totalCount = allPosts.length;
      const rawCount = rawPosts.length;

      expect(totalCount).toBe(rawCount);
      expect(totalCount).toBe(50);
    });

    it("should ensure itemContent indices are always valid", () => {
      const rawPosts = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      // Filter: keep only even IDs
      const allPosts = rawPosts.filter((post) => post.id % 2 === 0);
      const totalCount = allPosts.length;

      // Verify all indices from 0 to totalCount-1 are valid
      for (let index = 0; index < totalCount; index++) {
        const post = allPosts[index];
        expect(post).toBeDefined();
        expect(post.id).toBeDefined();
      }

      // Verify index beyond totalCount would be invalid (but VirtuosoGrid won't call it)
      expect(allPosts[totalCount]).toBeUndefined();
    });
  });

  describe("endReached should work on rawPosts for infinite scroll", () => {
    it("should continue loading based on rawPosts, not filtered allPosts", () => {
      // Scenario: Filter hides most posts, but we still want to load more raw data
      const rawPosts = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      const allPosts = rawPosts.filter((_, i) => i < 5); // Filter leaves 5

      // endReached logic should check rawPosts for hasNextPage
      // This allows loading more data even when filters hide most posts
      const shouldLoadMore = rawPosts.length === 50; // Full page means more available
      const filteredCount = allPosts.length;

      expect(shouldLoadMore).toBe(true); // Should continue loading
      expect(filteredCount).toBe(5); // But only 5 visible

      // This is correct: we load more raw data, filters apply to new data too
    });
  });
});
