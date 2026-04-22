import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { GlobalTopBar } from "./GlobalTopBar";
import { PanicButton } from "./PanicButton";
import { ViewerDialog } from "@/features/viewer/ViewerDialog";
import { PendingDownloadBanner } from "../downloads/PendingDownloadBanner";
import { CredentialsErrorToast } from "../dialogs/CredentialsErrorToast";

export const AppLayout = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribeSyncEnd = window.api.onSyncEnd(() => {
      // Sync writes new posts into DB, so all post-based feeds must refresh.
      // Smart playlists are dynamic queries over posts, so they must be invalidated too.
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["search"] });
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
      <div className="flex flex-col flex-1 min-w-0">
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
