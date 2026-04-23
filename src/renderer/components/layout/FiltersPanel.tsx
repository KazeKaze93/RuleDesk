import { useMemo } from "react";
import { buildApiQueryString, useSearchStore } from "../../store/searchStore";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { FilterSection } from "./filters/FilterSection";
import { FilterToggleGroup } from "./filters/FilterToggleGroup";
import { SourceSwitcher } from "./filters/SourceSwitcher";
import {
  Image,
  Film,
  RectangleHorizontal,
  RectangleVertical,
  X,
  Grid3x3,
} from "lucide-react";

type AiFilterValue = "all" | "hide" | "only";
type MediaFilterValue = "all" | "images" | "videos";
type OrientationFilterValue = "all" | "horizontal" | "vertical";
type RatingFilterValue = "all" | "s" | "q" | "e";

const isAiFilterValue = (value: string): value is AiFilterValue =>
  value === "all" || value === "hide" || value === "only";

const isMediaFilterValue = (value: string): value is MediaFilterValue =>
  value === "all" || value === "images" || value === "videos";

const isOrientationFilterValue = (value: string): value is OrientationFilterValue =>
  value === "all" || value === "horizontal" || value === "vertical";

const isRatingFilterValue = (value: string): value is RatingFilterValue =>
  value === "all" || value === "s" || value === "q" || value === "e";

export const FiltersPanel = () => {
  const filters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const resetFilters = useSearchStore((state) => state.resetFilters);
  const activeTab = useSearchStore((state) => state.activeTab);
  const includeTags = useSearchStore((state) => state.includeTags);
  const excludeTags = useSearchStore((state) => state.excludeTags);

  const apiQueryString = useMemo(
    () => buildApiQueryString(includeTags, excludeTags),
    [includeTags, excludeTags]
  );

  const hasActiveSearch = useMemo(() => {
    if (activeTab !== "browse") return true;
    return apiQueryString.trim().length > 0;
  }, [activeTab, apiQueryString]);

  const isDirty = useMemo(() => {
    return (
      filters.aiFilter !== "all" ||
      filters.rating !== "all" ||
      filters.mediaType !== "all" ||
      filters.source !== "all" ||
      filters.orientation !== "all"
    );
  }, [filters]);

  return (
    <div className="space-y-4">
      <FilterSection label="Source" showSeparator={true}>
        <SourceSwitcher
          value={filters.source}
          onValueChange={(value) => setFilters({ source: value })}
          hasActiveSearch={hasActiveSearch}
        />
      </FilterSection>

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

      <FilterSection label="Format" showSeparator={false}>
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
