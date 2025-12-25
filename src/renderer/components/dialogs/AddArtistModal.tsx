import { useState } from "react";
import { X } from "lucide-react";
import log from "electron-log/renderer";
import { normalizeTag } from "../../lib/tag-utils";
import { AsyncAutocomplete } from "../inputs/AsyncAutocomplete";
import type { AutocompleteOption } from "../inputs/AsyncAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import type { ProviderId } from "../../../main/providers";

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
  const [inputTag, setInputTag] = useState("");
  const [provider, setProvider] = useState<ProviderId>("rule34");
  const type = "tag" as const;

  const handleClose = () => {
    setInputTag("");
    setProvider("rule34");
    onClose();
  };

  // Reset inputTag when provider changes to avoid cross-provider tag confusion
  const handleProviderChange = (newProvider: ProviderId) => {
    setProvider(newProvider);
    setInputTag(""); // Clear input when switching providers
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTag) {
      const finalTag = normalizeTag(inputTag);
      const finalDisplayName = finalTag;
      onAdd(finalDisplayName, finalTag, type, provider);
      handleClose();
    }
  };

  const handleTagSelect = (option: AutocompleteOption | null) => {
    const selectedTag = option?.label || "";
    setInputTag(selectedTag);
  };

  const handleTagChange = (query: string) => {
    setInputTag(query);
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="provider-select" className="ml-1 text-xs font-medium text-zinc-400">
              Provider
            </Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger id="provider-select" className="w-full bg-zinc-950 border-zinc-800 text-white">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="rule34">Rule34.xxx</SelectItem>
                <SelectItem value="gelbooru">Gelbooru</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Input */}
          <div className="space-y-1.5">
            <div className="relative z-20">
              <AsyncAutocomplete
                label="Tag to Track"
                value={inputTag}
                onQueryChange={handleTagChange}
                onSelect={handleTagSelect}
                placeholder={`Search on ${provider === "rule34" ? "Rule34.xxx" : "Gelbooru"}...`}
                fetchOptions={async (query: string) => {
                  // Use custom hook for remote tag search (handles AbortController internally)
                  // For now, keep inline for backward compatibility, but consider refactoring
                  // to use useRemoteTags hook directly in component
                  try {
                    return await window.api.searchRemoteTags(query, provider);
                  } catch (error) {
                    log.error("[AddArtistModal] Failed to search tags:", error);
                    return [];
                  }
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 ml-1">
              Searching on <span className="font-medium text-zinc-400">{provider === "rule34" ? "Rule34.xxx" : "Gelbooru"}</span>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!inputTag}
            className="px-4 py-3 mt-2 w-full text-sm font-bold text-white bg-blue-600 rounded-lg shadow-lg transition-all hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-500/20"
          >
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
}
