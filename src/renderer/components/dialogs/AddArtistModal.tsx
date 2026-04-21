import { X } from "lucide-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { normalizeTag } from "../../lib/tag-utils";
import { AsyncAutocomplete } from "../inputs/AsyncAutocomplete";
import type { SearchResults } from "../../../main/providers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { AddArtistSchema, type AddArtistRequest } from "../../../shared/schemas/artist";
import type { ProviderId } from "../../../shared/constants";

interface AddArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    tag: string,
    type: "tag" | "uploader" | "query",
    provider: ProviderId
  ) => void;
}

export function AddArtistModal({
  isOpen,
  onClose,
  onAdd,
}: AddArtistModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AddArtistRequest>({
    resolver: zodResolver(AddArtistSchema),
    defaultValues: {
      provider: "rule34",
      type: "tag",
      name: "",
      tag: "",
    },
  });

  const provider = useWatch({ control, name: "provider" });
  const tag = useWatch({ control, name: "tag" });

  const handleClose = () => {
    reset();
    onClose();
  };

  // Reset tag when provider changes to avoid cross-provider tag confusion
  const handleProviderChange = (newProvider: ProviderId) => {
    setValue("provider", newProvider);
    setValue("tag", ""); // Clear input when switching providers
    setValue("name", ""); // Clear name as well
  };

  if (!isOpen) return null;

  const onSubmit = (data: AddArtistRequest) => {
    const finalTag = normalizeTag(data.tag);
    const finalDisplayName = finalTag;
    onAdd(finalDisplayName, finalTag, data.type, data.provider);
    handleClose();
  };

  const handleTagSelect = (option: SearchResults | null) => {
    const selectedTag = option?.label || "";
    setValue("tag", selectedTag);
    setValue("name", selectedTag); // Set name to tag for consistency
  };

  const handleTagChange = (query: string) => {
    setValue("tag", query);
    setValue("name", query); // Keep name in sync with tag
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm duration-200 bg-background/70 animate-in fade-in">
      <div className="flex flex-col w-full max-w-md rounded-xl border shadow-2xl bg-card border-border">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Track New Artist</h2>
          <Button
            type="button"
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground"
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="provider-select" className="ml-1 text-xs font-medium text-muted-foreground">
              Provider
            </Label>
            <Controller
              name="provider"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={handleProviderChange}>
                  <SelectTrigger id="provider-select" className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rule34">Rule34.xxx</SelectItem>
                    <SelectItem value="gelbooru">Gelbooru</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Tag Input */}
          <div className="space-y-1.5">
            <div className="relative z-20">
              <Controller
                name="tag"
                control={control}
                render={({ field }) => (
                  <AsyncAutocomplete
                    label="Tag to Track"
                    value={field.value}
                    onQueryChange={handleTagChange}
                    onSelect={handleTagSelect}
                    placeholder={`Search on ${provider === "rule34" ? "Rule34.xxx" : "Gelbooru"}...`}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            {errors.tag && (
              <p className="text-xs text-destructive ml-1">{errors.tag.message}</p>
            )}
            <p className="text-[10px] text-muted-foreground ml-1">
              Searching on <span className="font-medium text-foreground">{provider === "rule34" ? "Rule34.xxx" : "Gelbooru"}</span>
            </p>
          </div>

          {/* Hidden fields (synced with tag and provider) */}
          <input type="hidden" {...control.register("name")} />
          <input type="hidden" {...control.register("type")} />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !tag || !!errors.tag}
            className="mt-2 w-full"
          >
            {isSubmitting ? "Adding..." : "Start Tracking"}
          </Button>
        </form>
      </div>
    </div>
  );
}
