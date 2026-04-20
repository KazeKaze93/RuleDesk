import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import log from "electron-log/renderer";
import { Loader2, RefreshCw } from "lucide-react";
import type { Post } from "../../../../main/db/schema";
import { parsePlaylistQuery } from "../../../../shared/schemas/playlist";
import { Button } from "../../../components/ui/button";
import type { PostNotFoundFallbackProps } from "../types";

export function PostNotFoundFallback({
  currentPostId,
  queue,
  infiniteData,
  onPostFound,
  onClose,
}: PostNotFoundFallbackProps) {
  const queryClient = useQueryClient();
  const [isInserting, setIsInserting] = useState(false);
  const [insertedPost, setInsertedPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (!infiniteData || queue.origin?.kind !== "playlist") {
      if (!infiniteData) {
        setError(
          "Post not found in cache. This may indicate a data synchronization issue."
        );
      }
      return;
    }

    const allPosts = infiniteData.pages.flat();
    const foundPost = allPosts.find(
      (p) => p.id === currentPostId || (p.id === 0 && p.postId === currentPostId)
    );

    if (!foundPost || foundPost.id !== 0) {
      if (!foundPost) {
        setError(`Post not found in cache (ID: ${currentPostId})`);
      }
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const performShadowInsert = async () => {
      if (abortController.signal.aborted) {
        return;
      }

      setIsInserting(true);
      setError(null);

      try {
        if (!foundPost.postId) {
          throw new Error("Post ID is required for shadow insert");
        }

        let provider: "rule34" | "gelbooru" = "rule34";

        if (queue.origin?.kind === "playlist") {
          if (queue.origin.provider) {
            provider = queue.origin.provider;
          } else {
            if (abortController.signal.aborted) {
              return;
            }

            try {
              const playlist = await window.api.getPlaylist(queue.origin.playlistId);

              if (abortController.signal.aborted) {
                return;
              }

              if (playlist?.isSmart && playlist.queryJson) {
                const parsedQuery = parsePlaylistQuery(playlist.queryJson);
                if (parsedQuery?.provider) {
                  provider = parsedQuery.provider;
                }
              }
            } catch (err) {
              if (abortController.signal.aborted) {
                return;
              }
              log.warn(
                `[PostNotFoundFallback] Failed to get playlist for provider detection:`,
                err
              );
            }
          }
        }

        if (abortController.signal.aborted) {
          return;
        }

        const inserted = await window.api.shadowInsertPost({
          postId: foundPost.postId,
          provider,
        });

        if (abortController.signal.aborted) {
          log.debug(
            `[PostNotFoundFallback] Shadow insert aborted for postId ${foundPost.postId} (user switched posts)`
          );
          return;
        }

        log.info(
          `[PostNotFoundFallback] Shadow insert successful: postId ${foundPost.postId} -> local id ${inserted.id}`
        );

        if (abortController.signal.aborted) {
          log.debug(
            `[PostNotFoundFallback] Skipping cache update - request was aborted (user switched posts)`
          );
          return;
        }

        if (currentPostId !== foundPost.postId) {
          log.debug(
            `[PostNotFoundFallback] Skipping cache update - currentPostId changed (${currentPostId} vs ${foundPost.postId})`
          );
          return;
        }

        if (queue.origin && queue.origin.kind === "playlist") {
          const queryKey = [
            "playlist-posts",
            queue.origin.playlistId,
            queue.origin.mediaType ?? "all",
            queue.origin.sortOrder ?? "desc",
          ] as const;

          queryClient.setQueryData<InfiniteData<Post[]>>(queryKey, (oldData) => {
            if (!oldData) return oldData;

            const updatedPages = oldData.pages.map((page) =>
              page.map((p) =>
                p.id === 0 && p.postId === foundPost.postId ? inserted : p
              )
            );

            return {
              ...oldData,
              pages: updatedPages,
            };
          });
        }

        setInsertedPost(inserted);
        setIsInserting(false);
      } catch (err) {
        if (abortController.signal.aborted) {
          log.debug(`[PostNotFoundFallback] Shadow insert error ignored (request aborted):`, err);
          return;
        }

        log.error(`[PostNotFoundFallback] Shadow insert failed for postId ${foundPost.postId}:`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || "Failed to cache post");
        setIsInserting(false);
      }
    };

    void performShadowInsert();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [currentPostId, infiniteData, queue, queryClient]);

  if (insertedPost) {
    return <>{onPostFound(insertedPost)}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full text-white">
      {isInserting ? (
        <>
          <Loader2 className="w-10 h-10 animate-spin" />
          <div className="text-lg font-semibold">Caching post...</div>
          <div className="text-sm text-white/70">Post ID: {currentPostId}</div>
        </>
      ) : error ? (
        <>
          <div className="text-lg font-semibold">Failed to cache post</div>
          <div className="text-sm text-white/70">{error}</div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setInsertedPost(null);
                setIsInserting(false);
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
}
