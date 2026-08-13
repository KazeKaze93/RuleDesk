import { useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { useShallow } from "zustand/react/shallow";
import log from "electron-log/renderer";
import { useViewerStore } from "../../store/viewerStore";
import { Loader2 } from "lucide-react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import type { Post } from "@shared/types/db";
import type { SearchBooruPageResult } from "../../../shared/schemas/search";
import { cn } from "../../lib/utils";
import {
  flattenInfinitePostPages,
  searchBrowseHasNextPage,
} from "../../utils/react-query-cache";
import { releaseRadixModalLock } from "../../lib/radix-modal-lock";
import { VIEWER_SHELL_Z } from "./viewer-layers";
import { buildViewerOriginQueryKey } from "./buildViewerOriginQueryKey";
import { useCurrentPost } from "./hooks/useCurrentPost";
import { PostNotFoundFallback } from "./PostNotFoundFallback";
import { ViewerContent } from "./ViewerContent";

const BROWSE_POSTS_PER_PAGE = 50;

const VIEWER_DIALOG_CONTENT_CLASS = cn(
  VIEWER_SHELL_Z,
  "fixed inset-0 left-0 top-0 translate-x-0 translate-y-0",
  "flex flex-col",
  "w-screen h-screen max-w-none",
  "p-0 m-0 gap-0",
  "border-none bg-transparent shadow-none outline-none",
  "sm:rounded-none",
  "[&>button]:hidden"
);

export const ViewerDialog = () => {
  // Split Zustand selectors into logical groups to minimize re-renders
  const { isOpen, close } = useViewerStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      close: state.close,
    }))
  );

  const { currentPostId, queue } = useViewerStore(
    useShallow((state) => ({
      currentPostId: state.currentPostId,
      queue: state.queue,
    }))
  );

  const { currentIndex, next, prev } = useViewerStore(
    useShallow((state) => ({
      currentIndex: state.currentIndex,
      next: state.next,
      prev: state.prev,
    }))
  );

  const { controlsVisible, setControlsVisible, isTagsDrawerOpen, toggleTagsDrawer } = useViewerStore(
    useShallow((state) => ({
      controlsVisible: state.controlsVisible,
      setControlsVisible: state.setControlsVisible,
      isTagsDrawerOpen: state.isTagsDrawerOpen,
      toggleTagsDrawer: state.toggleTagsDrawer,
    }))
  );

  const { appendQueueIds } = useViewerStore(
    useShallow((state) => ({
      appendQueueIds: state.appendQueueIds,
    }))
  );

  const cachedPost = useCurrentPost(currentPostId, queue?.origin);
  const queryClient = useQueryClient();

  // Fallback to the snapshot captured when the viewer opened. This guarantees a
  // post the user just clicked is always renderable, even if the React Query
  // cache lookup misses (e.g. key drift), instead of showing "not found in cache".
  const post = useMemo(() => {
    if (cachedPost) return cachedPost;
    if (currentPostId === null || !queue?.posts) return undefined;
    return queue.posts.find(
      (p) => p.id === currentPostId || p.postId === currentPostId
    );
  }, [cachedPost, currentPostId, queue]);

  // Get infiniteData for fallback lookup (for remote posts)
  // React Compiler: Use queue directly instead of queue?.origin to match inferred dependencies
  const infiniteData = useMemo(() => {
    if (!queue?.origin) return undefined;

    const queryKey = buildViewerOriginQueryKey(queue.origin);
    if (!queryKey) {
      return undefined;
    }

    return queryClient.getQueryData<
      InfiniteData<Post[] | SearchBooruPageResult<Post>>
    >(queryKey);
  }, [queue, queryClient]);

  const liveHasNextPage = useMemo(() => {
    if (!queue) {
      return false;
    }
    if (queue.origin?.kind === "search" && infiniteData) {
      return searchBrowseHasNextPage(infiniteData, BROWSE_POSTS_PER_PAGE);
    }
    return queue.hasNextPage ?? false;
  }, [queue, infiniteData]);

  useEffect(() => {
    if (!isOpen || !queue || !queue.origin) return;

    const loadedCount = queue.ids.length;
    const threshold = 5;

    const isNearEnd = currentIndex >= loadedCount - threshold;
    const hasReachedLimit =
      (queue.totalGlobalCount && loadedCount >= queue.totalGlobalCount) ||
      !liveHasNextPage;

    if (isNearEnd && !hasReachedLimit) {
      if (queue.onLoadMore) {
        log.info(
          `[Viewer] Triggering onLoadMore callback at index ${currentIndex}. Loaded: ${loadedCount}`
        );
        queue.onLoadMore();
        return;
      }
    }
  }, [isOpen, queue, currentIndex, liveHasNextPage]);

  const artistId =
    queue?.origin?.kind === "artist" ? queue.origin.artistId : null;
  const queueIdsLength = queue?.ids.length ?? 0;
  const hasOnLoadMore = !!queue?.onLoadMore;

  useEffect(() => {
    if (!isOpen || !queue || !queue.origin) return;

    if (!queue.onLoadMore) return;

    // Query keys are consistent with component query keys.
    // Keep this mapping in sync with page query keys to avoid cache drift.
    // - Search: ["search", tags, source, aiFilter, mediaType, sortOrder]
    // - Artist: ["posts", artistId, aiFilter, mediaType, source, sortOrder]
    // - Favorites/Updates: ["posts", <tab>, tags]
    // - Playlist: ["playlist-posts", playlistId, mediaType, aiFilter, sortOrder]
    const queryKey = buildViewerOriginQueryKey(queue.origin);
    if (!queryKey) {
      return;
    }

    const infiniteData = queryClient.getQueryData<
      InfiniteData<Post[] | SearchBooruPageResult<Post>>
    >(queryKey);

    if (infiniteData) {
      const allLoadedPosts = flattenInfinitePostPages(infiniteData);
      const loadedPostIds = new Set(queue.ids);
      const newPosts = allLoadedPosts.filter((p) => !loadedPostIds.has(p.id));

      if (newPosts.length > 0) {
        const newPostIds = newPosts.map((p) => p.id);
        appendQueueIds(newPostIds);
      }
    }
  }, [
    isOpen,
    queue,
    queueIdsLength,
    artistId,
    hasOnLoadMore,
    queryClient,
    appendQueueIds,
  ]);

  const handleNavigationKeys = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      // Don't handle shortcuts when user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "Escape":
          e.preventDefault();
          if (isTagsDrawerOpen) {
            toggleTagsDrawer();
          } else {
            close();
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          // Favorite toggle will be handled in ViewerContent
          break;
        case "v":
        case "V":
          e.preventDefault();
          // Mark viewed will be handled in ViewerContent
          break;
        case "t":
        case "T":
          e.preventDefault();
          toggleTagsDrawer();
          break;
      }
    },
    [isOpen, next, prev, close, isTagsDrawerOpen, toggleTagsDrawer]
  );

  const handleSideMouseExit = useCallback(() => {
    if (!isOpen) {
      return;
    }
    if (isTagsDrawerOpen) {
      toggleTagsDrawer();
      return;
    }
    close();
  }, [isOpen, isTagsDrawerOpen, toggleTagsDrawer, close]);

  useEffect(() => {
    window.addEventListener("keydown", handleNavigationKeys);
    return () => window.removeEventListener("keydown", handleNavigationKeys);
  }, [handleNavigationKeys]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const isSideButton = (button: number): boolean => button === 3 || button === 4;

    const blockSideButtons = (event: MouseEvent) => {
      if (!isSideButton(event.button)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handleSideButtons = (event: MouseEvent) => {
      if (!isSideButton(event.button)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      handleSideMouseExit();
    };

    window.addEventListener("mousedown", blockSideButtons, { capture: true });
    window.addEventListener("mouseup", handleSideButtons, { capture: true });
    window.addEventListener("auxclick", handleSideButtons, { capture: true });

    return () => {
      window.removeEventListener("mousedown", blockSideButtons, true);
      window.removeEventListener("mouseup", handleSideButtons, true);
      window.removeEventListener("auxclick", handleSideButtons, true);
    };
  }, [isOpen, handleSideMouseExit]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 2000);
    };

    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      setControlsVisible(true);
      timeout = setTimeout(() => setControlsVisible(false), 2000);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isOpen, setControlsVisible]);

  useEffect(() => {
    if (!isOpen) {
      releaseRadixModalLock();
      const frameId = requestAnimationFrame(() => {
        releaseRadixModalLock();
      });
      return () => {
        cancelAnimationFrame(frameId);
      };
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    return () => {
      releaseRadixModalLock();
    };
  }, []);

  // modal={true}: block background clicks/focus; releaseRadixModalLock on close prevents body lock leak.
  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          releaseRadixModalLock();
          close();
        }
      }}
    >
      {isOpen ? (
      <DialogContent
        overlayClassName={cn(VIEWER_SHELL_Z, "bg-black/80")}
        className={VIEWER_DIALOG_CONTENT_CLASS}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        <DialogDescription className="sr-only">
          View and navigate through posts. Use arrow keys to navigate, Escape to
          close.
        </DialogDescription>

        <div className="absolute inset-0 pointer-events-none backdrop-blur-md bg-black/60" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full h-full pointer-events-auto">
          {post ? (
            <ViewerContent
              key={post.id > 0 ? post.id : post.postId}
              post={post}
              queue={queue}
              close={close}
              next={next}
              prev={prev}
              controlsVisible={controlsVisible}
              toggleTagsDrawer={toggleTagsDrawer}
              isTagsDrawerOpen={isTagsDrawerOpen}
            />
          ) : currentPostId !== null && queue ? (
            // Post not found in cache - try shadow insert for remote posts
            <PostNotFoundFallback
              currentPostId={currentPostId}
              queue={queue}
              infiniteData={infiniteData}
              onPostFound={(foundPost) => (
                <ViewerContent
                  key={foundPost.id > 0 ? foundPost.id : foundPost.postId}
                  post={foundPost}
                  queue={queue}
                  close={close}
                  next={next}
                  prev={prev}
                  controlsVisible={controlsVisible}
                  toggleTagsDrawer={toggleTagsDrawer}
                  isTagsDrawerOpen={isTagsDrawerOpen}
                />
              )}
              onClose={close}
            />
          ) : (
            // Loading state
            <div className="flex items-center justify-center w-full h-full text-white">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
      ) : null}
    </Dialog>
  );
};
