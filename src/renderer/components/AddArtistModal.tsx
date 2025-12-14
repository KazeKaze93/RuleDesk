import { useState } from "react";
import { X } from "lucide-react";
import { normalizeTag } from "../../shared/lib/tag-utils";
import { AsyncAutocomplete } from "./inputs/AsyncAutocomplete";
import type { AutocompleteOption } from "./inputs/AsyncAutocomplete";

interface AddArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Keep signature compatible with parent, but we always use "tag" internally
  onAdd: (
    name: string,
    tag: string,
    type: "tag" | "uploader" | "query"
  ) => void;
}

export function AddArtistModal({
  isOpen,
  onClose,
  onAdd,
}: AddArtistModalProps) {
  const [inputTag, setInputTag] = useState("");

  // We hardcode type to "tag" since the user only wants simple tag tracking.
  const type = "tag" as const;

  // Reset state on close
  const handleClose = () => {
    setInputTag("");
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTag) {
      // 1. Normalize the input tag (strip counts like '(1543)')
      const finalTag = normalizeTag(inputTag);

      // 2. Display Name is always the normalized tag (KISS Principle)
      const finalDisplayName = finalTag;

      onAdd(finalDisplayName, finalTag, type);
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
        {" "}
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white">Track New Tag</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full transition-colors hover:bg-zinc-800 text-zinc-400"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tag Input (with Autocomplete) */}
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-medium text-zinc-400">
              Booru Tag to Track
            </label>
            <div className="relative z-20">
              <AsyncAutocomplete
                label=""
                value={inputTag}
                onQueryChange={handleTagChange}
                onSelect={handleTagSelect}
                placeholder="Search tag (e.g. blue_eyes)"
                fetchOptions={async (query: string) => {
                  try {
                    return await window.api.searchRemoteTags(query);
                  } catch (error) {
                    console.error("Failed to search tags:", error);
                    return [];
                  }
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 ml-1">
              Type the full tag. Post counts like '(123)' will be removed on
              submit.
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
