import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, User, Hash, Search } from "lucide-react";
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const getIcon = () => {
    switch (artist.type) {
      case "uploader":
        return <User className="w-4 h-4 text-purple-400" />;
      case "query":
        return <Search className="w-4 h-4 text-emerald-400" />;
      default:
        return <Hash className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleCardClick = () => onSelect(artist);

  return (
    <>
      <div
        className={cn(
          "flex relative justify-between items-center p-1 pr-3 rounded-lg border transition-all group",
          "bg-slate-900/50 border-slate-800",
          "hover:bg-slate-900 hover:border-blue-500/50 hover:shadow-md"
        )}
      >
        <button
          onClick={handleCardClick}
          className={cn(
            "flex-1 p-3 min-w-0 text-left rounded-l-lg transition-colors",
            "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
            "text-white"
          )}
          aria-label={t("artistCard.selectArtist", { name: artist.name })}
        >
          <div className="flex gap-2 items-center mb-1">
            {/* Отображаем иконку типа */}
            {getIcon()}
            <h3 className="text-lg font-bold truncate transition-colors text-slate-200 group-hover:text-white">
              {artist.name}
            </h3>
          </div>

          <p className="mt-1 font-mono text-xs truncate text-slate-500">
            [{artist.tag}] {t("app.lastId", "Last ID")}: {artist.lastPostId} |{" "}
            {t("app.new", "New")}:{" "}
            <span className={artist.newPostsCount > 0 ? "text-green-400" : ""}>
              {artist.newPostsCount}
            </span>
          </p>
        </button>

        <div className="flex-shrink-0 pl-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-slate-500 hover:text-red-500 hover:bg-red-950/20"
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
