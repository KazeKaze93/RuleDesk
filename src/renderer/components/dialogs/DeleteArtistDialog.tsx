import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { Artist } from "../../../main/db/schema";

/** Shared label for delete-artist actions (dialog title + list-row affordances). */
export const DELETE_ARTIST_LABEL = "Delete Artist";

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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      await window.api.deleteArtist(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      onOpenChange(false);
    },
  });

  const getErrorMessage = (error: typeof mutation.error): string => {
    if (!error) return "Unknown error occurred";

    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown error occurred";
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!mutation.isPending) onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center text-red-500">
            <Trash2 className="w-5 h-5" />
            {DELETE_ARTIST_LABEL}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {`Are you sure you want to delete ${artist.name}? All posts will be removed.`}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 mb-2 rounded border bg-slate-950 border-slate-800">
          <span className="font-bold text-white">{artist.name}</span>
          <div className="mt-1 text-xs text-slate-500">Tag: {artist.tag}</div>
        </div>

        {mutation.isError && (
          <div
            className="flex gap-2 items-center p-3 mb-2 text-sm text-red-200 rounded border border-red-800 bg-red-900/50"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{getErrorMessage(mutation.error)}</span>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            className="border-slate-700 hover:bg-slate-800 text-slate-200"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate(artist.id)}
            disabled={mutation.isPending}
            className="text-white bg-red-600 hover:bg-red-700"
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
