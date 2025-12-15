import { NavLink } from "react-router-dom";
import {
  Activity,
  LayoutGrid,
  Heart,
  Users,
  Settings,
  RefreshCw,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/updates", icon: Zap, label: "Updates" },
  { to: "/browse", icon: LayoutGrid, label: "Browse" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
  { to: "/tracked", icon: Users, label: "Sources" }, // Бывшая "Главная"
  { to: "/settings", icon: Settings, label: "Settings" },
];

export const Sidebar = () => {
  const isSyncing = false;
  const lastSyncTime = "12:30";

  return (
    <aside className="flex sticky top-0 flex-col w-64 h-screen border-r bg-background">
      {/* Logo Area */}
      <div className="flex items-center px-6 h-14 border-b">
        <Activity className="mr-2 w-6 h-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">Booru Client</span>
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
      <div className="p-4 border-t bg-muted/20">
        <div className="flex gap-3 items-center">
          <div
            className={cn(
              "p-2 rounded-full bg-background border",
              isSyncing && "animate-spin"
            )}
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium">Sync Status</span>
            <span className="text-[10px] text-muted-foreground">
              {isSyncing ? "Syncing..." : `Last: ${lastSyncTime}`}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
