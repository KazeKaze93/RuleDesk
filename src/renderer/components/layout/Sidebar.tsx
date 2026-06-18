import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  Users,
  Heart,
  Settings,
  RefreshCw,
  LogOut,
  List,
  BarChart2,
} from "lucide-react";
import log from "electron-log/renderer";
import { Separator } from "@/components/ui/separator";
import { cn } from "../../lib/utils";
import { releaseRadixModalLock } from "../../lib/radix-modal-lock";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import { useSearchStore } from "../../store/searchStore";

const NAV_ITEM_BASE_CLASS =
  "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors [@media(max-height:700px)]:py-2.5 [@media(max-height:599px)]:py-2";
const SYNC_LAST_COMPLETED_QUERY_KEY = ["sync", "lastCompletedAt"];
const LAST_SYNC_REFRESH_INTERVAL_MS = 60_000;

const navGroups = [
  {
    label: "Discover",
    items: [
      { to: "/browse", icon: Search, label: "Browse" },
      { to: "/updates", icon: RefreshCw, label: "Updates" },
    ],
  },
  {
    label: "Library",
    items: [
      { to: "/tracked", icon: Users, label: "Artists" },
      { to: "/favorites", icon: Heart, label: "Favorites" },
      { to: "/playlists", icon: List, label: "Playlists" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/stats", icon: BarChart2, label: "Statistics" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const isNavRouteActive = (pathname: string, to: string): boolean => {
  if (to === "/browse") {
    return pathname === "/" || pathname === "/browse";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
};

export const Sidebar = () => {
  const location = useLocation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [relativeTimeTick, setRelativeTimeTick] = useState(0);
  const queryClient = useQueryClient();
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["updates", "unreadCount"],
    queryFn: () => window.api.getUpdatesUnreadCount(),
    refetchInterval: 30_000,
  });
  const { data: lastSyncTimestamp = null } = useQuery<number | null>({
    queryKey: SYNC_LAST_COMPLETED_QUERY_KEY,
    queryFn: async () => null,
    staleTime: Infinity,
  });
  const clearTagChips = useSearchStore((state) => state.clearTagChips);
  const resetFilters = useSearchStore((state) => state.resetFilters);

  useEffect(() => {
    const unsubscribeStart = window.api.onSyncStart(() => {
      setIsSyncing(true);
    });

    const unsubscribeProgress = window.api.onSyncProgress(() => {
      setIsSyncing(true);
    });

    const unsubscribeEnd = window.api.onSyncEnd(() => {
      setIsSyncing(false);
      queryClient.setQueryData(SYNC_LAST_COMPLETED_QUERY_KEY, Date.now());
    });

    return () => {
      unsubscribeStart();
      unsubscribeProgress();
      unsubscribeEnd();
    };
  }, [queryClient]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRelativeTimeTick((tick) => tick + 1);
    }, LAST_SYNC_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      log.info("[Sidebar] Triggering Sync...");
      await window.api.syncAll();
    } catch (error) {
      log.error("[Sidebar] Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const lastSyncText = useMemo(() => {
    void relativeTimeTick;
    return lastSyncTimestamp === null
      ? "Last sync: never"
      : `Last sync: ${formatRelativeTime(lastSyncTimestamp)}`;
  }, [lastSyncTimestamp, relativeTimeTick]);

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out? You will need to enter your API credentials again."
    );
    if (!confirmed) return;

    try {
      await window.api.logout();
      clearTagChips();
      resetFilters();
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      window.location.reload();
    } catch (error) {
      log.error("[Sidebar] Failed to logout:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const navItemClassName = (isActive: boolean) =>
    cn(
      NAV_ITEM_BASE_CLASS,
      isActive
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    );

  const handleNavClick = () => {
    releaseRadixModalLock();
  };

  return (
    <>
    <aside className="pointer-events-auto fixed inset-y-0 left-0 z-[200] flex w-56 flex-col h-screen border-r bg-background overflow-hidden">
      {/* Logo Area */}
      <div className="flex items-center px-4 h-14 border-b bg-transparent shrink-0">
        <span className="text-4xl font-black leading-none tracking-tight">
          RuleDesk
        </span>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {/* Navigation */}
        <nav
          className="relative z-10 overflow-y-auto flex-1 px-3 py-4 [@media(max-height:700px)]:py-3"
          aria-label="Основная навигация"
        >
          <div className="space-y-4">
            {navGroups.map((group) => (
              <section key={group.label} className="space-y-2">
                <div className="px-1 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <Separator />
                </div>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isNavRouteActive(location.pathname, item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={handleNavClick}
                        className={navItemClassName(isActive)}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                        {item.to === "/updates" && unreadCount > 0 && (
                          <span className="inline-flex justify-center items-center px-2 py-0.5 ml-auto text-xs font-semibold text-white bg-violet-600 rounded-full min-w-5">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        {/* Sync Status Footer */}
        <div className="relative z-10 p-4 space-y-2 border-t bg-muted/20 shrink-0 [@media(max-height:700px)]:p-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
              "flex gap-3 items-center w-full text-left rounded-md transition-all hover:bg-background/50 p-1 -ml-1",
              isSyncing
                ? "opacity-70 cursor-wait"
                : "cursor-pointer hover:opacity-100"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-full bg-background border shadow-sm",
                isSyncing && "animate-spin text-primary border-primary"
              )}
            >
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">
              {isSyncing ? "Syncing..." : "Sync now"}
            </span>
          </button>
          <p className="pl-1 text-xs text-muted-foreground" aria-live="polite">
            {lastSyncText}
          </p>
          <button
            onClick={handleLogout}
            className="flex gap-3 items-center p-2 -ml-1 w-full text-left rounded-md transition-all text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
          </div>
      </div>
    </aside>
    {/* Reserves horizontal space while the rail stays fixed above content */}
    <div className="w-56 shrink-0" aria-hidden="true" />
    </>
  );
};
