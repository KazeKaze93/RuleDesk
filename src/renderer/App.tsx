import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import log from "electron-log/renderer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProviderId } from "@shared/constants";

import { AppLayout as Layout } from "./components/layout/AppLayout";
import { Settings } from "./features/settings/Settings";
import { AgeGate } from "@/components/onboarding/AgeGate";
import { Tracked } from "./features/artists/Tracked";
import { ArtistDetails } from "./features/artists/ArtistDetails";
import { Favorites } from "./components/pages/Favorites";
import { Updates } from "./components/pages/Updates";
import { Browse } from "./components/pages/Browse";
import { PlaylistsPage } from "./components/pages/PlaylistsPage";
import { StatsPage } from "./components/pages/StatsPage";
import { useTheme } from "./hooks/useTheme";
import { useApplyAppearance } from "./hooks/useApplyAppearance";
import { Toaster } from "./components/ui/sonner";
import { RENDERER_WINDOW_EVENTS } from "@shared/constants";
import { SettingsAccountTab } from "./features/settings/SettingsAccountTab";
import { useSearchStore } from "./store/searchStore";

const AccountGate = ({
  provider,
  onProviderSelect,
  pendingProvider,
  onProviderChangeConfirm,
  onProviderChangeCancel,
  apiKey,
  onApiKeyChange,
  showApiKey,
  onToggleApiKeyVisibility,
  onSaveApiKey,
  accountStatus,
  onResetOnboarding,
}: {
  provider: ProviderId;
  onProviderSelect: (value: ProviderId) => void;
  pendingProvider: ProviderId | null;
  onProviderChangeConfirm: () => void;
  onProviderChangeCancel: () => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  showApiKey: boolean;
  onToggleApiKeyVisibility: () => void;
  onSaveApiKey: () => void;
  accountStatus: "idle" | "success" | "error";
  onResetOnboarding: () => void;
}) => {
  return (
    <div className="flex justify-center items-center p-6 min-h-screen bg-background">
      <div className="space-y-4 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Sign in to RuleDesk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your API key to continue to the full app experience.
          </p>
        </div>
        <SettingsAccountTab
          provider={provider}
          pendingProvider={pendingProvider}
          apiKey={apiKey}
          showApiKey={showApiKey}
          hasApiKey={false}
          accountStatus={accountStatus}
          isDevMode={false}
          onApiKeyChange={onApiKeyChange}
          onToggleApiKeyVisibility={onToggleApiKeyVisibility}
          onSaveApiKey={onSaveApiKey}
          onProviderSelect={onProviderSelect}
          onProviderChangeConfirm={onProviderChangeConfirm}
          onProviderChangeCancel={onProviderChangeCancel}
          onResetOnboarding={onResetOnboarding}
          showUserIdField={false}
        />
      </div>
    </div>
  );
};

function App() {
  useTheme();
  useApplyAppearance();
  const queryClient = useQueryClient();
  const clearTagChips = useSearchStore((state) => state.clearTagChips);
  const resetFilters = useSearchStore((state) => state.resetFilters);
  const [forceAccountGate, setForceAccountGate] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [accountStatus, setAccountStatus] = useState<"idle" | "success" | "error">("idle");
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => window.api.getSettings(),
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    const openOnboarding = () => {
      setForceAccountGate(true);
    };

    window.addEventListener(RENDERER_WINDOW_EVENTS.OPEN_ONBOARDING, openOnboarding);
    return () => {
      window.removeEventListener(RENDERER_WINDOW_EVENTS.OPEN_ONBOARDING, openOnboarding);
    };
  }, []);

  // Loading state: waiting for settings to load
  if (isSettingsLoading || !settings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Age Gate: must be confirmed before any content loads
  const legalConfirmed = settings.isAdultVerified === true && settings.tosAcceptedAt !== null;
  if (!legalConfirmed) {
    return (
      <AgeGate
        onComplete={(updatedSettings) => {
          if (!updatedSettings || typeof updatedSettings.hasApiKey !== "boolean") {
            log.error("[App] Invalid settings from confirmLegal:", updatedSettings);
            return;
          }
          queryClient.setQueryData(["settings"], updatedSettings);
        }}
      />
    );
  }

  const activeProvider = pendingProvider ?? settings.provider;
  const shouldShowAccountGate = forceAccountGate || !settings.hasApiKey;
  const handleSaveApiKey = async () => {
    setAccountStatus("idle");
    try {
      const trimmedApiKey = apiKey.trim();
      const trimmedUserId = settings.userId.trim();
      const saved = await window.api.saveSettings({
        userId: trimmedUserId,
        apiKey: trimmedApiKey,
        provider: activeProvider,
      });
      if (!saved) {
        setAccountStatus("error");
        return;
      }
      setApiKey("");
      setForceAccountGate(false);
      clearTagChips();
      resetFilters();
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      await queryClient.invalidateQueries({ queryKey: ["search"] });
      setAccountStatus("success");
    } catch (error) {
      log.error("[App] Failed to save API key in account gate:", error);
      setAccountStatus("error");
    }
  };

  const handleProviderChangeConfirm = async () => {
    if (!pendingProvider) {
      return;
    }
    const nextProvider = pendingProvider;
    setPendingProvider(null);
    try {
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => {
          const root = queryKey[0];
          return root === "posts" || root === "search" || root === "playlist-posts" || root === "artists";
        },
      });
      await window.api.saveSettings({ provider: nextProvider });
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (error) {
      log.error("[App] Failed to change provider in account gate:", error);
    }
  };

  if (shouldShowAccountGate) {
    return (
      <AccountGate
        provider={settings.provider}
        onProviderSelect={(value) => {
          if (value !== settings.provider) {
            setPendingProvider(value);
          }
        }}
        pendingProvider={pendingProvider}
        onProviderChangeConfirm={() => {
          void handleProviderChangeConfirm();
        }}
        onProviderChangeCancel={() => setPendingProvider(null)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        showApiKey={showApiKey}
        onToggleApiKeyVisibility={() => setShowApiKey((current) => !current)}
        onSaveApiKey={() => {
          void handleSaveApiKey();
        }}
        accountStatus={accountStatus}
        onResetOnboarding={() => {
          void window.api.resetOnboarding().then((reset) => {
            if (reset) {
              window.location.reload();
            }
          });
        }}
      />
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Browse />} />
            <Route path="tracked" element={<Tracked />} />
            <Route path="artist/:id" element={<ArtistDetails />} />
            <Route path="browse" element={<Browse />} />
            <Route path="updates" element={<Updates />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="playlists" element={<PlaylistsPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="*"
              element={<div className="p-10">Page Not Found (Check URL)</div>}
            />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
