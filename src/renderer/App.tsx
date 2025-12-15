import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

// Layouts
import { AppLayout } from "./components/layout/AppLayout";
import { UpdateNotification } from "./components/dialogs/UpdateNotification";
import { Onboarding } from "./components/dialogs/Onboarding";

// Pages
import { Updates } from "./components/pages/Updates";
import { Browse } from "./components/pages/Browse";
import { Favorites } from "./components/pages/Favorites";
import { Tracked } from "./components/pages/Tracked";
import { Settings } from "./components/pages/Settings";
import { ArtistDetails } from "./components/pages/ArtistDetails";

// Создаем клиент один раз
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const isAuthorized = true;

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {/* Глобальные уведомления об обновлениях */}
        <UpdateNotification />

        {!isAuthorized ? (
          // Заглушка для онбординга, чтобы TS не ругался на пустой проп
          <Onboarding onComplete={() => window.location.reload()} />
        ) : (
          <HashRouter>
            <Routes>
              <Route element={<AppLayout />}>
                {/* Редирект с корня на Updates */}
                <Route path="/" element={<Navigate to="/updates" replace />} />

                <Route path="/updates" element={<Updates />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/tracked" element={<Tracked />} />
                <Route path="/artist/:id" element={<ArtistDetails />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </HashRouter>
        )}
      </QueryClientProvider>
    </I18nextProvider>
  );
}
