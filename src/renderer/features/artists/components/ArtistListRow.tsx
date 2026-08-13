import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Hash,
  RefreshCw,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  DELETE_ARTIST_LABEL,
  DeleteArtistDialog,
} from "../../../components/dialogs/DeleteArtistDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip";
import { cn } from "../../../lib/utils";
import { formatRelativeTime } from "../../../lib/formatRelativeTime";
import type { TrackedArtist } from "@shared/types/bridge";

interface ArtistListRowProps {
  artist: TrackedArtist;
  onSelect: (artist: TrackedArtist) => void;
}

export const ArtistListRow: React.FC<ArtistListRowProps> = ({
  artist,
  onSelect,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const postsCount = artist.postsCount;
  const lastPostText =
    artist.lastPostAt !== null
      ? `Last: ${formatRelativeTime(artist.lastPostAt)}`
      : "Last: —";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const getTypeIcon = () => {
    switch (artist.type) {
      case "uploader":
        return <User className="w-4 h-4 text-primary" />;
      case "query":
        return <Search className="w-4 h-4 text-emerald-500" />;
      default:
        return <Hash className="w-4 h-4 text-blue-500" />;
    }
  };

  const renderStatusBadge = () => {
    if (artist.syncStatus === "syncing") {
      return (
        <Badge variant="secondary" className="h-6 shrink-0 gap-1 text-xs">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Syncing
        </Badge>
      );
    }

    if (artist.syncStatus === "error") {
      const badge = (
        <Badge variant="destructive" className="h-6 shrink-0 gap-1 text-xs">
          <AlertTriangle className="w-3 h-3" />
          Error
        </Badge>
      );

      if (!artist.lastError) {
        return badge;
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="left" className="max-w-64 break-words">
            {artist.lastError}
          </TooltipContent>
        </Tooltip>
      );
    }

    // lastChecked is set only after a successful pagination end (see SyncService).
    // Null means the artist has never completed a sync — do not treat default idle as Synced.
    if (artist.lastChecked === null) {
      return (
        <Badge variant="secondary" className="h-6 shrink-0 gap-1 text-xs">
          <Circle className="w-3 h-3" />
          Not synced yet
        </Badge>
      );
    }

    return (
      <Badge className="h-6 shrink-0 gap-1 border-green-200 bg-green-100 text-xs text-green-700 hover:bg-green-100">
        <CheckCircle2 className="w-3 h-3" />
        Synced
      </Badge>
    );
  };

  return (
    <>
      <div
        className={cn(
          "flex w-full min-h-[52px] border-b border-border/80 last:border-b-0",
          "transition-colors hover:bg-accent/50"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSelect(artist)}
          className={cn(
            "flex min-h-[52px] min-w-0 flex-1 items-center gap-2 px-3 text-left sm:gap-3",
            "h-auto rounded-none bg-transparent hover:bg-transparent",
            "focus:outline-none focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )}
          aria-label={`Select ${artist.name}`}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
            aria-hidden
          >
            {getTypeIcon()}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {artist.name}
          </span>
          <span
            className="w-12 flex-shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:w-14"
            title={`${postsCount} posts`}
          >
            {postsCount.toLocaleString()}
          </span>
          <span
            className="w-[6.5rem] flex-shrink-0 truncate text-xs text-muted-foreground sm:w-28 md:w-32"
            title={lastPostText}
          >
            {lastPostText}
          </span>
          <div className="flex min-w-0 flex-shrink-0 items-center">
            {renderStatusBadge()}
          </div>
        </Button>
        <div className="flex flex-shrink-0 items-center pr-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDeleteClick}
            aria-label={DELETE_ARTIST_LABEL}
            title={DELETE_ARTIST_LABEL}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DeleteArtistDialog
        artist={artist}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
};
