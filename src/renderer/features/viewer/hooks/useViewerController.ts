import { useEffect, useState } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import log from "electron-log/renderer";
import type { Post } from "../../../../main/db/schema";
import type { ViewerOrigin } from "../../../store/viewerStore";

interface ViewerQueue {
  ids: number[];
  origin: ViewerOrigin | undefined;
  totalGlobalCount?: number;
}

interface UseViewerControllerParams {
  post: Post;
  queue: ViewerQueue | null;
}

interface UseViewerControllerReturn {
  isFavorited: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  isCurrentlyDownloading: boolean;
  postPageUrl: string;
  tagQuery: string;
  toggleFavorite: () => Promise<void>;
  downloadImage: () => Promise<void>;
  openFolder: () => Promise<void>;
  handleCopyText: (text: string) => Promise<void>;
  handleCopyMetadata: () => Promise<void>;
  handleCopyDebugInfo: () => Promise<void>;
  handleOpenExternal: (url: string) => void;
  resetLocalCache: () => void;
}

/**
 * Custom hook that manages all viewer-related business logic:
 * - Favorite state and toggling
 * - Download state and progress tracking
 * - Copy operations (text, metadata, debug info)
 * - Automatic "viewed" marking
 * - Optimistic updates via React Query
 */
export function useViewerController({
  post,
  queue,
}: UseViewerControllerParams): UseViewerControllerReturn {
  const queryClient = useQueryClient();

  function tagsToQuery(t: string | null | undefined): string {
    if (!t) return "";
    return t.trim().split(/\s+/g).filter(Boolean).join("+");
  }

  const [isFavorited, setIsFavorited] = useState(post.isFavorited);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const postPageUrl = `https://rule34.xxx/index.php?page=post&s=view&id=${post.postId}`;
  const tagQuery = tagsToQuery(post.tags);
  const isCurrentlyDownloading =
    isDownloading && downloadProgress > 0 && downloadProgress < 100;

  useEffect(() => {
    if (post.isViewed) return;

    window.api.markPostAsViewed(post.id);

    const queryKey = ["posts", post.artistId];

    queryClient.setQueryData<InfiniteData<Post[]>>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) =>
          page.map((p) => (p.id === post.id ? { ...p, isViewed: true } : p))
        ),
      };
    });
  }, [post.id, post.isViewed, post.artistId, queryClient]);

  useEffect(() => {
    const filenameId = `${post.artistId}_${post.postId}.${
      post.fileUrl.split(".").pop() || "jpg"
    }`;

    const unsubscribe = window.api.onDownloadProgress((data) => {
      if (data.id !== filenameId) return;

      if (data.percent > 0 && data.percent < 100) {
        setIsDownloading(true);
        setDownloadProgress(data.percent);
      } else if (data.percent === 100) {
        setIsDownloading(false);
        setDownloadProgress(0);
      } else if (data.percent === 0) {
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [post.artistId, post.postId, post.fileUrl]);

  const toggleFavorite = async () => {
    const previousState = isFavorited;
    setIsFavorited(!previousState);

    try {
      const newState = await window.api.togglePostFavorite(post.id);
      setIsFavorited(newState);

      // Update all relevant query caches using setQueriesData
      // This updates all queries with prefix ["posts"] (artist galleries and favorites)
      queryClient.setQueriesData<InfiniteData<Post[]>>(
        { queryKey: ["posts"], exact: false },
        (old, { queryKey }) => {
          if (!old) return old;

          // Check if this is the favorites query
          const isFavoritesQuery = 
            Array.isArray(queryKey) && 
            queryKey.length === 2 && 
            queryKey[1] === "favorites";

          // Special handling for favorites: remove post if unfavorited
          if (isFavoritesQuery && !newState) {
            return {
              ...old,
              pages: old.pages
                .map((page) => page.filter((p) => p.id !== post.id))
                .filter((page) => page.length > 0),
            };
          }

          // For all other queries (artist galleries), update the post
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) =>
                p.id === post.id ? { ...p, isFavorited: newState } : p
              )
            ),
          };
        }
      );

      // Invalidate favorites query if removing from favorites or post not in cache
      const favoritesQueryKey = ["posts", "favorites"];
      const oldFavoritesData = queryClient.getQueryData<InfiniteData<Post[]>>(favoritesQueryKey);
      const foundInCache = oldFavoritesData?.pages.some((page) =>
        page.some((p) => p.id === post.id)
      );
      
      if (!newState || !foundInCache) {
        queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
      }
    } catch (error) {
      setIsFavorited(previousState);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log.error("[ViewerController] Failed to toggle favorite:", errorMessage);
    }
  };

  const downloadImage = async () => {
    if (isDownloading) return;

    setDownloadProgress(1);

    try {
      const ext = post.fileUrl.split(".").pop() || "jpg";
      const filename = `${post.artistId}_${post.postId}.${ext}`;

      const result = await window.api.downloadFile(post.fileUrl, filename);

      if (result && result.success && result.path) {
        // Download successful
      } else if (result && result.canceled) {
        // User canceled
      } else {
        log.error("[ViewerController] Download failed:", result?.error || "Unknown error");
      }
    } catch (error) {
      log.error("[ViewerController] Download failed:", error);
      setDownloadProgress(0);
    }
  };

  const openFolder = async () => {
    const ext = post.fileUrl.split(".").pop() || "jpg";
    const filename = `${post.artistId}_${post.postId}.${ext}`;
    await window.api.openFileInFolder(filename);
  };

  const handleCopyText = async (text: string) => {
    try {
      await window.api.writeToClipboard(text);
      log.info(`[ViewerController] Copied via IPC: ${text}`);
    } catch (err) {
      log.error("[ViewerController] Failed to copy text via IPC:", err);
    }
  };

  const handleOpenExternal = (url: string) => {
    if (!url) return;
    window.api.openExternal(url);
  };

  const resetLocalCache = () => {
    if (!post) return;
    log.info(`[ViewerController] Attempting to reset local cache for Post ID: ${post.id}`);
    window.api.resetPostCache(post.id);
  };

  const handleCopyMetadata = async () => {
    const metadata = JSON.stringify(post, null, 2);
    try {
      await window.api.writeToClipboard(metadata);
      log.info("[ViewerController] Metadata copied to clipboard:", post);
    } catch (e) {
      log.error("[ViewerController] Failed to copy metadata", e);
    }
  };

  const handleCopyDebugInfo = async () => {
    const debugInfo = {
      appVersion: "1.2.0",
      post: post,
      queueLength: queue?.ids.length,
      origin: queue?.origin,
    };

    try {
      await window.api.writeToClipboard(JSON.stringify(debugInfo, null, 2));
      log.info("[ViewerController] Debug info copied via IPC");
    } catch (e) {
      log.error("[ViewerController] Failed to copy debug info", e);
    }
  };

  return {
    isFavorited,
    isDownloading,
    downloadProgress,
    isCurrentlyDownloading,
    postPageUrl,
    tagQuery,
    toggleFavorite,
    downloadImage,
    openFolder,
    handleCopyText,
    handleCopyMetadata,
    handleCopyDebugInfo,
    handleOpenExternal,
    resetLocalCache,
  };
}
