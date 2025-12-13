import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Loader2, User, Tag, Search } from "lucide-react";
import { Button } from "./ui/button";
import type { NewArtist } from "../../main/db/schema";
import { getArtistTag } from "../lib/artist-utils";
import { artistBaseSchema, ArtistFormValues } from "../schemas/form-schemas";
import { cn } from "../lib/utils";
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

export const AddArtistModal: React.FC = () => {
  const { t } = useTranslation();
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
    resolver: zodResolver(artistBaseSchema, {
      path: [],
      async: false,
      errorMap: (issue, ctx) => {
        if (
          issue.code === z.ZodIssueCode.too_small &&
          issue.path[0] === "name"
        ) {
          return { message: t("validation.nameRequired") };
        }
        if (
          issue.code === z.ZodIssueCode.invalid_string &&
          issue.validation === "url"
        ) {
          return { message: t("validation.invalidUrl") };
        }
        return { message: ctx.defaultError };
      },
    }),
    defaultValues: {
      name: "",
      type: "tag",
      apiEndpoint: "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index",
    },
  });

  const selectedType = useWatch({ control, name: "type" });
  const watchedName = useWatch({ control, name: "name" });

  const mutation = useMutation({
    mutationFn: async (data: ArtistFormValues) => {
      const finalTag = getArtistTag(data.name, data.type);

      const newArtist: NewArtist = {
        name: data.name.trim(),
        tag: finalTag.trim(),
        type: data.type,
        apiEndpoint: data.apiEndpoint.trim(),
      };

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

  const getPlaceholder = () => {
    switch (selectedType) {
      case "uploader":
        return t("addArtistModal.placeholderUploader");
      case "query":
        return "elf blonde_hair rating:explicit";
      default:
        return t("addArtistModal.placeholderTag");
    }
  };

  const getLabel = () => {
    switch (selectedType) {
      case "uploader":
        return t("addArtistModal.usernameUploader");
      case "query":
        return "Search Query (Tags)";
      default:
        return t("addArtistModal.artistTagLabel");
    }
  };

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
        <Button aria-label={t("addArtistModal.addArtist")}>
          <Plus className="mr-2 w-4 h-4" /> {t("addArtistModal.addArtist")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t("addArtistModal.newArtist")}
          </DialogTitle>
        </DialogHeader>

        {mutation.isError && (
          <div className="p-3 mb-4 text-sm text-red-200 rounded border border-red-800 bg-red-900/50">
            {t("addArtistModal.error", { message: mutation.error.message })}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1 rounded border bg-slate-950 border-slate-800">
            <button
              type="button"
              onClick={() => setValue("type", "tag")}
              className={cn(
                "flex items-center justify-center py-2 text-sm rounded transition-colors",
                selectedType === "tag"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Tag className="mr-2 w-4 h-4" /> {t("addArtistModal.artistTag")}
            </button>
            <button
              type="button"
              onClick={() => setValue("type", "uploader")}
              className={cn(
                "flex items-center justify-center py-2 text-sm rounded transition-colors",
                selectedType === "uploader"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <User className="mr-2 w-4 h-4" /> {t("addArtistModal.uploader")}
            </button>

            <button
              type="button"
              onClick={() => setValue("type", "query")}
              className={cn(
                "flex items-center justify-center py-2 text-sm rounded transition-colors",
                selectedType === "query"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Search className="mr-2 w-4 h-4" /> Subs
            </button>
          </div>

          <div>
            <AsyncAutocomplete
              label={getLabel()}
              fetchOptions={window.api.searchRemoteTags}
              placeholder={getPlaceholder()}
              value={watchedName}
              onSelect={(option: AutocompleteOption | null) => {
                if (option) {
                  setValue("name", option.label, { shouldValidate: true });
                  setDuplicateWarning(
                    t("addArtistModal.duplicateWarning", {
                      name: option.label,
                      defaultValue: `Warning: "${option.label}" already exists.`,
                    })
                  );
                } else {
                  setDuplicateWarning(null);
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

            {watchedName && (
              <p className="mt-1 font-mono text-xs text-slate-500">
                {t("addArtistModal.willBeSent")}{" "}
                <span className="text-blue-400">
                  {getArtistTag(watchedName, selectedType)}{" "}
                </span>
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              {t("addArtistModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              aria-label={t("addArtistModal.add")}
            >
              {mutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                t("addArtistModal.add")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
