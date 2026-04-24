import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  Hash,
  RefreshCw,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { DeleteArtistDialog } from "../../../components/dialogs/DeleteArtistDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { cn } from "../../../lib/utils";
import { formatRelativeTime } from "../../../lib/formatRelativeTime";
import type { TrackedArtist } from "../../../../main/bridge";

interface ArtistCardProps {
  artist: TrackedArtist;
  onSelect: (artist: TrackedArtist) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect }) => {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const postsCount = artist.postsCount;
  const lastPostText =
    artist.lastPostAt !== null
      ? `Last: ${formatRelativeTime(artist.lastPostAt)}`
      : "Last: no posts yet";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const getIcon = () => {
    switch (artist.type) {
      case "uploader":
        return <User className="w-4 h-4 text-primary" />;
      case "query":
        return <Search className="w-4 h-4 text-emerald-500" />;
      default:
        return <Hash className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleCardClick = () => onSelect(artist);

  const renderStatusBadge = () => {
    if (artist.syncStatus === "syncing") {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Syncing
        </Badge>
      );
    }

    if (artist.syncStatus === "error") {
      const badge = (
        <Badge variant="destructive" className="gap-1">
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

    return (
      <Badge className="gap-1 text-green-700 bg-green-100 border-green-200 hover:bg-green-100">
        <CheckCircle2 className="w-3 h-3" />
        Synced
      </Badge>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "flex relative justify-between items-center p-1 pr-3 rounded-lg border transition-all group gap-3",
          "bg-card text-card-foreground border-border",
          "hover:bg-accent/50 hover:border-primary/40 hover:shadow-md"
        )}
      >
        <button
          onClick={handleCardClick}
          className={cn(
            "flex-1 p-3 min-w-0 text-left rounded-l-lg transition-colors",
            "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "text-card-foreground"
          )}
          aria-label={t("artistCard.selectArtist", { name: artist.name })}
        >
          <div className="flex gap-2 items-center mb-1">
            {/* Отображаем иконку типа */}
            {getIcon()}
            <h3 className="text-lg font-bold truncate transition-colors text-card-foreground group-hover:text-foreground">
              {artist.name}
            </h3>
          </div>

          <p className="mt-1 font-mono text-xs truncate text-muted-foreground">
            {postsCount.toLocaleString()} {postsCount === 1 ? "post" : "posts"}
          </p>
          <p className="mt-1 text-xs truncate text-muted-foreground">{lastPostText}</p>
        </button>

        <div className="flex flex-shrink-0 gap-2 items-center pl-2">
          {renderStatusBadge()}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDeleteClick}
            aria-label={t("common.deleteArtist", "Delete Artist")}
            title={t("common.deleteArtist", "Delete Artist")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <DeleteArtistDialog
        artist={artist}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </TooltipProvider>
  );
};
