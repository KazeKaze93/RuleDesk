import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  List,
  Sparkles,
  Plus,
  Trash2,
  X,
  Check,
  Minus,
  Pencil,
  Download,
  Upload,
  Eraser,
} from "lucide-react";
import log from "electron-log/renderer";
import { Button } from "../../components/ui/button";
import type { PlaylistWithStats } from "@shared/types/bridge";
import { ErrorCode } from "@shared/types/error-codes";
import { getErrorCode } from "../../../shared/utils/type-guards";
import { cn } from "../../lib/utils";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { AsyncAutocomplete } from "../../components/inputs/AsyncAutocomplete";
import type { SmartPlaylistQuery, SmartPlaylistTag } from "../../../shared/schemas/playlist";
import { SmartPlaylistTagSchema, parsePlaylistQuery } from "../../../shared/schemas/playlist";
import { usePlaylists } from "../../lib/hooks/usePlaylists";
import type { SearchResults } from "@shared/types/providers";
import { toast } from "sonner";
import { PlaylistCard } from "../playlists/PlaylistCard";
import { PlaylistGallery } from "../playlists/PlaylistGallery";
import { PageHeader } from "../layout/PageHeader";
import { Skeleton } from "../ui/skeleton";
import { ConfirmActionDialog } from "../dialogs/ConfirmActionDialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { resolveErrorMessage } from "../../utils/error-message";

interface PlaylistsPageProps {
  onBack?: () => void;
}

const INVALID_PLAYLIST_TOAST = "Invalid playlist file";
const EMPTY_IMPORTED_PLAYLIST_TOAST = "Playlist imported but contains no posts";
const CREATE_FAILED_TOAST = "Failed to create playlist";
const UPDATE_FAILED_TOAST = "Failed to update playlist";
const DELETE_FAILED_TOAST = "Failed to delete playlist";

const PlaylistFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(200, "Name too long"),
    playlistType: z.enum(["smart", "manual"]),
    tags: z.array(SmartPlaylistTagSchema),
  })
  .superRefine((data, ctx) => {
    if (data.playlistType === "smart" && data.tags.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one tag is required",
        path: ["tags"],
      });
    }
  });

type PlaylistFormValues = z.infer<typeof PlaylistFormSchema>;

const DEFAULT_FORM_VALUES: PlaylistFormValues = {
  name: "",
  playlistType: "manual",
  tags: [],
};

function normalizeSmartTags(tags: SmartPlaylistTag[]): SmartPlaylistTag[] {
  return tags.map((tag) => ({
    tag: tag.tag.trim().toLowerCase(),
    type: tag.type,
  }));
}

function buildQueryJson(
  playlistType: "smart" | "manual",
  tags: SmartPlaylistTag[]
): string {
  if (playlistType !== "smart") {
    return "";
  }
  const queryObj: SmartPlaylistQuery = {
    tags: normalizeSmartTags(tags),
    provider: "rule34",
  };
  return JSON.stringify(queryObj);
}

type PlaylistFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: PlaylistFormValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PlaylistFormValues) => Promise<void>;
};

