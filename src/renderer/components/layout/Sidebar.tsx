import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  Users,
  Heart,
  Settings,
  RefreshCw,
  List,
  BarChart2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "../../lib/utils";
import { releaseRadixModalLock } from "../../lib/radix-modal-lock";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import { useSyncAll } from "../../hooks/useSyncAll";

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
      { to: "/tracked", icon: Users, label: "Tracked artists" },
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
    return pathname === "/browse";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
};

export const Sidebar = () => {
  const location = useLocation();
  const [relativeTimeTick, setRelativeTimeTick] = useState(0);
  const queryClient = useQueryClient();
  const { isSyncing, progress, startSync } = useSyncAll({
    onSyncEnd: () => {
      void queryClient.invalidateQueries({
        queryKey: SYNC_LAST_COMPLETED_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: ["updates", "unreadCount"],
      });
    },
  });
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["updates", "unreadCount"],
    queryFn: () => window.api.getUpdatesUnreadCount(),
    refetchInterval: 30_000,
  });
  const { data: lastSyncTimestamp = null } = useQuery<number | null>({
    queryKey: SYNC_LAST_COMPLETED_QUERY_KEY,
    queryFn: () => window.api.getUpdatesLastSyncAt(),
    staleTime: Infinity,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRelativeTimeTick((tick) => tick + 1);
    }, LAST_SYNC_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const lastSyncText = useMemo(() => {
    void relativeTimeTick;
    return lastSyncTimestamp === null
      ? "Last sync: never"
      : `Last sync: ${formatRelativeTime(lastSyncTimestamp)}`;
  }, [lastSyncTimestamp, relativeTimeTick]);

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
        <div className="flex items-center px-4 h-14 border-b bg-transparent shrink-0">
          <span className="text-4xl font-black leading-none tracking-tight">
            RuleDesk
          </span>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <nav
            className="relative z-10 overflow-y-auto flex-1 px-3 py-4 [@media(max-height:700px)]:py-3"
            aria-label="Main navigation"
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
                      const isActive = isNavRouteActive(
                        location.pathname,
                        item.to
                      );
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
                            <Badge
                              variant="default"
                              className="ml-auto min-w-5 justify-center px-2 py-0.5"
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </nav>

          <div className="relative z-10 p-4 space-y-2 border-t bg-muted/20 shrink-0 [@media(max-height:700px)]:p-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void startSync();
              }}
              disabled={isSyncing}
              className={cn(
                "flex h-auto w-full justify-start gap-3 rounded-md p-1 -ml-1 text-left hover:bg-background/50",
                isSyncing && "opacity-70 cursor-wait"
              )}
            >
              <div
                className={cn(
                  "shrink-0 p-2 rounded-full bg-background border shadow-sm",
                  isSyncing && "animate-spin text-primary border-primary"
                )}
              >
                <RefreshCw className="w-4 h-4" />
              </div>
              <span
                className="min-w-0 flex-1 truncate text-sm font-medium"
                aria-live="polite"
              >
                {isSyncing ? progress : "Sync now"}
              </span>
            </Button>
            <p className="pl-1 text-xs text-muted-foreground" aria-live="polite">
              {lastSyncText}
            </p>
          </div>
        </div>
      </aside>
      <div className="w-56 shrink-0" aria-hidden="true" />
    </>
  );
};
