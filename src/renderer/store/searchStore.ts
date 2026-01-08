import { create } from "zustand";

type TabType = "browse" | "updates" | "favorites" | "tracked" | "settings";

interface SearchState {
  query: string;
  activeTab: TabType | null;
  
  setQuery: (query: string) => void;
  setActiveTab: (tab: TabType | null) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  activeTab: null,
  
  setQuery: (query) => {
    // Basic validation: ensure query is a string and reasonable length
    // Note: If logs are somehow reaching setQuery, that's a separate architectural issue
    // This validation is a safety net, not a fix for the root cause
    if (typeof query !== 'string') {
      console.warn('[SearchStore] setQuery called with non-string value:', query);
      return;
    }
    
    // Reasonable limit for tag search (tags are typically short)
    const MAX_QUERY_LENGTH = 500;
    if (query.length > MAX_QUERY_LENGTH) {
      console.warn(`[SearchStore] Query too long (${query.length} chars), truncating`);
      query = query.substring(0, MAX_QUERY_LENGTH);
    }
    
    // Basic sanitization: remove control characters and normalize whitespace
    const cleaned = query
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    if (cleaned.length === 0) {
      return;
    }
    
    set({ query: cleaned });
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  clearSearch: () => set({ query: "" }),
}));

