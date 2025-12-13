import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, ExternalLink, Wrench } from "lucide-react";
import { Button } from "./ui/button";
import type { Artist } from "../../main/db/schema";

const POSTS_PER_PAGE = 50;

interface ArtistGalleryProps {
  artist: Artist;
  onBack: () => void;
}

export const ArtistGallery: React.FC<ArtistGalleryProps> = ({
  artist,
  onBack,
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", artist.id, page],
    queryFn: () =>
      window.api.getArtistPosts({
        artistId: artist.id,
        page: page,
      }),
  });

  const handleRepairSync = async () => {
    if (isLoading) return;

    if (
      !confirm(t("artistGallery.repairConfirm", { artistName: artist.name }))
    ) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["posts", artist.id] });

    try {
      await window.api.repairArtist(artist.id);

      queryClient.invalidateQueries({ queryKey: ["artists"] });

      console.log(`Repair sync for ${artist.name} completed.`);
    } catch (e) {
      console.error(
        `Repair Error: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  };

  return (
    <div className="p-6 space-y-6 duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex sticky top-0 z-10 justify-between items-center py-4 border-b backdrop-blur bg-slate-950/80 border-slate-800">
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label={t("artistGallery.backToArtists")}
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
                {posts ? posts.length : 0} {t("artistGallery.postsOnPage")}{" "}
                {page}
              </span>
            </div>
          </div>
        </div>

        {/* REPAIR AND WEB BUTTONS */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRepairSync}
            disabled={isLoading}
            title={t("artistGallery.repairTitle")}
          >
            <Wrench className="mr-2 w-4 h-4" />
            {t("artistGallery.repair")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.api.openExternal(
                `https://rule34.xxx/index.php?page=post&s=list&tags=${artist.tag}`
              )
            }
            aria-label={t("artistGallery.openInBrowser")}
          >
            <ExternalLink className="mr-2 w-4 h-4" />
            {t("artistGallery.web")}
          </Button>
        </div>
      </div>

      {/* Content Gallery */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          {t("artistGallery.loadingPosts")}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {posts.map((post) => (
            <div
              key={post.postId}
              className="relative overflow-hidden rounded-lg border transition-colors group aspect-[2/3] bg-slate-900 border-slate-800 hover:border-blue-500"
            >
              {post.previewUrl ? (
                <img
                  src={post.previewUrl}
                  alt={t("artistGallery.imageAlt", {
                    artistName: artist.name,
                    tags: post.tags,
                  })}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex justify-center items-center w-full h-full text-slate-500">
                  <p className="text-sm">{t("artistGallery.noPreview")}</p>
                </div>
              )}
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
          <p className="text-slate-400">{t("artistGallery.noPostsFound")}</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex gap-4 justify-center pb-6 mt-6">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
          variant="outline"
          aria-label={t("artistGallery.previousPage")}
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> {t("artistGallery.back")}
        </Button>

        <span className="flex items-center font-mono text-slate-400">
          {t("artistGallery.page")} {page}
        </span>

        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading || (posts && posts.length < POSTS_PER_PAGE)}
          variant="outline"
          aria-label={t("artistGallery.nextPage")}
        >
          {t("artistGallery.next")} <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
