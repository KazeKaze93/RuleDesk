import React, { useState, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { I18nextProvider, useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import type { Artist } from "../main/db/schema";
import { AddArtistModal } from "./components/AddArtistModal";
import { Onboarding } from "./components/Onboarding";
import { Button } from "./components/ui/button";
import { ArtistGallery } from "./components/ArtistGallery";
import { UpdateNotification } from "./components/UpdateNotification";
import { cn } from "./lib/utils";
import i18n from "./i18n";
import { ArtistCard } from "./components/ArtistCard.tsx";

const queryClient = new QueryClient();

// --- 1. Sub-component: Только список артистов (UI) ---
const ArtistListView: React.FC<{
  artists: Artist[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onSelect: (artist: Artist) => void;
  onSync: () => void;
  isSyncing: boolean;
  syncMessage: string;
  version?: string;
}> = ({
  artists,
  isLoading,
  error,
  onSelect,
  onSync,
  isSyncing,
  syncMessage,
  version,
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-8 min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            {t("app.appTitle")}
          </h1>
          <div className="flex gap-4 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              aria-live="polite"
              aria-label={
                isSyncing
                  ? t("app.syncingInProgress", { message: syncMessage })
                  : t("app.startSynchronization")
              }
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")}
              />
              {isSyncing ? syncMessage || t("app.syncing") : t("app.syncAll")}
            </Button>
            <span className="font-mono text-xs text-slate-500">
              v{version || "..."}
            </span>
          </div>
        </div>

        {/* Content State Handling */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t("app.trackedArtists")}</h2>

          {isLoading && (
            <div className="text-yellow-400">{t("app.loadingFromSqlite")}</div>
          )}

          {error && (
            <div className="p-4 text-red-200 rounded border border-red-800 bg-red-900/50">
              {t("app.dbError", { message: error.message })}
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid gap-4">
              {artists && artists.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-slate-700 text-slate-400">
                  {t("app.trackingListEmpty")}
                </div>
              ) : (
                <div className="grid gap-2">
                  {/* ВОТ ЗДЕСЬ МЫ ЗАМЕНИЛИ КУСОК КОДА */}
                  {artists?.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      onSelect={onSelect}
                    />
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

// --- 2. Controller: Логика переключения экранов (List <-> Gallery) ---
const MainScreen: React.FC<{ version?: string }> = ({ version }) => {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const {
    data: artists,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  useEffect(() => {
    const unsubStart = window.api.onSyncStart(() => {
      setIsSyncing(true);
      setSyncMessage("Starting...");
    });

    const unsubProgress = window.api.onSyncProgress((msg) => {
      setSyncMessage(msg);
    });

    const unsubEnd = window.api.onSyncEnd(() => {
      setIsSyncing(false);
      setSyncMessage("");
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      refetch();
    });

    const unsubError = window.api.onSyncError((message) => {
      setIsSyncing(false);
      setSyncMessage(`Error: ${message}`);
      // Тут можно показать тостер или модалку
    });

    return () => {
      unsubStart();
      unsubProgress();
      unsubEnd();
      unsubError();
    };
  }, [refetch]);

  const handleSync = () => {
    window.api.syncAll();
  };

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

  return (
    <ArtistListView
      artists={artists}
      isLoading={isLoading}
      error={error as Error | null}
      version={version}
      onSelect={setSelectedArtist}
      onSync={handleSync}
      isSyncing={isSyncing}
      syncMessage={syncMessage}
    />
  );
};

// --- 3. Auth Guard: Проверка авторизации ---
const Root: React.FC = () => {
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

  const { t } = useTranslation();
  if (hasAuth === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950 text-slate-500">
        {t("app.loading")}
      </div>
    );
  }

  if (!hasAuth) {
    return <Onboarding onComplete={() => setHasAuth(true)} />;
  }

  return <MainScreen version={version} />;
};

// --- 4. App Entry: Провайдеры и глобальные компоненты ---
export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <Root />
        <UpdateNotification />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
