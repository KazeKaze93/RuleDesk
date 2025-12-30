/**
 * React Query Cache Utilities
 *
 * Shared utilities for updating React Query cache across the application.
 * Encapsulates common patterns for updating InfiniteData caches to avoid code duplication.
 */

import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Post } from "../../main/db/schema";

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
  origin?: { kind: "search"; tags: string[] } | { kind: "artist"; artistId: number } | { kind: "favorites" } | { kind: "updates" } | { kind: "browse"; filters?: string }
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
    const searchQueryKey = ["search", origin.tags];
    queryClient.setQueryData<InfiniteData<Post[]>>(
      searchQueryKey,
      (old) => updatePostInCache(old, post.id, updater)
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

