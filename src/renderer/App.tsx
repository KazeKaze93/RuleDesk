import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import log from "electron-log/renderer";

import { AppLayout as Layout } from "./components/layout/AppLayout";
import { Settings } from "./features/settings/Settings";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { AgeGate } from "@/components/onboarding/AgeGate";
import { Tracked } from "./features/artists/Tracked";
import { ArtistDetails } from "./features/artists/ArtistDetails";
import { Favorites } from "./components/pages/Favorites";
import { Updates } from "./components/pages/Updates";
import { Browse } from "./components/pages/Browse";
import { PlaylistsPage } from "./components/pages/PlaylistsPage";
import { useTheme } from "./hooks/useTheme";

type LegalStatus = "loading" | "confirmed" | "unconfirmed";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AppState {
  legalStatus: LegalStatus;
  authStatus: AuthStatus;
}

function App() {
  useTheme();
  const [appState, setAppState] = useState<AppState>({
    legalStatus: "loading",
    authStatus: "loading",
  });
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true); // Use ref to track mount state across async operations
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Reset mount state on mount
    isMountedRef.current = true;

    const checkStatus = async () => {
      try {
        log.debug("[App] Starting status check...");
        const settings = await window.api.getSettings();
        log.debug("[App] getSettings completed", { 
          hasSettings: !!settings,
          isAdultVerified: settings?.isAdultVerified,
          tosAcceptedAt: settings?.tosAcceptedAt,
          hasApiKey: settings?.hasApiKey 
        });
        
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) {
          log.debug("[App] Component unmounted, skipping state update");
          return;
        }
        
        // Trust TypeScript contract: if getSettings returns IpcSettings, it's validated by Zod in Main process
        if (!settings) {
          log.warn("[App] getSettings returned null/undefined");
          if (!isMountedRef.current) return;
          setAppState({
            legalStatus: "unconfirmed",
            authStatus: "unauthenticated",
          });
          return;
        }
        
        // Reset retry count on success
        retryCountRef.current = 0;
        
        // Check Age Gate & ToS status
        // tosAcceptedAt is timestamp (number), null means not accepted
        const legalConfirmed =
          settings.isAdultVerified === true && settings.tosAcceptedAt !== null;
        
        log.debug("[App] Status check result", {
          legalConfirmed,
          isAdultVerified: settings.isAdultVerified,
          tosAcceptedAt: settings.tosAcceptedAt,
          hasApiKey: settings.hasApiKey,
        });
        
        // Update both states atomically to avoid double render
        if (!isMountedRef.current) {
          log.debug("[App] Component unmounted before state update");
          return;
        }
        
        // If legal is not confirmed, authStatus should be "unauthenticated", not "loading"
        // "loading" is only used when legal is confirmed but we're still checking auth
        const newState = {
          legalStatus: legalConfirmed ? ("confirmed" as const) : ("unconfirmed" as const),
          authStatus: legalConfirmed
            ? (settings.hasApiKey ? ("authenticated" as const) : ("unauthenticated" as const))
            : ("unauthenticated" as const), // If legal not confirmed, auth is unauthenticated
        };
        
        log.debug("[App] Updating app state", newState);
        setAppState(newState);

        if (legalConfirmed) {
          log.info(
            `[App] Auth check result: hasApiKey=${settings.hasApiKey}, userId=${settings.userId}`
          );
        }
      } catch (error) {
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) {
          return;
        }
        
        // Use typed error code - do NOT parse error messages (brittle and error-prone)
        // If Main process changes error text, UI would break without this check
        const errorCode = (error as { code?: string })?.code;
        const isRateLimit = errorCode === "RATE_LIMIT";
        
        // Handle rate limit errors with exponential backoff
        if (isRateLimit && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
          log.debug(`[App] Rate limit detected, retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
          timeoutIdRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              checkStatus();
            }
          }, delay);
          return;
        }
        
        // For other errors or max retries exceeded, log and set to unconfirmed
        if (retryCountRef.current >= MAX_RETRIES) {
          log.error("[App] Max retries exceeded, setting to unconfirmed");
        } else {
          log.error("[App] Failed to check status:", error);
        }
        
        if (!isMountedRef.current) return;
        setAppState({
          legalStatus: "unconfirmed",
          authStatus: "unauthenticated",
        });
      }
    };
    
    // Start status check
    checkStatus();
    
    return () => {
      // Mark as unmounted to prevent state updates
      isMountedRef.current = false;
      // Clear any pending timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const openOnboarding = () => {
      setAppState((prev) => ({
        ...prev,
        authStatus: "unauthenticated",
      }));
    };

    window.addEventListener("app:open-onboarding", openOnboarding);
    return () => {
      window.removeEventListener("app:open-onboarding", openOnboarding);
    };
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
          <Route index element={<Browse />} />
          <Route path="tracked" element={<Tracked />} />
          <Route path="artist/:id" element={<ArtistDetails />} />
          <Route path="browse" element={<Browse />} />
          <Route path="updates" element={<Updates />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="playlists" element={<PlaylistsPage />} />
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
