import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import type { NewArtist } from "../../main/db/schema";
import { artistBaseSchema, ArtistFormValues } from "../schemas/form-schemas";
import {
  AsyncAutocomplete,
  type AutocompleteOption,
} from "./inputs/AsyncAutocomplete";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- ЛОГИКА НОРМАЛИЗАЦИИ (Твой код) ---
function normalizeTag(input: string) {
  return input
    .trim()
    .replace(/^#\s*/g, "")
    .replace(/^user:/i, "")
    .replace(/\s*\(\d+\)\s*$/g, "");
}

export const AddArtistModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ArtistFormValues>({
    resolver: zodResolver(artistBaseSchema),
    defaultValues: {
      name: "",
      type: "tag",
      apiEndpoint: "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index",
    },
  });

  const watchedName = useWatch({ control, name: "name" });

  const mutation = useMutation({
    mutationFn: async (data: ArtistFormValues) => {
      // 1. Нормализуем входную строку
      const cleanTag = normalizeTag(data.name);

      // 2. Формируем объект для БД
      const newArtist: NewArtist = {
        name: cleanTag,
        tag: cleanTag,
        type: "tag",
        apiEndpoint: data.apiEndpoint.trim(),
      };

      console.log(
        `[UI] Adding artist. Raw: "${data.name}" -> Normalized: "${cleanTag}"`
      );

      return window.api.addArtist(newArtist);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      setIsOpen(false);
      reset();
      setDuplicateWarning(null);
    },

    onError: (error) => {
      console.error("Mutation failed:", error);
    },
  });

  const onSubmit = (data: ArtistFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setDuplicateWarning(null);
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button aria-label="Add Tracker">
          <Plus className="mr-2 w-4 h-4" /> Track New
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add New Tracker
          </DialogTitle>
        </DialogHeader>

        {mutation.isError && (
          <div className="p-3 mb-4 text-sm text-red-200 rounded border border-red-800 bg-red-900/50">
            Error: {mutation.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <AsyncAutocomplete
              label="Search Tag / Artist"
              fetchOptions={window.api.searchRemoteTags}
              placeholder="e.g. elf, wlop, 2b_(nier)..."
              value={watchedName}
              onSelect={(option: AutocompleteOption | null) => {
                if (option) {
                  const valueToSet = String(option.id || option.label);
                  setValue("name", valueToSet, { shouldValidate: true });
                }
              }}
              onQueryChange={(query: string) => {
                setValue("name", query, { shouldValidate: true });
                setDuplicateWarning(null);
              }}
            />

            {errors.name && (
              <span className="text-xs text-red-500">
                {errors.name.message}
              </span>
            )}

            {duplicateWarning && (
              <p className="mt-1 text-xs text-yellow-400">{duplicateWarning}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Track"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
