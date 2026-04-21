import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, User, Hash, Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import type { Artist } from "../../../../main/db/schema";
import { DeleteArtistDialog } from "../../../components/dialogs/DeleteArtistDialog";
import { cn } from "../../../lib/utils";

interface ArtistCardProps {
  artist: Artist;
  onSelect: (artist: Artist) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect }) => {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get posts count for this artist
  // postsCount comes from JOIN query in ArtistsController.getArtists (fixes N+1 problem)
  // Trust the schema: if postsCount is in artist object, use it; otherwise default to 0
  const postsCount = ('postsCount' in artist && typeof artist.postsCount === 'number') 
    ? artist.postsCount 
    : 0;

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

  return (
    <>
      <div
        className={cn(
          "flex relative justify-between items-center p-1 pr-3 rounded-lg border transition-all group",
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
        </button>

        <div className="flex-shrink-0 pl-4">
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
    </>
  );
};
