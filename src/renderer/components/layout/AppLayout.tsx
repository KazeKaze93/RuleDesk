import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { releaseRadixModalLock } from "@/lib/radix-modal-lock";
import { useViewerStore } from "@/store/viewerStore";
import { Sidebar } from "./Sidebar";
import { GlobalTopBar } from "./GlobalTopBar";
import { PanicButton } from "./PanicButton";
import { ViewerDialog } from "@/features/viewer/ViewerDialog";
import { PendingDownloadBanner } from "../downloads/PendingDownloadBanner";
import { CredentialsErrorToast } from "../dialogs/CredentialsErrorToast";

export const AppLayout = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    releaseRadixModalLock();
  }, []);

  useEffect(() => {
    useViewerStore.getState().close();
    releaseRadixModalLock();
    const frameId = requestAnimationFrame(() => {
      releaseRadixModalLock();
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribeSyncEnd = window.api.onSyncEnd(() => {
      // Sync writes new posts into DB, so all post-based feeds must refresh.
      // Smart playlists are dynamic queries over posts, so they must be invalidated too.
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["playlist-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
      void queryClient.invalidateQueries({ queryKey: ["artists"] });
      void queryClient.invalidateQueries({ queryKey: ["posts-count"] });
    });

    return () => {
      unsubscribeSyncEnd();
    };
  }, [queryClient]);

  return (
    <div className="flex overflow-hidden w-full h-screen bg-background text-foreground">
      {/* Left Rail */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="relative z-0 flex flex-col flex-1 min-w-0">
        <PendingDownloadBanner />
        <GlobalTopBar />

        {/* Scrollable Content */}
        <main className="overflow-auto flex-1 p-6 bg-background">
          <Outlet />
        </main>
      </div>

      {/* ViewerDialog must always be rendered - it manages visibility internally via Dialog */}
      <ViewerDialog />
      <CredentialsErrorToast />
      <PanicButton />
    </div>
  );
};
