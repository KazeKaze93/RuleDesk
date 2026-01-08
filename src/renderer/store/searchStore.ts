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
    // Validate query: filter out invalid characters and limit length
    // Prevent injection of log text, extremely long strings, or invalid characters
    if (typeof query !== 'string') {
      console.warn('[SearchStore] setQuery called with non-string value:', query);
      return;
    }
    
    // Limit query length to prevent memory issues (reasonable limit for tag search)
    const MAX_QUERY_LENGTH = 200; // Reduced from 1000 - tags are short, this prevents log injection
    if (query.length > MAX_QUERY_LENGTH) {
      console.warn(`[SearchStore] Query too long (${query.length} chars), rejecting`);
      return; // Reject instead of truncating to prevent log injection
    }
    
    // Aggressive filtering: detect if query looks like logs or contains invalid patterns
    // Check for common log patterns that indicate the query is actually log text
    const logPatterns = [
      /electron-log/i,
      /Renderer loaded/i,
      /IPC.*request/i,
      /Request completed/i,
      /Array\(\d+\)/,
      /›/,
      /\[.*?Controller\]/,
      /\[.*?Provider\]/,
      /electron-log_renderer/,
      /Incoming request/,
      /Request completed/,
      /\d{2}:\d{2}:\d{2}\.\d{3}/, // Timestamp pattern
      /\[.*?\]\s*[A-Z]/ // Log prefix pattern like [IPC] Request
    ];
    
    const hasLogPatterns = logPatterns.some(pattern => pattern.test(query)) ||
      query.split(/\s+/).length > 30; // Too many words = likely log text
    
    if (hasLogPatterns) {
      console.warn('[SearchStore] Query rejected - contains log patterns. First 100 chars:', query.substring(0, 100));
      return; // Reject log-like queries entirely
    }
    
    // Filter out control characters and invalid tag characters
    // Valid tag characters: letters, numbers, underscores, hyphens, colons, parentheses
    const cleaned = query
      .trim()
      .replace(/[^\w\s\-:()]/g, '') // Remove invalid characters
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    // Final validation: query should be reasonable for tag search
    if (cleaned.length === 0 || cleaned.length > MAX_QUERY_LENGTH) {
      return;
    }
    
    set({ query: cleaned });
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  clearSearch: () => set({ query: "" }),
}));

