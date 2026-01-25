import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Filter,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { useSearchStore } from "../../store/searchStore";
import { TagAutocomplete } from "../inputs/TagAutocomplete";
import { FiltersPanel } from "./FiltersPanel";
import { cn } from "../../lib/utils";

export const GlobalTopBar = () => {
  const location = useLocation();
  const query = useSearchStore((state) => state.query);
  const setQuery = useSearchStore((state) => state.setQuery);
  const clearSearch = useSearchStore((state) => state.clearSearch);
  const setActiveTab = useSearchStore((state) => state.setActiveTab);
  const activeTab = useSearchStore((state) => state.activeTab);
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const toggleSortOrder = useSearchStore((state) => state.toggleSortOrder);
  const viewType = useSearchStore((state) => state.viewType);
  const setViewType = useSearchStore((state) => state.setViewType);
  const filters = useSearchStore((state) => state.filters);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.aiFilter !== "all") count++;
    if (filters.mediaType !== "all") count++;
    if (filters.source !== "all") count++;
    if (filters.orientation !== "all") count++;
    if (filters.sortBy !== "date") count++;
    return count;
  }, [filters]);

  // Determine current tab from location
  useEffect(() => {
    const path = location.pathname;
    if (path === "/browse" || path === "/") {
      setActiveTab("browse");
    } else if (path === "/updates") {
      setActiveTab("updates");
    } else if (path === "/favorites") {
      setActiveTab("favorites");
    } else if (path === "/tracked" || path.startsWith("/artist/")) {
      setActiveTab("tracked");
    } else if (path === "/playlists") {
      setActiveTab("browse"); // Use "browse" tab type for playlists to enable filters
    } else if (path === "/settings") {
      setActiveTab("settings");
    } else {
      setActiveTab(null);
    }
  }, [location.pathname, setActiveTab]);

  // Parse tags from query to check if there's a search on Browse tab
  const tags = useMemo(() => {
    if (!query.trim()) return [];
    return query
      .split(/[,\s]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }, [query]);

  // Determine if sort button should be enabled
  const isSortEnabled = useMemo(() => {
    if (activeTab === "browse") {
      // On Browse tab, only enable if there's a search query (tags.length > 0)
      return tags.length > 0;
    }
    // On all other tabs, always enable
    return activeTab !== null && activeTab !== "settings";
  }, [activeTab, tags.length]);

  const handleSearch = () => {
    // Trigger search update - pages will react to query change via useEffect
    // The search query is already in the store, pages will refetch automatically
    // No need to navigate - search works in context of current tab
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    clearSearch();
  };

  const handleSortToggle = () => {
    toggleSortOrder();
  };

  // Get appropriate sort icon based on sort order
  const SortIcon = sortOrder === "desc" ? ArrowDownNarrowWide : ArrowUpNarrowWide;

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Search */}
      <div className="flex flex-1 gap-2 items-center max-w-md">
        <TagAutocomplete
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
          onTagSelect={handleSearch}
          onClear={handleClear}
          showClearButton={true}
          placeholder="Search posts by tags..."
          className="w-full"
        />
        <Button
          onClick={handleSearch}
          size="sm"
          variant="outline"
          className="h-9 text-xs"
        >
          Search
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex gap-2 items-center">
        {/* Sort Button - Sort by date */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleSortToggle}
          disabled={!isSortEnabled}
          className={cn(
            "h-9 w-9",
            !isSortEnabled && "opacity-50 cursor-not-allowed"
          )}
          title={
            isSortEnabled
              ? `Sort by date (${sortOrder === "desc" ? "newest first" : "oldest first"})`
              : "Sorting not available"
          }
        >
          <SortIcon className="w-4 h-4" />
        </Button>

        {/* Filters Trigger */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9 text-xs relative">
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-1 mb-4">
              <h4 className="font-medium text-sm leading-none">Filters And Settings</h4>
            </div>
            <FiltersPanel />
          </PopoverContent>
        </Popover>

        <div className="mx-1 w-px h-4 bg-border" />

        {/* View Toggle - Grid/Masonry */}
        <div className="flex items-center border rounded-md p-0.5 bg-muted/50">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-7 h-7 rounded-sm",
              viewType === "grid"
                ? "bg-background shadow-sm"
                : "hover:bg-background/50"
            )}
            onClick={() => setViewType("grid")}
            title="Grid Layout"
          >
            <LayoutGrid className={cn(
              "w-4 h-4",
              viewType === "grid" ? "text-foreground" : "text-muted-foreground"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-7 h-7 rounded-sm",
              viewType === "masonry"
                ? "bg-background shadow-sm"
                : "hover:bg-background/50"
            )}
            onClick={() => setViewType("masonry")}
            title="Masonry Layout"
          >
            <LayoutList className={cn(
              "w-4 h-4",
              viewType === "masonry" ? "text-foreground" : "text-muted-foreground"
            )} />
          </Button>
        </div>
      </div>
    </header>
  );
};
