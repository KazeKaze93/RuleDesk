import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { invalidateAllPostQueries } from "../../utils/react-query-cache";

const MAX_BLACKLIST_TAGS = 100;

const normalizeTag = (value: string): string => value.trim().toLowerCase();

export const SettingsBlacklistTab = () => {
  const queryClient = useQueryClient();
  const [draftTag, setDraftTag] = useState("");

  const { data: blacklistedTags = [], isLoading } = useQuery({
    queryKey: ["blacklist"],
    queryFn: () => window.api.getBlacklistedTags(),
  });

  const tagsCount = blacklistedTags.length;
  const isLimitReached = tagsCount >= MAX_BLACKLIST_TAGS;
  const normalizedDraftTag = useMemo(() => normalizeTag(draftTag), [draftTag]);
  const canAdd =
    normalizedDraftTag.length > 0 &&
    !isLimitReached &&
    !blacklistedTags.includes(normalizedDraftTag);

  const refreshAfterMutation = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["blacklist"] });
    await invalidateAllPostQueries(queryClient);
  };

  const addMutation = useMutation({
    mutationFn: async (tag: string) => {
      await window.api.addTagToBlacklist(tag);
    },
    onSuccess: async () => {
      setDraftTag("");
      await refreshAfterMutation();
      toast.success("Tag added to blacklist");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to add tag";
      toast.error(message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (tag: string) => {
      await window.api.removeTagFromBlacklist(tag);
    },
    onSuccess: async () => {
      await refreshAfterMutation();
      toast.success("Tag removed from blacklist");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to remove tag";
      toast.error(message);
    },
  });

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Tag Blacklist</h3>
        <p className="text-sm text-muted-foreground">
          Blacklisted tags are excluded from every local post query.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={draftTag}
          onChange={(event) => setDraftTag(event.target.value)}
          placeholder="Enter tag"
          maxLength={128}
        />
        <Button
          type="button"
          onClick={() => addMutation.mutate(normalizedDraftTag)}
          disabled={!canAdd || addMutation.isPending}
        >
          Add
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {tagsCount} / {MAX_BLACKLIST_TAGS} tags
      </p>

      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading blacklist...</p>
        ) : blacklistedTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No blacklisted tags yet.
          </p>
        ) : (
          blacklistedTags.map((tag) => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              <span>{tag}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                aria-label={`Remove ${tag} from blacklist`}
                onClick={() => removeMutation.mutate(tag)}
                disabled={removeMutation.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>
    </section>
  );
};
