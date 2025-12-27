import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import log from "electron-log/renderer";

import { AppLayout as Layout } from "./components/layout/AppLayout";
import { Settings } from "./features/settings/Settings";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { AgeGate } from "@/components/onboarding/AgeGate";
import { Tracked } from "./features/artists/Tracked";
import { ArtistDetails } from "./features/artists/ArtistDetails";

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
const Favorites = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Favorites</h1>
    <p>Likes here.</p>
  </div>
);

type LegalStatus = "loading" | "confirmed" | "unconfirmed";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

function App() {
  const [legalStatus, setLegalStatus] = useState<LegalStatus>("loading");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const settings = await window.api.getSettings();
        
        // Check Age Gate & ToS status
        const legalConfirmed = settings?.isAdultVerified === true && settings?.tosAcceptedAt !== null;
        setLegalStatus(legalConfirmed ? "confirmed" : "unconfirmed");
        
        // Check authentication status (only if legal is confirmed)
        if (legalConfirmed) {
          const hasApiKey = settings?.hasApiKey ?? false;
          log.info(
            `[App] Auth check result: hasApiKey=${hasApiKey}, userId=${settings?.userId}`
          );
          setAuthStatus(hasApiKey ? "authenticated" : "unauthenticated");
        } else {
          // Don't check auth if legal is not confirmed
          setAuthStatus("loading");
        }
      } catch (error) {
        log.error("[App] Failed to check status:", error);
        setLegalStatus("unconfirmed");
        setAuthStatus("unauthenticated");
      }
    };
    checkStatus();
  }, []);

  // Loading state: waiting for settings to load
  if (legalStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Age Gate: must be confirmed before any content loads
  if (legalStatus === "unconfirmed") {
    return (
      <AgeGate
        onComplete={async (settings) => {
          setLegalStatus("confirmed");
          // Use settings returned from confirmLegal (no extra IPC call)
          const hasApiKey = settings?.hasApiKey ?? false;
          setAuthStatus(hasApiKey ? "authenticated" : "unauthenticated");
        }}
      />
    );
  }

  // Authentication check: only shown after legal confirmation
  if (authStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return <Onboarding onComplete={() => setAuthStatus("authenticated")} />;
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
