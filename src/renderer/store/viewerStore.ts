import { create } from "zustand";

export type ViewerOrigin =
  | { kind: "browse"; filters?: string }
  | { kind: "search"; tags: string[] }
  | { kind: "favorites"; tags?: string[] }
  | { kind: "updates"; tags?: string[] }
  | { kind: "artist"; artistId: number; tags?: string[]; aiFilter?: "all" | "hide" | "only"; mediaType?: "all" | "images" | "videos" }
  | { kind: "playlist"; playlistId: number; mediaType?: "all" | "images" | "videos"; sortOrder?: "asc" | "desc"; provider?: "rule34" | "gelbooru" };

// Очередь просмотра
export interface ViewerQueue {
  origin: ViewerOrigin;
  ids: number[];
  initialIndex: number;
  listKey: string;
  totalGlobalCount?: number;
  hasNextPage?: boolean;
  onLoadMore?: () => void | Promise<void>;
  // NOTE: isRandom removed - randomization should be part of API query parameters, not global state
  // This prevents conflicts when multiple viewers or content types are open
}

interface ViewerState {
  isOpen: boolean;
  controlsVisible: boolean;
  isTagsDrawerOpen: boolean;

  queue: ViewerQueue | null;
  currentIndex: number;
  currentPostId: number | null;

  open: (queue: ViewerQueue) => void;
  close: () => void;

  next: () => void;
  prev: () => void;

  toggleTagsDrawer: () => void;
  setControlsVisible: (visible: boolean) => void;
  updateQueueIds: (ids: number[]) => void;
  appendQueueIds: (newIds: number[]) => void;
  // NOTE: setQueueIsRandom removed - randomization should be part of API query parameters
  // Use searchStore.isRandom for search queries, pass isRandom in API params for other origins
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  isOpen: false,
  controlsVisible: true,
  isTagsDrawerOpen: false,
  queue: null,
  currentIndex: 0,
  currentPostId: null,

  open: (queue) => {
    const safeIndex = Math.max(
      0,
      Math.min(queue.initialIndex, queue.ids.length - 1)
    );

    set({
      isOpen: true,
      queue,
      currentIndex: safeIndex,
      currentPostId: queue.ids[safeIndex] || null,
      controlsVisible: true,
      isTagsDrawerOpen: false,
    });
  },

  close: () =>
    set({
      isOpen: false,
      queue: null,
      currentPostId: null,
    }),

  next: () => {
    const { queue, currentIndex } = get();
    if (!queue) return;

    // Sequential navigation only - randomization is handled at API query level
    // This prevents conflicts when multiple viewers or content types are open
    if (currentIndex < queue.ids.length - 1) {
      const newIndex = currentIndex + 1;
      set({
        currentIndex: newIndex,
        currentPostId: queue.ids[newIndex],
      });
    }
  },

  prev: () => {
    const { queue, currentIndex } = get();
    if (!queue) return;

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      set({
        currentIndex: newIndex,
        currentPostId: queue.ids[newIndex],
      });
    }
  },

  toggleTagsDrawer: () =>
    set((state) => ({ isTagsDrawerOpen: !state.isTagsDrawerOpen })),

  setControlsVisible: (visible) => set({ controlsVisible: visible }),

  updateQueueIds: (newIds) =>
    set((state) => {
      if (!state.queue) return {};
      return {
        queue: { ...state.queue, ids: newIds },
      };
    }),

  appendQueueIds: (newIds) =>
    set((state) => {
      if (!state.queue) return {};
      const existingIds = new Set(state.queue.ids);
      const uniqueNewIds = newIds.filter((id) => !existingIds.has(id));
      return {
        queue: {
          ...state.queue,
          ids: [...state.queue.ids, ...uniqueNewIds],
        },
      };
    }),
}));
