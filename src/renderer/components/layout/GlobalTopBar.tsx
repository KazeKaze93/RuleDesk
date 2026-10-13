import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Filter,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  LayoutList,
  LayoutGrid,
  CircleHelp,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  buildApiQueryString,
  getTopBarChrome,
  useSearchStore,
  type TabType,
} from "../../store/searchStore";
import { TagAutocomplete } from "../inputs/TagAutocomplete";
import { FiltersPanel } from "./FiltersPanel";
import { cn } from "../../lib/utils";

interface SyntaxRow {
  syntax: string;
  description: string;
}

interface SyntaxSection {
  title: string;
  rows: SyntaxRow[];
}

const SEARCH_SYNTAX_SECTIONS: SyntaxSection[] = [
  {
    title: "Basic",
    rows: [
      { syntax: "tag1 tag2", description: "AND - posts containing both tags" },
      { syntax: "-tag1", description: "Exclude tag (also available via right-click on a chip)" },
      {
        syntax: "( tag1 ~ tag2 )",
        description: "OR group - posts with either tag (spaces inside parentheses are required)",
      },
      { syntax: "ta*1", description: "Wildcard token match" },
      { syntax: "night~", description: "Fuzzy token match" },
    ],
  },
  {
    title: "Metatags",
    rows: [
      { syntax: "user:bob", description: "Posts uploaded by user bob" },
      { syntax: "md5:foo", description: "Exact MD5 match" },
      { syntax: "md5:foo*", description: "MD5 prefix match" },
      { syntax: "parent:1234", description: "Posts related to parent id 1234" },
      { syntax: "rating:questionable", description: "Only questionable posts (API metatag)" },
      { syntax: "-rating:questionable", description: "Exclude questionable posts" },
      { syntax: "score:>=10", description: "Score threshold filter" },
      { syntax: "width:>=1000", description: "Width threshold filter" },
      { syntax: "height:>1000", description: "Height threshold filter" },
      { syntax: "aspectratio:16:9", description: "Aspect ratio fraction filter" },
      { syntax: "aspectratiof:1.5", description: "Aspect ratio decimal filter" },
      { syntax: "sourcedomains:example.com", description: "Source domain filter" },
    ],
  },
];

const BASIC_SYNTAX_SECTION = SEARCH_SYNTAX_SECTIONS.find(
  (section) => section.title === "Basic"
);
const METATAGS_SYNTAX_SECTION = SEARCH_SYNTAX_SECTIONS.find(
  (section) => section.title === "Metatags"
);

function resolveTabFromPath(pathname: string): TabType | null {
  if (pathname === "/browse") {
    return "browse";
  }
  if (pathname === "/updates") {
    return "updates";
  }
  if (pathname === "/favorites") {
    return "favorites";
  }
  if (pathname === "/tracked" || pathname.startsWith("/artist/")) {
    return "tracked";
  }
  if (pathname === "/playlists") {
    return "playlists";
  }
  if (pathname === "/stats") {
    return "stats";
  }
  if (pathname === "/settings") {
    return "settings";
  }
  return null;
}

export const GlobalTopBar = () => {
  const location = useLocation();
  const includeTags = useSearchStore((state) => state.includeTags);
  const excludeTags = useSearchStore((state) => state.excludeTags);
  const setActiveTab = useSearchStore((state) => state.setActiveTab);
  const activeTab = useSearchStore((state) => state.activeTab);
  const sortOrder = useSearchStore((state) => state.sortOrder);
  const toggleSortOrder = useSearchStore((state) => state.toggleSortOrder);
  const viewType = useSearchStore((state) => state.viewType);
  const setViewType = useSearchStore((state) => state.setViewType);
  const filters = useSearchStore((state) => state.filters);

  const chrome = useMemo(() => getTopBarChrome(activeTab), [activeTab]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.aiFilter !== "all") count++;
    if (filters.mediaType !== "all") count++;
    if (filters.source !== "all") count++;
    return count;
  }, [filters]);

  useEffect(() => {
    setActiveTab(resolveTabFromPath(location.pathname));
  }, [location.pathname, setActiveTab]);

  const apiQueryString = useMemo(
    () => buildApiQueryString(includeTags, excludeTags),
    [includeTags, excludeTags]
  );

  const isSortEnabled = useMemo(() => {
    if (!chrome.showSort) {
      return false;
    }
    if (activeTab === "browse") {
      return apiQueryString.trim().length > 0;
    }
    // Playlists and other chrome tabs: sort without requiring a query.
    return true;
  }, [activeTab, apiQueryString, chrome.showSort]);

  const handleSortToggle = () => {
    toggleSortOrder();
  };

  const SortIcon = sortOrder === "desc" ? ArrowDownNarrowWide : ArrowUpNarrowWide;

  const hasAnyChrome =
    chrome.showSearch ||
    chrome.showFilters ||
    chrome.showSort ||
    chrome.showView;

  if (!hasAnyChrome) {
    return (
      <header className="min-h-14 border-b bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10" />
    );
  }

  return (
    <header className="min-h-14 border-b bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between sticky top-0 z-10">
      {chrome.showSearch ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
          <TagAutocomplete
            showClearButton={true}
            placeholder="Search posts by tags..."
            className="w-full"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="Search syntax help"
                title="Search syntax help"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] p-5" align="start">
              <div>
                <h4 className="text-sm font-semibold leading-none">Search Syntax</h4>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0">
                  {[BASIC_SYNTAX_SECTION, METATAGS_SYNTAX_SECTION].map((section) => (
                    <div key={section?.title ?? "search-syntax"}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pb-1 pt-3 first:pt-0">
                        {section?.title ?? ""}
                      </p>
                      <div>
                        {(section?.rows ?? []).map((row) => (
                          <div key={row.syntax} className="py-1.5 border-b border-border last:border-0">
                            <code className="font-mono text-xs font-semibold text-foreground">
                              {row.syntax}
                            </code>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              {row.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex gap-2 items-center">
        {chrome.showSort ? (
          <Button
            variant="outline"
            size="icon"
            onClick={handleSortToggle}
            disabled={!isSortEnabled}
            className={cn(
              "h-9 w-9",
              !isSortEnabled && "opacity-50 cursor-not-allowed"
            )}
            aria-label={
              isSortEnabled
                ? `Sort by date (${sortOrder === "desc" ? "newest first" : "oldest first"})`
                : "Sorting not available"
            }
            title={
              isSortEnabled
                ? `Sort by date (${sortOrder === "desc" ? "newest first" : "oldest first"})`
                : "Sorting not available"
            }
          >
            <SortIcon className="w-4 h-4" />
          </Button>
        ) : null}

        {chrome.showFilters ? (
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
                <h4 className="font-medium text-sm leading-none">Filters</h4>
              </div>
              <FiltersPanel />
            </PopoverContent>
          </Popover>
        ) : null}

        {chrome.showView ? (
          <>
            <div className="mx-1 w-px h-4 bg-border" />
            <div
              className="flex items-center border rounded-md p-0.5 bg-muted/50"
              role="group"
              aria-label="View layout"
            >
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
                aria-label="Grid"
                aria-pressed={viewType === "grid"}
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
                aria-label="Masonry"
                aria-pressed={viewType === "masonry"}
                title="Masonry Layout"
              >
                <LayoutList className={cn(
                  "w-4 h-4",
                  viewType === "masonry" ? "text-foreground" : "text-muted-foreground"
                )} />
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
};
