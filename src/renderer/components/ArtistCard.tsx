import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import type { Artist } from "../../main/db/schema";
import { DeleteArtistDialog } from "./DeleteArtistDialog";
import { cn } from "../lib/utils";

interface ArtistCardProps {
  artist: Artist;
  onSelect: (artist: Artist) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect }) => {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleCardClick = () => {
    onSelect(artist);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(artist);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative flex items-center justify-between p-4 mb-2 rounded-lg border transition-all cursor-pointer",
          "bg-slate-900/50 border-slate-800",
          "hover:bg-slate-900 hover:border-blue-500/50 hover:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-blue-500" // Визуальный фокус
        )}
        role="button"
        tabIndex={0}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-blue-500 truncate transition-colors group-hover:text-blue-400">
            {artist.name}
          </h3>
          <p className="mt-1 font-mono text-xs truncate text-slate-500">
            [{artist.tag}] {t("app.lastId", "Last ID")}: {artist.lastPostId} |{" "}
            {t("app.new", "New")}:{" "}
            <span className={artist.newPostsCount > 0 ? "text-green-400" : ""}>
              {artist.newPostsCount}
            </span>
          </p>
        </div>

        <div className="pl-4 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-slate-500 hover:text-red-500 hover:bg-red-950/20"
            onClick={handleDeleteClick}
            title={t("common.delete", "Delete Artist")}
            onKeyDown={(e) => e.stopPropagation()}
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
