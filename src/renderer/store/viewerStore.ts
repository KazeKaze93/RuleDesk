import { create } from "zustand";

export type ViewerOrigin =
  | { kind: "browse"; filters?: string }
  | { kind: "search"; tags: string[] }
  | { kind: "favorites"; tags?: string[] }
  | { kind: "updates"; tags?: string[] }
  | { kind: "artist"; artistId: number; tags?: string[]; aiFilter?: "all" | "hide" | "only"; mediaType?: "all" | "images" | "videos" }
  | { kind: "playlist"; playlistId: number; mediaType?: "all" | "images" | "videos"; sortOrder?: "asc" | "desc" };

// Очередь просмотра
export interface ViewerQueue {
  origin: ViewerOrigin;
  ids: number[];
  initialIndex: number;
  listKey: string;
  totalGlobalCount?: number;
  hasNextPage?: boolean;
  onLoadMore?: () => void | Promise<void>;
  isRandom?: boolean; // Store isRandom state in queue for viewer navigation
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
  setQueueIsRandom: (isRandom: boolean) => void;
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

    // Check if random mode is enabled (from queue or fallback to false)
    const isRandom = queue.isRandom ?? false;
    
    if (isRandom && queue.ids.length > 1) {
      // Random navigation: use shuffle-bag algorithm to avoid showing same posts
      // Create a shuffled array of available indices
      const availableIndices = queue.ids.map((_, idx) => idx);
      
      // Fisher-Yates shuffle for better randomness
      for (let i = availableIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
      }
      
      // Find current index in shuffled array and pick next one
      const currentShuffledIndex = availableIndices.indexOf(currentIndex);
      const nextShuffledIndex = (currentShuffledIndex + 1) % availableIndices.length;
      const randomIndex = availableIndices[nextShuffledIndex];
      
      set({
        currentIndex: randomIndex,
        currentPostId: queue.ids[randomIndex],
      });
    } else {
      // Sequential navigation
      if (currentIndex < queue.ids.length - 1) {
        const newIndex = currentIndex + 1;
        set({
          currentIndex: newIndex,
          currentPostId: queue.ids[newIndex],
        });
      }
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

  setQueueIsRandom: (isRandom) =>
    set((state) => {
      if (!state.queue) return {};
      return {
        queue: { ...state.queue, isRandom },
      };
    }),
}));
