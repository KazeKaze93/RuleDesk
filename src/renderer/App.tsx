import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

// --- ИМПОРТЫ КОМПОНЕНТОВ ---
import { AppLayout as Layout } from "./components/layout/AppLayout";
import { Settings } from "./components/pages/Settings";
import { Onboarding } from "./components/pages/Onboarding";
import { Tracked } from "./components/pages/Tracked";
import { ArtistDetails } from "./components/pages/ArtistDetails";
import { Browse } from "./components/pages/Browse"; // Импорт настоящего компонента

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
        console.log(
          `[App] Auth check result: hasApiKey=${settings?.hasApiKey}, userId=${settings?.userId}`
        );
        setIsAuthenticated(settings?.hasApiKey ?? false);
      } catch (error) {
        console.error("Failed to check authentication:", error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Show loader while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show onboarding if not authenticated
  if (isAuthenticated === false) {
    return <Onboarding onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Show main app if authenticated
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
