import { useMemo } from "react";
import { useSearchStore } from "../../store/searchStore";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { FilterSection } from "./filters/FilterSection";
import { FilterToggleGroup } from "./filters/FilterToggleGroup";
import { SourceSwitcher } from "./filters/SourceSwitcher";
import { Image, Film, RectangleHorizontal, RectangleVertical, Clock, ArrowUpNarrowWide, Eye, X, Grid3x3 } from "lucide-react";

type AiFilterValue = "all" | "hide" | "only";
type MediaFilterValue = "all" | "images" | "videos";
type OrientationFilterValue = "all" | "horizontal" | "vertical";
type SortByFilterValue = "date" | "score";
type RatingFilterValue = "all" | "s" | "q" | "e";

const isAiFilterValue = (value: string): value is AiFilterValue =>
  value === "all" || value === "hide" || value === "only";

const isMediaFilterValue = (value: string): value is MediaFilterValue =>
  value === "all" || value === "images" || value === "videos";

const isOrientationFilterValue = (value: string): value is OrientationFilterValue =>
  value === "all" || value === "horizontal" || value === "vertical";

const isSortByFilterValue = (value: string): value is SortByFilterValue =>
  value === "date" || value === "score";

const isRatingFilterValue = (value: string): value is RatingFilterValue =>
  value === "all" || value === "s" || value === "q" || value === "e";

export const FiltersPanel = () => {
  const filters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const resetFilters = useSearchStore((state) => state.resetFilters);
  const query = useSearchStore((state) => state.query);
  const activeTab = useSearchStore((state) => state.activeTab);

  // Check if we're on Browse tab with active search (tags)
  const hasActiveSearch = useMemo(() => {
    if (activeTab !== "browse") return true;
    if (!query.trim()) return false;
    const tags = query
      .split(/[,\s]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    return tags.length > 0;
  }, [activeTab, query]);

  // Check if filters are dirty (not default)
  const isDirty = useMemo(() => {
    return (
      filters.aiFilter !== "all" ||
      filters.rating !== "all" ||
      filters.mediaType !== "all" ||
      filters.source !== "all" ||
      filters.orientation !== "all" ||
      filters.sortBy !== "date"
    );
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Source Switcher - At the top */}
      <FilterSection label="Source" showSeparator={true}>
        <SourceSwitcher
          value={filters.source}
          onValueChange={(value) => setFilters({ source: value })}
          hasActiveSearch={hasActiveSearch}
        />
      </FilterSection>

      {/* AI Filter - 3-state ToggleGroup */}
      <FilterSection label="AI Posts" showSeparator={true}>
        <FilterToggleGroup
          value={filters.aiFilter}
          onValueChange={(value) => {
            if (isAiFilterValue(value)) {
              setFilters({ aiFilter: value });
            }
          }}
          options={[
            { value: "all", label: "All" },
            { value: "hide", label: "No AI" },
            { value: "only", label: "Only" },
          ]}
        />
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection label="Rating" showSeparator={true}>
        <FilterToggleGroup
          value={filters.rating}
          onValueChange={(value) => {
            if (isRatingFilterValue(value)) {
              setFilters({ rating: value });
            }
          }}
          options={[
            { value: "all", label: "All" },
            { value: "s", label: "Safe" },
            { value: "q", label: "Questionable" },
            { value: "e", label: "Explicit" },
          ]}
        />
      </FilterSection>

      {/* Media Type */}
      <FilterSection label="Media" showSeparator={true}>
        <FilterToggleGroup
          value={filters.mediaType}
          onValueChange={(value) => {
            if (isMediaFilterValue(value)) {
              setFilters({ mediaType: value });
            }
          }}
          options={[
            { value: "all", label: "All", icon: <Grid3x3 className="w-3.5 h-3.5" /> },
            { value: "images", label: "Images", icon: <Image className="w-3.5 h-3.5" /> },
            { value: "videos", label: "Videos", icon: <Film className="w-3.5 h-3.5" /> },
          ]}
        />
      </FilterSection>

      {/* Format/Orientation */}
      <FilterSection label="Format" showSeparator={true}>
        <FilterToggleGroup
          value={filters.orientation}
          onValueChange={(value) => {
            if (isOrientationFilterValue(value)) {
              setFilters({ orientation: value });
            }
          }}
          options={[
            { value: "all", label: "All" },
            { value: "horizontal", label: "Horizontal", icon: <RectangleHorizontal className="w-3.5 h-3.5" />, disabled: true },
            { value: "vertical", label: "Vertical", icon: <RectangleVertical className="w-3.5 h-3.5" />, disabled: true },
          ]}
        />
      </FilterSection>

      {/* Sort */}
      <FilterSection label="Sort" showSeparator={false}>
        <FilterToggleGroup
          value={filters.sortBy}
          onValueChange={(value) => {
            if (isSortByFilterValue(value)) {
              setFilters({ sortBy: value });
            }
          }}
          options={[
            { value: "date", label: "Latest", icon: <Clock className="w-3.5 h-3.5" /> },
            { value: "score", label: "Top Rated", icon: <ArrowUpNarrowWide className="w-3.5 h-3.5" />, disabled: true },
            { value: "views", label: "Most Viewed", icon: <Eye className="w-3.5 h-3.5" />, disabled: true },
          ]}
        />
      </FilterSection>

      {/* Footer with Clear Filters */}
      {isDirty && (
        <>
          <Separator className="my-3" />
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1.5" />
              Clear Filters
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
