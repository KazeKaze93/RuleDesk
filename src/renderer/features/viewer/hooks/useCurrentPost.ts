import { useMemo } from "react";
import { InfiniteData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Post } from "@shared/types/db";
import type { SearchBooruPageResult } from "../../../../shared/schemas/search";
import type { ViewerOrigin } from "../../../store/viewerStore";
import { isSearchGalleryPage } from "../../../utils/react-query-cache";
import { buildViewerOriginQueryKey } from "../buildViewerOriginQueryKey";

export const useCurrentPost = (
  currentPostId: number | null,
  origin: ViewerOrigin | undefined
) => {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => buildViewerOriginQueryKey(origin), [origin]);

  // Use useQuery with enabled: false for reactive cache access
  // This ensures component re-renders when cache data changes (e.g., post marked as viewed)
  // initialData is set from cache, and useQuery will reactively update when cache changes
  const { data: infiniteData } = useQuery<
    InfiniteData<Post[] | SearchBooruPageResult<Post>>
  >({
    queryKey: queryKey ?? ["__invalid__"],
    queryFn: async () => {
      const cached = queryKey
        ? queryClient.getQueryData<
            InfiniteData<Post[] | SearchBooruPageResult<Post>>
          >(queryKey)
        : undefined;
      if (!cached) throw new Error("useCurrentPost: No cached data available");
      return cached;
    },
    enabled: queryKey !== null && currentPostId !== null,
    initialData: queryKey
      ? queryClient.getQueryData<
          InfiniteData<Post[] | SearchBooruPageResult<Post>>
        >(queryKey)
      : undefined,
    staleTime: Infinity, // Never refetch, only use cache
    gcTime: Infinity, // Keep in cache forever
  });

  // Optimize: Create Map for O(1) lookup instead of O(N) find() on every slide change
  // Trade-off: Map creation is O(N) but happens only when infiniteData changes (new pages or cache updates)
  // For 1000+ posts, O(1) lookup on slide change is much better than O(N) search
  // Map is recreated when infiniteData reference changes (React Query updates reference on cache changes)
  // Support both id (local posts) and postId (remote posts with id=0) lookup
  const postsMap = useMemo(() => {
    if (!infiniteData) return new Map<number, Post>();

    // Create Map from all pages for O(1) lookup
    // Use both id and postId as keys to support remote posts (id=0)
    const map = new Map<number, Post>();
    for (const page of infiniteData.pages) {
      const posts = isSearchGalleryPage(page) ? page.posts : page;
      for (const post of posts) {
        map.set(post.id, post);
        // For remote posts (id=0), also index by postId for lookup
        if (post.id === 0 && post.postId) {
          map.set(post.postId, post);
        }
      }
    }
    return map;
  }, [infiniteData]); // Recreate when infiniteData changes (includes cache updates)

  // O(1) lookup using Map - much faster than O(N) find() for large datasets
  // Try id first, then postId for remote posts
  return useMemo(() => {
    if (!currentPostId || postsMap.size === 0) return undefined;
    // First try direct id lookup (works for local posts)
    const postById = postsMap.get(currentPostId);
    if (postById) return postById;
    // If not found, currentPostId might be a postId (for remote posts with id=0)
    // This handles the case where remote posts have id=0 but we're searching by postId
    // The map already has postId entries for remote posts, so this will find them
    return undefined;
  }, [currentPostId, postsMap]);
};
