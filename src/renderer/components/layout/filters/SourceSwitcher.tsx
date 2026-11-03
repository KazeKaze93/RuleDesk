import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "../../ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { Users, Heart, Grid3x3 } from "lucide-react";
import { cn } from "../../../lib/utils";

type SourceValue = "all" | "favorites" | "subscriptions";

const DISABLED_SOURCE_TOOLTIP =
  "Enter at least one tag to search local favorites / posts since tracking";

function isSourceValue(v: string): v is SourceValue {
  return v === "all" || v === "favorites" || v === "subscriptions";
}

interface SourceSwitcherProps {
  value: SourceValue;
  onValueChange: (value: SourceValue) => void;
  hasActiveSearch: boolean;
}

interface GatedSourceItemProps {
  value: SourceValue;
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const GatedSourceItem: React.FC<GatedSourceItemProps> = ({
  value,
  label,
  ariaLabel,
  icon,
  enabled,
}) => {
  const item = (
    <ToggleGroupItem
      value={value}
      disabled={!enabled}
      aria-label={ariaLabel}
      className={cn(
        "flex-1 gap-2",
        !enabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </ToggleGroupItem>
  );

  if (enabled) {
    return item;
  }

  // Disabled buttons do not receive pointer/focus events; wrap so the tooltip
  // still works on hover and keyboard focus.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex flex-1" tabIndex={0}>
          {item}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{DISABLED_SOURCE_TOOLTIP}</TooltipContent>
    </Tooltip>
  );
};

export const SourceSwitcher: React.FC<SourceSwitcherProps> = ({
  value,
  onValueChange,
  hasActiveSearch,
}) => {
  return (
    <TooltipProvider delayDuration={200}>
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
        aria-label="Source filter"
      >
        <ToggleGroupItem
          value="all"
          aria-label="All sources"
          className="flex-1 gap-2"
        >
          <Grid3x3 className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs">All</span>
        </ToggleGroupItem>
        <GatedSourceItem
          value="favorites"
          label="Favorites"
          ariaLabel="Favorites"
          icon={<Heart className="w-3.5 h-3.5 shrink-0" />}
          enabled={hasActiveSearch}
        />
        <GatedSourceItem
          value="subscriptions"
          label="Since tracked"
          ariaLabel="Since tracked"
          icon={<Users className="w-3.5 h-3.5 shrink-0" />}
          enabled={hasActiveSearch}
        />
      </ToggleGroup>
    </TooltipProvider>
  );
};