const PlaylistFormDialog = ({
  open,
  mode,
  initialValues,
  onOpenChange,
  onSubmit,
}: PlaylistFormDialogProps) => {
  const [tagInputValue, setTagInputValue] = useState("");
  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(PlaylistFormSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const playlistType =
    useWatch({ control: form.control, name: "playlistType" }) ?? "manual";
  const smartTags =
    useWatch({ control: form.control, name: "tags" }) ?? [];
  const isSubmitting = form.formState.isSubmitting;
  const isValid = form.formState.isValid;
  const isTypeLocked = mode === "edit";

  React.useEffect(() => {
    if (!open) {
      return;
    }
    form.reset(initialValues);
    setTagInputValue("");
    void form.trigger();
  }, [open, initialValues, form]);

  const handleTagSelect = (option: SearchResults | null) => {
    if (!option) {
      return;
    }

    const tagName = option.value.trim();
    if (!tagName) {
      return;
    }

    const currentTags = form.getValues("tags");
    if (currentTags.some((t) => t.tag.toLowerCase() === tagName.toLowerCase())) {
      setTagInputValue("");
      return;
    }

    form.setValue(
      "tags",
      [...currentTags, { tag: tagName, type: "include" }],
      { shouldValidate: true, shouldDirty: true }
    );
    setTagInputValue("");
  };

  const toggleTagType = (index: number) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.map((tag, i) =>
        i === index
          ? { ...tag, type: tag.type === "include" ? "exclude" : "include" }
          : tag
      ),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSubmitting) {
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? (
              <Plus className="w-5 h-5 text-primary" />
            ) : (
              <Pencil className="w-5 h-5 text-primary" />
            )}
            {mode === "create" ? "Create Playlist" : "Edit Playlist"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a manual playlist or a smart collection that automatically updates based on tags."
              : "Update playlist name and tags. Smart collections automatically update based on tags."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              void form
                .handleSubmit(async (values) => {
                  await onSubmit(values);
                })(event)
                .catch((error: unknown) => {
                  log.error("[PlaylistsPage] Form submit failed:", error);
                });
            }}
          >
            <FormField
              control={form.control}
              name="playlistType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playlist Type</FormLabel>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(value) => {
                      if (isTypeLocked) {
                        return;
                      }
                      if (value === "smart" || value === "manual") {
                        field.onChange(value);
                        if (value === "manual") {
                          form.setValue("tags", [], {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          setTagInputValue("");
                        }
                      }
                    }}
                    size="default"
                    variant="outline"
                    className="w-full"
                  >
                    <ToggleGroupItem
                      value="manual"
                      className="flex-1"
                      disabled={isTypeLocked && field.value !== "manual"}
                    >
                      <List className="w-4 h-4 mr-2" />
                      Manual Playlist
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="smart"
                      className="flex-1"
                      disabled={isTypeLocked && field.value !== "smart"}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Smart Collection
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {playlistType === "smart"
                      ? mode === "create"
                        ? "Collection Name"
                        : "Name"
                      : mode === "create"
                        ? "Playlist Name"
                        : "Name"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        playlistType === "smart"
                          ? "My Smart Collection"
                          : "My Playlist"
                      }
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {playlistType === "smart" ? (
              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <AsyncAutocomplete
                        label=""
                        value={tagInputValue}
                        onQueryChange={setTagInputValue}
                        onSelect={handleTagSelect}
                        placeholder="Search for tags..."
                      />
                    </FormControl>
                    <FormDescription>
                      Click tags to toggle between Include (green) and Exclude (red)
                    </FormDescription>
                    {smartTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50 min-h-[60px]">
                        {smartTags.map((tag, index) => (
                          <Badge
                            key={`${tag.type}-${tag.tag}`}
                            variant={
                              tag.type === "include" ? "success" : "destructive"
                            }
                            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5"
                            onClick={() => toggleTagType(index)}
                          >
                            {tag.type === "include" ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                            <span>{tag.tag}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTag(index);
                              }}
                              className="ml-1 h-auto w-auto rounded-full p-0.5 hover:bg-foreground/20"
                              aria-label={`Remove tag ${tag.tag}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </>
                ) : mode === "create" ? (
                  playlistType === "smart" ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Collection
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Playlist
                    </>
                  )
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update Playlist
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ onBack }) => {
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<PlaylistWithStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playlistFilter, setPlaylistFilter] = useState<"all" | "smart" | "manual">(
    "all"
  );
  const [playlistToDelete, setPlaylistToDelete] =
    useState<PlaylistWithStats | null>(null);
  const [playlistToClear, setPlaylistToClear] =
    useState<PlaylistWithStats | null>(null);
  const [playlistToEdit, setPlaylistToEdit] =
    useState<PlaylistWithStats | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportingPlaylistId, setExportingPlaylistId] = useState<number | null>(
    null
  );
  const [clearingPlaylistId, setClearingPlaylistId] = useState<number | null>(
    null
  );
  const queryClient = useQueryClient();

  const { data: playlists = [], isLoading } = usePlaylists();

  const filteredPlaylists = useMemo(() => {
    if (playlistFilter === "all") {
      return playlists;
    }
    return playlists.filter((playlist: PlaylistWithStats) =>
      playlistFilter === "smart" ? playlist.isSmart : !playlist.isSmart
    );
  }, [playlists, playlistFilter]);

  const editInitialValues = useMemo<PlaylistFormValues>(() => {
    if (!playlistToEdit) {
      return DEFAULT_FORM_VALUES;
    }
    const tags =
      playlistToEdit.isSmart && playlistToEdit.queryJson
        ? parsePlaylistQuery(
            playlistToEdit.queryJson,
            playlistToEdit.querySchemaVersion
          )?.tags ?? []
        : [];
    return {
      name: playlistToEdit.name,
      playlistType: playlistToEdit.isSmart ? "smart" : "manual",
      tags,
    };
  }, [playlistToEdit]);

  const invalidatePlaylists = () => {
    void queryClient
      .invalidateQueries({ queryKey: ["playlists"] })
      .catch((error: unknown) => {
        log.error("[PlaylistsPage] Failed to invalidate playlists:", error);
      });
  };

  const handleCreatePlaylist = async (values: PlaylistFormValues) => {
    try {
      await window.api.createPlaylist({
        name: values.name.trim(),
        isSmart: values.playlistType === "smart",
        queryJson: buildQueryJson(values.playlistType, values.tags),
        iconName: "",
      });
      invalidatePlaylists();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      log.error("[PlaylistsPage] Failed to create playlist:", error);
      toast.error(resolveErrorMessage(error, CREATE_FAILED_TOAST));
      throw error;
    }
  };

  const handleUpdatePlaylist = async (values: PlaylistFormValues) => {
    if (!playlistToEdit) {
      return;
    }
    try {
      await window.api.updatePlaylist(playlistToEdit.id, {
        name: values.name.trim(),
        queryJson: buildQueryJson(values.playlistType, values.tags),
      });
      invalidatePlaylists();
      setPlaylistToEdit(null);
      setIsEditDialogOpen(false);
    } catch (error: unknown) {
      log.error("[PlaylistsPage] Failed to update playlist:", error);
      toast.error(resolveErrorMessage(error, UPDATE_FAILED_TOAST));
      throw error;
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlistToDelete) {
      return;
    }
    try {
      await window.api.deletePlaylist(playlistToDelete.id);
      invalidatePlaylists();
      if (selectedPlaylist?.id === playlistToDelete.id) {
        setSelectedPlaylist(null);
      }
      setPlaylistToDelete(null);
    } catch (error: unknown) {
      log.error("[PlaylistsPage] Failed to delete playlist:", error);
      toast.error(resolveErrorMessage(error, DELETE_FAILED_TOAST));
      throw error;
    }
  };

  const handleClearAllPostsInPlaylist = async (
    pl: PlaylistWithStats
  ): Promise<void> => {
    if (pl.isSmart) {
      return;
    }
    setClearingPlaylistId(pl.id);
    try {
      await window.api.clearManualPlaylist({ playlistId: pl.id });
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      await queryClient.invalidateQueries({
        queryKey: ["playlist-posts", pl.id],
      });
      toast.success(`Removed all posts from "${pl.name}"`);
    } catch (error: unknown) {
      log.error("[PlaylistsPage] Failed to clear playlist posts:", error);
      toast.error("Failed to clear playlist");
      throw error;
    } finally {
      setClearingPlaylistId(null);
    }
  };

  const handleExportPlaylist = async (playlist: PlaylistWithStats) => {
    if (exportingPlaylistId !== null) {
      return;
    }

    setExportingPlaylistId(playlist.id);

    try {
      const result = await window.api.exportPlaylist(playlist.id);
      if (result.success && result.path) {
        toast.success("Playlist exported successfully");
        return;
      }

      if (result.error && result.error !== "Cancelled") {
        toast.error(`Failed to export playlist: ${result.error}`);
      }
    } catch (error: unknown) {
      log.error("[PlaylistsPage] Failed to export playlist:", error);
      toast.error("Failed to export playlist");
    } finally {
      setExportingPlaylistId(null);
    }
  };

  const handleImportPlaylist = async () => {
    if (isImporting) {
      return;
    }

    setIsImporting(true);

    try {
      const result = await window.api.importPlaylist();
      if (result.success) {
        invalidatePlaylists();

        if (typeof result.playlistId === "number") {
          const importedPosts = await window.api.getPlaylistPosts({
            playlistId: result.playlistId,
            page: 1,
            limit: 1,
            isRandom: false,
            sortOrder: "position",
          });
          if (importedPosts.length === 0) {
            toast.info(EMPTY_IMPORTED_PLAYLIST_TOAST);
          } else {
            toast.success("Playlist imported successfully");
          }
        } else {
          toast.success("Playlist imported successfully");
        }
        return;
      }

      if (result.code === ErrorCode.CANCELLED) {
        return;
      }
      if (result.code === ErrorCode.PARSE_ERROR) {
        toast.error(INVALID_PLAYLIST_TOAST);
        return;
      }
      if (result.error) {
        toast.error(`Failed to import playlist: ${result.error}`);
      }
    } catch (error: unknown) {
      log.error("[PlaylistsPage] Failed to import playlist:", error);
      if (getErrorCode(error) === ErrorCode.PARSE_ERROR) {
        toast.error(INVALID_PLAYLIST_TOAST);
      } else {
        toast.error("Failed to import playlist");
      }
    } finally {
      setIsImporting(false);
    }
  };

  if (selectedPlaylist) {
    return (
      <PlaylistGallery
        playlist={selectedPlaylist}
        onBack={() => setSelectedPlaylist(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 p-4 border-b bg-background">
        <div className="flex items-start gap-2">
          {onBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mt-0.5 shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : null}
          <div className="min-w-0 flex-1">
            <PageHeader
              title="Playlists"
              icon={List}
              actions={
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void handleImportPlaylist();
                    }}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {isImporting ? "Importing..." : "Import Playlist"}
                  </Button>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Playlist
                  </Button>
                </>
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Filter:</Label>
          <ToggleGroup
            type="single"
            value={playlistFilter}
            onValueChange={(value) => {
              if (value === "all" || value === "smart" || value === "manual") {
                setPlaylistFilter(value);
              }
            }}
            size="sm"
            variant="outline"
          >
            <ToggleGroupItem value="all" className="gap-2">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="smart" className="gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Smart Collections
            </ToggleGroupItem>
            <ToggleGroupItem value="manual" className="gap-2">
              <List className="w-3.5 h-3.5" />
              Manual Playlists
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <List className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">No playlists yet</p>
            <p className="text-sm mt-2">Create your first playlist to get started</p>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            {playlistFilter === "smart" ? (
              <Sparkles className="w-16 h-16 mb-4 opacity-50" />
            ) : (
              <List className="w-16 h-16 mb-4 opacity-50" />
            )}
            <p className="text-lg">
              {playlistFilter === "smart"
                ? "No smart collections yet"
                : "No manual playlists yet"}
            </p>
            <p className="text-sm mt-2">
              {playlistFilter === "smart"
                ? "Create a smart collection to get started"
                : "Create a manual playlist to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlaylists.map((playlist: PlaylistWithStats) => (
              <div
                key={playlist.id}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-lg border bg-card",
                  "hover:border-primary hover:shadow-md transition-all",
                  "relative group"
                )}
              >
                <PlaylistCard
                  playlist={playlist}
                  onOpen={setSelectedPlaylist}
                  actionPaddingClassName={playlist.isSmart ? "pr-32" : "pr-40"}
                />
                <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleExportPlaylist(playlist);
                    }}
                    title="Export playlist"
                    disabled={exportingPlaylistId !== null}
                  >
                    {exportingPlaylistId === playlist.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaylistToEdit(playlist);
                      setIsEditDialogOpen(true);
                    }}
                    title="Edit playlist"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!playlist.isSmart && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaylistToClear(playlist);
                      }}
                      title="Clear all posts from playlist"
                      disabled={clearingPlaylistId !== null}
                    >
                      {clearingPlaylistId === playlist.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eraser className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaylistToDelete(playlist);
                    }}
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmActionDialog
        open={playlistToClear !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPlaylistToClear(null);
          }
        }}
        title="Clear all posts?"
        description={`Remove all posts from ${playlistToClear?.name ?? ""}? This cannot be undone.`}
        confirmLabel="Clear all"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          if (!playlistToClear) {
            return;
          }
          await handleClearAllPostsInPlaylist(playlistToClear);
        }}
      />

      <ConfirmActionDialog
        open={playlistToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPlaylistToDelete(null);
          }
        }}
        title="Delete Playlist"
        description={
          playlistToDelete
            ? `Are you sure you want to delete "${playlistToDelete.name}"? This action cannot be undone.${
                playlistToDelete.isSmart
                  ? ""
                  : " All posts will be removed from this playlist."
              }`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeletePlaylist}
      />

      <PlaylistFormDialog
        open={isDialogOpen}
        mode="create"
        initialValues={DEFAULT_FORM_VALUES}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreatePlaylist}
      />

      <PlaylistFormDialog
        open={isEditDialogOpen}
        mode="edit"
        initialValues={editInitialValues}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setPlaylistToEdit(null);
          }
        }}
        onSubmit={handleUpdatePlaylist}
      />
    </div>
  );
};
