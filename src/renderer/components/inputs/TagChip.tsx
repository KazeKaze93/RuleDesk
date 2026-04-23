import { X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export type TagChipVariant = "include" | "exclude";

export interface TagChipProps {
  tag: string;
  variant: TagChipVariant;
  onRemove: () => void;
  onToggleVariant: () => void;
  onEdit: () => void;
}

const labelForAria = (variant: TagChipVariant, text: string): string => {
  if (variant === "exclude") {
    return `Exclude tag: ${text}. Right-click to mark as include.`;
  }
  return `Include tag: ${text}. Right-click to mark as exclude.`;
};

const titleForHint = (variant: TagChipVariant, text: string): string => {
  if (variant === "exclude") {
    return `${text} — right-click to include`;
  }
  return `${text} — right-click to exclude`;
};

/**
 * Renders a single search tag with include/exclude styling and actions.
 */
export function TagChip({
  tag,
  variant,
  onRemove,
  onToggleVariant,
  onEdit,
}: TagChipProps) {
  return (
    <div
      className="inline-flex max-w-full items-center gap-0.5"
      onContextMenu={(e) => {
        e.preventDefault();
        onToggleVariant();
      }}
    >
      <Badge
        variant="outline"
        className={cn(
          "h-7 min-w-0 max-w-[14rem] flex-1 flex-row items-center justify-start gap-0 px-2 py-0 text-left text-xs font-normal sm:max-w-xs",
          variant === "include" && "ring-2 ring-green-600/40",
          variant === "exclude" && "ring-2 ring-red-600/50"
        )}
        aria-label={labelForAria(variant, tag)}
        title={titleForHint(variant, tag)}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        {variant === "exclude" ? (
          <span className="shrink-0 pr-0.5 text-destructive" aria-hidden="true">-</span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left" dir="auto">
          {tag}
        </span>
      </Badge>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 rounded-sm p-0"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove tag ${tag}`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </Button>
    </div>
  );
}
