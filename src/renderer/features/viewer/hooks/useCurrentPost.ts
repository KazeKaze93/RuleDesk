import { useMemo } from "react";
import { useQueryClient, InfiniteData, useQuery } from "@tanstack/react-query";
import type { Post } from "../../../../main/db/schema";
import type { ViewerOrigin } from "../../../store/viewerStore";

/**
 * Reactive cache lookup for the current viewer post.
 * Builds the same query keys as gallery pages so TanStack Query updates when cache changes.
 */
export function useCurrentPost(
  currentPostId: number | null,
  origin: ViewerOrigin | undefined
): {
  post: Post | undefined;
  getPostById: (id: number) => Post | undefined;
} {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    if (!origin) return null;

    switch (origin.kind) {
      case "updates": {
        const tags = origin.tags ?? [];
        return ["posts", "updates", tags] as const;
      }
      case "favorites": {
        const tags = origin.tags ?? [];
        return ["posts", "favorites", tags] as const;
      }
      case "artist": {
        const aiFilter = origin.aiFilter ?? "all";
        const mediaType = origin.mediaType ?? "all";
        return ["posts", origin.artistId, aiFilter, mediaType] as const;
      }
      case "search": {
        return ["search", origin.tags] as const;
      }
      case "browse": {
        return ["search", []] as const;
      }
      case "playlist": {
        return [
          "playlist-posts",
          origin.playlistId,
          origin.mediaType ?? "all",
          origin.sortOrder ?? "desc",
        ] as const;
      }
      default:
        return null;
    }
  }, [origin]);

  const { data: infiniteData } = useQuery<InfiniteData<Post[]>>({
    queryKey: queryKey ?? ["__invalid__"],
    queryFn: async () => {
      const cached = queryKey
        ? queryClient.getQueryData<InfiniteData<Post[]>>(queryKey)
        : undefined;
      if (!cached) throw new Error("useCurrentPost: No cached data available");
      return cached;
    },
    enabled: queryKey !== null && currentPostId !== null,
    initialData: queryKey ? queryClient.getQueryData<InfiniteData<Post[]>>(queryKey) : undefined,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const postsMap = useMemo(() => {
    if (!infiniteData) return new Map<number, Post>();

    const map = new Map<number, Post>();
    for (const page of infiniteData.pages) {
      for (const post of page) {
        map.set(post.id, post);
        if (post.id === 0 && post.postId) {
          map.set(post.postId, post);
        }
      }
    }
    return map;
  }, [infiniteData]);

  const getPostById = useMemo(() => {
    return (id: number): Post | undefined => {
      if (!id || postsMap.size === 0) return undefined;
      return postsMap.get(id);
    };
  }, [postsMap]);

  const post = useMemo(() => {
    if (!currentPostId || postsMap.size === 0) return undefined;
    return postsMap.get(currentPostId);
  }, [currentPostId, postsMap]);

  return { post, getPostById };
}
