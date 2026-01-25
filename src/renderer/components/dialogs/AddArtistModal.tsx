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
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm duration-200 bg-black/60 animate-in fade-in">
      <div className="flex flex-col w-full max-w-md rounded-xl border shadow-2xl bg-zinc-900 border-zinc-800">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white">Track New Artist</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full transition-colors hover:bg-zinc-800 text-zinc-400"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="provider-select" className="ml-1 text-xs font-medium text-zinc-400">
              Provider
            </Label>
            <Controller
              name="provider"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={handleProviderChange}>
                  <SelectTrigger id="provider-select" className="w-full bg-zinc-950 border-zinc-800 text-white">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
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
              <p className="text-xs text-red-400 ml-1">{errors.tag.message}</p>
            )}
            <p className="text-[10px] text-zinc-500 ml-1">
              Searching on <span className="font-medium text-zinc-400">{provider === "rule34" ? "Rule34.xxx" : "Gelbooru"}</span>
            </p>
          </div>

          {/* Hidden fields (synced with tag and provider) */}
          <input type="hidden" {...control.register("name")} />
          <input type="hidden" {...control.register("type")} />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !tag || !!errors.tag}
            className="px-4 py-3 mt-2 w-full text-sm font-bold text-white bg-blue-600 rounded-lg shadow-lg transition-all hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-500/20"
          >
            {isSubmitting ? "Adding..." : "Start Tracking"}
          </button>
        </form>
      </div>
    </div>
  );
}
