import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import log from "electron-log/renderer";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { Artist } from "@shared/types/db";

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
      const result = await window.api.deleteArtist(id);
      if (!result.ok) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      void queryClient
        .invalidateQueries({ queryKey: ["artists"] })
        .catch((error: unknown) => {
          log.error("[DeleteArtistDialog] Failed to invalidate artists:", error);
        });
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center text-destructive">
            <Trash2 className="w-5 h-5" />
            {DELETE_ARTIST_LABEL}
          </DialogTitle>
          <DialogDescription>
            {`Are you sure you want to delete ${artist.name}? All posts will be removed.`}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2 rounded border border-border bg-muted p-3">
          <span className="font-bold text-foreground">{artist.name}</span>
          <div className="mt-1 text-xs text-muted-foreground">Tag: {artist.tag}</div>
        </div>

        {mutation.isPending && (
          <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
            Deleting… If this artist is syncing, waiting for sync to stop first.
          </p>
        )}

        {mutation.isError && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getErrorMessage(mutation.error)}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate(artist.id)}
            disabled={mutation.isPending}
            aria-label={
              mutation.isPending ? "Deleting artist" : DELETE_ARTIST_LABEL
            }
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
