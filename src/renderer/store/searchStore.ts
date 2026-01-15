import { create } from "zustand";
import log from "electron-log/renderer";

type TabType = "browse" | "updates" | "favorites" | "tracked" | "settings";
type SortOrder = "asc" | "desc";

interface SearchState {
  query: string;
  activeTab: TabType | null;
  sortOrder: SortOrder;
  
  setQuery: (query: string) => void;
  setActiveTab: (tab: TabType | null) => void;
  clearSearch: () => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  activeTab: null,
  sortOrder: "desc",
  
  setQuery: (query) => {
    // Basic validation: ensure query is a string and reasonable length
    // Note: If logs are somehow reaching setQuery, that's a separate architectural issue
    // This validation is a safety net, not a fix for the root cause
    if (typeof query !== 'string') {
      // Silently ignore invalid input - don't pollute logs with expected edge cases
      return;
    }
    
    // Reasonable limit for tag search (tags are typically short)
    const MAX_QUERY_LENGTH = 500;
    if (query.length > MAX_QUERY_LENGTH) {
      // Log only if significantly over limit (potential issue)
      if (query.length > MAX_QUERY_LENGTH * 2) {
        log.warn(`[SearchStore] Query extremely long (${query.length} chars), truncating`);
      }
      query = query.substring(0, MAX_QUERY_LENGTH);
    }
    
    // Basic sanitization: remove control characters and normalize whitespace
    // Use regex replace for better performance (O(n) instead of O(n) split + filter + join)
    // Allow printable characters (0x20-0x7E) and common whitespace (\t, \n, \r)
    // Remove control characters: 0x00-0x1F (except 0x09, 0x0A, 0x0D), 0x7F
    const cleaned = query
      .trim()
      .replace(/[^\x20-\x7E\t\n\r]/g, '') // Remove control characters (faster than split/filter/join)
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    // Allow empty string to clear search (don't block it)
    set({ query: cleaned });
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  clearSearch: () => set({ query: "" }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSortOrder: () => set((state) => ({ 
    sortOrder: state.sortOrder === "desc" ? "asc" : "desc" 
  })),
}));

