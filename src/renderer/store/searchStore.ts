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
  
  setQuery: (query) => set({ query }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  clearSearch: () => set({ query: "" }),
}));

