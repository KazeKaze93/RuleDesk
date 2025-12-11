import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import type { NewArtist } from "../../main/db/schema";

// --- ДОБАВЛЕНО: Схема валидации и Типы ---
const artistSchema = z.object({
  username: z.string().min(1, "Имя обязательно"),
  apiEndpoint: z.string().url("Некорректный URL"),
});

type ArtistFormValues = z.infer<typeof artistSchema>;
// -----------------------------------------

export const AddArtistModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Хук формы
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ArtistFormValues>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      username: "",
      apiEndpoint: "https://danbooru.donmai.us",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ArtistFormValues) => {
      // Создаем объект строго по типу NewArtist
      // lastPostId и newPostsCount инициализируем нулями
      // lastChecked и createdAt база заполнит сама (или null)
      const newArtist: NewArtist = {
        username: data.username,
        apiEndpoint: data.apiEndpoint,
        lastPostId: 0,
        newPostsCount: 0,
      };
      return window.api.addArtist(newArtist);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      setIsOpen(false);
      reset();
    },
    // Ошибки обрабатываем через mutation.isError в рендере
  });

  const onSubmit = (data: ArtistFormValues) => {
    mutation.mutate(data);
  };

  // Закрытие по Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 w-4 h-4" /> Добавить Автора
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/80"
        >
          {/* Добавляем onClick на фон для закрытия (UX) */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <div className="relative z-10 p-6 w-full max-w-md rounded-lg border shadow-xl bg-slate-900 border-slate-700">
            <h2 className="mb-4 text-xl font-bold text-white">
              Отслеживать нового автора
            </h2>

            {/* Отображение ошибки API внутри формы */}
            {mutation.isError && (
              <div className="p-3 mb-4 text-sm text-red-200 rounded border border-red-800 bg-red-900/50">
                Ошибка сервера: {mutation.error.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-400">
                  Имя автора (Tag)
                </label>
                <input
                  {...register("username")}
                  autoFocus
                  className="px-3 py-2 w-full text-white rounded border bg-slate-950 border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. wlop"
                />
                {errors.username && (
                  <span className="text-xs text-red-500">
                    {errors.username.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-400">
                  Booru URL
                </label>
                <input
                  {...register("apiEndpoint")}
                  className="px-3 py-2 w-full text-white rounded border bg-slate-950 border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.apiEndpoint && (
                  <span className="text-xs text-red-500">
                    {errors.apiEndpoint.message}
                  </span>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  )}
                  Добавить
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
