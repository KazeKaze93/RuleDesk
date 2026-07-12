import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "../../ui/toggle-group";
import { Users, Heart, Grid3x3 } from "lucide-react";
import { cn } from "../../../lib/utils";

type SourceValue = "all" | "favorites" | "subscriptions";

function isSourceValue(v: string): v is SourceValue {
  return v === "all" || v === "favorites" || v === "subscriptions";
}

interface SourceSwitcherProps {
  value: SourceValue;
  onValueChange: (value: SourceValue) => void;
  hasActiveSearch: boolean;
}

export const SourceSwitcher: React.FC<SourceSwitcherProps> = ({
  value,
  onValueChange,
  hasActiveSearch,
}) => {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        const stringVal = typeof val === "string" ? val : val[0] || "";
        if (stringVal && isSourceValue(stringVal)) onValueChange(stringVal);
      }}
      size="sm"
      variant="outline"
      className="w-full"
    >
      <ToggleGroupItem value="all" className="flex-1 gap-2">
        <Grid3x3 className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs">All</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="favorites"
        disabled={!hasActiveSearch}
        className={cn(
          "flex-1 gap-2",
          !hasActiveSearch && "opacity-50 cursor-not-allowed"
        )}
      >
        <Heart className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs">Favorites</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="subscriptions"
        disabled={!hasActiveSearch}
        className={cn(
          "flex-1 gap-2",
          !hasActiveSearch && "opacity-50 cursor-not-allowed"
        )}
      >
        <Users className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs">Subscriptions</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
