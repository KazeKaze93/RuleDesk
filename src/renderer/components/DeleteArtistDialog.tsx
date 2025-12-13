import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { Artist } from "../../main/db/schema";

interface DeleteArtistDialogProps {
  artist: Artist;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteArtistDialog: React.FC<DeleteArtistDialogProps> = ({
  artist,
  isOpen,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      await window.api.deleteArtist(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Failed to delete artist:", error);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <Trash2 className="w-5 h-5" />
            {t("deleteArtist.title", "Delete Artist")}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {t(
              "deleteArtist.description",
              "Are you sure you want to delete {{name}}? All posts will be removed.",
              { name: artist.name }
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded mb-4">
          <span className="font-bold text-white">{artist.name}</span>
          <div className="text-xs text-slate-500">{artist.tag}</div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            className="border-slate-700 hover:bg-slate-800 text-slate-200"
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate(artist.id)}
            disabled={mutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              t("common.delete", "Delete")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
