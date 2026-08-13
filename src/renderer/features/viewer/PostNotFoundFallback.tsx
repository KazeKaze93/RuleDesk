import { useEffect, useRef, useState, type ReactNode } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import log from "electron-log/renderer";
import type { Post } from "@shared/types/db";
import type { SearchBooruPageResult } from "../../../shared/schemas/search";
import { parsePlaylistQuery } from "../../../shared/schemas/playlist";
import { Button } from "../../components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import type { ViewerOrigin } from "../../store/viewerStore";
import { flattenInfinitePostPages } from "../../utils/react-query-cache";
import { buildViewerOriginQueryKey } from "./buildViewerOriginQueryKey";

/**
 * PostNotFoundFallback: Handles shadow insert for remote posts not in cache
 *
 * When a post from a playlist is not found in cache, this component:
 * 1. Checks if it's a remote post (id=0) in infiniteData
 * 2. If found, triggers shadow insert to cache it in local DB
 * 3. After insert, updates the cache and renders the post
 */
export const PostNotFoundFallback = ({
  currentPostId,
  queue,
  infiniteData,
  onPostFound,
  onClose,
}: {
  currentPostId: number;
  queue: {
    ids: number[];
    origin: ViewerOrigin | undefined;
    totalGlobalCount?: number;
  };
  infiniteData?: InfiniteData<Post[] | SearchBooruPageResult<Post>>;
  onPostFound: (post: Post) => ReactNode;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [isInserting, setIsInserting] = useState(false);
  const [insertedPost, setInsertedPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AbortController для отмены запросов при быстром переключении постов
  // Предотвращает забивание очереди ненужными запросами
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Отменить предыдущий запрос при изменении currentPostId
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Try to find remote post in infiniteData
    // Only attempt shadow insert for playlist origin (remote posts from playlists)
    if (!infiniteData || queue.origin?.kind !== "playlist") {
      // For non-playlist origins, if post is not found, it's a real error
      // Don't attempt shadow insert - these posts should already be in cache
      if (!infiniteData) {
        setError("Post not found in cache. This may indicate a data synchronization issue.");
      }
      return;
    }

    const allPosts = flattenInfinitePostPages(infiniteData);
    const foundPost = allPosts.find((p) =>
      p.id === currentPostId || (p.id === 0 && p.postId === currentPostId)
    );

    if (!foundPost || foundPost.id !== 0) {
      // Not a remote post or not found - show error
      if (!foundPost) {
        setError(`Post not found in cache (ID: ${currentPostId})`);
      }
      return;
    }

    // Found remote post - trigger shadow insert
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const performShadowInsert = async () => {
      // Check if request was already aborted before starting
      if (abortController.signal.aborted) {
        return;
      }

      setIsInserting(true);
      setError(null);

      try {
        // Validate required field
        if (!foundPost.postId) {
          throw new Error("Post ID is required for shadow insert");
        }

        // CRITICAL SECURITY: Renderer only passes postId and provider to Main process.
        // Main process fetches post data from API to ensure data integrity.
        // This prevents Renderer from injecting malicious URLs or data.

        // Determine provider from playlist metadata or origin
        // Priority: 1) origin.provider (from playlist queryJson), 2) fetched playlist provider, 3) default rule34
        let provider: "rule34" | "gelbooru" = "rule34";

        if (queue.origin?.kind === "playlist") {
          // First, check if provider is already in origin (from playlist queryJson)
          if (queue.origin.provider) {
            provider = queue.origin.provider;
          } else {
            // Fallback: fetch playlist to get provider from queryJson
            // Check abort signal before async operation
            if (abortController.signal.aborted) {
              return;
            }

            try {
              const playlist = await window.api.getPlaylist(queue.origin.playlistId);

              // Check abort signal after async operation
              if (abortController.signal.aborted) {
                return;
              }

              // SECURITY: Validate queryJson using parsePlaylistQuery utility
              // This prevents crashes from invalid JSON or malicious data
              if (playlist?.isSmart && playlist.queryJson) {
                const parsedQuery = parsePlaylistQuery(
                  playlist.queryJson,
                  playlist.querySchemaVersion
                );
                if (parsedQuery?.provider) {
                  provider = parsedQuery.provider;
                }
              }
            } catch (error) {
              // Ignore errors if request was aborted
              if (abortController.signal.aborted) {
                return;
              }
              log.warn(`[ViewerDialog] Failed to get playlist for provider detection:`, error);
              // Fallback to default provider
            }
          }
        }

        // Check abort signal before shadow insert
        if (abortController.signal.aborted) {
          return;
        }

        // Perform shadow insert - Main process fetches data from API
        const insertedPost = await window.api.shadowInsertPost({
          postId: foundPost.postId,
          provider,
        });

        // CRITICAL: Check if request was aborted after async operation
        // If user switched posts, ignore the result to prevent stale data
        if (abortController.signal.aborted) {
          log.debug(`[ViewerDialog] Shadow insert aborted for postId ${foundPost.postId} (user switched posts)`);
          return;
        }

        log.info(`[ViewerDialog] Shadow insert successful: postId ${foundPost.postId} -> local id ${insertedPost.id}`);

        // CRITICAL: Check if component is still mounted and currentPostId hasn't changed
        // before updating cache to prevent race conditions
        // If user closed dialog or switched posts, don't mutate global cache
        if (abortController.signal.aborted) {
          log.debug(`[ViewerDialog] Skipping cache update - request was aborted (user switched posts)`);
          return;
        }

        // Double-check: verify currentPostId matches the post we just inserted
        // This prevents updating cache for a post that's no longer being viewed
        if (currentPostId !== foundPost.postId && currentPostId !== foundPost.postId) {
          log.debug(`[ViewerDialog] Skipping cache update - currentPostId changed (${currentPostId} vs ${foundPost.postId})`);
          return;
        }

        // Update cache with inserted post (no setTimeout needed - we have the post object)
        if (queue.origin && queue.origin.kind === "playlist") {
          const queryKey = buildViewerOriginQueryKey(queue.origin);
          if (queryKey) {
            // Update cache directly with inserted post
            // Use functional update to ensure we're working with latest cache state
            queryClient.setQueryData<InfiniteData<Post[]>>(queryKey, (oldData) => {
              if (!oldData) return oldData;

              // Replace remote post (id=0) with inserted post in cache
              const updatedPages = oldData.pages.map(page =>
                page.map(p =>
                  (p.id === 0 && p.postId === foundPost.postId) ? insertedPost : p
                )
              );

              return {
                ...oldData,
                pages: updatedPages,
              };
            });
          }
        }

        // Use the returned post directly (no setTimeout needed)
        setInsertedPost(insertedPost);
        setIsInserting(false);
      } catch (err) {
        // Ignore errors if request was aborted (user switched posts)
        if (abortController.signal.aborted) {
          log.debug(`[ViewerDialog] Shadow insert error ignored (request aborted):`, err);
          return;
        }

        log.error(`[ViewerDialog] Shadow insert failed for postId ${foundPost.postId}:`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || "Failed to cache post");
        setIsInserting(false);
      }
    };

    performShadowInsert();

    // Cleanup: abort request on unmount or when currentPostId changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [currentPostId, infiniteData, queue, queryClient]);

  // If post was inserted, render it
  if (insertedPost) {
    return <>{onPostFound(insertedPost)}</>;
  }

  // Show loading or error state
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full text-white">
      {isInserting ? (
        <>
          <Loader2 className="w-10 h-10 animate-spin" />
          <div className="text-lg font-semibold">Caching post...</div>
          <div className="text-sm text-white/70">
            Post ID: {currentPostId}
          </div>
        </>
      ) : error ? (
        <>
          <div className="text-lg font-semibold">Failed to cache post</div>
          <div className="text-sm text-white/70">
            {error}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                // Reset error state and trigger retry by clearing insertedPost
                setError(null);
                setInsertedPost(null);
                setIsInserting(false);
                // Trigger useEffect again by clearing abortController
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                  abortControllerRef.current = null;
                }
              }}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Close
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="text-lg font-semibold">Post not found in cache</div>
          <div className="text-sm text-white/70">
            Post ID: {currentPostId}
            <br />
            Origin: {queue.origin?.kind}
            {queue.origin?.kind === "playlist" && (
              <>
                <br />
                Playlist ID: {queue.origin.playlistId}
              </>
            )}
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-white border-white/20 hover:bg-white/10"
          >
            Close
          </Button>
        </>
      )}
    </div>
  );
};
