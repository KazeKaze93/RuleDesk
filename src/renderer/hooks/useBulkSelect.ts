import { create } from "zustand";

interface BulkSelectState {
  isBulkMode: boolean;
  selectedIds: Set<number>;
  activateBulkMode: () => void;
  deactivate: () => void;
  toggleId: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
}

export const useBulkSelect = create<BulkSelectState>((set) => ({
  isBulkMode: false,
  selectedIds: new Set<number>(),
  activateBulkMode: () => set({ isBulkMode: true }),
  deactivate: () =>
    set({
      isBulkMode: false,
      selectedIds: new Set<number>(),
    }),
  toggleId: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    }),
  selectAll: (ids) =>
    set({
      selectedIds: new Set(ids),
      isBulkMode: true,
    }),
  clearSelection: () => set({ selectedIds: new Set<number>() }),
}));
