import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import type { Artist, Post } from "../../main/db/schema";

const POSTS_PER_PAGE = 50;

interface ArtistGalleryProps {
  artist: Artist;
  onBack: () => void;
}

export const ArtistGallery: React.FC<ArtistGalleryProps> = ({
  artist,
  onBack,
}) => {
  // 1. Состояние страницы
  const [page, setPage] = useState(1);

  // 2. Запрос с зависимостью от страницы
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", artist.id, page],
    queryFn: () =>
      window.api.getArtistPosts({
        artistId: artist.id,
        page: page,
      }),
  });

  return (
    <div className="p-6 space-y-6 duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex sticky top-0 z-10 justify-between items-center py-4 border-b backdrop-blur bg-slate-950/80 border-slate-800">
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label="Вернуться к списку авторов"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-white">{artist.name}</h2>
            <div className="flex gap-2 text-xs text-slate-400">
              <span className="px-1 font-mono rounded bg-slate-900 text-slate-500">
                {artist.tag}
              </span>
              <span>•</span>
              <span>
                {posts ? posts.length : 0} постов на стр. {page}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.api.openExternal(
              `https://rule34.xxx/index.php?page=post&s=list&tags=${artist.tag}`
            )
          }
        >
          <ExternalLink className="mr-2 w-4 h-4" />
          Web
        </Button>
      </div>

      {/* Контент галереи */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          Загрузка постов...
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {posts.map((post: Post) => (
            <div
              key={post.id}
              className="relative overflow-hidden rounded-lg border transition-colors group aspect-[2/3] bg-slate-900 border-slate-800 hover:border-blue-500"
            >
              <img
                src={post.previewUrl || post.fileUrl}
                alt={`Image by ${artist.name} with tags ${post.tags}`} // Улучшенный alt для A11y
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="flex absolute inset-0 flex-col justify-end p-2 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity from-black/80 group-hover:opacity-100">
                <span
                  className={`text-xs font-bold ${
                    post.rating === "e" ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {post.rating?.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-lg border border-dashed border-slate-800">
          <p className="text-slate-400">Нет постов на этой странице.</p>
        </div>
      )}

      {/* Пагинация */}
      <div className="flex gap-4 justify-center pb-6 mt-6">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
          variant="outline"
          aria-label="Предыдущая страница"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Назад
        </Button>

        <span className="flex items-center font-mono text-slate-400">
          Страница {page}
        </span>

        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading || (posts && posts.length < POSTS_PER_PAGE)}
          variant="outline"
          aria-label="Следующая страница"
        >
          Вперед <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
