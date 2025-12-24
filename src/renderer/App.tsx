import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import { AppLayout as Layout } from "./components/layout/AppLayout";
import { Settings } from "./features/settings/Settings";
import { Onboarding } from "@/features/onboarding/Onboarding";
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const settings = await window.api.getSettings();
        // hasApiKey is always boolean (non-nullable) per IpcSettings interface
        const hasApiKey = settings?.hasApiKey ?? false;
        console.log(
          `[App] Auth check result: hasApiKey=${hasApiKey}, userId=${settings?.userId}`
        );
        setIsAuthenticated(hasApiKey);
      } catch (error) {
        console.error("Failed to check authentication:", error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return <Onboarding onComplete={() => setIsAuthenticated(true)} />;
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
