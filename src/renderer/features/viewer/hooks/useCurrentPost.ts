import { useMemo, useSyncExternalStore } from "react";
import {
  hashKey,
  InfiniteData,
  useQueryClient,
} from "@tanstack/react-query";
import type { Post } from "@shared/types/db";
import type { SearchBooruPageResult } from "../../../../shared/schemas/search";
import type { ViewerOrigin } from "../../../store/viewerStore";
import { isSearchGalleryPage } from "../../../utils/react-query-cache";
import { buildViewerOriginQueryKey } from "../buildViewerOriginQueryKey";

type GalleryInfiniteData = InfiniteData<Post[] | SearchBooruPageResult<Post>>;

/**
 * Look up the current viewer post from the gallery React Query cache.
 *
 * Important: do NOT mount a second `useQuery` on the gallery infinite-query key.
 * Sharing one key between `useInfiniteQuery` and `useQuery` can leave the viewer
 * on a stale post snapshot after async cache writes (metadata missing until reopen).
 * Subscribe to the query cache instead.
 */
export const useCurrentPost = (
  currentPostId: number | null,
  origin: ViewerOrigin | undefined
) => {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => buildViewerOriginQueryKey(origin), [origin]);
  const queryHash = useMemo(
    () => (queryKey ? hashKey(queryKey) : null),
    [queryKey]
  );

  const infiniteData = useSyncExternalStore(
    (onStoreChange) => {
      if (!queryHash) {
        return () => undefined;
      }
      return queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryHash === queryHash) {
          onStoreChange();
        }
      });
    },
    () =>
      queryKey
        ? queryClient.getQueryData<GalleryInfiniteData>(queryKey)
        : undefined,
    () => undefined
  );

  const postsMap = useMemo(() => {
    if (!infiniteData) return new Map<number, Post>();

    const map = new Map<number, Post>();
    for (const page of infiniteData.pages) {
      const posts = isSearchGalleryPage(page) ? page.posts : page;
      for (const post of posts) {
        map.set(post.id, post);
        if (post.id === 0 && post.postId) {
          map.set(post.postId, post);
        }
      }
    }
    return map;
  }, [infiniteData]);

  return useMemo(() => {
    if (!currentPostId || postsMap.size === 0) return undefined;
    return postsMap.get(currentPostId);
  }, [currentPostId, postsMap]);
};
