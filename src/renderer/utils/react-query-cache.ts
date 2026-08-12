/**
 * React Query Cache Utilities
 *
 * Shared utilities for updating React Query cache across the application.
 * Encapsulates common patterns for updating InfiniteData caches to avoid code duplication.
 */

import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Post } from "@shared/types/db";
import { RULE34_MAX_OFFSET_PAGES } from "../../shared/constants";
import type {
  BrowseSearchPageParam,
  SearchBooruPageResult,
} from "../../shared/schemas/search";

type SearchGalleryPage = SearchBooruPageResult<Post>;
type InfinitePostPage = Post[] | SearchGalleryPage;

export function isSearchGalleryPage(page: unknown): page is SearchGalleryPage {
  return (
    typeof page === "object" &&
    page !== null &&
    "posts" in page &&
    Array.isArray(page.posts)
  );
}

/** Raw API page size before blacklist; falls back to visible posts for legacy pages. */
export function getBrowsePageApiCount(page: SearchGalleryPage): number {
  if (typeof page.apiFetchedCount === "number") {
    return page.apiFetchedCount;
  }
  return page.posts.length;
}

/** Next page param for Browse infinite query; tolerates legacy Post[] cache pages. */
export function getSearchBrowseNextPageParam(
  lastPage: InfinitePostPage,
  allPages: InfinitePostPage[],
  postsPerPage: number
): BrowseSearchPageParam | undefined {
  if (isSearchGalleryPage(lastPage)) {
    const apiCount = getBrowsePageApiCount(lastPage);

    if (apiCount === 0) {
      return undefined;
    }

    const canContinue =
      lastPage.hasMore === true ||
      (lastPage.hasMore === false && apiCount >= postsPerPage);

    if (!canContinue) {
      return undefined;
    }

    if (allPages.length < RULE34_MAX_OFFSET_PAGES) {
      return allPages.length + 1;
    }

    if (typeof lastPage.nextBeforePostId === "number") {
      return { beforePostId: lastPage.nextBeforePostId };
    }

    return undefined;
  }

  if (Array.isArray(lastPage)) {
    if (lastPage.length === 0 || lastPage.length < postsPerPage) {
      return undefined;
    }
    if (allPages.length < RULE34_MAX_OFFSET_PAGES) {
      return allPages.length + 1;
    }
    return undefined;
  }

  return undefined;
}

export function searchBrowseHasNextPage(
  data: InfiniteData<InfinitePostPage> | undefined,
  postsPerPage: number
): boolean {
  if (!data?.pages.length) {
    return false;
  }
  const lastPage = data.pages[data.pages.length - 1];
  return (
    getSearchBrowseNextPageParam(lastPage, data.pages, postsPerPage) !== undefined
  );
}

export function flattenInfinitePostPages(
  infiniteData: InfiniteData<InfinitePostPage> | undefined
): Post[] {
  if (!infiniteData) {
    return [];
  }
  return infiniteData.pages.flatMap((page) =>
    isSearchGalleryPage(page) ? page.posts : page
  );
}

export function updatePostInSearchCache(
  oldData: InfiniteData<SearchGalleryPage> | undefined,
  postId: number,
  updater: (post: Post) => Post
): InfiniteData<SearchGalleryPage> | undefined {
  if (!oldData) {
    return oldData;
  }

  let pageIndex = -1;
  for (let i = 0; i < oldData.pages.length; i++) {
    if (oldData.pages[i].posts.some((post) => post.id === postId)) {
      pageIndex = i;
      break;
    }
  }

  if (pageIndex === -1) {
    return oldData;
  }

  return {
    ...oldData,
    pages: oldData.pages.map((page, index) =>
      index === pageIndex
        ? {
            ...page,
            posts: page.posts.map((post) =>
              post.id === postId ? updater(post) : post
            ),
          }
        : page
    ),
  };
}

/**
 * Update a single post in InfiniteData cache by post ID
 *
 * This utility function updates a post in any InfiniteData<Post[]> cache,
 * regardless of the query key structure. It finds the page containing the post
 * and updates only that page for optimal performance.
 *
 * @param oldData - Current InfiniteData cache or undefined
 * @param postId - ID of the post to update
 * @param updater - Function that returns updated post object
 * @returns Updated InfiniteData or undefined if post not found
 *
 * @example
 * ```typescript
 * queryClient.setQueryData(
 *   ["posts", artistId],
 *   (old) => updatePostInCache(old, postId, (post) => ({ ...post, isViewed: true }))
 * );
 * ```
 */
export function updatePostInCache(
  oldData: InfiniteData<Post[]> | undefined,
  postId: number,
  updater: (post: Post) => Post
): InfiniteData<Post[]> | undefined {
  if (!oldData) return oldData;

  // Find the page index containing the post
  let pageIndex = -1;
  for (let i = 0; i < oldData.pages.length; i++) {
    if (oldData.pages[i].some((post) => post.id === postId)) {
      pageIndex = i;
      break;
    }
  }

  // If post not found, return unchanged
  if (pageIndex === -1) return oldData;

  // Update only the page containing the post
  return {
    ...oldData,
    pages: oldData.pages.map((page, index) =>
      index === pageIndex
        ? page.map((post) => (post.id === postId ? updater(post) : post))
        : page
    ),
  };
}

/**
 * Update post in multiple React Query caches based on origin
 *
 * This function updates all relevant caches for a post based on its origin:
 * - Artist gallery cache (if artistId exists)
 * - Updates feed cache
 * - Search cache (if origin is search)
 * - Favorites cache (if updating favorite state)
 *
 * @param queryClient - React Query client instance
 * @param post - Post to update
 * @param updater - Function that returns updated post object
 * @param origin - Optional origin information for search cache updates
 */
export function updatePostInAllCaches(
  queryClient: QueryClient,
  post: Post,
  updater: (post: Post) => Post,
  origin?:
    | {
        kind: "search";
        tags: string[];
        source?: "all" | "favorites" | "subscriptions";
      }
    | { kind: "artist"; artistId: number }
    | { kind: "favorites" }
    | { kind: "updates" }
    | { kind: "browse"; filters?: string }
): void {
  // Update artist gallery cache if post has artistId
  if (post.artistId) {
    const artistQueryKey = ["posts", post.artistId];
    queryClient.setQueryData<InfiniteData<Post[]>>(
      artistQueryKey,
      (old) => updatePostInCache(old, post.id, updater)
    );
  }

  // Update updates feed cache
  const updatesQueryKey = ["posts", "updates"];
  queryClient.setQueryData<InfiniteData<Post[]>>(
    updatesQueryKey,
    (old) => updatePostInCache(old, post.id, updater)
  );

  // Update search cache if post is from search
  if (origin?.kind === "search") {
    const searchQueryKey = ["search", origin.tags, origin.source ?? "all"];
    queryClient.setQueryData<InfiniteData<SearchGalleryPage>>(
      searchQueryKey,
      (old) => updatePostInSearchCache(old, post.id, updater)
    );
  }

  // Update favorites cache if updating favorite state
  if (origin?.kind === "favorites" || post.isFavorited !== undefined) {
    const favoritesQueryKey = ["posts", "favorites"];
    queryClient.setQueryData<InfiniteData<Post[]>>(
      favoritesQueryKey,
      (old) => updatePostInCache(old, post.id, updater)
    );
  }
}

export async function invalidateAllPostQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["posts"] }),
    queryClient.invalidateQueries({ queryKey: ["search"] }),
    queryClient.invalidateQueries({ queryKey: ["playlist-posts"] }),
  ]);
}

