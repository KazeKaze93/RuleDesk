import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";

// --- ИМПОРТЫ КОМПОНЕНТОВ ---
import { AppLayout as Layout } from "./components/layout/AppLayout";
import { Settings } from "./components/pages/Settings";
import { Onboarding } from "./components/dialogs/Onboarding";
import { Tracked } from "./components/pages/Tracked"; // Твой список авторов

// 🔥 ИМПОРТ СТРАНИЦЫ АВТОРА (Твой файл)
// Убедись, что путь правильный. Судя по названию, он может лежать в pages или gallery.
// Если файл лежит в components/gallery/ArtistDetails.tsx, исправь путь ниже:
import { ArtistDetails } from "./components/pages/ArtistDetails";

// Заглушки (пока нет файлов)
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

// --- AUTH GUARD ---
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const settings = await window.api.getSettings();

        // @ts-expect-error Типы bridge не обновлены для расшифрованного API ключа
        const hasKeys = settings && settings.userId && settings.apiKey;

        setNeedsOnboarding(!hasKeys);
      } catch (e) {
        console.error(e);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [location]);

  if (isChecking)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );

  if (needsOnboarding) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="p-6 w-full max-w-md">
          <Onboarding onComplete={() => window.location.reload()} />
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthGuard>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Tracked />} />

            <Route path="tracked" element={<Tracked />} />

            {/* 🔥 МАРШРУТ ДЛЯ ТВОЕГО ФАЙЛА 🔥 */}
            {/* :id позволяет вытащить ID автора из URL */}
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
      </AuthGuard>
    </Router>
  );
}

export default App;
