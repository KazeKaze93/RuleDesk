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

    // For external posts from Browse (artistId === 0), pass post data to create post in DB
    const postData =
      post.artistId === 0
        ? {
            postId: post.postId,
            artistId: post.artistId,
            fileUrl: post.fileUrl,
            previewUrl: post.previewUrl,
            sampleUrl: post.sampleUrl || "",
            rating: post.rating as "s" | "q" | "e" | undefined,
            tags: post.tags || "",
            publishedAt: post.publishedAt instanceof Date
              ? post.publishedAt.getTime()
              : typeof post.publishedAt === "number"
              ? post.publishedAt
              : undefined,
          }
        : undefined;

    // Always pass second argument (even if undefined) to match schema
    window.api.markPostAsViewed(post.id, postData);

    // Update artist gallery cache if post has artistId
    if (post.artistId) {
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
    }

    // Update updates feed cache
    // Note: Query key ["posts", "updates"] is consistent with Updates.tsx
    const updatesQueryKey = ["posts", "updates"];
    queryClient.setQueryData<InfiniteData<Post[]>>(updatesQueryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) =>
          page.map((p) => (p.id === post.id ? { ...p, isViewed: true } : p))
        ),
      };
    });

    // Update search cache (for Browse page) if post is from search
    if (queue.origin.kind === "search") {
      const searchQueryKey = ["search", queue.origin.tags];
      queryClient.setQueryData<InfiniteData<Post[]>>(searchQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((p) => (p.id === post.id ? { ...p, isViewed: true } : p))
          ),
        };
      });
    }
  }, [post.id, post.isViewed, post.artistId, post.postId, post.fileUrl, post.previewUrl, post.sampleUrl, post.rating, post.tags, post.publishedAt, queue.origin, queryClient]);

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
    if (!post) return;

    const previousState = isFavorited;

    // DETECT SOURCE:
    // Local posts (from DB) usually have camelCase `createdAt` and `fileUrl`.
    // Network posts (from API) usually have snake_case `file_url` or `preview_url` (raw data).
    // Also check artistId: network posts from Browse have artistId === 0
    const raw = post as any;
    const isNetworkPost =
      "file_url" in post ||
      "preview_url" in post ||
      !("createdAt" in post) ||
      post.artistId === 0;

    let postData: {
      postId: number;
      artistId: number;
      fileUrl: string;
      previewUrl: string;
      sampleUrl?: string;
      rating?: "s" | "q" | "e";
      tags?: string;
      publishedAt?: number;
    } | undefined = undefined;

    // Only perform heavy mapping for network posts (Browse tab)
    if (isNetworkPost) {
      // Map fields with fallbacks for both camelCase (DB) and snake_case (API) formats
      const fileUrl =
        post.fileUrl ||
        raw.file_url ||
        raw.fileUrl ||
        "";

      const previewUrl =
        post.previewUrl ||
        raw.preview_url ||
        raw.preview_file_url ||
        raw.previewUrl ||
        "";

      const sampleUrl =
        post.sampleUrl ||
        raw.sample_url ||
        raw.sampleUrl ||
        "";

      // Handle tags: can be Array (from API) or String (from DB)
      let tagsStr = "";
      if (Array.isArray(post.tags)) {
        tagsStr = post.tags.join(" ");
      } else if (typeof post.tags === "string") {
        tagsStr = post.tags;
      } else if (raw.tags) {
        // Fallback for raw API response
        tagsStr = Array.isArray(raw.tags)
          ? raw.tags.join(" ")
          : String(raw.tags || "");
      }

      // Normalize rating: convert full words to single characters
      // API may return "explicit", "safe", "questionable" or "s", "q", "e"
      const normalizeRating = (
        value: string | undefined | null
      ): "s" | "q" | "e" => {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          // Default to "q" if missing or empty
          return "q";
        }

        const normalized = value.toLowerCase().trim();

        // Handle full words
        if (normalized === "explicit") return "e";
        if (normalized === "safe") return "s";
        if (normalized === "questionable") return "q";

        // Handle single characters (already correct format)
        if (normalized === "e" || normalized === "s" || normalized === "q") {
          return normalized;
        }

        // Default to "q" for unknown values
        return "q";
      };

      const rawRating = post.rating || raw.rating;
      const rating = normalizeRating(
        typeof rawRating === "string" ? rawRating : rawRating ? String(rawRating) : undefined
      );

      // Handle publishedAt: can be Date, number (timestamp), or snake_case field
      let publishedAt: number | undefined;
      if (post.publishedAt instanceof Date) {
        publishedAt = post.publishedAt.getTime();
      } else if (typeof post.publishedAt === "number") {
        publishedAt = post.publishedAt;
      } else if (raw.published_at) {
        publishedAt =
          typeof raw.published_at === "number"
            ? raw.published_at
            : new Date(raw.published_at).getTime();
      } else if (raw.created_at) {
        // Fallback to created_at if published_at is missing
        publishedAt =
          typeof raw.created_at === "number"
            ? raw.created_at
            : new Date(raw.created_at).getTime();
      } else if (raw.createdAt instanceof Date) {
        publishedAt = raw.createdAt.getTime();
      } else if (typeof raw.createdAt === "number") {
        publishedAt = raw.createdAt;
      }

      // Sanity check: fileUrl is required (NOT NULL constraint)
      if (!fileUrl || fileUrl.trim() === "") {
        log.error(
          "[ViewerController] Cannot toggle favorite: fileUrl is missing after mapping",
          {
            postId: post.id,
            postPostId: post.postId,
            hasFileUrl: !!post.fileUrl,
            hasRawFileUrl: !!raw.file_url,
            rawKeys: Object.keys(raw || {}),
          }
        );
        // Don't revert optimistic update here - it will be reverted in catch block
        throw new Error("fileUrl is required for network posts");
      }

      // Sanity check: previewUrl is required (NOT NULL constraint)
      if (!previewUrl || previewUrl.trim() === "") {
        log.error(
          "[ViewerController] Cannot toggle favorite: previewUrl is missing after mapping",
          {
            postId: post.id,
            postPostId: post.postId,
            hasPreviewUrl: !!post.previewUrl,
            hasRawPreviewUrl: !!raw.preview_url,
            rawKeys: Object.keys(raw || {}),
          }
        );
        // Don't revert optimistic update here - it will be reverted in catch block
        throw new Error("previewUrl is required for network posts");
      }

      // Create postData only for network posts
      postData = {
        postId: post.postId || raw.id || raw.post_id || 0,
        artistId: post.artistId || raw.artist_id || raw.artistId || 0,
        fileUrl: fileUrl.trim(),
        previewUrl: previewUrl.trim(),
        sampleUrl: sampleUrl.trim(),
        rating: rating || undefined,
        tags: tagsStr,
        publishedAt,
      };
    }

    // OPTIMISTIC UPDATE
    setIsFavorited(!previousState);

    try {
      // For local posts: postData is undefined (old behavior preserved)
      // For network posts: postData contains mapped data
      const newState = await window.api.togglePostFavorite(post.id, postData);
      setIsFavorited(newState);

      // Update artist gallery cache if post has artistId
      if (post.artistId) {
        const artistQueryKey = ["posts", post.artistId];
        queryClient.setQueryData<InfiniteData<Post[]>>(artistQueryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) =>
                p.id === post.id ? { ...p, isFavorited: newState } : p
              )
            ),
          };
        });
      }

      // Update updates feed cache
      const updatesQueryKey = ["posts", "updates"];
      queryClient.setQueryData<InfiniteData<Post[]>>(updatesQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((p) =>
              p.id === post.id ? { ...p, isFavorited: newState } : p
            )
          ),
        };
      });

      // Update search cache (for Browse page) if post is from search
      if (queue.origin.kind === "search") {
        const searchQueryKey = ["search", queue.origin.tags];
        queryClient.setQueryData<InfiniteData<Post[]>>(searchQueryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) =>
                p.id === post.id ? { ...p, isFavorited: newState } : p
              )
            ),
          };
        });
      }

      // Update favorites cache separately
      const favoritesQueryKey = ["posts", "favorites"];
      const oldFavoritesData = queryClient.getQueryData<InfiniteData<Post[]>>(favoritesQueryKey);
      
      if (oldFavoritesData) {
        queryClient.setQueryData<InfiniteData<Post[]>>(favoritesQueryKey, (old) => {
          if (!old) return old;
          
          // If removing from favorites, filter out the post
          if (!newState) {
            return {
              ...old,
              pages: old.pages
                .map((page) => page.filter((p) => p.id !== post.id))
                .filter((page) => page.length > 0),
            };
          }
          
          // If adding to favorites, update existing post
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) =>
                p.id === post.id ? { ...p, isFavorited: newState } : p
              )
            ),
          };
        });
      }

      // Invalidate favorites query if removing from favorites or post not in cache
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
