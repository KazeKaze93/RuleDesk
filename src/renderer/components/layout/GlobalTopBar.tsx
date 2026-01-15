import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Filter,
  ArrowUpDown,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { Button } from "../ui/button";
import { useSearchStore } from "../../store/searchStore";
import { TagAutocomplete } from "../inputs/TagAutocomplete";
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
        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </Button>

        <div className="mx-1 w-px h-4 bg-border" />

        {/* View Toggle */}
        <div className="flex items-center border rounded-md p-0.5 bg-muted/50">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 rounded-sm shadow-sm bg-background"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 rounded-sm hover:bg-background/50"
          >
            <LayoutList className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
};
