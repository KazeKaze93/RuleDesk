import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

// --- ИМПОРТЫ КОМПОНЕНТОВ ---
import { AppLayout } from "./components/layout/AppLayout";
import { Settings } from "./components/pages/Settings";
import { Onboarding } from "./components/pages/Onboarding";
import { Tracked } from "./components/pages/Tracked";
import { ArtistDetails } from "./components/pages/ArtistDetails";
import { Browse } from "./components/pages/Browse";
import { ViewerDialog } from "./components/viewer/ViewerDialog";

// Заглушки
const Updates = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Updates</h1>
  </div>
);
const Favorites = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Favorites</h1>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const settings = await window.api.getSettings();
        // [FIX AUTH] Более мягкая проверка.
        // Если есть userId ИЛИ ключ, считаем что пользователь прошел онбординг.
        // Это предотвратит постоянный логаут.
        const isAuth = !!(settings?.userId || settings?.encryptedApiKey);

        console.log(`[App] Auth check: ${isAuth} (ID: ${settings?.userId})`);
        setIsAuthenticated(isAuth);
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
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Onboarding onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/browse" replace />} />
          <Route path="browse" element={<Browse />} />
          <Route path="tracked" element={<Tracked />} />
          <Route path="artist/:id" element={<ArtistDetails />} />
          <Route path="updates" element={<Updates />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<div className="p-10">404 Not Found</div>} />
        </Route>
      </Routes>

      {/* [FIX CLICKABILITY] Диалог должен быть ВНЕ Routes, но ВНУТРИ Router */}
      <ViewerDialog />
    </Router>
  );
}

export default App;
