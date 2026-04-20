import { useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { useShallow } from "zustand/react/shallow";
import { Loader2 } from "lucide-react";
import log from "electron-log/renderer";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import type { Post } from "../../../main/db/schema";
import { useViewerStore } from "../../store/viewerStore";
import { PostNotFoundFallback } from "./components/PostNotFoundFallback";
import { ViewerControls } from "./components/ViewerControls";
import { useCurrentPost } from "./hooks/useCurrentPost";
import { useViewerAutoHide } from "./hooks/useViewerAutoHide";
import { useViewerKeyboard } from "./hooks/useViewerKeyboard";
import { useImagePreload } from "./hooks/useImagePreload";
import type { ViewerKeyboardActionsRef } from "./types";

export const ViewerDialog = () => {
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

  const { controlsVisible, setControlsVisible, isTagsDrawerOpen, toggleTagsDrawer } =
    useViewerStore(
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

  const { post, getPostById } = useCurrentPost(currentPostId, queue?.origin);
  const queryClient = useQueryClient();
  const keyboardActionsRef = useRef<ViewerKeyboardActionsRef>({});

  useViewerKeyboard({
    enabled: isOpen,
    next,
    prev,
    close,
    isTagsDrawerOpen,
    toggleTagsDrawer,
    actionsRef: keyboardActionsRef,
  });

  useViewerAutoHide(isOpen, setControlsVisible);

  const prevNeighborId =
    queue && currentIndex > 0 ? queue.ids[currentIndex - 1] : undefined;
  const nextNeighborId =
    queue && currentIndex < queue.ids.length - 1
      ? queue.ids[currentIndex + 1]
      : undefined;

  const prevPost = prevNeighborId !== undefined ? getPostById(prevNeighborId) : undefined;
  const nextPost = nextNeighborId !== undefined ? getPostById(nextNeighborId) : undefined;

  useImagePreload(prevPost, nextPost);

  const infiniteData = useMemo(() => {
    if (!queue?.origin) return undefined;

    let queryKey: unknown[] = [];
    if (queue.origin.kind === "playlist") {
      queryKey = [
        "playlist-posts",
        queue.origin.playlistId,
        queue.origin.mediaType ?? "all",
        queue.origin.sortOrder ?? "desc",
      ];
    } else if (queue.origin.kind === "artist") {
      const aiFilter = queue.origin.aiFilter ?? "all";
      const mediaType = queue.origin.mediaType ?? "all";
      queryKey = ["posts", queue.origin.artistId, aiFilter, mediaType];
    } else if (queue.origin.kind === "favorites") {
      queryKey =
        queue.origin.tags && queue.origin.tags.length > 0
          ? ["posts", "favorites", queue.origin.tags]
          : ["posts", "favorites"];
    } else if (queue.origin.kind === "updates") {
      queryKey =
        queue.origin.tags && queue.origin.tags.length > 0
          ? ["posts", "updates", queue.origin.tags]
          : ["posts", "updates"];
    } else if (queue.origin.kind === "search") {
      queryKey = ["search", queue.origin.tags];
    } else {
      return undefined;
    }

    return queryClient.getQueryData<InfiniteData<Post[]>>(queryKey);
  }, [queue, queryClient]);

  useEffect(() => {
    if (!isOpen || !queue || !queue.origin) return;

    const loadedCount = queue.ids.length;
    const threshold = 5;

    const isNearEnd = currentIndex >= loadedCount - threshold;
    const hasReachedLimit =
      (queue.totalGlobalCount && loadedCount >= queue.totalGlobalCount) ||
      !queue.hasNextPage;

    if (isNearEnd && !hasReachedLimit) {
      if (queue.onLoadMore) {
        log.info(
          `[Viewer] Triggering onLoadMore callback at index ${currentIndex}. Loaded: ${loadedCount}`
        );
        queue.onLoadMore();
      }
    }
  }, [isOpen, queue, currentIndex]);

  const artistId =
    queue?.origin?.kind === "artist" ? queue.origin.artistId : null;
  const queueIdsLength = queue?.ids.length ?? 0;
  const hasOnLoadMore = !!queue?.onLoadMore;

  useEffect(() => {
    if (!isOpen || !queue || !queue.origin) return;

    if (!queue.onLoadMore) return;

    let queryKey: unknown[] = [];
    if (queue.origin.kind === "artist") {
      const aiFilter = queue.origin.aiFilter ?? "all";
      const mediaType = queue.origin.mediaType ?? "all";
      queryKey = ["posts", queue.origin.artistId, aiFilter, mediaType];
    } else if (queue.origin.kind === "favorites") {
      queryKey =
        queue.origin.tags && queue.origin.tags.length > 0
          ? ["posts", "favorites", queue.origin.tags]
          : ["posts", "favorites"];
    } else if (queue.origin.kind === "updates") {
      queryKey =
        queue.origin.tags && queue.origin.tags.length > 0
          ? ["posts", "updates", queue.origin.tags]
          : ["posts", "updates"];
    } else if (queue.origin.kind === "search") {
      queryKey = ["search", queue.origin.tags];
    } else if (queue.origin.kind === "playlist") {
      queryKey = [
        "playlist-posts",
        queue.origin.playlistId,
        queue.origin.mediaType ?? "all",
        queue.origin.sortOrder ?? "desc",
      ];
    } else {
      return;
    }

    const data = queryClient.getQueryData<InfiniteData<Post[]>>(queryKey);

    if (data) {
      const allLoadedPosts = data.pages.flatMap((page) => page);
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="
          fixed inset-0 left-0 top-0 translate-x-0 translate-y-0
          z-50 flex flex-col
          w-screen h-screen max-w-none
          p-0 m-0 gap-0
          border-none bg-transparent shadow-none outline-none
          sm:rounded-none
          [&>button]:hidden
        "
      >
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        <DialogDescription className="sr-only">
          View and navigate through posts. Use arrow keys to navigate, Escape to
          close.
        </DialogDescription>

        <div className="absolute inset-0 backdrop-blur-md pointer-events-none bg-black/60" />

        <div className="flex relative z-10 flex-col justify-center items-center w-full h-full">
          {post ? (
            <ViewerControls
              key={post.id}
              post={post}
              queue={queue}
              close={close}
              next={next}
              prev={prev}
              controlsVisible={controlsVisible}
              toggleTagsDrawer={toggleTagsDrawer}
              isTagsDrawerOpen={isTagsDrawerOpen}
              keyboardActionsRef={keyboardActionsRef}
            />
          ) : currentPostId !== null && queue ? (
            <PostNotFoundFallback
              currentPostId={currentPostId}
              queue={queue}
              infiniteData={infiniteData}
              onPostFound={(foundPost) => (
                <ViewerControls
                  key={foundPost.id}
                  post={foundPost}
                  queue={queue}
                  close={close}
                  next={next}
                  prev={prev}
                  controlsVisible={controlsVisible}
                  toggleTagsDrawer={toggleTagsDrawer}
                  isTagsDrawerOpen={isTagsDrawerOpen}
                  keyboardActionsRef={keyboardActionsRef}
                />
              )}
              onClose={close}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-white">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
