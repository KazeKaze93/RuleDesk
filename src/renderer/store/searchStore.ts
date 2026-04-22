import { create } from "zustand";
import log from "electron-log/renderer";

type TabType = "browse" | "updates" | "favorites" | "tracked" | "settings";
type SortOrder = "asc" | "desc";
type MediaType = "all" | "images" | "videos";
type SourceType = "all" | "favorites" | "subscriptions";
type ViewType = "grid" | "masonry";
type AiFilterType = "all" | "hide" | "only";
type OrientationType = "all" | "horizontal" | "vertical";
type SortByType = "date" | "score";

interface PostFilters {
  aiFilter: AiFilterType;
  mediaType: MediaType;
  source: SourceType;
  orientation: OrientationType;
  sortBy: SortByType;
}

interface SearchState {
  query: string;
  excludedTags: string[];
  activeTab: TabType | null;
  sortOrder: SortOrder;
  filters: PostFilters;
  viewType: ViewType;
  isRandom: boolean;
  
  setQuery: (query: string) => void;
  addIncludeTag: (tag: string) => void;
  addExcludeTag: (tag: string) => void;
  isTagIncluded: (tag: string) => boolean;
  isTagExcluded: (tag: string) => boolean;
  setActiveTab: (tab: TabType | null) => void;
  clearSearch: () => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  setFilters: (filters: Partial<PostFilters>) => void;
  resetFilters: () => void;
  setViewType: (viewType: ViewType) => void;
  setIsRandom: (isRandom: boolean) => void;
  toggleIsRandom: () => void;
}

const DEFAULT_FILTERS: PostFilters = {
  aiFilter: "all",
  mediaType: "all",
  source: "all",
  orientation: "all",
  sortBy: "date",
};

const splitQueryTokens = (query: string): string[] =>
  query.split(" ").filter((token) => token.length > 0);

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  excludedTags: [],
  activeTab: null,
  sortOrder: "desc",
  filters: DEFAULT_FILTERS,
  viewType: "grid",
  isRandom: false,
  
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
    set({
      query: cleaned,
      excludedTags: splitQueryTokens(cleaned)
        .filter((token) => token.startsWith("-"))
        .map((token) => token.slice(1)),
    });
  },
  addIncludeTag: (tag) =>
    set((state) => {
      const normalizedTag = tag.trim();
      if (!normalizedTag) {
        return state;
      }

      const includeToken = normalizedTag;
      const excludeToken = `-${normalizedTag}`;
      const tokens = splitQueryTokens(state.query).filter(
        (token) => token !== excludeToken
      );

      if (!tokens.includes(includeToken)) {
        tokens.push(includeToken);
      }

      const nextQuery = tokens.join(" ");
      return {
        query: nextQuery,
        excludedTags: tokens
          .filter((token) => token.startsWith("-"))
          .map((token) => token.slice(1)),
      };
    }),
  addExcludeTag: (tag) =>
    set((state) => {
      const normalizedTag = tag.trim();
      if (!normalizedTag) {
        return state;
      }

      const includeToken = normalizedTag;
      const excludeToken = `-${normalizedTag}`;
      const tokens = splitQueryTokens(state.query).filter(
        (token) => token !== includeToken
      );

      if (!tokens.includes(excludeToken)) {
        tokens.push(excludeToken);
      }

      const nextQuery = tokens.join(" ");
      return {
        query: nextQuery,
        excludedTags: tokens
          .filter((token) => token.startsWith("-"))
          .map((token) => token.slice(1)),
      };
    }),
  isTagIncluded: (tag) => {
    const normalizedTag = tag.trim();
    if (!normalizedTag) {
      return false;
    }
    const tokens = splitQueryTokens(useSearchStore.getState().query);
    return tokens.includes(normalizedTag);
  },
  isTagExcluded: (tag) => {
    const normalizedTag = tag.trim();
    if (!normalizedTag) {
      return false;
    }
    const tokens = splitQueryTokens(useSearchStore.getState().query);
    return tokens.includes(`-${normalizedTag}`);
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  clearSearch: () => set({ query: "", excludedTags: [] }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSortOrder: () => set((state) => ({ 
    sortOrder: state.sortOrder === "desc" ? "asc" : "desc" 
  })),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  setViewType: (viewType) => set({ viewType }),
  setIsRandom: (isRandom) => set({ isRandom }),
  toggleIsRandom: () => set((state) => ({ isRandom: !state.isRandom })),
}));

