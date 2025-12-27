import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import log from "electron-log/renderer";

import { AppLayout as Layout } from "./components/layout/AppLayout";
import { Settings } from "./features/settings/Settings";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { AgeGate } from "@/components/onboarding/AgeGate";
import { Tracked } from "./features/artists/Tracked";
import { ArtistDetails } from "./features/artists/ArtistDetails";
import { Favorites } from "./components/pages/Favorites";

const Browse = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Browse</h1>
    <p>Search here.</p>
  </div>
);
const Updates = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Updates</h1>
    <p>Feed here.</p>
  </div>
);

type LegalStatus = "loading" | "confirmed" | "unconfirmed";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AppState {
  legalStatus: LegalStatus;
  authStatus: AuthStatus;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    legalStatus: "loading",
    authStatus: "loading",
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const settings = await window.api.getSettings();
        
        // Trust TypeScript contract: if getSettings returns IpcSettings, it's validated by Zod in Main process
        if (!settings) {
          log.warn("[App] getSettings returned null/undefined");
          setAppState({
            legalStatus: "unconfirmed",
            authStatus: "unauthenticated",
          });
          return;
        }
        
        // Check Age Gate & ToS status
        // tosAcceptedAt is timestamp (number), null means not accepted
        const legalConfirmed =
          settings.isAdultVerified === true && settings.tosAcceptedAt !== null;
        
        // Update both states atomically to avoid double render
        setAppState({
          legalStatus: legalConfirmed ? "confirmed" : "unconfirmed",
          authStatus: legalConfirmed
            ? settings.hasApiKey
              ? "authenticated"
              : "unauthenticated"
            : "loading",
        });

        if (legalConfirmed) {
          log.info(
            `[App] Auth check result: hasApiKey=${settings.hasApiKey}, userId=${settings.userId}`
          );
        }
      } catch (error) {
        log.error("[App] Failed to check status:", error);
        setAppState({
          legalStatus: "unconfirmed",
          authStatus: "unauthenticated",
        });
      }
    };
    checkStatus();
  }, []);

  // Loading state: waiting for settings to load
  if (appState.legalStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Age Gate: must be confirmed before any content loads
  if (appState.legalStatus === "unconfirmed") {
    return (
      <AgeGate
        onComplete={(settings) => {
          // Validate settings before using
          if (!settings || typeof settings.hasApiKey !== "boolean") {
            log.error("[App] Invalid settings from confirmLegal:", settings);
            setAppState({
              legalStatus: "unconfirmed",
              authStatus: "unauthenticated",
            });
            return;
          }

          // Update both states atomically to avoid double render
          setAppState({
            legalStatus: "confirmed",
            authStatus: settings.hasApiKey ? "authenticated" : "unauthenticated",
          });
        }}
      />
    );
  }

  // Authentication check: only shown after legal confirmation
  if (appState.authStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (appState.authStatus === "unauthenticated") {
    return (
      <Onboarding
        onComplete={() =>
          setAppState((prev) => ({
            ...prev,
            authStatus: "authenticated",
          }))
        }
      />
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Tracked />} />
          <Route path="tracked" element={<Tracked />} />
          <Route path="artist/:id" element={<ArtistDetails />} />
          <Route path="browse" element={<Browse />} />
          <Route path="updates" element={<Updates />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="*"
            element={<div className="p-10">Page Not Found (Check URL)</div>}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
