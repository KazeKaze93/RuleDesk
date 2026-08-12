import { describe, expect, it } from "vitest";
import { getSearchBrowseNextPageParam } from "@/renderer/utils/react-query-cache";
import type { Post } from "@shared/types/db";

const POSTS_PER_PAGE = 50;

const makePost = (id: number): Post =>
  ({
    id,
    postId: id,
  }) as Post;

describe("getSearchBrowseNextPageParam", () => {
  it("continues when API reports hasMore", () => {
    const lastPage = {
      posts: Array.from({ length: 30 }, (_, i) => makePost(i + 1)),
      hasMore: true,
      apiFetchedCount: 50,
      nextBeforePostId: 100,
    };
    expect(getSearchBrowseNextPageParam(lastPage, [lastPage], POSTS_PER_PAGE)).toBe(2);
  });

  it("stops when API reports no hasMore on a partial page", () => {
    const lastPage = {
      posts: Array.from({ length: 30 }, (_, i) => makePost(i + 1)),
      hasMore: false,
      apiFetchedCount: 30,
      nextBeforePostId: 100,
    };
    expect(
      getSearchBrowseNextPageParam(lastPage, [lastPage], POSTS_PER_PAGE)
    ).toBeUndefined();
  });

  it("continues on a full API page even when blacklist removed all visible posts", () => {
    const lastPage = {
      posts: [],
      hasMore: true,
      apiFetchedCount: 50,
      nextBeforePostId: 500,
    };
    expect(getSearchBrowseNextPageParam(lastPage, [lastPage], POSTS_PER_PAGE)).toBe(2);
  });

  it("stops when API returned zero rows", () => {
    const lastPage = {
      posts: [],
      hasMore: false,
      apiFetchedCount: 0,
    };
    expect(
      getSearchBrowseNextPageParam(lastPage, [lastPage], POSTS_PER_PAGE)
    ).toBeUndefined();
  });

  it("continues on a full page even when hasMore is false (stale flag)", () => {
    const lastPage = {
      posts: Array.from({ length: 50 }, (_, i) => makePost(i + 1)),
      hasMore: false,
      apiFetchedCount: 50,
      nextBeforePostId: 900,
    };
    expect(getSearchBrowseNextPageParam(lastPage, [lastPage], POSTS_PER_PAGE)).toBe(2);
  });

  it("supports legacy Post[] cache pages", () => {
    const lastPage = Array.from({ length: 50 }, (_, i) => makePost(i + 1));
    expect(getSearchBrowseNextPageParam(lastPage, [lastPage], POSTS_PER_PAGE)).toBe(2);
  });

  it("switches to cursor pagination after four offset pages", () => {
    const pages = Array.from({ length: 4 }, (_, pageIndex) => ({
      posts: Array.from({ length: 50 }, (_, i) => makePost(pageIndex * 50 + i + 1)),
      hasMore: true,
      apiFetchedCount: 50,
      nextBeforePostId: 10_000 - pageIndex * 50,
    }));
    const lastPage = pages[3];

    expect(
      getSearchBrowseNextPageParam(lastPage, pages, POSTS_PER_PAGE)
    ).toEqual({ beforePostId: 9_850 });
  });

  it("continues cursor pagination when nextBeforePostId is present", () => {
    const offsetPages = Array.from({ length: 4 }, (_, pageIndex) => ({
      posts: Array.from({ length: 50 }, (_, i) => makePost(pageIndex * 50 + i + 1)),
      hasMore: true,
      apiFetchedCount: 50,
      nextBeforePostId: 10_000 - pageIndex * 50,
    }));
    const cursorPage = {
      posts: Array.from({ length: 50 }, (_, i) => makePost(200 + i + 1)),
      hasMore: true,
      apiFetchedCount: 50,
      nextBeforePostId: 7_500,
    };
    const allPages = [...offsetPages, cursorPage];

    expect(
      getSearchBrowseNextPageParam(cursorPage, allPages, POSTS_PER_PAGE)
    ).toEqual({ beforePostId: 7_500 });
  });
});
