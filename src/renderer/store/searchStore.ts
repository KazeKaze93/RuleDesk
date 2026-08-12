import { create } from "zustand";
import log from "electron-log/renderer";

type TabType = "browse" | "updates" | "favorites" | "tracked" | "settings";
type SortOrder = "asc" | "desc";
type MediaType = "all" | "images" | "videos";
type SourceType = "all" | "favorites" | "subscriptions";
type ViewType = "grid" | "masonry";
type AiFilterType = "all" | "hide" | "only";
interface PostFilters {
  aiFilter: AiFilterType;
  mediaType: MediaType;
  source: SourceType;
}

export function buildBooruTagListForIpc(
  includeTags: string[],
  excludeTags: string[]
): string[] {
  return [...includeTags, ...excludeTags.map((t) => `-${t}`)];
}

export function buildApiQueryString(
  includeTags: string[],
  excludeTags: string[]
): string {
  return buildBooruTagListForIpc(includeTags, excludeTags).join(" ");
}

export interface SearchState {
  includeTags: string[];
  excludeTags: string[];
  activeTab: TabType | null;
  sortOrder: SortOrder;
  filters: PostFilters;
  viewType: ViewType;
  isRandom: boolean;
  addIncludeTag: (tag: string) => void;
  addExcludeTag: (tag: string) => void;
  removeIncludeTag: (tag: string) => void;
  removeExcludeTag: (tag: string) => void;
  toggleChipVariant: (tag: string) => void;
  isTagIncluded: (tag: string) => boolean;
  isTagExcluded: (tag: string) => boolean;
  setActiveTab: (tab: TabType | null) => void;
  clearTagChips: () => void;
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
};

const MAX_TOKEN_LENGTH = 200;

const normalizeInputTag = (raw: string): string => {
  if (typeof raw !== "string") {
    return "";
  }
  return raw
    .trim()
    .replace(/[^\x20-\x7E\t\n\r]/g, "")
    .replace(/\s+/g, " ");
};

const truncateToken = (token: string): string => {
  if (token.length <= MAX_TOKEN_LENGTH) {
    return token;
  }
  if (token.length > MAX_TOKEN_LENGTH * 2) {
    log.warn(
      `[SearchStore] Token extremely long (${token.length} chars), truncating`
    );
  }
  return token.substring(0, MAX_TOKEN_LENGTH);
};

export function parseSearchQuery(query: string): {
  includeTags: string[];
  excludeTags: string[];
} {
  const includeTags: string[] = [];
  const excludeTags: string[] = [];
  const rawTokens = query
    .split(/\s+/)
    .map((token) => normalizeInputTag(token))
    .filter((token) => token.length > 0);

  for (const rawToken of rawTokens) {
    if (rawToken === "-") {
      continue;
    }
    if (rawToken.startsWith("-")) {
      const normalizedExclude = truncateToken(
        normalizeInputTag(rawToken.slice(1))
      );
      if (
        normalizedExclude.length > 0 &&
        !excludeTags.includes(normalizedExclude)
      ) {
        excludeTags.push(normalizedExclude);
      }
      continue;
    }

    const normalizedInclude = truncateToken(normalizeInputTag(rawToken));
    if (normalizedInclude.length > 0 && !includeTags.includes(normalizedInclude)) {
      includeTags.push(normalizedInclude);
    }
  }

  return { includeTags, excludeTags };
}

export const useSearchStore = create<SearchState>((set, get) => ({
  includeTags: [],
  excludeTags: [],
  activeTab: null,
  sortOrder: "desc",
  filters: DEFAULT_FILTERS,
  viewType: "grid",
  isRandom: false,
  addIncludeTag: (tag) =>
    set((state) => {
      const normalized = normalizeInputTag(tag);
      if (normalized.startsWith("-") && normalized.length > 1) {
        const excludeTag = truncateToken(normalizeInputTag(normalized.slice(1)));
        if (excludeTag.length === 0) {
          return state;
        }
        const nextInclude = state.includeTags.filter((x) => x !== excludeTag);
        if (state.excludeTags.includes(excludeTag)) {
          if (nextInclude.length === state.includeTags.length) {
            return state;
          }
          return { includeTags: nextInclude };
        }
        return {
          excludeTags: [...state.excludeTags, excludeTag],
          includeTags: nextInclude,
        };
      }

      const t = truncateToken(normalizeInputTag(normalized));
      if (t.length === 0) {
        return state;
      }
      const nextExclude = state.excludeTags.filter((x) => x !== t);
      if (state.includeTags.includes(t)) {
        if (nextExclude.length === state.excludeTags.length) {
          return state;
        }
        return { excludeTags: nextExclude };
      }
      return {
        includeTags: [...state.includeTags, t],
        excludeTags: nextExclude,
      };
    }),
  addExcludeTag: (tag) =>
    set((state) => {
      const normalized = normalizeInputTag(tag);
      const normalizedWithoutPrefix = normalized.startsWith("-")
        ? normalizeInputTag(normalized.slice(1))
        : normalized;
      const t = truncateToken(normalizeInputTag(normalizedWithoutPrefix));
      if (t.length === 0) {
        return state;
      }
      const nextInclude = state.includeTags.filter((x) => x !== t);
      if (state.excludeTags.includes(t)) {
        if (nextInclude.length === state.includeTags.length) {
          return state;
        }
        return { includeTags: nextInclude };
      }
      return {
        excludeTags: [...state.excludeTags, t],
        includeTags: nextInclude,
      };
    }),
  removeIncludeTag: (tag) =>
    set((state) => ({
      includeTags: state.includeTags.filter((x) => x !== tag),
    })),
  removeExcludeTag: (tag) =>
    set((state) => ({
      excludeTags: state.excludeTags.filter((x) => x !== tag),
    })),
  toggleChipVariant: (tag) => {
    const t = tag.trim();
    if (!t) {
      return;
    }
    set((state) => {
      if (state.includeTags.includes(t)) {
        return {
          includeTags: state.includeTags.filter((x) => x !== t),
          excludeTags: state.excludeTags.includes(t)
            ? state.excludeTags
            : [...state.excludeTags, t],
        };
      }
      if (state.excludeTags.includes(t)) {
        return {
          excludeTags: state.excludeTags.filter((x) => x !== t),
          includeTags: state.includeTags.includes(t)
            ? state.includeTags
            : [...state.includeTags, t],
        };
      }
      return state;
    });
  },
  isTagIncluded: (tag) => {
    const t = normalizeInputTag(tag);
    if (t.length === 0) {
      return false;
    }
    return get().includeTags.includes(t);
  },
  isTagExcluded: (tag) => {
    const t = normalizeInputTag(tag);
    if (t.length === 0) {
      return false;
    }
    return get().excludeTags.includes(t);
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  clearTagChips: () => set({ includeTags: [], excludeTags: [] }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSortOrder: () =>
    set((s) => ({
      sortOrder: s.sortOrder === "desc" ? "asc" : "desc",
    })),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
  setViewType: (viewType) => set({ viewType }),
  setIsRandom: (isRandom) => set({ isRandom }),
  toggleIsRandom: () => set((state) => ({ isRandom: !state.isRandom })),
}));
