import { create } from "zustand";

export type ViewerOrigin =
  | { kind: "browse"; filters?: string }
  | { kind: "search"; tags: string[] }
  | { kind: "favorites" }
  | { kind: "updates" }
  | { kind: "artist"; artistId: number };

// Очередь просмотра
export interface ViewerQueue {
  origin: ViewerOrigin;
  ids: number[];
  initialIndex: number;
  listKey: string;
  totalGlobalCount?: number;
  hasNextPage?: boolean;
  onLoadMore?: () => void | Promise<void>;
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
