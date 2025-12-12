import React, { useState, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { Artist } from "../main/db/schema";
import { AddArtistModal } from "./components/AddArtistModal";
import { Onboarding } from "./components/Onboarding";
import { Button } from "./components/ui/button";
import { ArtistGallery } from "./components/ArtistGallery";

const queryClient = new QueryClient();

// --- Интерфейс для пропсов ---
interface DashboardProps {
  version?: string;
}

// --- Указываем React.FC<DashboardProps> ---
const Dashboard: React.FC<DashboardProps> = ({ version }) => {
  // Состояние: какой автор выбран?
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const {
    data: artists,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  const syncMutation = useMutation({
    mutationFn: () => window.api.syncAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
    },
  });

  // --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ (ЭТОГО НЕ ХВАТАЛО) ---
  if (selectedArtist) {
    return (
      <div className="p-8 min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-7xl">
          <ArtistGallery
            artist={selectedArtist}
            onBack={() => setSelectedArtist(null)}
          />
        </div>
      </div>
    );
  }
  // ----------------------------------------------

  return (
    <div className="p-8 min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            NSFW Booru Client
          </h1>
          <div className="flex gap-4 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  syncMutation.isPending ? "animate-spin" : ""
                }`}
              />
              {syncMutation.isPending ? "Syncing..." : "Sync All"}
            </Button>
            <span className="font-mono text-xs text-slate-500">
              v{version || "..."}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tracked Artists</h2>

          {isLoading && (
            <div className="text-yellow-400">Loading from SQLite...</div>
          )}

          {error && (
            <div className="p-4 text-red-200 rounded border border-red-800 bg-red-900/50">
              🛑 DB Error: {(error as Error).message}
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid gap-4">
              {artists && artists.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-slate-700 text-slate-400">
                  Список отслеживания пуст.
                </div>
              ) : (
                <div className="grid gap-2">
                  {artists?.map((artist: Artist) => (
                    <div
                      key={artist.id}
                      onClick={() => setSelectedArtist(artist)} // <--- КЛИК ОТКРЫВАЕТ ГАЛЕРЕЮ
                      className="flex justify-between items-center p-3 rounded border transition-colors cursor-pointer bg-slate-900 border-slate-800 hover:bg-slate-800 group"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-blue-400 transition-colors group-hover:text-blue-300">
                          {artist.name}
                        </span>
                        <div className="text-xs text-slate-500">
                          {/* Показываем реальный тег для отладки */}[
                          {artist.tag}] Last ID: {artist.lastPostId} | New:{" "}
                          {artist.newPostsCount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8">
          <AddArtistModal />
        </div>
      </div>
    </div>
  );
};

// --- Логика переключения экранов ---
const AppContent: React.FC = () => {
  const [hasAuth, setHasAuth] = useState<boolean | null>(null);

  const { data: version } = useQuery({
    queryKey: ["version"],
    queryFn: () => window.api.getAppVersion(),
  });

  useEffect(() => {
    window.api.getSettings().then((settings) => {
      setHasAuth(!!settings && !!settings.userId);
    });
  }, []);

  if (hasAuth === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950 text-slate-500">
        Загрузка...
      </div>
    );
  }

  if (!hasAuth) {
    return <Onboarding onComplete={() => setHasAuth(true)} />;
  }

  return <Dashboard version={version} />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
