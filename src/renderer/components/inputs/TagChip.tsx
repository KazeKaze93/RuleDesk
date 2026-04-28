import { useLayoutEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { invalidateAllPostQueries } from "../../utils/react-query-cache";
import { resolveErrorMessage } from "../../utils/error-message";

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
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const menuAnchorRef = useRef<HTMLSpanElement>(null);

  const { data: blacklistedTags = [] } = useQuery({
    queryKey: ["blacklist"],
    queryFn: () => window.api.getBlacklistedTags(),
  });

  const isBlacklisted = blacklistedTags.includes(tag.toLowerCase());

  const toggleBlacklistMutation = useMutation({
    mutationFn: async () => {
      if (isBlacklisted) {
        await window.api.removeTagFromBlacklist(tag);
        return "removed";
      }
      await window.api.addTagToBlacklist(tag);
      return "added";
    },
    onSuccess: async (state) => {
      await queryClient.invalidateQueries({ queryKey: ["blacklist"] });
      await invalidateAllPostQueries(queryClient);
      toast.success(
        state === "added" ? "Tag added to blacklist" : "Tag removed from blacklist"
      );
    },
    onError: (error) => {
      const message = resolveErrorMessage(error, "Failed to update blacklist");
      toast.error(message);
    },
  });

  useLayoutEffect(() => {
    const anchor = menuAnchorRef.current;
    if (!anchor) {
      return;
    }
    if (menuPosition) {
      anchor.style.left = `${menuPosition.x}px`;
      anchor.style.top = `${menuPosition.y}px`;
      return;
    }
    anchor.style.removeProperty("left");
    anchor.style.removeProperty("top");
  }, [menuPosition]);

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(open) => {
        setMenuOpen(open);
        if (!open) {
          setMenuPosition(null);
        }
      }}
    >
      <div
        className="inline-flex max-w-full items-center gap-0.5 whitespace-nowrap"
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenuPosition({ x: event.clientX, y: event.clientY });
          setMenuOpen(true);
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
            <span className="shrink-0 pr-0.5 text-destructive" aria-hidden="true">
              -
            </span>
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
      <DropdownMenuTrigger asChild>
        <span
          ref={menuAnchorRef}
          className={cn(
            "inline-flex h-0 w-0 overflow-hidden opacity-0",
            menuPosition && "fixed"
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" sideOffset={0}>
        <DropdownMenuItem onClick={onToggleVariant}>
          {variant === "exclude" ? "Mark as include" : "Mark as exclude"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => toggleBlacklistMutation.mutate()}
          disabled={toggleBlacklistMutation.isPending}
        >
          <Ban className="mr-2 h-4 w-4" />
          {isBlacklisted ? "Remove from blacklist" : "Add to blacklist"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
