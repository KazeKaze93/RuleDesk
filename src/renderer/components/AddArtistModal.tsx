import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, User, Tag } from "lucide-react";
import type { NewArtist } from "../../main/db/schema";

// --- SHADCN IMPORTS ---
// Убедись, что пути правильные (зависят от твоего tsconfig)
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Схема валидации
const artistSchema = z.object({
  name: z.string().min(1, "Имя обязательно"),
  type: z.enum(["tag", "uploader"]),
  apiEndpoint: z.string().url(),
});

type ArtistFormValues = z.infer<typeof artistSchema>;

export const AddArtistModal: React.FC = () => {
  const [open, setOpen] = useState(false); // Управляем состоянием диалога
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ArtistFormValues>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      name: "",
      type: "tag",
      apiEndpoint: "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index",
    },
  });

  const watchedName = useWatch({ control, name: "name" });
  const selectedType = useWatch({ control, name: "type" });

  const mutation = useMutation({
    mutationFn: async (data: ArtistFormValues) => {
      let finalTag = data.name.trim();
      if (data.type === "uploader") {
        finalTag = `user:${data.name.trim()}`;
      } else {
        finalTag = data.name.trim().toLowerCase().replace(/ /g, "_");
      }

      const newArtist: NewArtist = {
        name: data.name,
        tag: finalTag,
        type: data.type,
        apiEndpoint: data.apiEndpoint,
        lastPostId: 0,
        newPostsCount: 0,
      };

      return window.api.addArtist(newArtist);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      setOpen(false); // Закрываем диалог
      reset(); // Сбрасываем форму
    },
  });

  const onSubmit = (data: ArtistFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 w-4 h-4" /> Добавить Автора
        </Button>
      </DialogTrigger>

      {/* sm:max-w-[425px] задает ширину. bg-slate-900 нужен, так как у тебя темная тема */}
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Новый автор</DialogTitle>
        </DialogHeader>

        {mutation.isError && (
          <div className="p-3 mb-4 text-sm text-red-200 rounded border border-red-800 bg-red-900/50">
            Ошибка: {mutation.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Выбор типа */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded border bg-slate-950 border-slate-800">
            <button
              type="button"
              onClick={() => setValue("type", "tag")}
              className={`flex items-center justify-center py-2 text-sm rounded transition-colors ${
                selectedType === "tag"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Tag className="mr-2 w-4 h-4" /> Artist Tag
            </button>
            <button
              type="button"
              onClick={() => setValue("type", "uploader")}
              className={`flex items-center justify-center py-2 text-sm rounded transition-colors ${
                selectedType === "uploader"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="mr-2 w-4 h-4" /> Uploader
            </button>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-400">
              {selectedType === "uploader"
                ? "Имя пользователя (Uploader)"
                : "Тег автора"}
            </label>
            <input
              id="artist-name-input"
              {...register("name")}
              autoFocus
              className="px-3 py-2 w-full text-white rounded border bg-slate-950 border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={selectedType === "uploader" ? "Lesdias" : "wlop"}
            />
            {errors.name && (
              <span className="text-xs text-red-500">
                {errors.name.message}
              </span>
            )}

            {watchedName && (
              <p className="mt-1 font-mono text-xs text-slate-500">
                Будет отправлено:{" "}
                <span className="text-blue-400">
                  {selectedType === "uploader"
                    ? `user:${watchedName}`
                    : watchedName.toLowerCase().replace(/ /g, "_")}
                </span>
              </p>
            )}
          </div>

          <input type="hidden" {...register("apiEndpoint")} />

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Добавить"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
