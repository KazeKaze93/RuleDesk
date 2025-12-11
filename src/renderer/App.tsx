import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import type { Artist } from "../main/db/schema";
import { AddArtistModal } from "./components/AddArtistModal";

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  // 1. Тест простого IPC
  const { data: version } = useQuery({
    queryKey: ["version"],
    queryFn: () => window.api.getAppVersion(),
  });

  // 2. Тест Базы Данных (Drizzle + SQLite)
  const {
    data: artists,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  return (
    <div className="p-8 min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto space-y-6 max-w-4xl">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            NSFW Booru Client
          </h1>
          <span className="font-mono text-xs text-slate-500">
            v{version || "..."}
          </span>
        </div>

        {/* Секция Статуса БД */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Database Connection Check</h2>

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
                  База данных работает, но она пуста.
                  <br />
                  <span className="block mt-2 text-xs">
                    Это хорошо! Значит миграции прошли успешно.
                  </span>
                </div>
              ) : (
                <div className="grid gap-2">
                  {artists?.map((artist: Artist) => (
                    <div
                      key={artist.id}
                      className="p-3 rounded border bg-slate-900 border-slate-800"
                    >
                      {artist.username}
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
