import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { releaseRadixModalLock } from "@/lib/radix-modal-lock";
import { useViewerStore } from "@/store/viewerStore";
import { useArtistsSyncInvalidation } from "@/hooks/useArtistsSyncInvalidation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { GlobalTopBar } from "./GlobalTopBar";
import { PanicButton } from "./PanicButton";
import { ViewerDialog } from "@/features/viewer/ViewerDialog";
import { PendingDownloadBanner } from "../downloads/PendingDownloadBanner";
import { CredentialsErrorToast } from "../dialogs/CredentialsErrorToast";
import { SyncErrorAggregator } from "../dialogs/SyncErrorAggregator";

/** Outer content padding contract for routes under AppLayout. */
type ContentVariant = "padded" | "flush";

/**
 * Exhaustive map of static AppLayout child paths → content variant.
 * Dynamic paths (`/artist/:id`) and the catch-all fall through to `padded`.
 */
const CONTENT_VARIANT_BY_ROUTE = {
  "/browse": "flush",
  "/updates": "flush",
  "/favorites": "flush",
  "/tracked": "padded",
  "/playlists": "padded",
  "/stats": "padded",
  "/settings": "padded",
} as const satisfies Record<string, ContentVariant>;

type StaticAppRoute = keyof typeof CONTENT_VARIANT_BY_ROUTE;

function isStaticAppRoute(pathname: string): pathname is StaticAppRoute {
  return Object.prototype.hasOwnProperty.call(CONTENT_VARIANT_BY_ROUTE, pathname);
}

function resolveContentVariant(pathname: string): ContentVariant {
  if (isStaticAppRoute(pathname)) {
    return CONTENT_VARIANT_BY_ROUTE[pathname];
  }
  return "padded";
}

export const AppLayout = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const contentVariant = resolveContentVariant(location.pathname);

  useArtistsSyncInvalidation(queryClient);

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

  return (
    <div className="flex overflow-hidden w-full h-screen bg-background text-foreground">
      <Sidebar />

      <div className="relative z-0 flex flex-col flex-1 min-w-0">
        <PendingDownloadBanner />
        <GlobalTopBar />

        <main
          className={cn(
            "overflow-auto flex-1 bg-background",
            contentVariant === "padded" && "p-6"
          )}
        >
          <Outlet />
        </main>
      </div>

      <ViewerDialog />
      <CredentialsErrorToast />
      <SyncErrorAggregator />
      <PanicButton />
    </div>
  );
};
