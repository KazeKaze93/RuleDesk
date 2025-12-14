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
import { normalizeTag } from "../../shared/lib/tag-utils";

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
      // 1. Нормализуем входную строку (удаляем скобки, пробелы -> подчеркивания)
      const rawInput = data.name;
      const canonicalTag = normalizeTag(rawInput);

      // 2. Формируем объект для БД
      const newArtist: NewArtist = {
        name: rawInput.trim(),
        tag: canonicalTag,
        type: "tag",
        apiEndpoint: data.apiEndpoint.trim(),
      };

      console.log(
        `[UI] Adding artist. Raw: "${data.name}" -> Normalized: "${canonicalTag}"`
      );

      // 3. Отправляем в Main Process
      return window.api.addArtist(newArtist);
    },

    onSuccess: () => {
      // При успехе сбрасываем форму и закрываем модалку
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      setIsOpen(false);
      reset();
      setDuplicateWarning(null);
    },

    onError: (error) => {
      console.error("Mutation failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const isDuplicateError =
        errorMessage.includes("UNIQUE constraint") ||
        errorMessage.includes("SQLITE_CONSTRAINT") ||
        errorMessage.includes("artists.tag") ||
        errorMessage.includes("already exists");

      if (isDuplicateError) {
        const cleanTag = normalizeTag(watchedName || "");
        setDuplicateWarning(
          `This tag "${cleanTag}" is already being tracked. Each tag can only be added once.`
        );
      } else {
        setDuplicateWarning(null);
      }
    },
  });

  const onSubmit = (data: ArtistFormValues) => {
    // Сбрасываем старые ошибки перед новой попыткой
    setDuplicateWarning(null);
    mutation.mutate(data);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          // Очистка при закрытии
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

        {/* Блок ошибки (общий) */}
        {mutation.isError && !duplicateWarning && (
          <div className="p-3 mb-4 text-sm text-red-200 rounded border border-red-800 bg-red-900/50">
            Error:{" "}
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Failed to add artist"}
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
                setDuplicateWarning(null); // Скрываем ошибку при редактировании
              }}
            />

            {errors.name && (
              <span className="text-xs text-red-500">
                {errors.name.message}
              </span>
            )}

            {/* Блок предупреждения о дубликате (Желтый) */}
            {duplicateWarning && (
              <div className="p-3 mt-2 text-sm text-yellow-200 rounded border border-yellow-800 bg-yellow-900/50">
                ⚠️ {duplicateWarning}
              </div>
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
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving...
                </>
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
