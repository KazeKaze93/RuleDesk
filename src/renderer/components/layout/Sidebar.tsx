import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  LayoutGrid,
  Heart,
  Users,
  Settings,
  RefreshCw,
  Zap,
  LogOut,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/updates", icon: Zap, label: "Updates" },
  { to: "/browse", icon: LayoutGrid, label: "Browse" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
  { to: "/tracked", icon: Users, label: "Sources" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export const Sidebar = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("12:30");

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      console.log("Triggering Sync...");
      await window.api.syncAll();

      const now = new Date();
      setLastSyncTime(
        `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`
      );
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out? You will need to enter your API credentials again."
    );
    if (!confirmed) return;

    try {
      await window.api.logout();
      window.location.reload();
    } catch (error) {
      console.error("Failed to logout:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <aside className="flex sticky top-0 flex-col w-64 h-screen border-r bg-background">
      {/* Logo Area */}
      <div className="flex items-center px-6 h-14 border-b">
        <Activity className="mr-2 w-6 h-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">RuleDesk</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sync Status Footer */}
      <div className="p-4 space-y-2 border-t bg-muted/20">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            "flex gap-3 items-center p-1 -ml-1 w-full text-left rounded-md transition-all hover:bg-background/50",
            isSyncing
              ? "opacity-70 cursor-wait"
              : "cursor-pointer hover:opacity-100"
          )}
          title="Click to sync all sources"
        >
          <div
            className={cn(
              "p-2 rounded-full bg-background border shadow-sm",
              isSyncing && "animate-spin text-primary border-primary"
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium">Sync Status</span>
            <span className="text-[10px] text-muted-foreground">
              {isSyncing ? "Syncing..." : `Last: ${lastSyncTime}`}
            </span>
          </div>
        </button>

        {/* Log Out Button */}
        <button
          onClick={handleLogout}
          className="flex gap-3 items-center p-2 -ml-1 w-full text-left rounded-md transition-all text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
};
