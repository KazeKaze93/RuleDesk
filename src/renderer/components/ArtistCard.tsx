import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import type { Artist } from "../../main/db/schema";
import { DeleteArtistDialog } from "./DeleteArtistDialog";

interface ArtistCardProps {
  artist: Artist;
  onSelect: (artist: Artist) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect }) => {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы клик не открывал галерею
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <div
        onClick={() => onSelect(artist)}
        className="group flex justify-between items-center p-3 w-full text-left rounded border transition-all cursor-pointer bg-slate-900 border-slate-800 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        role="button"
        tabIndex={0}
      >
        <div className="flex-1">
          <span className="font-medium text-blue-400 transition-colors group-hover:text-blue-300">
            {artist.name}
          </span>
          <div className="text-xs text-slate-500">
            [{artist.tag}] {t("app.lastId")}: {artist.lastPostId} |{" "}
            {t("app.new")}:{" "}
            <span className={artist.newPostsCount > 0 ? "text-green-400" : ""}>
              {artist.newPostsCount}
            </span>
          </div>
        </div>

        {/* Кнопка удаления: видна только при наведении на строку (group-hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-500 hover:bg-red-950/20"
            onClick={handleDeleteClick}
            title={t("common.delete", "Delete")}
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